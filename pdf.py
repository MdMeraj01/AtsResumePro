# pdf.py - WeasyPrint Text-Based PDF Generator
# Works with Flask + WeasyPrint
# No Playwright / Chromium required

import io
from flask import render_template, request


# ============================================================
# 1. WEASYPRINT SAFE SETUP
# ============================================================

try:
    from weasyprint import HTML
    WEASYPRINT_AVAILABLE = True
    print("✅ WeasyPrint loaded successfully")
except (ImportError, ModuleNotFoundError, OSError) as e:
    WEASYPRINT_AVAILABLE = False
    HTML = None
    print(f"⚠️ WeasyPrint unavailable: {e}")


# ============================================================
# 2. XHTML2PDF FALLBACK
# ============================================================

try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    XHTML2PDF_AVAILABLE = False
    pisa = None


# ============================================================
# 3. MAIN PDF GENERATOR
# ============================================================

def generate_text_based_pdf(full_html_content):
    """
    Generate a text-based PDF using WeasyPrint.

    Flow:
        HTML + CSS
            ↓
        WeasyPrint
            ↓
        Text-based PDF

    No Chromium / Playwright required.
    """

    # --------------------------------------------------------
    # Attempt 1: WeasyPrint
    # --------------------------------------------------------

    if WEASYPRINT_AVAILABLE and HTML:

        try:
            # Flask application's root URL.
            #
            # This allows WeasyPrint to resolve URLs such as:
            #
            # /static/css/templates/default.css
            # /static/images/logo.png
            #
            base_url = request.url_root

            print("📄 Generating PDF using WeasyPrint...")
            print(f"🌐 Base URL: {base_url}")

            pdf_bytes = HTML(
                string=full_html_content,
                base_url=base_url
            ).write_pdf()

            if pdf_bytes:
                print(
                    f"✅ WeasyPrint PDF generated successfully "
                    f"({len(pdf_bytes)} bytes)"
                )

                return pdf_bytes

            print("❌ WeasyPrint returned empty PDF.")

        except Exception as e:
            print(f"❌ WeasyPrint PDF generation failed: {e}")

    else:
        print("⚠️ WeasyPrint is not available.")


    # --------------------------------------------------------
    # Attempt 2: xhtml2pdf fallback
    # --------------------------------------------------------

    if XHTML2PDF_AVAILABLE and pisa:

        try:
            print("🔄 Falling back to xhtml2pdf...")

            pdf_buffer = io.BytesIO()

            pisa_status = pisa.CreatePDF(
                full_html_content,
                dest=pdf_buffer
            )

            if not pisa_status.err:

                pdf_bytes = pdf_buffer.getvalue()

                if pdf_bytes:
                    print(
                        f"✅ xhtml2pdf PDF generated successfully "
                        f"({len(pdf_bytes)} bytes)"
                    )

                    return pdf_bytes

            print(
                f"❌ xhtml2pdf render error: "
                f"{pisa_status.err}"
            )

        except Exception as pisa_err:
            print(
                f"❌ xhtml2pdf exception: "
                f"{pisa_err}"
            )


    # --------------------------------------------------------
    # No PDF engine available
    # --------------------------------------------------------

    print("❌ No PDF engine available to render the document.")

    return None


# ============================================================
# 4. BUILD RESUME HTML
# ============================================================

def build_resume_html(template_name, resume_data):
    """
    Jinja2 template render karke clean HTML string return karta hai.
    """

    try:

        # ----------------------------------------------------
        # Normalize resume data
        # ----------------------------------------------------

        if (
            isinstance(resume_data, dict)
            and 'data' in resume_data
            and isinstance(resume_data['data'], dict)
        ):
            payload = resume_data['data']

        elif (
            isinstance(resume_data, dict)
            and 'resume_data' in resume_data
            and isinstance(resume_data['resume_data'], dict)
        ):
            payload = resume_data['resume_data']

        else:
            payload = resume_data or {}


        # ----------------------------------------------------
        # Extract sections
        # ----------------------------------------------------

        personal = payload.get('personal', {})
        skills = payload.get('skills', {})
        experience = payload.get('experience', [])
        education = payload.get('education', [])
        projects = payload.get('projects', [])


        # ----------------------------------------------------
        # Template path
        # ----------------------------------------------------

        template_path = f"resume_templates/{template_name}.html"


        # ----------------------------------------------------
        # Render template
        # ----------------------------------------------------

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

        print(
            f"❌ Template Render Error "
            f"for {template_name}: {e}"
        )

        # Fallback ATS template
        return generate_default_ats_html(resume_data)


# ============================================================
# 5. DEFAULT ATS HTML FALLBACK
# ============================================================

