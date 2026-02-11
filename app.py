from flask import Flask, render_template, request, jsonify, send_file, send_from_directory, redirect, url_for, session, Response, make_response, flash
from werkzeug.utils import secure_filename
import os
from flask_cors import CORS  
import json
import time 
import requests
from datetime import datetime
from dotenv import load_dotenv
import io
from fpdf import FPDF
from docx import Document
from flask_bcrypt import Bcrypt
import pymysql  # <--- NEW IMPORT 
from authlib.integrations.flask_client import OAuth
import secrets
import csv
import io
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import hashlib
import base64
import json


pymysql.install_as_MySQLdb()
# ✅ IMPORT CONFIG HERE
# Load environment variables
load_dotenv()

app = Flask(__name__)

# app.py

def get_db_connection():
    # .env se variables load karo
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    passwd = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME")
    
    # Port env me string hota hai, use integer banana padta hai
    port = int(os.getenv("DB_PORT", 3306)) 

    # Connection Config
    config = {
        'host': host,
        'user': user,
        'password': passwd,
        'database': db_name,
        'port': port,
        'cursorclass': pymysql.cursors.DictCursor
    }

    # 🔒 SSL LOGIC: Agar Host Localhost nahi hai (yani Cloud hai), to SSL on karo
    if host != '127.0.0.1' and host != 'localhost':
        config['ssl'] = {'ssl': {}} # Empty dict SSL trigger karne ke liye kaafi hai Aiven par

    return pymysql.connect(**config)


CORS(app)

# ==========================================
# CONFIGURATION (Updated from your Screenshot)
# ==========================================

# 1. Security
app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY")


# 2. Database Configuration (Matched with Workbench)
app.config['MYSQL_HOST'] = '127.0.0.1'  # Localhost ki jagah IP use karo
app.config['MYSQL_PORT'] = 3306         # Port explicit batao
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''       # Workbench me password nahi tha to blank rakho
app.config['MYSQL_DB'] = 'ats_resume_db'
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

# Initialize Extensions
# try:
#     mysql = MySQL(app)
#     
# except Exception as e:
#     print(f"❌ Extension Initialization Error: {e}")

bcrypt = Bcrypt(app)
oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)


# ==========================================
# GOOGLE API CONFIGURATION
# ==========================================

API_KEY = os.getenv('GOOGLE_API_KEY')

# Debugging
if API_KEY:
    print(f"✅ GOOGLE_API_KEY Found! (Length: {len(API_KEY)})")
else:
    print("❌ GOOGLE_API_KEY NOT Found! Please check your .env file.")
    API_KEY = "your-google-api-key-here"

# List of all available templates
RESUME_TEMPLATES = [
    'modern', 'classic', 'minimal', 'creative', 'professional', 'elegant',
    'bold', 'compact', 'stylish', 'infographic', 'clean', 'formal',
    'innovative', 'timeline', 'technical'
]

