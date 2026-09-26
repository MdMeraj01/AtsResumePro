import re
import time
import secrets
import threading
from collections import defaultdict, deque
from functools import wraps
from urllib.parse import urlparse

import dns.resolver
from flask import jsonify, request, session

# Common disposable email domains. This is intentionally a small blocklist;
# DNS/MX validation remains the primary domain check.
DISPOSABLE_DOMAINS = {
    'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'trashmail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com',
    'getnada.com', 'crazymailing.com', 'fakemailgenerator.com', 'dropmail.me'
}


def validate_full_name(name):
    if not name or len(name.strip()) < 2:
        return False, "Name must be at least 2 characters long."
    name = name.strip()
    if len(name) > 50 or not re.fullmatch(r'[a-zA-Z\s]{2,50}', name):
        return False, "Name cannot contain emojis, numbers, or special characters."
    return True, ""


def validate_password(password):
    """Minimum password policy used for signup/change/reset/admin-created users."""
    if not isinstance(password, str):
        return False, "Password is required."
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if len(password) > 128:
        return False, "Password must be 128 characters or fewer."
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number."
    if not re.search(r'[^A-Za-z0-9]', password):
        return False, "Password must contain at least one special character."
    return True, ""


def validate_real_email(email):
    if not email:
        return False, "Email address is required."
    email = email.strip().lower()
    if len(email) > 254:
        return False, "Email address is too long."

    email_regex = r'^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$'
    if not re.fullmatch(email_regex, email):
        return False, "Invalid email format."

    domain = email.rsplit('@', 1)[1].lower().rstrip('.')
    if domain in DISPOSABLE_DOMAINS:
        return False, "Temporary/Disposable emails are not allowed."

    try:
        records = dns.resolver.resolve(domain, 'MX', lifetime=4)
        if not records:
            return False, "Email domain does not exist or cannot receive mail."
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.LifetimeTimeout,
            dns.resolver.NoNameservers, dns.exception.Timeout):
        return False, f"Domain '@{domain}' is invalid or has no active mail server."
    except Exception:
        # Do not reject users because of a transient DNS resolver problem.
        return True, ""
    return True, ""


def generate_secure_otp():
    return f"{secrets.randbelow(900000) + 100000:06d}"


def check_user_template_access(conn, template_name):
    if not template_name:
        return True, False, "ALLOWED", ""

    template_name = str(template_name).strip().lower()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "SELECT is_premium, display_name FROM templates WHERE LOWER(name) = %s",
            (template_name,)
        )
        tpl = cursor.fetchone()

        if not tpl or not tpl.get('is_premium'):
            display_title = tpl.get('display_name', template_name).title() if tpl else template_name.title()
            return True, False, "ALLOWED", display_title

        display_title = tpl.get('display_name', template_name).title()
        if 'user_id' not in session:
            return False, True, "LOGIN_REQUIRED", display_title

        cursor.execute("SELECT plan_type FROM users WHERE id = %s", (session['user_id'],))
        user = cursor.fetchone()
        plan = str(user.get('plan_type', 'Free')).strip().capitalize() if user else 'Free'

        if plan in ['Standard', 'Premium', 'Pro', 'Lifetime']:
            return True, True, "PLAN_UNLOCKED", display_title

        cursor.execute(
            "SELECT id FROM user_purchases WHERE user_id = %s AND LOWER(template_name) = %s",
            (session['user_id'], template_name)
        )
        if cursor.fetchone():
            return True, True, "PURCHASED", display_title

        return False, True, "PAYMENT_REQUIRED", display_title
    finally:
        cursor.close()


# Simple process-local rate limiter. It protects a single worker/container.
# For multiple Render instances, move the store to Redis later.
_rate_lock = threading.Lock()
_rate_store = defaultdict(deque)

def rate_limit(limit=10, window_seconds=60, key_func=None):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if key_func:
                try:
                    key = key_func()
                except Exception:
                    key = request.remote_addr or 'unknown'
            else:
                key = request.remote_addr or 'unknown'

            bucket_key = f"{view.__name__}:{key}"
            now = time.monotonic()
            with _rate_lock:
                bucket = _rate_store[bucket_key]
                while bucket and now - bucket[0] >= window_seconds:
                    bucket.popleft()
                if len(bucket) >= limit:
                    return jsonify({
                        'success': False,
                        'message': 'Too many requests. Please wait a moment and try again.'
                    }), 429
                bucket.append(now)
            return view(*args, **kwargs)
        return wrapped
    return decorator


def is_safe_redirect_target(target, allowed_host=None):
    if not target:
        return False
    parsed = urlparse(target)
    if parsed.scheme or parsed.netloc:
        return bool(allowed_host and parsed.netloc == allowed_host)
    return target.startswith('/') and not target.startswith('//')