def generate_default_ats_html(data):
    """
    Clean ATS Fallback HTML Layout.
    """

    # --------------------------------------------------------
    # Normalize data
    # --------------------------------------------------------

    if (
        isinstance(data, dict)
        and 'data' in data
        and isinstance(data['data'], dict)
    ):
        data = data['data']


    # --------------------------------------------------------
    # Personal information
    # --------------------------------------------------------

    personal = data.get('personal', {})

    first_name = personal.get(
        'firstName',
        ''
    )

    last_name = personal.get(
        'lastName',
        ''
    )

    full_name = (
        f"{first_name} {last_name}".strip()
        or personal.get(
            'fullName',
            'Candidate'
        )
    )

    job_title = personal.get(
        'jobTitle',
        'Professional'
    )

    email = personal.get(
        'email',
        ''
    )

    phone = personal.get(
        'phone',
        ''
    )

    city = personal.get(
        'city',
        ''
    )

    summary = personal.get(
        'summary',
        ''
    )


    # --------------------------------------------------------
    # Skills
    # --------------------------------------------------------

    skills = data.get(
        'skills',
        {}
    )

    if isinstance(skills, dict):

        tech_skills = skills.get(
            'technical',
            []
        )

    elif isinstance(skills, list):

        tech_skills = skills

    else:

        tech_skills = []


    # --------------------------------------------------------
    # Other sections
    # --------------------------------------------------------

    experiences = data.get(
        'experience',
        []
    )

    educations = data.get(
        'education',
        []
    )

    projects = data.get(
        'projects',
        []
    )


    # ========================================================
    # EXPERIENCE HTML
    # ========================================================

    exp_html = ""

    for exp in experiences:

        exp_html += f"""
        <div class="section-item">

            <div class="row">

                <span class="bold">
                    {exp.get('position', '')}
                </span>

                -

                <span>
                    {exp.get('company', '')}
                </span>

                <span class="right italic">
                    {exp.get('startDate', '')}
                    -
                    {exp.get('endDate', 'Present')}
                </span>

            </div>

            <p class="desc">
                {exp.get('description', '')}
            </p>

        </div>
        """


    # ========================================================
    # EDUCATION HTML
    # ========================================================

    edu_html = ""

    for edu in educations:

        edu_html += f"""
        <div class="section-item">

            <div class="row">

                <span class="bold">
                    {edu.get('degree', '')}
                </span>

                -

                <span>
                    {edu.get('school', '')}
                </span>

                <span class="right italic">
                    {edu.get('gradYear', '')}
                </span>

            </div>

            <p class="desc">
                {edu.get('description', '')}
            </p>

        </div>
        """


    # ========================================================
    # PROJECTS HTML
    # ========================================================

    proj_html = ""

    for proj in projects:

        proj_html += f"""
        <div class="section-item">

            <div class="row">

                <span class="bold">
                    {proj.get('name', '')}
                </span>

                |

                <span class="italic">
                    {proj.get('techStack', '')}
                </span>

            </div>

            <p class="desc">
                {proj.get('description', '')}
            </p>

        </div>
        """


    # ========================================================
    # SKILLS
    # ========================================================

    skills_joined = (
        " • ".join(tech_skills)
        if tech_skills
        else "General Professional Skills"
    )


    # ========================================================
    # FINAL HTML
    # ========================================================

    return f"""
    <!DOCTYPE html>

    <html>

    <head>

        <meta charset="utf-8">

        <style>

            @page {{
                size: A4 portrait;
                margin: 1.2cm;
            }}

            body {{
                font-family:
                    Helvetica,
                    Arial,
                    sans-serif;

                font-size: 10pt;

                line-height: 1.4;

                color: #111827;
            }}

            h1 {{
                font-size: 20pt;

                margin: 0;

                text-transform: uppercase;

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

                border-bottom:
                    1px solid #cbd5e1;

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

            .bold {{
                font-weight: bold;
            }}

            .italic {{
                font-style: italic;

                color: #475569;
            }}

            .right {{
                float: right;

                text-align: right;
            }}

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

            <h1>
                {full_name}
            </h1>

            <div class="subtitle">
                {job_title}
            </div>

            <div class="contact">
                {city}
                |
                {email}
                |
                {phone}
            </div>

        </div>


        {
            f'''
            <div class="section-title">
                Professional Summary
            </div>

            <p class="desc">
                {summary}
            </p>
            '''
            if summary
            else ''
        }


        <div class="section-title">
            Technical Skills
        </div>

        <p class="desc">
            {skills_joined}
        </p>


        {
            f'''
            <div class="section-title">
                Professional Experience
            </div>

            {exp_html}
            '''
            if exp_html
            else ''
        }


        {
            f'''
            <div class="section-title">
                Education
            </div>

            {edu_html}
            '''
            if edu_html
            else ''
        }


        {
            f'''
            <div class="section-title">
                Projects
            </div>

            {proj_html}
            '''
            if proj_html
            else ''
        }


    </body>

    </html>
    """