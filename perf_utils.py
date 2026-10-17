"""
Speed helpers (Step 3): a small MySQL connection pool and a TTL cache.

ConnectionPool
  Before: every request opened a brand-new SSL connection to the cloud database
  (TCP + TLS + login = several round-trips, ~200-600 ms when app and DB are in
  different regions). Now finished connections are kept and re-used.
  The app code is unchanged: conn.close() simply hands the connection back.

Safety rules:
  * on release the open transaction is rolled back, so the next user never
    sees a stale snapshot or someone else's half-finished work
  * a connection is never put back twice and is unusable after close()
  * connections idle for >30 s are pinged before re-use, dead ones are dropped
  * set env DB_POOL=0 to switch the pool off completely (old behaviour)
"""
import threading
import time
from collections import deque


class ConnectionReleasedError(RuntimeError):
    pass


class PooledConnection:
    """Looks and behaves like the pymysql connection; close() returns it to the pool."""

    def __init__(self, pool, raw, created):
        self._pool = pool
        self._raw = raw
        self._created = created
        self._released = False

    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        if self._released:
            raise ConnectionReleasedError("Database connection was already closed/released")
        return getattr(self._raw, name)

    def close(self):
        if self._released:
            return
        self._released = True
        self._pool._release(self._raw, self._created)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()
        return False


class ConnectionPool:
    def __init__(self, factory, max_idle=6, max_age=1800, ping_after=30):
        self._factory = factory
        self._max_idle = max_idle
        self._max_age = max_age          # recycle connections older than 30 min
        self._ping_after = ping_after    # re-check connections idle longer than this
        self._idle = deque()
        self._lock = threading.Lock()
        self.stats = {'created': 0, 'reused': 0, 'discarded': 0}

    def acquire(self):
        now = time.time()
        while True:
            with self._lock:
                entry = self._idle.pop() if self._idle else None   # newest first
            if entry is None:
                break
            raw, created, last_used = entry
            if now - created > self._max_age:
                self._discard(raw)
                continue
            if now - last_used > self._ping_after:
                try:
                    raw.ping(reconnect=False)
                except Exception:
                    self._discard(raw)
                    continue
            self.stats['reused'] += 1
            return PooledConnection(self, raw, created)
        raw = self._factory()
        self.stats['created'] += 1
        return PooledConnection(self, raw, time.time())

    def _release(self, raw, created):
        try:
            # ALWAYS roll back: (1) drops half-finished writes so the next user can never
            # commit them by accident, (2) ends the read snapshot so the next user sees fresh data.
            # Costs one round-trip, still far cheaper than a new TCP+TLS+login.
            raw.rollback()
        except Exception:
            self._discard(raw)
            return
        with self._lock:
            if len(self._idle) < self._max_idle:
                self._idle.append((raw, created, time.time()))
                return
        self._discard(raw)

    def _discard(self, raw):
        self.stats['discarded'] += 1
        try:
            raw.close()
        except Exception:
            pass


class TTLCache:
    """Tiny thread-safe cache: get(key, loader) returns the cached value for `ttl` seconds."""

    def __init__(self, ttl=60):
        self.ttl = ttl
        self._data = {}
        self._lock = threading.Lock()

    def get(self, key, loader, ttl=None):
        now = time.time()
        with self._lock:
            hit = self._data.get(key)
            if hit and hit[0] > now:
                return hit[1]
        value = loader()
        with self._lock:
            self._data[key] = (now + (self.ttl if ttl is None else ttl), value)
        return value

    def clear(self):
        with self._lock:
            self._data.clear()
