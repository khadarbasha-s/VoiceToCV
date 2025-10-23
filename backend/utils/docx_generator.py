from docx import Document
import io

def generate_docx_bytes(cv_json):
    try:
        doc = Document()
        personal = cv_json.get("personal_info", {})
        doc.add_heading(personal.get("name",""), level=1)
        # Contact
        contact = []
        for k in ["email","phone","address"]:
            if personal.get(k):
                contact.append(personal.get(k))
        if contact:
            doc.add_paragraph(" | ".join(contact))
        # Education
        doc.add_heading("Education", level=2)
        for ed in cv_json.get("education", []):
            doc.add_paragraph(f"{ed.get('degree','')} - {ed.get('institute','')} ({ed.get('start_year','')} - {ed.get('end_year','')})")
        # Experience
        doc.add_heading("Experience", level=2)
        for exp in cv_json.get("experience", []):
            doc.add_paragraph(f"{exp.get('role','')} at {exp.get('company','')} ({exp.get('start_date','')} - {exp.get('end_date','')})")
        # Skills
        doc.add_heading("Skills", level=2)
        skills = cv_json.get("skills", [])
        if skills:
            doc.add_paragraph(", ".join(skills))
        # Projects
        doc.add_heading("Projects", level=2)
        for proj in cv_json.get("projects", []):
            doc.add_paragraph(f"{proj.get('project_name','')} - {proj.get('description','')}")
        # Certifications
        doc.add_heading("Certifications", level=2)
        for cert in cv_json.get("certifications", []):
            doc.add_paragraph(f"{cert.get('name','')} - {cert.get('issuer','')} ({cert.get('year','')})")

        output = io.BytesIO()
        doc.save(output)
        output.seek(0)
        return output.read()
    except Exception as e:
        raise Exception(f"Failed to generate DOCX: {str(e)}")
