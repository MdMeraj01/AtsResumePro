# 🚀 ATS Resume Builder Pro

[![Live Demo](https://img.shields.io/badge/Live_Demo-🟢_Online-success?style=for-the-badge)](https://atsresumepro.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)]()
[![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)]()
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)]()
[![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)]()

**ATS Resume Builder Pro** is a comprehensive, AI-powered Software-as-a-Service (SaaS) platform designed to help job seekers create 100% Applicant Tracking System (ATS) compliant resumes. Integrated with Google Gemini 2.5 Flash and a secure Razorpay payment gateway, it offers a seamless experience from resume generation to premium template monetization.

---

## ✨ Key Features

### 👨‍💻 For Users
* **🤖 AI-Powered Writing:** Overcome writer's block with Google Gemini 2.5 Flash, generating highly professional summaries and bullet points dynamically.
* **💼 100% ATS-Friendly Export:** Utilizes native browser print engines to ensure PDFs contain highly parsable, linear text (no unreadable images).
* **📧 Secure Authentication:** robust signup process with real-time 6-digit Email OTP Verification.
* **💎 Tiered Premium Templates:** Users can unlock premium designs via Razorpay using a smart pricing model (Single Export vs. Lifetime Access).
* **📊 Personalized Dashboard:** Users can track their AI credits, resume limits, and view their unlocked VIP templates.

### 👑 For Administrators
* **📈 Advanced Analytics:** Real-time Chart.js visualizations tracking user growth, template usage, and revenue metrics.
* **💳 Financial Dashboard:** Monitor all successful and failed Razorpay transactions seamlessly.
* **🛠️ User Management:** View detailed user profiles, adjust AI credits, upgrade plans, and track individual user purchases.
* **🎨 Template Engine:** Dynamically add, edit, or remove resume templates and blog posts directly from the UI.

---

## 💻 Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript, Tailwind CSS, Chart.js
* **Backend:** Python 3, Flask, Jinja2 Templates
* **Database:** MySQL (Relational Database Management)
* **APIs & Integrations:** * Google Gemini 2.5 Flash API (AI Generation)
  * Razorpay API (Payment Gateway)
  * SMTP (`smtplib`) for Email OTPs
* **Deployment:** Render (with Gunicorn WSGI)

---

## ⚙️ Local Setup & Installation

To run this project locally on your machine, follow these steps:

**1. Clone the repository**
```bash
git clone [https://github.com/yourusername/ats-resume-builder-pro.git](https://github.com/Meraj83/ats-resume-builder-pro.git)
cd ats-resume-builder-pro

2. Create a virtual environment

Bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
3. Install dependencies

Bash
pip install -r requirements.txt
4. Set up Environment Variables
Create a .env file in the root directory and add the following credentials:

Code snippet
# Flask App Secret
SECRET_KEY=your_super_secret_key

# Database Configuration
DB_HOST=your_mysql_host
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
DB_PORT=3306

# API Keys
GEMINI_API_KEY=your_google_gemini_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration (For OTP)
MAIL_USERNAME=your_gmail_address@gmail.com
MAIL_PASSWORD=your_16_digit_google_app_password
5. Run the application

Bash
python app.py
The app will be running at http://127.0.0.1:5000/

🗄️ Database Schema Highlights
The platform operates on a normalized MySQL database including the following core tables:

users: Stores credentials, AI credits, and verification status.

templates: Manages template HTML/CSS, pricing, and premium status.

transactions & user_purchases: Handles Razorpay receipts and tracks access types (single/lifetime).

saved_resumes: Stores user-specific generated resume data.

👨‍💼 Author
Mohammad Meraj