# --- CHANGED: Default max_tokens increased to 4096 ---
def call_gemini_ai(prompt, max_tokens=4096, max_retries=3):
    """Call Gemini AI API using requests (REST API)."""
    
    if not API_KEY or API_KEY == "your-google-api-key-here" or len(API_KEY) < 10:
        print("❌ AI Error: GOOGLE_API_KEY missing or invalid.")
        return get_fallback_response(prompt)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generation_config": {
            "temperature": 0.7,
            "top_p": 0.8,
            "max_output_tokens": max_tokens  # Uses the increased limit
        },
        "safety_settings": [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_ONLY_HIGH"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_ONLY_HIGH"
            }
        ]
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code != 200:
                print(f"AI Error (Status {response.status_code}): {response.text}")
                if attempt == max_retries - 1:
                    return get_fallback_response(prompt)
                continue

            result = response.json()
            
            candidates = result.get('candidates', [])
            if not candidates:
                feedback = result.get('promptFeedback', {})
                if feedback:
                    print(f"⚠️ Prompt Feedback: {feedback}")
                raise Exception('No response candidates received from API.')
            
            candidate = candidates[0]
            content = candidate.get('content', {})
            parts = content.get('parts', [])
            
            if not parts:
                finish_reason = candidate.get('finishReason', 'UNKNOWN')
                print(f"⚠️ Empty Response. Finish Reason: {finish_reason}")
                
                if finish_reason == 'SAFETY':
                    return get_fallback_response(prompt)
                
                # If finish reason is MAX_TOKENS, it might still have content in some API versions, 
                # but usually it's better to just error out or handle partial. 
                # Increasing limit solves this.
                raise Exception(f'No content parts. Finish Reason: {finish_reason}')
                
            response_text = parts[0].get('text', '').strip()
            
            if response_text:
                return response_text
            else:
                raise Exception('Empty text response.')

        except Exception as e:
            print(f"AI Error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            return get_fallback_response(prompt)
            
    return get_fallback_response(prompt)

def get_fallback_response(prompt):
    """Fallback responses when AI fails or Key is missing"""
    prompt_lower = prompt.lower()
    
    if 'summary' in prompt_lower or 'professional' in prompt_lower:
        return "Experienced professional with strong technical skills and proven track record of delivering high-quality solutions. Excellent problem-solving abilities and effective communication skills."
    
    elif 'education' in prompt_lower or 'school' in prompt_lower:
        return "Comprehensive academic background with focus on practical application of theoretical concepts. Developed strong foundation through rigorous coursework and hands-on projects."
    
    elif 'experience' in prompt_lower or 'work' in prompt_lower:
        return "Responsible for key deliverables and contributed significantly to team success. Demonstrated technical expertise and achieved project objectives through effective collaboration."
    
    elif 'project' in prompt_lower:
        return "Successfully planned and executed project deliverables using industry best practices. Collaborated with team members to achieve project goals and deliver valuable solutions."
    
    elif 'keyword' in prompt_lower or 'analyze' in prompt_lower or 'ats' in prompt_lower:
        return json.dumps({
            "matching_keywords": ["JavaScript", "Python", "React", "Node.js", "Git"],
            "missing_keywords": ["TypeScript", "AWS", "Docker", "MongoDB"],
            "score": 78,
            "suggestions": [
                "Add cloud platform experience",
                "Include database management skills",
                "Highlight project leadership experience"
            ],
            "overall_score": 78,
            "breakdown": {'content': 75, 'keywords': 80, 'format': 85, 'completeness': 70},
            "strengths": ["Clear sections", "Quantified achievements", "Strong summary"],
            "improvements": ["Need more action verbs", "Expand technical skills", "Tailor to job description"],
            "keyword_analysis": {'matched': ["Python", "React"], 'missing': ["AWS", "Kubernetes"]}
        })
    
    elif 'interview' in prompt_lower or 'question' in prompt_lower:
        # Fallback for interview questions
        return json.dumps([
            {
                "id": 1,
                "question": "Tell me about yourself and your professional background.",
                "type": "behavioral",
                "difficulty": "easy",
                "category": "Introduction"
            },
            {
                "id": 2,
                "question": "What are your greatest strengths and weaknesses?",
                "type": "behavioral", 
                "difficulty": "medium",
                "category": "Self-Assessment"
            },
            {
                "id": 3,
                "question": "Why do you want to work for our company?",
                "type": "hr",
                "difficulty": "easy",
                "category": "Motivation"
            },
            {
                "id": 4,
                "question": "Describe a challenging project and how you overcame obstacles.",
                "type": "behavioral",
                "difficulty": "hard",
                "category": "Problem Solving"
            },
            {
                "id": 5,
                "question": "Where do you see yourself in 5 years?",
                "type": "hr",
                "difficulty": "easy",
                "category": "Career Goals"
            }
        ])
    
    else:
        return "Professional experience and contributions demonstrating strong capabilities and commitment to delivering quality results."

# ==========================================
# 🟢 HELPER: Check & Deduct Credits (FINAL FIX)
# ==========================================
# ==========================================
# 🟢 HELPER: Check & Deduct Credits (DEBUG MODE)
# ==========================================
def check_and_deduct_credits(user_id):
    print(f"🕵️ DEBUG: Checking credits for User ID: {user_id}")  # <--- SPY 1
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Check Current Credits
    cursor.execute("SELECT ai_credits FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    
    print(f"🕵️ DEBUG: User Data Found: {user}") # <--- SPY 2
    
    # Agar user ke paas credits hain (0 se zyada)
    if user and user['ai_credits'] > 0:
        new_credits = user['ai_credits'] - 1
        
        # 2. Update Credits
        cursor.execute("UPDATE users SET ai_credits = %s WHERE id = %s", (new_credits, user_id))
        
        # 3. Activity Log
        cursor.execute(
            "INSERT INTO resume_activity (user_id, activity_type, details) VALUES (%s, %s, %s)",
            (user_id, 'ai_usage', 'Credit Used')
        )
        
        conn.commit()
        conn.close()
        
        print(f"✅ SUCCESS: Credit deducted! New Balance: {new_credits}") # <--- SPY 3
        return True, new_credits  # Success
    
    conn.close()
    print("❌ FAILED: No credits left or User not found") # <--- SPY 4
    return False, 0  # Fail

# ==========================================
# 2. GLOBAL CONTEXT PROCESSOR (Inject User Data everywhere)
# ==========================================
@app.context_processor
def inject_user():
    user = None
    if 'user_id' in session:
        conn = None
        try:
            # Direct PyMySQL Connection
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Fetch user info for Navbar
            cursor.execute("SELECT id, full_name, email, plan_type, profile_pic FROM users WHERE id = %s", (session['user_id'],))
            user = cursor.fetchone()
            
            cursor.close()
        except Exception as e:
            print(f"Context Processor Error: {e}")
        finally:
            if conn:
                conn.close() # Connection close karna zaroori hai
                
    return dict(current_user=user)

# ==========================================
# 📊 USER DASHBOARD ROUTE (Fixed Count)
# ==========================================
# ==========================================
# 📊 USER DASHBOARD ROUTE (Updated with Limits)
# ==========================================
@app.route('/dashboard')
def user_dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. User Info Fetch (Make sure to get resume_limit and plan_type)
        # Note: COALESCE use kiya hai taaki agar value NULL ho to default aa jaye
        cursor.execute("""
            SELECT *, 
            COALESCE(ai_credits, 5) as ai_credits, 
            COALESCE(resume_limit, 3) as resume_limit, 
            COALESCE(plan_type, 'Free') as plan_type 
            FROM users WHERE id = %s
        """, (session['user_id'],))
        user_data = cursor.fetchone()
        
        # 2. My Resumes Fetch
        cursor.execute("""
            SELECT * FROM saved_resumes 
            WHERE user_id = %s 
            ORDER BY updated_at DESC
        """, (session['user_id'],))
        my_resumes = cursor.fetchall()
        
        # Real Count
        real_resume_count = len(my_resumes)

        # 3. Stats Fetch
        cursor.execute("""
            SELECT activity_type, COUNT(*) as count 
            FROM resume_activity 
            WHERE user_id = %s 
            GROUP BY activity_type
        """, (session['user_id'],))
        db_stats = cursor.fetchall()

        # 4. Stats Update
        stats = []
        for s in db_stats:
            if s['activity_type'] != 'created':
                stats.append(s)
        stats.append({'activity_type': 'created', 'count': real_resume_count})

        # --- 🆕 NEW LIMIT LOGIC ---
        resume_limit = user_data['resume_limit']
        plan_type = user_data['plan_type']
        
        # Calculate Percentage for Progress Bar (3 is max for Free)
        limit_percent = 0
        if plan_type == 'Free':
            limit_percent = (resume_limit / 3) * 100
        else:
            limit_percent = 100 # Premium users full bar

        return render_template('dashboard.html', 
                             user=user_data, 
                             stats=stats, 
                             my_resumes=my_resumes,
                             resume_limit=resume_limit, # Pass vars to HTML
                             plan_type=plan_type,
                             limit_percent=limit_percent)
        
    except Exception as e:
        print(f"Dashboard Error: {e}")
        return redirect(url_for('index'))
    finally:
        conn.close()
            
            
# ==========================================
# UPDATE PROFILE ROUTE
# ==========================================
@app.route('/api/user/update-profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.json
        new_name = data.get('full_name')

        if not new_name:
            return jsonify({'success': False, 'message': 'Name cannot be empty'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update Query
        cursor.execute("UPDATE users SET full_name = %s WHERE id = %s", (new_name, session['user_id']))
        conn.commit()
        conn.close()

        # Update Session Data immediately
        session['user_name'] = new_name

        return jsonify({'success': True, 'message': 'Profile updated successfully'})

    except Exception as e:
        print(f"Update Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


# ==========================================
# CHANGE PASSWORD ROUTE
# ==========================================
@app.route('/api/user/change-password', methods=['POST'])
def change_password():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.json
        current_password = data.get('current_password')
        new_password = data.get('new_password')

        if not current_password or not new_password:
            return jsonify({'success': False, 'message': 'Both fields are required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Get User's Current Password Hash
        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (session['user_id'],))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # 2. Verify Current Password
        if not bcrypt.check_password_hash(user['password_hash'], current_password):
            conn.close()
            return jsonify({'success': False, 'message': 'Incorrect current password!'}), 401

        # 3. Update with New Password
        new_hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
        cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hashed_password, session['user_id']))
        conn.commit()
        conn.close()

        return jsonify({'success': True, 'message': 'Password changed successfully!'})

    except Exception as e:
        print(f"Change Password Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    
# ==========================================
# TRACK ACTIVITY ROUTE (Live Stats ke liye)
# ==========================================
# ==========================================
# TRACK ACTIVITY ROUTE (Updated: Increments Count)
# ==========================================
@app.route('/api/track-activity', methods=['POST'])
def track_activity():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        data = request.json
        activity_type = data.get('activity_type') # e.g. 'downloaded_pdf'
        details = data.get('details', '') # Template Name (e.g. 'modern')

        valid_types = ['created', 'downloaded_pdf', 'downloaded_docx', 'ai_summary', 'ats_check', 'cover_letter_created']
        
        if activity_type not in valid_types:
            return jsonify({'success': False, 'message': 'Invalid activity type'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Activity Log Karo (Graph ke liye)
        cursor.execute(
            "INSERT INTO resume_activity (user_id, activity_type, details) VALUES (%s, %s, %s)",
            (session['user_id'], activity_type, details)
        )
        
        # 2. 👇 NEW: Template Download Count Badhao (Admin Cards ke liye)
        if activity_type in ['downloaded_pdf', 'downloaded_docx']:
            # Hum check karte hain ki kya ye template exist karta hai, phir +1 karte hain
            cursor.execute("UPDATE templates SET downloads = downloads + 1 WHERE name = %s", (details,))
            
        conn.commit()
        conn.close()

        return jsonify({'success': True})

    except Exception as e:
        print(f"Tracking Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500



# ========== MAIN ROUTES ==========
@app.route('/')
def index():
    return render_template('home.html')

@app.route('/builder')
def builder():
    return render_template('builder.html')

@app.route('/templates')
def templates_section():
    return render_template('templates.html')

@app.route('/interview-prep')
def interview_prep():
    return render_template('interview.html')

@app.route('/pricing')
def pricing():
    return render_template('pricing.html')

# --- GOOGLE LOGIN ROUTES ---
@app.route('/login/google')
def login_google():
    # Google ke login page par bhejo
    redirect_uri = url_for('google_auth', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def google_auth():
    try:
        token = google.authorize_access_token()
        user_info = token.get('userinfo')
        
        if not user_info:
            return "Failed to fetch user info from Google", 400
            
        email = user_info['email']
        name = user_info['name']
        picture = user_info.get('picture', '')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check karo user hai ya nahi
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user:
            # USER EXISTS -> Login
            session['user_id'] = user['id']
            session['user_name'] = user['full_name']
            conn.close()
            return redirect(url_for('index')) # Ya dashboard
        else:
            # NEW USER -> Signup
            random_password = secrets.token_urlsafe(16)
            hashed_password = bcrypt.generate_password_hash(random_password).decode('utf-8')

            cursor.execute(
                "INSERT INTO users (full_name, email, password_hash, profile_pic) VALUES (%s, %s, %s, %s)",
                (name, email, hashed_password, picture)
            )
            conn.commit()
            
            new_user_id = cursor.lastrowid
            session['user_id'] = new_user_id
            session['user_name'] = name
            conn.close()
            return redirect(url_for('user_dashboard'))

    except Exception as e:
        print(f"OAuth Error: {e}")
        return f"Login Failed: {e}", 500
    
# ==========================================
# 🐙 GITHUB LOGIN CONFIGURATION
# ==========================================

# 1. Register GitHub
oauth.register(
    name='github',
    client_id=os.getenv('GITHUB_CLIENT_ID'),
    client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

# 2. Login Route
@app.route('/login/github')
def login_github():
    # Callback URL generate karo
    redirect_uri = url_for('callback_github', _external=True)
    return oauth.github.authorize_redirect(redirect_uri)

# 3. Callback Route (Jahan GitHub wapas bhejega)
@app.route('/callback/github')
def callback_github():
    try:
        # Token access karo
        token = oauth.github.authorize_access_token()
        
        # User ki basic info lo
        resp = oauth.github.get('user', token=token)
        user_info = resp.json()
        
        # GitHub Special: Agar email private hai to 'user/emails' API se nikalo
        email = user_info.get('email')
        
        if not email:
            resp_emails = oauth.github.get('user/emails', token=token)
            emails_list = resp_emails.json()
            # Primary aur Verified email dhundo
            for e in emails_list:
                if e['primary'] and e['verified']:
                    email = e['email']
                    break
        
        # Agar abhi bhi email nahi mila to error do
        if not email:
            return redirect(url_for('login_page', error="GitHub Account Email is Private or Not Verified"))

        # Name aur ID nikalo
        name = user_info.get('name') or user_info.get('login')
        github_id = str(user_info.get('id'))
        
        # --- DATABASE LOGIC (Register/Login) ---
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check karo user pehle se hai kya?
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()

        if existing_user:
            # LOGIN USER
            session['user_id'] = existing_user['id']
            session['user_name'] = existing_user['full_name']
            session['user_email'] = existing_user['email']
            session['logged_in'] = True
            
            # Provider update kar sakte ho (Optional)
            cursor.execute("UPDATE users SET auth_provider = 'github' WHERE id = %s", (existing_user['id'],))
            conn.commit()
            
        else:
            # REGISTER NEW USER
            cursor.execute("""
                INSERT INTO users (full_name, email, password, auth_provider, created_at)
                VALUES (%s, %s, '', 'github', NOW())
            """, (name, email))
            conn.commit()
            
            user_id = cursor.lastrowid
            session['user_id'] = user_id
            session['user_name'] = name
            session['user_email'] = email
            session['logged_in'] = True
        
        conn.close()
        return redirect(url_for('user_dashboard'))

    except Exception as e:
        print(f"GitHub Error: {e}")
        return redirect(url_for('login_page', error="GitHub Login Failed"))    
    
# ==========================================
# AUTHENTICATION ROUTES (LOGIC VERIFIED)
# ==========================================

@app.route('/login')
def login_page():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/api/user/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')

        if not all([full_name, email, password]):
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400

        # DB CONNECT (PyMySQL)
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check existing user
        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({
                'success': False,
                'message': 'Email already registered. Please login.'
            }), 409

        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Insert user
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash) VALUES (%s, %s, %s)",
            (full_name, email, hashed_password)
        )
        conn.commit()

        user_id = cursor.lastrowid

        cursor.close()
        conn.close()

        # Auto login
        session['user_id'] = user_id
        session['user_name'] = full_name

        return jsonify({
            'success': True,
            'message': 'Account created successfully',
            'redirect_url': url_for('index')
        })

    except Exception as e:
        print("SIGNUP ERROR:", e)
        return jsonify({
            'success': False,
            'message': 'Server error'
        }), 500

@app.route('/api/user/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password required'
            }), 400

        # DB CONNECT
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id, full_name, email, password_hash FROM users WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        # USER NOT FOUND
        if not user:
            return jsonify({
                'success': False,
                'error_type': 'not_found',
                'message': 'Account not found. Please sign up.'
            }), 404

        # PASSWORD CHECK
        if bcrypt.check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['user_name'] = user['full_name']

            return jsonify({
                'success': True,
                'redirect_url': url_for('index'),
                'user': {
                    'name': user['full_name'],
                    'email': user['email']
                }
            })

        else:
            return jsonify({
                'success': False,
                'message': 'Incorrect password'
            }), 401

    except Exception as e:
        print("LOGIN ERROR:", e)
        return jsonify({
            'success': False,
            'message': 'Server error'
        }), 500


# ==========================================
# 🏢 COMPANY PAGES ROUTES
# ==========================================
@app.route('/about')
def about():
    # File location: templates/company/about.html
    return render_template('company/about.html')

@app.route('/careers')
def careers():
    # File location: templates/company/careers.html
    return render_template('company/careers.html')

# Refund Policy Route
@app.route('/refund-policy')
def refund_policy():
    return render_template('support/refund_policy.html')

@app.route('/press')
def press():
    # File location: templates/company/press.html
    return render_template('company/press.html')


# ==========================================
# 🤝 SUPPORT PAGES ROUTES
# ==========================================
@app.route('/help-center')
def help_center():
    # File location: templates/support/help_center.html
    return render_template('support/help_center.html')


@app.route('/privacy-policy')
def privacy_policy():
    # File location: templates/support/privacy_policy.html
    return render_template('support/privacy_policy.html')

@app.route('/terms-of-service')
def terms_of_service():
    # File location: templates/support/terms_of_service.html
    return render_template('support/terms_of_service.html')

# Terms alias (agar footer me kahin short link ho)
@app.route('/terms')
def terms():
    return render_template('support/terms_of_service.html')


@app.route('/resume_templates/<path:filename>')
def serve_resume_template(filename):
    return send_from_directory('templates/resume_templates', filename)


@app.route('/template/<template_name>')
def get_template(template_name):
    if template_name not in RESUME_TEMPLATES:
        return "Template not found", 404
    
    resume_data = request.args.get('data')
    if resume_data:
        try:
            resume_data = json.loads(resume_data)
        except:
            resume_data = None
            
    # ✅ FIX: Yahan maine "template_" hata diya hai. 
    # Ab ye seedha "modern.html" dhundega jo aapke folder mein hai.
    template_file = f"{template_name}.html"
    
    return render_template(f'resume_templates/{template_file}', 
                         resume_data=resume_data,
                         template_name=template_name)
    
    
# ==========================================
# 📝 BLOG MANAGEMENT (Dynamic)
# ==========================================

# 1. Public Blog Page (Dynamic Fetch)
@app.route('/blog')
def blog():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Latest posts pehle dikhane ke liye DESC order
    cursor.execute("SELECT * FROM blog_posts ORDER BY created_at DESC")
    posts = cursor.fetchall()
    conn.close()
    return render_template('company/blog.html', posts=posts)

@app.route('/blog/post-<int:id>')
def blog_post(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 👇 1. Pehle Views badhao (+1)
    cursor.execute("UPDATE blog_posts SET views = views + 1 WHERE id = %s", (id,))
    conn.commit()  # Save changes
    
    # 👇 2. Phir Post ka data fetch karo (Updated views ke sath)
    cursor.execute("SELECT * FROM blog_posts WHERE id = %s", (id,))
    post = cursor.fetchone()
    
    conn.close()
    
    if not post:
        return render_template('404.html'), 404
        
    return render_template('company/blog_post.html', post=post)

# 3. Admin API: Add New Blog Post
@app.route('/api/admin/add-blog', methods=['POST'])
def add_blog():
    if 'admin_id' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        title = request.form.get('title')
        summary = request.form.get('summary')
        content = request.form.get('content')
        author = session.get('admin_name', 'Admin')
        
        # Image Upload Handle
        image_filename = 'default_blog.jpg'
        if 'image_file' in request.files:
            file = request.files['image_file']
            if file.filename != '':
                filename = secure_filename(f"blog_{int(time.time())}_{file.filename}")
                save_path = os.path.join(app.root_path, 'static/images/blog', filename)
                
                # Folder nahi hai to banao
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                
                file.save(save_path)
                image_filename = filename

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO blog_posts (title, summary, content, image_file, author) 
            VALUES (%s, %s, %s, %s, %s)
        """, (title, summary, content, image_filename, author))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Blog Post Published!'})

    except Exception as e:
        print(f"Blog Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# 4. Admin API: Delete Blog Post
@app.route('/api/admin/delete-blog/<int:id>', methods=['DELETE'])
def delete_blog(id):
    if 'admin_id' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM blog_posts WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ========== API ROUTES =========

# ==========================================
# 🟢 AI ROUTE: Summary Generator (FIXED - Now Deducts Credits)
# ==========================================
@app.route('/api/ai/summary', methods=['POST'])
def generate_ai_summary():
    """Generate professional summary or interview questions using AI"""
    
    # 1. Login Check
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # 2. Credits Check & Deduct (-1)
    has_credits, remaining_credits = check_and_deduct_credits(session['user_id'])
    
    if not has_credits:
        return jsonify({
            'success': False, 
            'error': 'NO_CREDITS', 
            'message': 'No credits left! Please upgrade.'
        }), 403

    try:
        data = request.json
        full_name = data.get('full_name', '')
        job_title = data.get('job_title', '')
        technical_skills = data.get('technical_skills', '')
        experience_count = data.get('experience_count', 0)
        custom_prompt = data.get('custom_prompt', '')
        
        # If custom prompt is provided, use it
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = f"""Generate a compelling professional resume summary for {full_name} who is a {job_title}. 
            
            Technical Skills: {technical_skills}. 
            Experience: {experience_count} positions. 
            
            Requirements:
            - Create a 5-6 line professional summary
            - Highlight key technical skills
            - Show experience level
            - Make it ATS-friendly with relevant keywords
            - Sound professional and achievement-oriented
            - Tailor specifically for a {job_title} role
            
            Return only the summary text without any additional explanations."""

        # Call AI
        summary = call_gemini_ai(prompt, 4096)
        
        # 3. Return Summary AND New Credit Balance
        return jsonify({
            'success': True,
            'summary': summary,
            'credits_left': remaining_credits 
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# 🟢 AI ROUTE: Description Generator (FIXED - Now Deducts Credits)
# ==========================================
@app.route('/api/ai/description', methods=['POST'])
def generate_ai_description():
    """Generate description for education/experience/projects"""
    
    # 1. Login Check
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    # 2. Credits Check & Deduct (-1)
    has_credits, remaining_credits = check_and_deduct_credits(session['user_id'])
    
    if not has_credits:
        return jsonify({
            'success': False, 
            'error': 'NO_CREDITS', 
            'message': 'No credits left! Please upgrade.'
        }), 403

    try:
        data = request.json
        section_type = data.get('section_type')
        content = data.get('content', {})
        
        if section_type == 'education':
            prompt = f"""Generate a professional description for education entry.
            Degree: {content.get('degree')}
            Field: {content.get('field')}
            School: {content.get('school')}
            Return only the description text."""

        elif section_type == 'experience':
            prompt = f"""Generate a professional work experience description.
            Position: {content.get('position')}
            Company: {content.get('company')}
            Return only the description text."""

        elif section_type == 'project':
            prompt = f"""Generate a professional project description.
            Project: {content.get('name')}
            Return only the description text."""

        else:
            return jsonify({'error': 'Invalid section type'}), 400
        
        # Call AI
        description = call_gemini_ai(prompt, 4096)
        
        return jsonify({
            'success': True,
            'description': description,
            'credits_left': remaining_credits
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/analyze-keywords', methods=['POST'])
def analyze_keywords():
    try:
        data = request.json
        job_description = data.get('job_description')
        resume_data = data.get('resume_data')
        
        if not job_description:
            return jsonify({'error': 'Job description is required'}), 400

        prompt = f"""Analyze this job description and compare it with the resume data.
        JOB DESCRIPTION: {job_description}
        RESUME DATA: {json.dumps(resume_data)}
        Return a valid JSON object."""

        # --- CHANGED: Increased token limit to 4096 ---
        analysis = call_gemini_ai(prompt, 4096)
        
        
        try:
            analysis = analysis.strip()
            if analysis.startswith('```json'):
                analysis = analysis[7:]
            if analysis.endswith('```'):
                analysis = analysis[:-3]
            
            keywords_data = json.loads(analysis)
            return jsonify(keywords_data)
        except json.JSONDecodeError as e:
            return jsonify({
                'matching_keywords': [],
                'missing_keywords': [],
                'score': compute_simple_ats_score(resume_data),
                'suggestions': ['AI analysis unavailable - please try again']
            })
            
    
    except Exception as e:
       return jsonify({
        'matching_keywords': ['Python', 'Flask'], 
        'missing_keywords': ['Docker'], 
        'score': 85
    })

@app.route('/api/ai/ats-score', methods=['POST'])
def calculate_ats_score():
    try:
        data = request.json
        resume_data = data.get('resume_data')
        job_description = data.get('job_description', '')
        
        prompt = f"""Evaluate this resume for ATS compatibility.
        RESUME DATA: {json.dumps(resume_data)}
        Return valid JSON."""

        # --- CHANGED: Increased token limit to 4096 ---
        score_result = call_gemini_ai(prompt, 4096)
        
        try:
            score_result = score_result.strip()
            if score_result.startswith('```json'):
                score_result = score_result[7:]
            if score_result.endswith('```'):
                score_result = score_result[:-3]
            
            score_data = json.loads(score_result)
            return jsonify(score_data)
        except json.JSONDecodeError:
            return jsonify({
                'overall_score': compute_simple_ats_score(resume_data),
                'breakdown': {'content': 0, 'keywords': 0, 'format': 0, 'completeness': 0},
                'strengths': [],
                'improvements': ['AI evaluation unavailable'],
                'keyword_analysis': {'matched': [], 'missing': []}
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ai/suggestions', methods=['POST'])
def get_ai_suggestions():
    try:
        data = request.json
        step = data.get('step')
        resume_data = data.get('resume_data')
        
        prompt = f"""Suggest improvements for the {step} section of this resume.
        Resume Data: {json.dumps(resume_data)}
        Return valid JSON array."""

        # --- CHANGED: Increased token limit to 4096 ---
        suggestions_result = call_gemini_ai(prompt, 4096)
        
        try:
            suggestions_result = suggestions_result.strip()
            if suggestions_result.startswith('```json'):
                suggestions_result = suggestions_result[7:]
            if suggestions_result.endswith('```'):
                suggestions_result = suggestions_result[:-3]
            
            suggestions = json.loads(suggestions_result)
            return jsonify({'suggestions': suggestions})
        except:
            return jsonify({'suggestions': get_fallback_suggestions(step)})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# (Keep helper functions like compute_simple_ats_score, export_pdf, export_docx unchanged)
def compute_simple_ats_score(resume_data):
    score = 20
    personal = resume_data.get('personal', {})
    if personal.get('fullName'): score += 15
    if personal.get('jobTitle'): score += 10
    if personal.get('summary'): score += 10
    score += min(20, len(resume_data.get('experience', [])) * 5)
    score += min(20, len(resume_data.get('education', [])) * 5)
    if resume_data.get('skills', {}).get('technical'): score += 10
    return min(100, score)

def get_fallback_suggestions(step):
    fallback_suggestions = {
        'personal': ["Ensure your contact information is professional", "Use a custom email"],
        'education': ["List education in reverse chronological order"],
        'experience': ["Use action verbs", "Quantify achievements"],
        'skills': ["Categorize skills into Technical and Soft"],
        'projects': ["Include GitHub links if available"]
    }
    return fallback_suggestions.get(step, ["Review this section for completeness"])

# (Keep export routes unchanged)
# ==========================================
# 💾 RESUME SAVE & LOAD APIs
# ==========================================
# app.py

@app.route('/api/save-resume', methods=['POST'])
def save_resume():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    resume_data = data.get('data') 
    template_name = data.get('template_name', 'modern')
    resume_id = data.get('resume_id')
    
    # 👇 NEW: Check if this is an auto-save (e.g. before download)
    is_auto_save = data.get('is_auto_save', False)

    personal = resume_data.get('personal', {})
    first_name = personal.get('firstName', 'Untitled')
    title = f"{first_name}'s Resume"

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if resume_id:
            # Update Existing (No Count Increase)
            cursor.execute("""
                UPDATE saved_resumes 
                SET resume_data = %s, template_name = %s, title = %s, updated_at = NOW()
                WHERE id = %s AND user_id = %s
            """, (json.dumps(resume_data), template_name, title, resume_id, session['user_id']))
        else:
            # Insert New
            cursor.execute("""
                INSERT INTO saved_resumes (user_id, template_name, title, resume_data) 
                VALUES (%s, %s, %s, %s)
            """, (session['user_id'], template_name, title, json.dumps(resume_data)))
            resume_id = cursor.lastrowid
            
            # 👇 FIX: Log 'created' ONLY if it's a Manual Save (Not Auto-Save)
            # This prevents double counting when user downloads a new resume
            if not is_auto_save:
                cursor.execute("INSERT INTO resume_activity (user_id, activity_type, details) VALUES (%s, 'created', %s)", 
                               (session['user_id'], template_name))

        conn.commit()
        return jsonify({'success': True, 'resume_id': resume_id, 'message': 'Resume saved successfully!'})
        
    except Exception as e:
        print(f"Save Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()

# Load Single Resume (For Builder)
@app.route('/api/get-resume/<int:resume_id>')
def get_resume(resume_id):
    # Security: User sirf apna ya Admin kisi ka bhi dekh sake
    if 'user_id' not in session and 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check ownership if not admin
    if 'admin_id' in session:
        cursor.execute("SELECT * FROM saved_resumes WHERE id = %s", (resume_id,))
    else:
        cursor.execute("SELECT * FROM saved_resumes WHERE id = %s AND user_id = %s", (resume_id, session['user_id']))
    
    resume = cursor.fetchone()
    conn.close()
    
    if resume:
        # JSON string ko wapas Object banao
        if isinstance(resume['resume_data'], str):
            resume['resume_data'] = json.loads(resume['resume_data'])
        return jsonify({'success': True, 'resume': resume})
    else:
        return jsonify({'success': False, 'message': 'Resume not found'}), 404

# ==========================================
# 📄 PDF EXPORT ROUTE (Fixed Version)
# ==========================================
@app.route('/api/export/pdf', methods=['POST'])
def export_pdf():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    print(f"\n🚀 START: Export PDF Request received from User ID: {session['user_id']}") 

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Fetch User Data
        cursor.execute("""
            SELECT 
                COALESCE(plan_type, 'Free') as plan_type, 
                COALESCE(resume_limit, 3) as resume_limit 
            FROM users WHERE id = %s
        """, (session['user_id'],))
        user = cursor.fetchone()

        # 2. Data Cleaning
        current_plan = str(user['plan_type']).strip().capitalize() 
        current_limit = int(user['resume_limit'])

        print(f"👤 DEBUG: Plan='{current_plan}' | Limit Remaining={current_limit}") 

        # 🛑 3. LIMIT CHECK LOGIC
        if current_plan == 'Free' and current_limit <= 0:
            print("🚫 STOP: Free limit is 0. Blocking download.")
            return jsonify({
                'success': False, 
                'error': 'LIMIT_REACHED', 
                'message': 'Your free download limit is over! Please upgrade to continue.'
            }), 403

        # ---------------------------------------------------------
        # 👇 YAHAN APNA PURANA PDF CODE PASTE KARO 👇
        # ---------------------------------------------------------
        # data = request.json (Example)
        # pdf = FPDF() ... (Tumhara code yahan aayega)
        # ...
        # ...
        
        # Maan lo PDF ban gayi (Tumhare code ke baad ye flag true hona chahiye)
        pdf_generated_successfully = True 
        
        if pdf_generated_successfully:
            new_limit = current_limit 

            # ✅ 4. SUCCESS: Limit Minus Karo (Sirf Free Plan ke liye)
            if current_plan == 'Free':
                new_limit = current_limit - 1
                
                # Database Update
                cursor.execute("UPDATE users SET resume_limit = %s WHERE id = %s", (new_limit, session['user_id']))
                conn.commit()
                print(f"✅ SUCCESS: Database Updated! Old={current_limit} -> New={new_limit}") 
            else:
                print(f"ℹ️ INFO: Plan is '{current_plan}', No deduction needed.")

            # 5. Log Activity
            cursor.execute("INSERT INTO resume_activity (user_id, activity_type, details) VALUES (%s, 'downloaded_pdf', 'PDF Export')", (session['user_id'],))
            conn.commit()

            # 6. Return Success (Yahan File URL ya Success Message bhejo)
            return jsonify({'success': True, 'message': 'Download started', 'new_limit': new_limit})

    except Exception as e:
        print(f"❌ ERROR in Export: {e}") 
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()
        
 

@app.route('/api/export/docx', methods=['POST'])
def export_docx():
    # ... (Keep existing DOCX export logic) ...
    return jsonify({'error': 'Use previous working DOCX code here'}) # Re-paste previous logic if needed

@app.route('/api/resume/history', methods=['GET'])
def get_resume_history():
    return jsonify({'success': True, 'resumes': []})

@app.route('/api/health/ai', methods=['GET'])
def ai_health_check():
    api_ready = False
    if API_KEY and API_KEY != 'your-google-api-key-here':
        api_ready = True
    return jsonify({
        'gemini_available': api_ready,
        'model_used': 'gemini-2.5-flash-preview-09-2025',
        'status': 'operational' if api_ready else 'configured_but_not_verified'
    })

# ==========================================
# COVER LETTER ROUTE
# ==========================================
@app.route('/cover-letter')
def cover_letter_builder():
    return render_template('cover_letter.html')


# ==========================================
# 🟢 AI ROUTE: Cover Letter (With Credit System)
# ==========================================
@app.route('/api/ai/write-cover-letter', methods=['POST'])
def write_cover_letter_ai():
    # 1. Login Check
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # 2. Credits Check & Deduct (-1)
    has_credits, remaining_credits = check_and_deduct_credits(session['user_id'])
    
    if not has_credits:
        # Agar credits 0 hain to error bhejo
        return jsonify({
            'success': False, 
            'error': 'NO_CREDITS', 
            'message': 'No credits left! Please upgrade.'
        }), 403

    try:
        data = request.json
        job_role = data.get('job_role')
        company = data.get('company')
        
        # AI Prompt
        prompt = f"""Write a professional cover letter for a {job_role} position at {company}.
        Keep it professional, engaging, and under 200 words. 
        Do not include headers like 'Subject:', just the body."""
        
        # Call Gemini AI
        content = call_gemini_ai(prompt)
        
        # 3. Return Content + Remaining Credits
        return jsonify({
            'success': True,
            'content': content,
            'credits_left': remaining_credits  # Frontend ko batao kitne bache
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
   
   
# ==========================================
# 🟢 AI ROUTE: Resume Builder (With Credit System)
# ==========================================
@app.route('/api/ai/generate', methods=['POST'])
def generate_ai_content():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    # 1. Credits Check
    has_credits, remaining_credits = check_and_deduct_credits(session['user_id'])
    
    if not has_credits:
        return jsonify({
            'success': False, 
            'error': 'NO_CREDITS', 
            'message': 'No credits left! Please upgrade.'
        }), 403

    try:
        data = request.json
        prompt = data.get('prompt')
        
        # Call Gemini AI
        content = call_gemini_ai(prompt)
        
        return jsonify({
            'success': True,
            'content': content,
            'credits_left': remaining_credits
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
# ==========================================
# 👑 ADMIN AUTHENTICATION ROUTES
# ==========================================

# 1. Login Page
@app.route('/admin/login')
def admin_login_page():
    # Agar Admin pehle se logged in hai (admin_id check karo)
    if 'admin_id' in session:
        return redirect(url_for('admin_dashboard'))
    return render_template('admin_login.html')

# ==========================================
# 🖼️ GALLERY / STORAGE MANAGEMENT APIs
# ==========================================

@app.route('/api/admin/gallery-scan')
def scan_gallery():
    if 'admin_id' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    
    # 1. Folder Path define karo (Jahan images save hoti hain)
    blog_folder = os.path.join(app.root_path, 'static/images/blog')
    
    # Agar folder nahi hai to bana do (Safety ke liye)
    if not os.path.exists(blog_folder):
        os.makedirs(blog_folder)

    # 2. Disk par jitni files hain sab list karo
    files_on_disk = os.listdir(blog_folder)
    
    # 3. Database mein jitni files used hain wo fetch karo
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT image_file FROM blog_posts")
    # Set bana rahe hain taaki fast search ho sake
    used_files = {row['image_file'] for row in cursor.fetchall()} 
    conn.close()
    
    # 4. Compare karo (Used vs Garbage)
    gallery_data = []
    
    for filename in files_on_disk:
        # System files (like .DS_Store) ko ignore karo
        if filename.startswith('.'): 
            continue
            
        is_used = filename in used_files
        
        gallery_data.append({
            'name': filename,
            'url': url_for('static', filename=f'images/blog/{filename}'),
            'status': 'used' if is_used else 'garbage',
            'size': round(os.path.getsize(os.path.join(blog_folder, filename)) / 1024, 2) # Size in KB
        })
        
    return jsonify(gallery_data)

@app.route('/api/admin/delete-image', methods=['POST'])
def delete_image():
    if 'admin_id' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    filename = data.get('filename')
    
    if not filename: 
        return jsonify({'error': 'Filename missing'}), 400
    
    # Secure filename taaki koi ../.. karke system hack na kare
    filename = secure_filename(filename)
    file_path = os.path.join(app.root_path, 'static/images/blog', filename)
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path) # 🗑️ DELETE FILE
            return jsonify({'success': True, 'message': 'Image deleted permanently'})
        else:
            return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==========================================
# 🔐 ADMIN LOGIN API (Final Perfect Version)
# ==========================================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        # Debug Print (Console check karo ki kya data aaya)
        print(f"🔍 Login Attempt: Email={email}, Password={password}")

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Admin ko email se dhoondo
        cursor.execute("SELECT * FROM admins WHERE email = %s", (email,))
        admin = cursor.fetchone()
        conn.close()
        if admin:
        # 👇 NEW CHECK: Agar suspended hai to rok do
         if admin.get('status') == 'suspended':
          return jsonify({'success': False, 'message': '🚫 Account Suspended. Contact Super Admin.'}), 403
     
        # Check 1: Kya Admin database mein mila?
        if not admin:
            print("❌ Error: Admin email not found in DB")
            return jsonify({'success': False, 'message': 'User not found'}), 401

        # Debug Print (DB mein kya password save hai)
        # Note: Production mein password print karna unsafe hai, par abhi debugging ke liye zaroori hai.
        print(f"✅ User Found: {admin['full_name']}")
        print(f"🔑 DB Password: {admin['password']} | Entered Password: {password}")

        # Check 2: Password Match (Plain Text Match)
        # .strip() use kar rahe hain taaki agar galti se space aa gaya ho to hat jaye
        if str(admin['password']).strip() == str(password).strip():
            session['admin_id'] = admin['id']
            session['admin_name'] = admin['full_name']
            session['admin_role'] = admin.get('role', 'Admin')
            
            print("🎉 Login Successful!")
            return jsonify({'success': True, 'redirect': url_for('admin_dashboard')})
        else:
            print("❌ Error: Password Mismatch")
            return jsonify({'success': False, 'message': 'Wrong Password'}), 401

    except Exception as e:
        print(f"🔥 System Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================
# 👑 ADMIN DASHBOARD ROUTE (Updated)
# ==========================================
@app.route('/admin')
def admin_dashboard():
    if 'admin_id' not in session:
        return redirect(url_for('admin_login_page'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch Stats
    cursor.execute("SELECT COUNT(*) as count FROM users")
    total_users = cursor.fetchone()['count']
    
    # 🟢 FIX: Ab ye seedha 'saved_resumes' table se count karega (Sahi ginti)
    cursor.execute("SELECT COUNT(*) as count FROM saved_resumes")
    total_resumes = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM resume_activity WHERE activity_type = 'ai_usage'")
    ai_usage_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()")
    today_signups = cursor.fetchone()['count']

    # 2. Fetch ALL Users
    cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
    all_users = cursor.fetchall()
    
    # 3. Fetch ALL Templates
    cursor.execute("SELECT * FROM templates ORDER BY created_at DESC")
    all_templates = cursor.fetchall()
    
    # 4. Fetch TOP 3 Templates for Analytics (Most Used)
    cursor.execute("SELECT * FROM templates ORDER BY downloads DESC LIMIT 3")
    top_templates = cursor.fetchall()

    # Calculate Percentages
    cursor.execute("SELECT SUM(downloads) as total FROM templates")
    res = cursor.fetchone()
    total_downloads_all = res['total'] if res and res['total'] else 1 # Avoid divide by zero

    # Har template mein 'percent' field add karo
    for t in top_templates:
        t['percent'] = round((t['downloads'] / total_downloads_all) * 100)

    cursor.execute("SELECT * FROM blog_posts ORDER BY created_at DESC")
    all_blogs = cursor.fetchall()
    
    # 5. FETCH ALL ADMINS
    cursor.execute("SELECT * FROM admins")
    all_admins = cursor.fetchall()
    
    cursor.execute("SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 10")
    support_tickets = cursor.fetchall()
    
    conn.close()

    # Return Template
    return render_template('admin.html', 
                           admin_name=session.get('admin_name', 'Admin'),
                           total_users=total_users,
                           total_resumes=total_resumes, 
                           ai_usage_count=ai_usage_count,
                           today_signups=today_signups,
                           active_templates=len(all_templates),
                           all_users=all_users,
                           all_templates=all_templates, 
                           total_templates_count=len(all_templates),
                           top_templates=top_templates,
                           all_blogs=all_blogs,
                           all_admins=all_admins,
                           support_tickets=support_tickets)
                            
    

@app.route('/api/admin/add-user', methods=['POST'])
def admin_add_user():
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (full_name, email, password_hash, plan_type) VALUES (%s, %s, %s, 'Free')",
            (data['name'], data['email'], hashed_pw)
        )
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        conn.close()


# ==========================================
# ⚙️ SYSTEM SETTINGS APIs
# ==========================================

# 1. Get All Settings
@app.route('/api/admin/settings', methods=['GET'])
def get_settings():
    if 'admin_id' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_settings")
    settings = {row['setting_key']: row['setting_value'] for row in cursor.fetchall()}
    conn.close()
    
    return jsonify(settings)

# 2. Update Settings
@app.route('/api/admin/update-settings', methods=['POST'])
def update_settings():
    if 'admin_id' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Loop through data and update each key
        for key, value in data.items():
            cursor.execute("""
                INSERT INTO system_settings (setting_key, setting_value) 
                VALUES (%s, %s) 
                ON DUPLICATE KEY UPDATE setting_value = %s
            """, (key, str(value), str(value)))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Settings saved successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        
# 3. Delete User API
@app.route('/api/admin/delete-user/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# 4. Reset Password API (Admin Power)
@app.route('/api/admin/reset-password', methods=['POST'])
def admin_reset_password():
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    new_hash = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (new_hash, data['user_id']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# ==========================================
# 🟢 ADMIN ACTIONS: Edit & Suspend
# ==========================================

# 1. Edit User Details
@app.route('/api/admin/edit-user', methods=['POST'])
def admin_edit_user():
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET full_name = %s, email = %s, plan_type = %s 
            WHERE id = %s
        """, (data['name'], data['email'], data['plan'], data['user_id']))
        
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        conn.close()

# app.py mein ye route replace karo

# 1. Toggle User Status (URL CHANGED)
@app.route('/api/admin/toggle-user-status/<int:user_id>', methods=['POST']) 
def admin_toggle_status(user_id):
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    
    if user:
        new_status = 'Suspended' if user['status'] == 'Active' else 'Active'
        cursor.execute("UPDATE users SET status = %s WHERE id = %s", (new_status, user_id))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'new_status': new_status})
    
    conn.close()
    return jsonify({'success': False, 'message': 'User ID not found'})

# ==========================================
# 📊 ANALYTICS API (Updated: Daily Growth)
# ==========================================
@app.route('/api/admin/analytics')
def admin_analytics():
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. USER GROWTH (Last 30 Days)
    cursor.execute("""
        SELECT DATE_FORMAT(created_at, '%d %b') as date_label, COUNT(*) as count 
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at), date_label 
        ORDER BY DATE(created_at) ASC
    """)
    growth_data = cursor.fetchall()
    
    # 2. DOWNLOAD TRENDS (Last 30 Days) - New for Analytics Tab
    cursor.execute("""
        SELECT DATE_FORMAT(created_at, '%d %b') as date_label, COUNT(*) as count 
        FROM resume_activity 
        WHERE activity_type IN ('downloaded_pdf', 'downloaded_docx') 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at), date_label 
        ORDER BY DATE(created_at) ASC
    """)
    download_data = cursor.fetchall()

    # 3. TEMPLATE USAGE
    cursor.execute("""
        SELECT details as template_name, COUNT(*) as count 
        FROM resume_activity 
        WHERE activity_type IN ('downloaded_pdf', 'created') 
        GROUP BY details 
        LIMIT 5
    """)
    template_data = cursor.fetchall()
    
    conn.close()

    return jsonify({
        'user_growth': {
            'labels': [row['date_label'] for row in growth_data],
            'data': [row['count'] for row in growth_data]
        },
        'downloads_trend': { # New Data
            'labels': [row['date_label'] for row in download_data],
            'data': [row['count'] for row in download_data]
        },
        'template_usage': {
            'labels': [row['template_name'] for row in template_data] if template_data else ['No Data'],
            'data': [row['count'] for row in template_data] if template_data else [0]
        }
    })
    
# ==========================================
# 🎨 TEMPLATE MANAGEMENT APIS
# ==========================================

# 1. Get All Templates (Public - For Website & Admin)
# ==========================================
# 🎨 TEMPLATE MANAGEMENT APIS (Updated Logic)
# ==========================================

# 1. Get All Templates (With User Access Info)
@app.route('/api/templates', methods=['GET'])
def get_templates():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch All Templates
    cursor.execute("SELECT * FROM templates ORDER BY sort_order DESC, is_premium DESC")
    templates = cursor.fetchall()
    
    # 2. Check User Access (Agar logged in hai)
    purchased_templates = []
    user_plan = 'Free'
    
    if 'user_id' in session:
        # User ka Plan check karo
        cursor.execute("SELECT plan_type FROM users WHERE id = %s", (session['user_id'],))
        user_row = cursor.fetchone()
        if user_row:
            user_plan = user_row['plan_type'] # Basic, Standard, Premium
            
        # User ne kaunse single templates kharide hain?
        cursor.execute("SELECT template_name FROM user_purchases WHERE user_id = %s", (session['user_id'],))
        purchases = cursor.fetchall()
        purchased_templates = [p['template_name'] for p in purchases]

    conn.close()

    # 3. Data Enrich karo (Frontend ko batane ke liye ki access hai ya nahi)
    for t in templates:
        t['user_has_access'] = False
        
        # Logic: Kab access milega?
        # 1. Agar Template Free hai
        if not t['is_premium']:
            t['user_has_access'] = True
            
        # 2. Agar User ne Single Template kharida hai
        elif t['name'] in purchased_templates:
            t['user_has_access'] = True
            
        # 3. Agar User ke Plan mein ye template covered hai
        elif user_plan in ['Standard', 'Premium']: # Standard/Premium get ALL
            t['user_has_access'] = True
        elif user_plan == 'Basic' and t['plan_level'] == 'Basic': # Basic gets Basic
            t['user_has_access'] = True
            
    return jsonify({
        'templates': templates,
        'user_plan': user_plan
    })

# 2. Buy Single Template API (Mock Payment)
@app.route('/api/buy-single-template', methods=['POST'])
def buy_single_template():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    template_name = data.get('template_name')
    price = data.get('price')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Save Purchase
        cursor.execute("INSERT INTO user_purchases (user_id, template_name, amount) VALUES (%s, %s, %s)", 
                       (session['user_id'], template_name, price))
        conn.commit()
        return jsonify({'success': True, 'message': 'Template Unlocked Successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()

# ==========================================
# 2. Add New Template (Advanced - Files & DB)
# ==========================================
@app.route('/api/admin/add-template', methods=['POST'])
def add_template():
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # 1. Get Data form FormData
        name = request.form.get('name')
        display_name = request.form.get('display_name')
        category = request.form.get('category')
        description = request.form.get('description')
        badge = request.form.get('badge')
        is_premium = request.form.get('is_premium') == 'true'
        position = request.form.get('position') # 'start' or 'end'
        
        html_content = request.form.get('html_content')
        css_content = request.form.get('css_content')
        
        # 2. Handle Image Upload
        image_filename = 'default.png'
        if 'image_file' in request.files:
            file = request.files['image_file']
            if file.filename != '':
                filename = secure_filename(f"{name}_{file.filename}")
                # Save path
                save_path = os.path.join(app.root_path, 'static/images/template-previews', filename)
                file.save(save_path)
                image_filename = filename

        # 3. Create HTML File
        if html_content:
            html_path = os.path.join(app.root_path, 'templates/resume_templates', f"{name}.html")
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_content)
        
        # 4. Create CSS File
        if css_content:
            css_path = os.path.join(app.root_path, 'static/css/templates', f"{name}.css")
            with open(css_path, "w", encoding="utf-8") as f:
                f.write(css_content)

        # 5. Database Logic (Sorting)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sort_order = 0
        if position == 'start':
            # Get current max sort order and add 1 (to be on top)
            cursor.execute("SELECT MAX(sort_order) as max_val FROM templates")
            result = cursor.fetchone()
            max_val = result['max_val'] if result['max_val'] else 0
            sort_order = max_val + 10
        else:
            # For end, keep it 0 or negative (or create logic based on ID)
            sort_order = 0

        # 6. Insert into DB
        cursor.execute("""
            INSERT INTO templates 
            (name, display_name, category, description, image_file, badge, is_premium, sort_order)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (name, display_name, category, description, image_filename, badge, is_premium, sort_order))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Template created and files saved!'})

    except Exception as e:
        print(f"Add Template Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    
    
# 3. Toggle Premium / Edit Template
@app.route('/api/admin/update-template', methods=['POST'])
def update_template():
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE templates 
            SET display_name=%s, category=%s, description=%s, is_premium=%s, badge=%s
            WHERE id=%s
        """, (data['display_name'], data['category'], data['description'], data['is_premium'], data['badge'], data['id']))
        conn.commit()
        return jsonify({'success': True})
    finally:
        conn.close()

# 4. Delete Template
@app.route('/api/admin/delete-template/<int:id>', methods=['DELETE'])
def delete_template(id):
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM templates WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})    

# ==========================================
# 📊 EXPORT APIS (Fixed & Renamed)
# ==========================================

# 1. Export Users to CSV (Excel Compatible)
@app.route('/api/admin/export/csv')
def admin_export_csv(): # <--- Renamed
    if 'admin_id' not in session: return redirect(url_for('admin_login_page'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, full_name, email, plan_type, status, created_at FROM users")
    users = cursor.fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['User ID', 'Full Name', 'Email', 'Plan', 'Status', 'Join Date'])
    
    # Rows
    for user in users:
        writer.writerow([user['id'], user['full_name'], user['email'], user['plan_type'], user['status'], user['created_at']])
    
    output.seek(0)
    
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=users_report.csv"}
    )

# 2. Export Analytics Report to PDF
@app.route('/api/admin/export/pdf')
def admin_export_pdf(): # <--- 🔴 NAME CHANGED HERE (Error Solved)
    if 'admin_id' not in session: return redirect(url_for('admin_login_page'))
    
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    pdf.cell(200, 10, txt="ATS Resume Builder - Admin Report", ln=1, align='C')
    pdf.cell(200, 10, txt=f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=1, align='C')
    pdf.ln(10)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as count FROM users")
    users_count = cursor.fetchone()['count']
    
    cursor.execute("SELECT COUNT(*) as count FROM resume_activity WHERE activity_type != 'ai_usage'")
    resumes_count = cursor.fetchone()['count']
    
    conn.close()

    pdf.cell(200, 10, txt=f"Total Users: {users_count}", ln=1)
    pdf.cell(200, 10, txt=f"Total Resumes Created: {resumes_count}", ln=1)
    
    response = make_response(pdf.output(dest='S').encode('latin-1'))
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=analytics_report.pdf'
    return response
   
# 4. Admin Logout Route
@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_id', None)
    session.pop('admin_name', None)
    session.pop('is_admin_logged_in', None)
    return redirect(url_for('admin_login_page'))
    
    
# ==========================================
# 🔐 SECURITY & ADMIN APIs
# ==========================================

# 1. Change Password (Direct Reset)
@app.route('/api/admin/change-password', methods=['POST'])
def change_admin_password():
    if 'admin_id' not in session: 
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    new_password = data.get('new_password')
    
    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    # Logged in admin ka password direct update karo
    cursor.execute("UPDATE admins SET password = %s WHERE id = %s", (new_password, session['admin_id']))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Password updated successfully!'})

# ==========================================
# 🛑 SUPER ADMIN ONLY ACTIONS (UPDATED)
# ==========================================

# 1. Add New Admin (Only Super Admin)
@app.route('/api/admin/add-admin', methods=['POST'])
def add_new_admin():
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401

    # 👇 SIRF SUPER ADMIN ALLOWED
    if session.get('admin_role') != 'Super Admin':
        return jsonify({'success': False, 'message': 'Permission Denied! Only Super Admin can add users.'}), 403

    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO admins (full_name, email, password, role) VALUES (%s, %s, %s, %s)",
                       (data['full_name'], data['email'], data['password'], data['role']))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# ==========================================
# 🛑 ADMIN MANAGEMENT APIs (Fix)
# ==========================================

# 1. Toggle Status ADMIN (Suspend/Active) -> URL CHANGED
# 2. Toggle Admin Status (URL CHANGED)
@app.route('/api/admin/toggle-admin-status/<int:id>', methods=['POST']) 
def toggle_admin_status(id):
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    # Super Admin Check
    if session.get('admin_role') != 'Super Admin':
        return jsonify({'success': False, 'message': 'Permission Denied!'}), 403
        
    if id == session['admin_id']:
        return jsonify({'success': False, 'message': "You cannot suspend yourself!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM admins WHERE id = %s", (id,))
    admin = cursor.fetchone()
    
    if not admin:
        conn.close()
        return jsonify({'success': False, 'message': 'Admin ID not found'}), 404
        
    new_status = 'suspended' if admin['status'] == 'active' else 'active'
    cursor.execute("UPDATE admins SET status = %s WHERE id = %s", (new_status, id))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'new_status': new_status})

# 3. Delete Admin (Only Super Admin)
@app.route('/api/admin/delete-admin/<int:id>', methods=['DELETE'])
def delete_admin(id):
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    if session.get('admin_role') != 'Super Admin':
        return jsonify({'success': False, 'message': 'Permission Denied!'}), 403
    
    if id == session['admin_id']:
        return jsonify({'success': False, 'message': "You cannot delete yourself!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 👇 FIX: Query 'admins' table
    cursor.execute("DELETE FROM admins WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# ==========================================
# 👤 SUPER ADMIN: USER DETAIL & RESOURCE MANAGER
# ==========================================

# 1. Get Single User Details (For Admin View)
@app.route('/api/admin/user-details/<int:user_id>', methods=['GET'])
def get_user_details(user_id):
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # User Basic Info
    cursor.execute("SELECT id, full_name, email, plan_type, status, ai_credits, created_at, profile_pic FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return jsonify({'success': False, 'message': 'User not found'}), 404
        
    # Stats: Total Resumes Created
    cursor.execute("SELECT COUNT(*) as count FROM resume_activity WHERE user_id = %s AND activity_type != 'ai_usage'", (user_id,))
    resume_count = cursor.fetchone()['count']
    
    # Stats: Last Active
    cursor.execute("SELECT created_at FROM resume_activity WHERE user_id = %s ORDER BY created_at DESC LIMIT 1", (user_id,))
    last_active = cursor.fetchone()
    last_active_date = last_active['created_at'] if last_active else user['created_at']

    cursor.execute("SELECT id, title, template_name, updated_at FROM saved_resumes WHERE user_id = %s ORDER BY updated_at DESC", (user_id,))
    saved_docs = cursor.fetchall()
    conn.close()
    
    # Data structure return karo
    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'full_name': user['full_name'],
            'email': user['email'],
            'plan_type': user['plan_type'],
            'ai_credits': user['ai_credits'] if user['ai_credits'] is not None else 0,
            'status': user['status'],
            'joined_at': user['created_at'],
            'resume_count': resume_count,
            'last_active': last_active_date,
            'saved_docs': saved_docs
        }
    })
    

# 2. Update User Resources (Plan & Credits)
@app.route('/api/admin/update-user-resources', methods=['POST'])
def update_user_resources():
    if 'admin_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    user_id = data.get('user_id')
    new_plan = data.get('plan_type')
    new_credits = data.get('ai_credits')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users 
            SET plan_type = %s, ai_credits = %s 
            WHERE id = %s
        """, (new_plan, new_credits, user_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'User resources updated successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()
        
# ==========================================
# 🛠️ DATABASE IMAGE FIXER (RUN ONCE)
# ==========================================
@app.route('/fix-template-images')
def fix_template_images():
    if 'admin_id' not in session: return "Admin login required", 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Magic Query: Har template ka image_file wahi kar do jo uska naam hai + .png
        # Example: Agar naam 'modern' hai to image ho jayegi 'modern.png'
        
        sql = "UPDATE templates SET image_file = CONCAT(name, '.png')"
        cursor.execute(sql)
        conn.commit()
        
        return jsonify({
            'success': True, 
            'message': 'All template images updated to match their names! (e.g. modern -> modern.png)'
        })
        
    except Exception as e:
        return f"Error: {e}"
    finally:
        conn.close()

# ==========================================
# 🧹 DATABASE CLEANER (Run Once)
# ==========================================
@app.route('/clean-old-templates')
def clean_old_templates():
    if 'admin_id' not in session: return "Admin login required", 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Jin templates ka naam 'temp' se shuru hota hai unhe uda do
        # Kyunki humne naye naam (modern, classic) rakh liye hain
        sql = "DELETE FROM templates WHERE name LIKE 'temp%'"
        cursor.execute(sql)
        conn.commit()
        
        deleted_count = cursor.rowcount
        return jsonify({
            'success': True, 
            'message': f'Deleted {deleted_count} old garbage templates (temp1, temp2, etc.)'
        })
        
    except Exception as e:
        return f"Error: {e}"
    finally:
        conn.close()
        
# ==========================================
# 🛠️ FIX EMPTY TEMPLATE NAMES
# ==========================================
@app.route('/fix-missing-names')
def fix_missing_names():
    if 'admin_id' not in session: return "Admin login required", 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Magic Query: Jiska naam khali hai, use 'luxury' set kar do
        cursor.execute("UPDATE saved_resumes SET template_name = 'luxury' WHERE template_name = '' OR template_name IS NULL")
        conn.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Fixed! Empty resumes are now named "luxury".'
        })
        
    except Exception as e:
        return f"Error: {e}"
    finally:
        conn.close()
        
# ==========================================
# 📧 CONTACT US LOGIC (Live Email)
# ==========================================

def send_contact_emails(user_name, user_email, subject, message):
    # 🔐 EMAIL SETTINGS (Apna Gmail aur App Password yahan dalein)
    SENDER_EMAIL = "atsresumepro01@gmail.com"  # Apna Gmail dalein
    SENDER_PASSWORD = "nmma chlo ybuc bprl" # Gmail App Password (Not login password)
    ADMIN_EMAIL = "meraj8329@gmail.com"     # Jis par aapko msg chahiye
    
    # ----------------------------------------
    # 1. EMAIL TO ADMIN (Aapke liye)
    # ----------------------------------------
    msg_admin = MIMEMultipart()
    msg_admin['From'] = SENDER_EMAIL
    msg_admin['To'] = ADMIN_EMAIL
    msg_admin['Subject'] = f"🔔 New Contact: {subject}"
    
    body_admin = f"""
    <h3>New User Query Received</h3>
    <p><b>Name:</b> {user_name}</p>
    <p><b>Email:</b> {user_email}</p>
    <p><b>Subject:</b> {subject}</p>
    <hr>
    <p><b>Message:</b><br>{message}</p>
    """
    msg_admin.attach(MIMEText(body_admin, 'html'))

    # ----------------------------------------
    # 2. EMAIL TO USER (Auto Reply)
    # ----------------------------------------
    msg_user = MIMEMultipart()
    msg_user['From'] = f"ATS Resume Builder <{SENDER_EMAIL}>"
    msg_user['To'] = user_email
    msg_user['Subject'] = "We received your message! 🚀"

    # Isme Favicon aur Branding hai
    body_user = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="{url_for('static', filename='images/favicon.png', _external=True)}" alt="ATS Resume Builder" style="width: 50px;">
            <h2 style="color: #4f46e5;">ATS Resume Builder Pro</h2>
        </div>
        
        <p>Hi <b>{user_name}</b>,</p>
        
        <p>Thanks for reaching out to us! We have received your message and created a support ticket.</p>
        
        <p style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #4f46e5; font-style: italic;">
            "{message}"
        </p>
        
        <p>Our team is reviewing your request. We aim to reply to all queries within <b>24 hours</b>.</p>
        
        <br>
        <p>Best Regards,<br><b>Support Team</b><br>ATS Resume Builder</p>
        <hr>
        <small style="color: gray;">This is an automated message. Please do not reply directly to this email.</small>
    </div>
    """
    msg_user.attach(MIMEText(body_user, 'html'))

    # 🚀 SEND BOTH EMAILS
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        
        # Send to Admin
        server.sendmail(SENDER_EMAIL, ADMIN_EMAIL, msg_admin.as_string())
        # Send to User
        server.sendmail(SENDER_EMAIL, user_email, msg_user.as_string())
        
        server.quit()
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False

# ROUTE HANDLER
# app.py - Updated Contact Us Route

@app.route('/contact-us', methods=['GET', 'POST'])
def contact_us():
    if request.method == 'POST':
        # 1. Get All Form Data
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')   # 👈 NEW: Phone Number
        subject = request.form.get('subject')
        message = request.form.get('message')
        
        # 2. Save EVERYTHING to Database
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            # 👇 Query me 'phone' add kiya hai
            cursor.execute("""
                INSERT INTO support_tickets (name, email, phone, subject, message) 
                VALUES (%s, %s, %s, %s, %s)
            """, (name, email, phone, subject, message))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"DB Error: {e}")

        # 3. Send Email (Purana code same rahega)
        # Note: Aap chaho to send_contact_emails function me bhi phone pass kar sakte ho
        if send_contact_emails(name, email, subject, message):
            return render_template('support/contact_us.html', success="Message sent! Ticket Created.")
        else:
            return render_template('support/contact_us.html', error="Failed to send message.")

    return render_template('support/contact_us.html')
 
# ==========================================
# 🛑 CHECK & DEDUCT LIMIT (For JS Download)
# ==========================================
@app.route('/api/check-download-limit', methods=['POST'])
def check_download_limit():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. User Data Fetch
        cursor.execute("SELECT plan_type, resume_limit FROM users WHERE id = %s", (session['user_id'],))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        plan = str(user['plan_type'] or 'Free').strip().capitalize()
        limit = int(user['resume_limit'] or 0)

        # 2. Check Logic
        if plan == 'Free':
            if limit > 0:
                # ✅ ALLOWED: Deduct 1
                new_limit = limit - 1
                cursor.execute("UPDATE users SET resume_limit = %s WHERE id = %s", (new_limit, session['user_id']))
                conn.commit()
                return jsonify({'success': True, 'remaining': new_limit})
            else:
                # 🚫 BLOCKED
                return jsonify({
                    'success': False, 
                    'error': 'LIMIT_REACHED',
                    'message': 'Free limit exceeded! Upgrade plan.'
                }), 403
        else:
            # ✅ PREMIUM USER: Always Allowed (No deduction)
            return jsonify({'success': True, 'message': 'Premium User'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()
       

# ==========================================
# 💳 PAYMENT & CHECKOUT ROUTES
# ==========================================

@app.route('/checkout')
def checkout():
    # 🔒 Security: Sirf Login user hi aa sakta hai
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    plan = request.args.get('plan')
    cycle = request.args.get('cycle')
    
    # Prices Set karo (Backend side validation)
    prices = {
        'basic': {'monthly': 199, 'yearly': 1990},
        'standard': {'monthly': 499, 'yearly': 4990},
        'premium': {'monthly': 999, 'yearly': 9990}
    }
    
    # Amount nikalo
    amount = prices.get(plan, {}).get(cycle, 0)
    
    if amount == 0:
        return redirect(url_for('pricing')) # Galat plan select kiya to wapas bhejo
    
    return render_template('payment/checkout.html', plan=plan, cycle=cycle, amount=amount)

@app.route('/api/process-payment', methods=['POST'])
def process_payment():
    if 'user_id' not in session: return jsonify({'success': False}), 401
    
    data = request.json
    plan_name = data.get('plan') # basic, standard, premium
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Update User Plan
        # Plan ka naam Capitalize karo (basic -> Basic)
        new_plan = plan_name.capitalize()
        
        # Limit set karo (Basic=Unlimited, lekin hum code me logic lagayenge)
        # Standard/Premium ke liye limit 99999 kar do (Unlimited)
        new_limit = 99999 
        
        cursor.execute("""
            UPDATE users 
            SET plan_type = %s, resume_limit = %s 
            WHERE id = %s
        """, (new_plan, new_limit, session['user_id']))
        
        conn.commit()
        return jsonify({'success': True, 'redirect': url_for('user_dashboard')})
        
    except Exception as e:
        print(f"Payment Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        conn.close()


# ✅ YE SAHI HAI (Universal Keys - 100% Chalega)
PHONEPE_MERCHANT_ID = "PGTESTPAYUAT" 
PHONEPE_SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399"
PHONEPE_SALT_INDEX = 1
PHONEPE_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"

# ==========================================
# 💳 PHONEPE PAYMENT ROUTES
# ==========================================

@app.route('/api/create-phonepe-order', methods=['POST'])
def create_phonepe_order():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        amount = float(data.get('amount'))
        plan = data.get('plan')
        
        # Unique Transaction ID
        transaction_id = f"TXN_{int(time.time())}_{secrets.token_hex(2).upper()}"
        
        # PhonePe Amount (Paise me)
        amount_paise = int(amount * 100)
        
        # 1. Payload
        payload = {
            "merchantId": PHONEPE_MERCHANT_ID,
            "merchantTransactionId": transaction_id,
            "merchantUserId": str(session['user_id']),
            "amount": amount_paise,
            "redirectUrl": url_for('phonepe_callback', _external=True),
            "redirectMode": "POST",
            "callbackUrl": url_for('phonepe_callback', _external=True),
            "paymentInstrument": {
                "type": "PAY_PAGE"
            }
        }
        
        # 2. Encode
        payload_json = json.dumps(payload)
        base64_payload = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')
        
        # 3. Checksum
        verification_str = base64_payload + "/pg/v1/pay" + PHONEPE_SALT_KEY
        checksum = hashlib.sha256(verification_str.encode('utf-8')).hexdigest() + "###" + str(PHONEPE_SALT_INDEX)
        
        # 4. Request
        headers = {
            "Content-Type": "application/json",
            "X-VERIFY": checksum
        }
        
        response = requests.post(
            f"{PHONEPE_BASE_URL}/pg/v1/pay", 
            json={"request": base64_payload}, 
            headers=headers
        )
        
        print("PhonePe Response:", response.text) # Debugging ke liye console me dekho
        resp_data = response.json()
        
        if resp_data.get("success"):
            return jsonify({'success': True, 'redirectUrl': resp_data['data']['instrumentResponse']['redirectInfo']['url']})
        else:
            return jsonify({'success': False, 'message': resp_data.get("message", "Payment Failed")})
            
    except Exception as e:
        print(f"PhonePe Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/payment/callback', methods=['POST'])
def phonepe_callback():
    try:
        # PhonePe POST request bhejta hai response ke saath
        if not request.form.get('code') == 'PAYMENT_SUCCESS':
             flash("Payment Failed or Cancelled!", "error")
             return redirect(url_for('pricing'))

        # Payment Success!
        plan_name = session.get('temp_payment_plan', 'Premium').capitalize()
        amount = session.get('temp_payment_amount', 0)
        user_id = session.get('user_id')
        
        if not user_id: return redirect(url_for('login_page'))

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Update User Limits
        credits = 5
        if plan_name == 'Basic': credits = 10
        elif plan_name == 'Standard': credits = 100
        elif plan_name == 'Premium': credits = 9999

        cursor.execute("""
            UPDATE users SET plan_type = %s, resume_limit = 9999, ai_credits = %s 
            WHERE id = %s
        """, (plan_name, credits, user_id))
        
        # 2. Transaction Log
        tx_id = request.form.get('merchantTransactionId', 'UNK')
        cursor.execute("""
            INSERT INTO transactions (user_id, plan_name, amount, transaction_id, payment_method, status)
            VALUES (%s, %s, %s, %s, 'PhonePe', 'Success')
        """, (user_id, plan_name, amount, tx_id))
        
        conn.commit()
        conn.close()
        
        # Email Receipt Bhej Do (Optional)
        # send_payment_receipt(...) 
        
        return render_template('payment/success.html', tx_id=tx_id) # Success Page
        
    except Exception as e:
        print(f"Callback Error: {e}")
        return redirect(url_for('pricing'))
# ==========================================
# 🔍 SEO ROUTES (Dynamic Sitemap for Render)
# ==========================================

@app.route('/robots.txt')
def robots_txt():
    # Render URL ko hardcode kar diya taaki galti na ho
    base_url = "https://atsresumepro.onrender.com"
    content = f"User-agent: *\nAllow: /\nSitemap: {base_url}/sitemap.xml"
    return Response(content, mimetype="text/plain")

@app.route('/sitemap.xml')
def sitemap_xml():
    """Generates sitemap for atsresumepro.onrender.com"""
    base_url = "https://atsresumepro.onrender.com"
    
    # Static Pages List
    pages = [
        '/', 
        '/builder', 
        '/templates', 
        '/pricing', 
        '/interview-prep', 
        '/contact-us', 
        '/about', 
        '/login'
    ]
    
    xml = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # 1. Static Pages
    for page in pages:
        xml.append('<url>')
        xml.append(f'<loc>{base_url}{page}</loc>')
        xml.append('<changefreq>weekly</changefreq>')
        xml.append('<priority>0.8</priority>')
        xml.append('</url>')

    # 2. Dynamic Blog Posts (Database se)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, created_at FROM blog_posts")
        posts = cursor.fetchall()
        conn.close()

        for post in posts:
            xml.append('<url>')
            xml.append(f'<loc>{base_url}/blog/post-{post["id"]}</loc>')
            # Date formatting check
            date_str = post["created_at"].strftime("%Y-%m-%d") if post["created_at"] else datetime.now().strftime("%Y-%m-%d")
            xml.append(f'<lastmod>{date_str}</lastmod>')
            xml.append('<changefreq>monthly</changefreq>')
            xml.append('<priority>0.6</priority>')
            xml.append('</url>')
    except Exception as e:
        print(f"Sitemap Error: {e}")

    xml.append('</urlset>')
    return Response('\n'.join(xml), mimetype="application/xml")    
    
if __name__ == '__main__':
    print("🚀 ATS Resume Builder Pro - Multi Page Version")
    if API_KEY and API_KEY != 'your-google-api-key-here':
        print("🔑 GOOGLE_API_KEY Status: LOADED")
    else:
        print("⚠️  GOOGLE_API_KEY Status: MISSING (Check .env file)")
    app.run(debug=True, host='0.0.0.0', port=5000)