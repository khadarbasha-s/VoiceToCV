import base64
import os
import tempfile
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view
from rest_framework import status
from agents.openai_tools import openai_refine_cv
from utils.pdf_generator import render_html
from utils.docx_generator import generate_docx_bytes
from utils.logger import logger
from .models import CVSession
from .serializers import CVSessionSerializer
from agents.voice_handler import transcribe_audio_file, speak_text
from agents.agent_core import AgentCore
from openai import OpenAI

# instantiate agent once (reuse)
agent = AgentCore()

# Initialize OpenAI client (moved inside function to ensure env vars are loaded)

@api_view(["POST"])
def create_session(request):
    s = CVSession.objects.create(cv_json={
        "personal_info": {},
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "certifications": []
    }, conversation=[])
    return JsonResponse({"session_id": s.session_id}, status=201)

@api_view(["POST"])
def voice_input(request):
    """
    Accepts audio upload (multipart/form-data with 'audio' file and 'session_id')
    Returns transcribed text.
    """
    audio = request.FILES.get("audio")
    session_id = request.data.get("session_id")
    if not audio or not session_id:
        return JsonResponse({"error": "audio and session_id required"}, status=400)

    # save temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        for chunk in audio.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    # transcribe using faster-whisper
    try:
        text = transcribe_audio_file(tmp_path)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    # update conversation
    try:
        session = CVSession.objects.get(session_id=session_id)
        session.conversation.append({"from": "user", "text": text})
        session.save()
    except CVSession.DoesNotExist:
        return JsonResponse({"error": "session not found"}, status=404)

    # run through agent
    agent_response = agent.process_user_message(session, text)
    return JsonResponse(agent_response, status=200)

@api_view(["POST"])
def process_text(request):
    """
    Accepts JSON: {'session_id':..., 'text': ...}
    Returns agent response and updated JSON
    """
    data = request.data
    session_id = data.get("session_id")
    text = data.get("text")
    if not session_id or text is None:
        return JsonResponse({"error": "session_id and text required"}, status=400)
    try:
        session = CVSession.objects.get(session_id=session_id)
    except CVSession.DoesNotExist:
        return JsonResponse({"error": "session not found"}, status=404)

    session.conversation.append({"from": "user", "text": text})
    session.save()
    agent_response = agent.process_user_message(session, text)
    return JsonResponse(agent_response, status=200)


