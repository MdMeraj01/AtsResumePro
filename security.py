import re
import dns.resolver

# 🚫 Common Disposable Email Domains Blocklist
DISPOSABLE_DOMAINS = {
    'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
    'trashmail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com',
    'getnada.com', 'crazymailing.com', 'fakemailgenerator.com'
}

def validate_full_name(name):
    """
    Checks if name contains only English letters and spaces (No emojis, no special symbols).
    """
    if not name or len(name.strip()) < 2:
        return False, "Name must be at least 2 characters long."
    
    # Allows only letters and spaces (Min 2, Max 50 chars)
    if not re.match(r'^[a-zA-Z\s]{2,50}$', name.strip()):
        return False, "Name cannot contain emojis, numbers, or special characters."
    
    return True, ""

def validate_real_email(email):
    """
    Validates regex format, blocks temp-mails, and checks live DNS MX records.
    """
    if not email:
        return False, "Email address is required."
    
    email = email.strip().lower()

    # 1. Regex Format Check
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return False, "Invalid email format."

    domain = email.split('@')[1]

    # 2. Block Disposable Email Providers
    if domain in DISPOSABLE_DOMAINS:
        return False, "Temporary/Disposable emails are not allowed."

    # 3. Live DNS MX Record Check (Domain exists and can receive emails)
    try:
        records = dns.resolver.resolve(domain, 'MX')
        if not records:
            return False, "Email domain does not exist or cannot receive mail."
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.LifetimeTimeout, Exception):
        return False, f"Domain '@{domain}' is invalid or has no active mail server."

    return True, ""

from flask import session

def check_user_template_access(conn, template_name):
    """
    Validates template access permissions based on database status,
    user login status, membership plan, and individual purchases.
    Returns: (has_access: bool, is_premium: bool, reason: str, display_name: str)
    """
    if not template_name:
        return True, False, "ALLOWED", ""

    template_name = str(template_name).strip().lower()
    cursor = conn.cursor()

    try:
        # 1. Check if template is Premium
        cursor.execute("SELECT is_premium, display_name FROM templates WHERE LOWER(name) = %s", (template_name,))
        tpl = cursor.fetchone()

        # Free template or not found in DB -> Allow
        if not tpl or not tpl.get('is_premium'):
            display_title = tpl.get('display_name', template_name).title() if tpl else template_name.title()
            return True, False, "ALLOWED", display_title

        display_title = tpl.get('display_name', template_name).title()

        # 2. Block guest users on premium templates
        if 'user_id' not in session:
            return False, True, "LOGIN_REQUIRED", display_title

        # 3. Check User Plan (Pro / Standard / Premium / Lifetime gets all)
        cursor.execute("SELECT plan_type FROM users WHERE id = %s", (session['user_id'],))
        user = cursor.fetchone()
        plan = str(user.get('plan_type', 'Free')).strip().capitalize() if user else 'Free'

        if plan in ['Standard', 'Premium', 'Pro', 'Lifetime']:
            return True, True, "PLAN_UNLOCKED", display_title

        # 4. Check if user purchased this single template
        cursor.execute(
            "SELECT id FROM user_purchases WHERE user_id = %s AND LOWER(template_name) = %s",
            (session['user_id'], template_name)
        )
        if cursor.fetchone():
            return True, True, "PURCHASED", display_title

        # Free user without purchase -> Block
        return False, True, "PAYMENT_REQUIRED", display_title

    finally:
        cursor.close()