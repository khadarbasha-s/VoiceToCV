from jinja2 import Environment, FileSystemLoader
from pathlib import Path
import io

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

def _ensure_list(value):
    if isinstance(value, list):
        return value
    if value in (None, ""):
        return []
    if isinstance(value, dict):
        return [value]
    return [value]


def _normalize_entry(entry, key_map=None):
    if isinstance(entry, dict):
        if key_map:
            for alias, target in key_map.items():
                if alias in entry and target not in entry:
                    entry[target] = entry[alias]
        return entry
    if isinstance(entry, str):
        return {"description": entry}
    return {}


def render_html(cv_json):
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
    template = env.get_template("cv_template.html")
    html = template.render(cv=cv_json)
    return html

def generate_pdf_bytes(cv_json):
    # Try multiple PDF generation methods in order of preference

    # Method 1: WeasyPrint (best quality, but requires system dependencies)
    try:
        import weasyprint
        html = render_html(cv_json)

        # Check if WeasyPrint has the required functionality
        if not hasattr(weasyprint, 'HTML'):
            raise ImportError("WeasyPrint HTML functionality not available")

        pdf = weasyprint.HTML(string=html).write_pdf()
        return pdf

    except ImportError as e:
        print(f"WeasyPrint not available: {e}")

    except Exception as e:
        error_msg = str(e)
        if "WeasyPrint" in error_msg or "import" in error_msg.lower() or "library" in error_msg.lower():
            print(f"WeasyPrint error: {e}")
        else:
            print(f"Unexpected WeasyPrint error: {e}")

    # Method 2: ReportLab (more reliable on Windows, fewer dependencies)
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        # Create PDF buffer
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )

        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12
        )

        content_style = styles['Normal']
        story = []

        # Personal Info
        personal = cv_json.get("personal_info", {})
        if personal.get("name"):
            story.append(Paragraph(personal.get("name", ""), title_style))

        contact_parts = []
        for field in ["email", "phone", "address"]:
            if personal.get(field):
                contact_parts.append(personal.get(field))
        if contact_parts:
            story.append(Paragraph(" | ".join(contact_parts), content_style))
        story.append(Spacer(1, 12))

        # Education
        education = _ensure_list(cv_json.get("education", []))
        education = [
            _normalize_entry(ed, {"college": "institute"}) for ed in education
        ]
        if education:
            story.append(Paragraph("Education", section_style))
            for ed in education:
                if not ed:
                    continue
                degree = ed.get('degree', '') or ed.get('description', '')
                institute = ed.get('institute', '')
                start_year = ed.get('start_year', '')
                end_year = ed.get('end_year', '')
                line = f"{degree} - {institute} ({start_year} - {end_year})"
                story.append(Paragraph(line.strip(" -()"), content_style))
            story.append(Spacer(1, 12))

        # Experience
        experience = _ensure_list(cv_json.get("experience", []))
        experience = [_normalize_entry(exp) for exp in experience]
        if experience:
            story.append(Paragraph("Experience", section_style))
            for exp in experience:
                if not exp:
                    continue
                role = exp.get('role', '') or exp.get('description', '')
                company = exp.get('company', '')
                start_date = exp.get('start_date', '')
                end_date = exp.get('end_date', '')
                line = f"{role} at {company} ({start_date} - {end_date})"
                story.append(Paragraph(line.strip(" -()"), content_style))
                description = exp.get('description')
                if description and description != role:
                    story.append(Paragraph(description, content_style))
            story.append(Spacer(1, 12))

        # Skills
        skills = _ensure_list(cv_json.get("skills", []))
        if skills:
            story.append(Paragraph("Skills", section_style))
            flattened = []
            for skill in skills:
                if isinstance(skill, str):
                    flattened.append(skill)
                elif isinstance(skill, dict):
                    flattened.extend(
                        v for v in skill.values() if isinstance(v, str)
                    )
            story.append(Paragraph(", ".join(flattened), content_style))
            story.append(Spacer(1, 12))

        # Projects
        projects = _ensure_list(cv_json.get("projects", []))
        projects = [_normalize_entry(proj) for proj in projects]
        if projects:
            story.append(Paragraph("Projects", section_style))
            for proj in projects:
                if not proj:
                    continue
                name = proj.get('project_name', '') or proj.get('description', '')
                description = proj.get('description', '')
                line = name
                if description and description != name:
                    line = f"{name} - {description}"
                story.append(Paragraph(line, content_style))
            story.append(Spacer(1, 12))

        # Build PDF
        doc.build(story)
        pdf_buffer.seek(0)
        return pdf_buffer.read()

    except ImportError as e:
        print(f"ReportLab not available: {e}")

    except Exception as e:
        print(f"ReportLab error: {e}")

    # Method 3: Fallback to HTML
    print("All PDF methods failed, returning HTML")
    html = render_html(cv_json)
    return html.encode('utf-8')