def save_cv_to_database(user, cv_json):
    """
    Convert CV JSON to structured database models
    """
    from .models import UserCV, Education, Experience, Skill, Project, Certification
    
    # Get or create UserCV
    personal_info = cv_json.get('personal_info', {})
    cv, created = UserCV.objects.update_or_create(
        user=user,
        defaults={
            'full_name': personal_info.get('name', ''),
            'email': personal_info.get('email', ''),
            'phone': personal_info.get('phone', ''),
            'address': personal_info.get('address', ''),
            'github': personal_info.get('github', ''),
            'linkedin': personal_info.get('linkedin', ''),
            'portfolio': personal_info.get('portfolio', ''),
            'summary': cv_json.get('summary', ''),
        }
    )
    
    # Clear existing related data
    cv.education.all().delete()
    cv.experience.all().delete()
    cv.skills.all().delete()
    cv.projects.all().delete()
    cv.certifications.all().delete()
    
    # Add Education
    education_list = cv_json.get('education', [])
    if isinstance(education_list, dict):
        education_list = [education_list]
    for idx, edu in enumerate(education_list):
        if isinstance(edu, dict):
            Education.objects.create(
                cv=cv,
                degree=edu.get('degree', ''),
                institute=edu.get('institute', ''),
                start_year=str(edu.get('start_year', '')),
                end_year=str(edu.get('end_year', '')),
                gpa=str(edu.get('gpa', '')),
                order=idx
            )
    
    # Add Experience
    experience_list = cv_json.get('experience', [])
    if isinstance(experience_list, dict):
        experience_list = [experience_list]
    for idx, exp in enumerate(experience_list):
        if isinstance(exp, dict):
            Experience.objects.create(
                cv=cv,
                company=exp.get('company', ''),
                role=exp.get('role', ''),
                start_date=str(exp.get('start_date', '')),
                end_date=str(exp.get('end_date', '')),
                description=exp.get('description', ''),
                order=idx
            )
    
    # Add Skills
    skills_data = cv_json.get('skills', [])
    if isinstance(skills_data, dict):
        # Categorized skills
        for category, skill_list in skills_data.items():
            if isinstance(skill_list, list):
                for skill_name in skill_list:
                    Skill.objects.create(
                        cv=cv,
                        category=category,
                        name=str(skill_name),
                        proficiency='Intermediate'
                    )
            else:
                Skill.objects.create(
                    cv=cv,
                    category=category,
                    name=str(skill_list),
                    proficiency='Intermediate'
                )
    elif isinstance(skills_data, list):
        # Simple list of skills
        for skill_name in skills_data:
            Skill.objects.create(
                cv=cv,
                category='General',
                name=str(skill_name),
                proficiency='Intermediate'
            )
    
    # Add Projects
    projects_list = cv_json.get('projects', [])
    for idx, proj in enumerate(projects_list):
        if isinstance(proj, dict):
            Project.objects.create(
                cv=cv,
                project_name=proj.get('project_name', proj.get('name', '')),
                description=proj.get('description', ''),
                technologies=proj.get('technologies', ''),
                date=str(proj.get('date', '')),
                order=idx
            )
    
    # Add Certifications
    certifications_list = cv_json.get('certifications', [])
    for idx, cert in enumerate(certifications_list):
        if isinstance(cert, dict):
            Certification.objects.create(
                cv=cv,
                name=cert.get('name', ''),
                issuer=cert.get('issuer', ''),
                year=str(cert.get('year', '')),
                order=idx
            )
    
    return cv


@api_view(["GET"])
def get_session(request, session_id):
    try:
        session = CVSession.objects.get(session_id=session_id)
    except CVSession.DoesNotExist:
        return JsonResponse({"error": "session not found"}, status=404)
    ser = CVSessionSerializer(session)
    return JsonResponse(ser.data, safe=False)

@api_view(["GET"])
def generate_cv(request, session_id):
    """
    Generates PDF and DOCX and returns download links / binary.
    """
    try:
        session = CVSession.objects.get(session_id=session_id)
    except CVSession.DoesNotExist:
        return JsonResponse({"error": "session not found"}, status=404)

    cv_json = session.cv_json or {}

    # Validate that we have minimum required data
    if not cv_json.get("personal_info", {}).get("name"):
        return JsonResponse({"error": "CV data is incomplete. Please provide at least your name."}, status=400)

    target_language = (
        cv_json.get("meta", {}).get("preferred_language")
        if isinstance(cv_json.get("meta"), dict)
        else None
    ) or "auto"

    refinement_note = None
    try:
        refinement = openai_refine_cv(cv_json, target_language=target_language)
        refined_cv = refinement.get("cv_json", cv_json)
        session.cv_json = refined_cv
        session.cv_json.setdefault("meta", {})["refined"] = True
        session.save(update_fields=["cv_json", "updated_at"])
    except Exception as exc:
        refined_cv = cv_json
        logger.warning("OpenAI CV refinement failed: %s", exc)
        refinement_note = "Skipped AI refinement due to an error. Using collected details as-is."

    html_content = None
    docx_base64 = None
    notes = []

    if refinement_note:
        notes.append(refinement_note)

    # Generate HTML preview
    try:
        html_content = render_html(refined_cv)
    except Exception as exc:
        logger.warning("HTML generation failed: %s", exc)
        notes.append("HTML preview generation failed.")

    # Generate DOCX only
    try:
        docx_bytes = generate_docx_bytes(refined_cv)
        docx_base64 = base64.b64encode(docx_bytes).decode("utf-8")
    except Exception as exc:
        logger.warning("DOCX generation failed: %s", exc)
        notes.append("DOCX generation failed.")

    if not any([html_content, docx_base64]):
        return JsonResponse({"error": "Unable to generate resume files. Please try again later."}, status=500)

    # Save CV to structured database if user is authenticated
    if hasattr(session, 'user') and session.user:
        try:
            save_cv_to_database(session.user, refined_cv)
        except Exception as e:
            logger.warning(f"Failed to save CV to database: {e}")

    response_data = {"docx_base64": docx_base64, "html_content": html_content}
    if notes:
        response_data["note"] = " ".join(notes)

    return JsonResponse(response_data)

