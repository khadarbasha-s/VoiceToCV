from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
import io
import traceback


# -----------------------------------------------------
# Template Directory
# -----------------------------------------------------
TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"


# -----------------------------------------------------
# Utility Functions
# -----------------------------------------------------
def _ensure_list(value):
    """Ensures the input is always returned as a list."""
    if isinstance(value, list):
        return value
    if value in (None, "", []):
        return []
    if isinstance(value, dict):
        return [value]
    return [value]


def _normalize_entry(entry, key_map=None):
    """Normalizes dict fields based on alias mapping."""
    if isinstance(entry, dict):
        if key_map:
            for alias, target in key_map.items():
                if alias in entry and target not in entry:
                    entry[target] = entry[alias]
        return entry

    if isinstance(entry, str):
        return {"description": entry}

    return {}


# -----------------------------------------------------
# HTML Rendering (Jinja2)
# -----------------------------------------------------
def render_html(cv_json):
    """Renders the CV as HTML using Jinja2 template."""
    env = Environment(
        loader=FileSystemLoader(TEMPLATES_DIR),
        autoescape=select_autoescape(['html'])
    )
    template = env.get_template("cv_template.html")

    # Ensure structured data
    # Skills can be dict (categorized) or list (flat), so don't force to list
    if cv_json.get("skills") and not isinstance(cv_json.get("skills"), (dict, list, str)):
        cv_json["skills"] = _ensure_list(cv_json.get("skills"))
    cv_json["projects"] = _ensure_list(cv_json.get("projects"))
    cv_json["education"] = _ensure_list(cv_json.get("education"))
    cv_json["experience"] = _ensure_list(cv_json.get("experience"))

    return template.render(cv=cv_json)


# -----------------------------------------------------
# PDF Generation
# -----------------------------------------------------
def generate_pdf_bytes(cv_json):
    """
    Generates a PDF using:
    1. WeasyPrint (best)
    2. ReportLab (fallback)
    3. HTML return (last fallback)
    """

    # Normalize structure before PDF creation
    cv_json["skills"] = _ensure_list(cv_json.get("skills"))
    cv_json["projects"] = [
        _normalize_entry(p, {"title": "project_name"})
        for p in _ensure_list(cv_json.get("projects"))
    ]
    cv_json["education"] = [
        _normalize_entry(e, {"college": "institute"})
        for e in _ensure_list(cv_json.get("education"))
    ]
    cv_json["experience"] = [
        _normalize_entry(exp)
        for exp in _ensure_list(cv_json.get("experience"))
    ]

    # -----------------------------------------------------
    # Method 1: WeasyPrint
    # -----------------------------------------------------
    try:
        import weasyprint

        html = render_html(cv_json)

        if not hasattr(weasyprint, "HTML"):
            raise ImportError("WeasyPrint HTML interface not available.")

        return weasyprint.HTML(string=html).write_pdf()

    except Exception:
        print("⚠️ WeasyPrint failed:")
        print(traceback.format_exc())

    # -----------------------------------------------------
    # Method 2: ReportLab Fallback
    # -----------------------------------------------------
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        # Custom styles
        header_style = ParagraphStyle(
            "Header",
            parent=styles["Heading1"],
            fontSize=22,
            alignment=1,
            spaceAfter=20,
        )

        section_style = ParagraphStyle(
            "Section",
            parent=styles["Heading2"],
            fontSize=15,
            textColor="black",
        )

        body_style = styles["Normal"]

        story = []

        # --- Header ---
        personal = cv_json.get("personal_info", {})
        if personal.get("name"):
            story.append(Paragraph(personal["name"], header_style))

        contact = " | ".join(
            filter(None, [
                personal.get("email"),
                personal.get("phone"),
                personal.get("address")
            ])
        )
        if contact:
            story.append(Paragraph(contact, body_style))
        story.append(Spacer(1, 14))

        # --- Education ---
        story.append(Paragraph("Education", section_style))
        for ed in cv_json["education"]:
            line = f"{ed.get('degree', '')} - {ed.get('institute', '')} ({ed.get('start_year', '')} - {ed.get('end_year', '')})"
            story.append(Paragraph(line.strip(" -()"), body_style))
            story.append(Spacer(1, 6))

        story.append(Spacer(1, 12))

        # --- Experience ---
        if cv_json["experience"]:
            story.append(Paragraph("Experience", section_style))
            for exp in cv_json["experience"]:
                role = exp.get("role", "Role")
                company = exp.get("company", "")
                duration = f"{exp.get('start_date', '')} - {exp.get('end_date', '')}"
                story.append(Paragraph(f"{role} at {company} ({duration})", body_style))

                desc = exp.get("description")
                if desc:
                    story.append(Paragraph(desc, body_style))
                story.append(Spacer(1, 10))

        # --- Skills ---
        story.append(Paragraph("Skills", section_style))
        skills = cv_json.get("skills", [])
        if isinstance(skills, dict):
            # Categorized skills
            for category, skills_list in skills.items():
                if category != 'General' or (category == 'General' and skills_list):
                    if skills_list:
                        skills_str = skills_list if isinstance(skills_list, str) else ", ".join(str(s) for s in skills_list)
                        p = Paragraph(f"<b>{category}:</b> {skills_str}", body_style)
                        story.append(p)
        elif isinstance(skills, list):
            # Flat list
            story.append(Paragraph(", ".join(str(s) for s in skills), body_style))
        elif isinstance(skills, str):
            story.append(Paragraph(skills, body_style))
        story.append(Spacer(1, 14))

        # --- Projects ---
        story.append(Paragraph("Projects", section_style))
        for proj in cv_json["projects"]:
            title = proj.get("project_name") or proj.get("title")
            desc = proj.get("description", "")
            story.append(Paragraph(f"<b>{title}</b>: {desc}", body_style))
            story.append(Spacer(1, 10))

        doc.build(story)
        pdf_buffer.seek(0)
        return pdf_buffer.read()

    except Exception:
        print("⚠️ ReportLab fallback failed:")
        print(traceback.format_exc())

    # -----------------------------------------------------
    # Method 3: Last Fallback → Return HTML Bytes
    # -----------------------------------------------------
    html = render_html(cv_json)
    return html.encode("utf-8")
