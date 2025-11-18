from docx import Document
import io


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


def generate_docx_bytes(cv_json):
    try:
        doc = Document()
        personal = cv_json.get("personal_info", {})
        doc.add_heading(personal.get("name", ""), level=1)

        contact = [
            personal.get(field)
            for field in ["email", "phone", "address"]
            if personal.get(field)
        ]
        if contact:
            doc.add_paragraph(" | ".join(contact))

        doc.add_heading("Education", level=2)
        education = _ensure_list(cv_json.get("education", []))
        education = [
            _normalize_entry(ed, {"college": "institute"}) for ed in education
        ]
        for ed in education:
            if not ed:
                continue
            degree = ed.get("degree", "") or ed.get("description", "")
            institute = ed.get("institute", "")
            start_year = ed.get("start_year", "")
            end_year = ed.get("end_year", "")
            line = f"{degree} - {institute} ({start_year} - {end_year})"
            doc.add_paragraph(line.strip(" -()"))

        doc.add_heading("Experience", level=2)
        experience = _ensure_list(cv_json.get("experience", []))
        experience = [_normalize_entry(exp) for exp in experience]
        for exp in experience:
            if not exp:
                continue
            role = exp.get("role", "") or exp.get("description", "")
            company = exp.get("company", "")
            start_date = exp.get("start_date", "")
            end_date = exp.get("end_date", "")
            line = f"{role} at {company} ({start_date} - {end_date})"
            doc.add_paragraph(line.strip(" -()"))
            description = exp.get("description")
            if description and description != role:
                doc.add_paragraph(description)

        doc.add_heading("Skills", level=2)
        skills = _ensure_list(cv_json.get("skills", []))
        flattened_skills = []
        for skill in skills:
            if isinstance(skill, str):
                flattened_skills.append(skill)
            elif isinstance(skill, dict):
                flattened_skills.extend(
                    v for v in skill.values() if isinstance(v, str)
                )
        if flattened_skills:
            doc.add_paragraph(", ".join(flattened_skills))

        doc.add_heading("Projects", level=2)
        projects = _ensure_list(cv_json.get("projects", []))
        projects = [_normalize_entry(proj) for proj in projects]
        for proj in projects:
            if not proj:
                continue
            name = proj.get("project_name", "") or proj.get("description", "")
            description = proj.get("description", "")
            line = name
            if description and description != name:
                line = f"{name} - {description}"
            doc.add_paragraph(line)

        doc.add_heading("Certifications", level=2)
        certs = _ensure_list(cv_json.get("certifications", []))
        certs = [_normalize_entry(cert) for cert in certs]
        for cert in certs:
            if not cert:
                continue
            name = cert.get("name", "") or cert.get("description", "")
            issuer = cert.get("issuer", "")
            year = cert.get("year", "")
            line = name
            if issuer or year:
                suffix = " - ".join(filter(None, [issuer, year]))
                line = f"{name} - {suffix}"
            doc.add_paragraph(line)

        output = io.BytesIO()
        doc.save(output)
        output.seek(0)
        return output.read()
    except Exception as e:
        raise Exception(f"Failed to generate DOCX: {str(e)}")