@api_view(["POST"])
def chat(request):
    """
    Accepts JSON: {'message': 'user message'}
    Returns AI response using OpenAI.
    """
    data = request.data
    message = data.get("message")
    if not message:
        return JsonResponse({"error": "message required"}, status=400)

    # Initialize OpenAI client here to ensure env vars are loaded
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": message}]
        )
        ai_response = response.choices[0].message.content
        return JsonResponse({"response": ai_response}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
def get_user_cv(request):
    """Get user's CV from structured database"""
    from .models import UserCV
    from .serializers import UserCVSerializer
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        cv = UserCV.objects.get(user=request.user)
        serializer = UserCVSerializer(cv)
        return JsonResponse(serializer.data, safe=False)
    except UserCV.DoesNotExist:
        return JsonResponse({"error": "CV not found"}, status=404)
    
    # Add Experience
    experience_list = cv_json.get('experience', [])
    if isinstance(experience_list, dict):
        experience_list = [experience_list]
    for idx, exp in enumerate(experience_list):
        if isinstance(exp, dict):
            Experience.objects.create(
                cv=cv,
                company=exp.get('company', ''),
                role=exp.get('role', ''),
                start_date=str(exp.get('start_date', '')),
                end_date=str(exp.get('end_date', '')),
                description=exp.get('description', ''),
                order=idx
            )
    
    # Add Skills
    skills_data = cv_json.get('skills', [])
    if isinstance(skills_data, dict):
        # Categorized skills
        for category, skill_list in skills_data.items():
            if isinstance(skill_list, list):
                for skill_name in skill_list:
                    Skill.objects.create(
                        cv=cv,
                        category=category,
                        name=str(skill_name),
                        proficiency='Intermediate'
                    )
            else:
                Skill.objects.create(
                    cv=cv,
                    category=category,
                    name=str(skill_list),
                    proficiency='Intermediate'
                )
    elif isinstance(skills_data, list):
        # Simple list of skills
        for skill_name in skills_data:
            Skill.objects.create(
                cv=cv,
                category='General',
                name=str(skill_name),
                proficiency='Intermediate'
            )
    
    # Add Projects
    projects_list = cv_json.get('projects', [])
    for idx, proj in enumerate(projects_list):
        if isinstance(proj, dict):
            Project.objects.create(
                cv=cv,
                project_name=proj.get('project_name', proj.get('name', '')),
                description=proj.get('description', ''),
                technologies=proj.get('technologies', ''),
                date=str(proj.get('date', '')),
                order=idx
            )
    
    # Add Certifications
    certifications_list = cv_json.get('certifications', [])
    for idx, cert in enumerate(certifications_list):
        if isinstance(cert, dict):
            Certification.objects.create(
                cv=cv,
                name=cert.get('name', ''),
                issuer=cert.get('issuer', ''),
                year=str(cert.get('year', '')),
                order=idx
            )
    
    return cv


@api_view(["GET"])
def get_session(request, session_id):
    try:
        session = CVSession.objects.get(session_id=session_id)
    except CVSession.DoesNotExist:
        return JsonResponse({"error": "session not found"}, status=404)
    ser = CVSessionSerializer(session)
    return JsonResponse(ser.data, safe=False)

@api_view(["GET"])
def generate_cv(request, session_id):
    """
    Generates PDF and DOCX and returns download links / binary.
    """
    try:
        session = CVSession.objects.get(session_id=session_id)
    except CVSession.DoesNotExist:
        return JsonResponse({"error": "session not found"}, status=404)

    cv_json = session.cv_json or {}

    # Validate that we have minimum required data
    if not cv_json.get("personal_info", {}).get("name"):
        return JsonResponse({"error": "CV data is incomplete. Please provide at least your name."}, status=400)

    target_language = (
        cv_json.get("meta", {}).get("preferred_language")
        if isinstance(cv_json.get("meta"), dict)
        else None
    ) or "auto"

    refinement_note = None
    try:
        refinement = openai_refine_cv(cv_json, target_language=target_language)
        refined_cv = refinement.get("cv_json", cv_json)
        session.cv_json = refined_cv
        session.cv_json.setdefault("meta", {})["refined"] = True
        session.save(update_fields=["cv_json", "updated_at"])
    except Exception as exc:
        refined_cv = cv_json
        logger.warning("OpenAI CV refinement failed: %s", exc)
        refinement_note = "Skipped AI refinement due to an error. Using collected details as-is."

    html_content = None
    docx_base64 = None
    notes = []

    if refinement_note:
        notes.append(refinement_note)

    # Generate HTML preview
    try:
        html_content = render_html(refined_cv)
    except Exception as exc:
        logger.warning("HTML generation failed: %s", exc)
        notes.append("HTML preview generation failed.")

    # Generate DOCX only
    try:
        docx_bytes = generate_docx_bytes(refined_cv)
        docx_base64 = base64.b64encode(docx_bytes).decode("utf-8")
    except Exception as exc:
        logger.warning("DOCX generation failed: %s", exc)
        notes.append("DOCX generation failed.")

    if not any([html_content, docx_base64]):
        return JsonResponse({"error": "Unable to generate resume files. Please try again later."}, status=500)

    # Save CV to structured database if user is authenticated
    if hasattr(session, 'user') and session.user:
        try:
            save_cv_to_database(session.user, refined_cv)
        except Exception as e:
            logger.warning(f"Failed to save CV to database: {e}")

    response_data = {"docx_base64": docx_base64, "html_content": html_content}
    if notes:
        response_data["note"] = " ".join(notes)

    return JsonResponse(response_data)

@api_view(["POST"])
def chat(request):
    """
    Accepts JSON: {'message': 'user message'}
    Returns AI response using OpenAI.
    """
    data = request.data
    message = data.get("message")
    if not message:
        return JsonResponse({"error": "message required"}, status=400)

    # Initialize OpenAI client here to ensure env vars are loaded
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": message}]
        )
        ai_response = response.choices[0].message.content
        return JsonResponse({"response": ai_response}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
def get_user_cv(request):
    """Get user's CV from structured database"""
    from .models import UserCV
    from .serializers import UserCVSerializer
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    try:
        cv = UserCV.objects.get(user=request.user)
        serializer = UserCVSerializer(cv)
        return JsonResponse(serializer.data, safe=False)
    except UserCV.DoesNotExist:
        return JsonResponse({"error": "CV not found"}, status=404)


@api_view(["POST"])
def save_user_cv(request):
    """Manually save CV JSON to database"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"save_user_cv called by user: {request.user}")
    logger.info(f"Is authenticated: {request.user.is_authenticated}")
    
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    
    cv_json = request.data.get('cv_json')
    logger.info(f"Received cv_json keys: {cv_json.keys() if cv_json else None}")
    
    if not cv_json:
        return JsonResponse({"error": "cv_json required"}, status=400)
    
    try:
        cv = save_cv_to_database(request.user, cv_json)
        from .serializers import UserCVSerializer
        serializer = UserCVSerializer(cv)
        logger.info(f"CV saved successfully for user: {request.user.username}")
        return JsonResponse(serializer.data, status=201)
    except Exception as e:
        logger.error(f"Error saving CV: {str(e)}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)
