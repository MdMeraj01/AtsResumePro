# pdf.py - Modular Backend PDF Generator (Pure Text-based for ATS)
import io
import re
from xhtml2pdf import pisa
from flask import render_template

from playwright.sync_api import sync_playwright

def generate_text_based_pdf(full_html_content):
    """
    Chromium engine se live HTML ko pixel-perfect text PDF me render karta hai.
    Speed optimized: commit level wait karta hai jisse PDF instant generate ho.
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--single-process'
                ]
            )
            # Standard A4 Viewport
            page = browser.new_page(viewport={"width": 794, "height": 1122})

            # Fast content set
            page.set_content(
                full_html_content, 
                wait_until="commit", 
                timeout=12000
            )

            page.emulate_media(media="screen")

            # Pure selectable vector text PDF
            pdf_bytes = page.pdf(
                format="A4",
                print_background=True,
                prefer_css_page_size=False,
                margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"}
            )

            browser.close()
            return pdf_bytes

    except Exception as e:
        print(f"❌ Playwright PDF Generation Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def build_resume_html(template_name, resume_data):
    """
    Jinja2 template ko render karke clean HTML string deta hai.
    Sare variables ko flat aur nested dono structure me pass karta hai taaki
    har template (executive, modern, classic, etc.) sahi text utha sake.
    """
    try:
        # Agar nested wrapper ho to unwrapped data nikalo
        if isinstance(resume_data, dict) and 'data' in resume_data and isinstance(resume_data['data'], dict):
            payload = resume_data['data']
        elif isinstance(resume_data, dict) and 'resume_data' in resume_data and isinstance(resume_data['resume_data'], dict):
            payload = resume_data['resume_data']
        else:
            payload = resume_data or {}

        personal = payload.get('personal', {})
        skills = payload.get('skills', {})
        experience = payload.get('experience', [])
        education = payload.get('education', [])
        projects = payload.get('projects', [])

        template_path = f"resume_templates/{template_name}.html"
        return render_template(
            template_path,
            resume_data=payload,
            data=payload,
            personal=personal,
            skills=skills,
            experience=experience,
            education=education,
            projects=projects,
            template_name=template_name
        )
    except Exception as e:
        print(f"❌ Template Render Error for {template_name}: {e}")
        return generate_default_ats_html(resume_data)


def generate_default_ats_html(data):
    """
    Standard clean ATS-optimized HTML layout (Fallback).
    """
    if isinstance(data, dict) and 'data' in data and isinstance(data['data'], dict):
        data = data['data']

    personal = data.get('personal', {})
    first_name = personal.get('firstName', '')
    last_name = personal.get('lastName', '')
    full_name = f"{first_name} {last_name}".strip() or personal.get('fullName', 'Candidate')
    job_title = personal.get('jobTitle', 'Professional')
    email = personal.get('email', '')
    phone = personal.get('phone', '')
    city = personal.get('city', '')
    summary = personal.get('summary', '')

    skills = data.get('skills', {})
    if isinstance(skills, dict):
        tech_skills = skills.get('technical', [])
    elif isinstance(skills, list):
        tech_skills = skills
    else:
        tech_skills = []

    experiences = data.get('experience', [])
    educations = data.get('education', [])
    projects = data.get('projects', [])

    exp_html = ""
    for exp in experiences:
        exp_html += f"""
        <div class="section-item">
            <div class="row">
                <span class="bold">{exp.get('position', '')}</span> - <span>{exp.get('company', '')}</span>
                <span class="right italic">{exp.get('startDate', '')} - {exp.get('endDate', 'Present')}</span>
            </div>
            <p class="desc">{exp.get('description', '')}</p>
        </div>
        """

    edu_html = ""
    for edu in educations:
        edu_html += f"""
        <div class="section-item">
            <div class="row">
                <span class="bold">{edu.get('degree', '')}</span> - <span>{edu.get('school', '')}</span>
                <span class="right italic">{edu.get('gradYear', '')}</span>
            </div>
            <p class="desc">{edu.get('description', '')}</p>
        </div>
        """

    proj_html = ""
    for proj in projects:
        proj_html += f"""
        <div class="section-item">
            <div class="row">
                <span class="bold">{proj.get('name', '')}</span> | <span class="italic">{proj.get('techStack', '')}</span>
            </div>
            <p class="desc">{proj.get('description', '')}</p>
        </div>
        """

    skills_joined = " • ".join(tech_skills) if tech_skills else "General Professional Skills"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page {{
                size: a4 portrait;
                margin: 1.2cm;
            }}
            body {{
                font-family: Helvetica, Arial, sans-serif;
                font-size: 10pt;
                line-height: 1.4;
                color: #111827;
            }}
            h1 {{
                font-size: 20pt;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #0f172a;
            }}
            .subtitle {{
                font-size: 11pt;
                font-weight: bold;
                color: #2563eb;
                margin-top: 2px;
                text-transform: uppercase;
            }}
            .contact {{
                font-size: 9pt;
                color: #475569;
                margin-top: 4px;
                margin-bottom: 12px;
            }}
            .section-title {{
                font-size: 11pt;
                font-weight: bold;
                text-transform: uppercase;
                border-bottom: 1px solid #cbd5e1;
                padding-bottom: 2px;
                margin-top: 12px;
                margin-bottom: 6px;
                color: #0f172a;
            }}
            .section-item {{
                margin-bottom: 8px;
            }}
            .row {{
                width: 100%;
            }}
            .bold {{ font-weight: bold; }}
            .italic {{ font-style: italic; color: #475569; }}
            .right {{ float: right; text-align: right; }}
            .desc {{
                margin-top: 2px;
                margin-bottom: 4px;
                font-size: 9pt;
                color: #334155;
            }}
        </style>
    </head>
    <body>
        <div>
            <h1>{full_name}</h1>
            <div class="subtitle">{job_title}</div>
            <div class="contact">
                {city} | {email} | {phone}
            </div>
        </div>

        {f'<div class="section-title">Professional Summary</div><p class="desc">{summary}</p>' if summary else ''}

        <div class="section-title">Technical Skills</div>
        <p class="desc">{skills_joined}</p>

        {f'<div class="section-title">Professional Experience</div>{exp_html}' if exp_html else ''}

        {f'<div class="section-title">Education</div>{edu_html}' if edu_html else ''}

        {f'<div class="section-title">Projects</div>{proj_html}' if proj_html else ''}
    </body>
    </html>
    """
    return html