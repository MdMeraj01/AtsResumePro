"""
Small in-memory guard for one-time codes (OTP): expiry, wrong-attempt limit,
resend cool-down. Works for a single gunicorn worker (the Dockerfile uses
--workers 1). If you ever run more than one worker/instance, move this state
to the database or Redis.

Fail-closed: after a server restart the state is gone, so old codes are treated
as expired and the user simply asks for a new one.
"""
import hashlib
import hmac
import threading
import time

MAX_ATTEMPTS = 5
DEFAULT_TTL = 600        # 10 minutes
RESEND_COOLDOWN = 60     # seconds between two OTP e-mails to the same address

_lock = threading.Lock()
_active = {}             # key -> {'expires': ts, 'attempts': int}
_last_sent = {}          # key -> ts


def _key(purpose, email):
    return f"{purpose}:{str(email or '').strip().lower()}"


def _purge(now):
    for k in [k for k, v in _active.items() if v['expires'] < now]:
        _active.pop(k, None)
    for k in [k for k, t in _last_sent.items() if now - t > 3600]:
        _last_sent.pop(k, None)


def digest(secret, email, otp):
    """HMAC of the OTP. Safe to keep inside a (readable) session cookie because
    nobody without the server secret can compute or brute-force it offline."""
    msg = f"{str(email or '').strip().lower()}:{str(otp or '').strip()}".encode('utf-8')
    return hmac.new(str(secret).encode('utf-8'), msg, hashlib.sha256).hexdigest()


def same(a, b):
    return hmac.compare_digest(str(a or '').encode('utf-8'), str(b or '').encode('utf-8'))


def cooldown_ok(purpose, email, seconds=RESEND_COOLDOWN):
    """True (and records the send time) if enough time passed since the last OTP mail."""
    now = time.time()
    with _lock:
        _purge(now)
        k = _key(purpose, email)
        if now - _last_sent.get(k, 0) < seconds:
            return False
        _last_sent[k] = now
        return True


def start(purpose, email, ttl=DEFAULT_TTL):
    now = time.time()
    with _lock:
        _purge(now)
        _active[_key(purpose, email)] = {'expires': now + ttl, 'attempts': 0}


def is_active(purpose, email):
    now = time.time()
    with _lock:
        st = _active.get(_key(purpose, email))
        return bool(st and st['expires'] >= now and st['attempts'] < MAX_ATTEMPTS)


def register_failure(purpose, email):
    """Count a wrong guess. After MAX_ATTEMPTS the code is dead (user must request a new one)."""
    with _lock:
        k = _key(purpose, email)
        st = _active.get(k)
        if not st:
            return 0
        st['attempts'] += 1
        if st['attempts'] >= MAX_ATTEMPTS:
            _active.pop(k, None)
            return 0
        return MAX_ATTEMPTS - st['attempts']


def finish(purpose, email):
    with _lock:
        _active.pop(_key(purpose, email), None)
