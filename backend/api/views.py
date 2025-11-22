import base64
import os
import tempfile
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view
from rest_framework import status
from agents.openai_tools import openai_refine_cv
from utils.pdf_generator import generate_pdf_bytes, render_html
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

    pdf_base64 = None
    html_content = None
    docx_base64 = None
    notes = []

    if refinement_note:
        notes.append(refinement_note)

    try:
        pdf_or_html_bytes = generate_pdf_bytes(refined_cv)
        if isinstance(pdf_or_html_bytes, bytes):
            try:
                decoded_html = pdf_or_html_bytes.decode("utf-8")
                if "<html" in decoded_html.lower() or "<!doctype" in decoded_html.lower():
                    html_content = decoded_html
                    notes.append("PDF generation not available - showing HTML preview instead.")
                else:
                    pdf_base64 = base64.b64encode(pdf_or_html_bytes).decode("utf-8")
            except UnicodeDecodeError:
                pdf_base64 = base64.b64encode(pdf_or_html_bytes).decode("utf-8")
        elif isinstance(pdf_or_html_bytes, str):
            html_content = pdf_or_html_bytes
            notes.append("PDF generation not available - showing HTML preview instead.")
    except Exception as exc:
        logger.warning("PDF generation failed: %s", exc)
        html_content = render_html(refined_cv)
        notes.append("PDF generation failed - showing HTML preview instead.")

    try:
        docx_bytes = generate_docx_bytes(refined_cv)
        docx_base64 = base64.b64encode(docx_bytes).decode("utf-8")
    except Exception as exc:
        logger.warning("DOCX generation failed: %s", exc)
        notes.append("DOCX generation failed.")

    if not any([pdf_base64, html_content, docx_base64]):
        return JsonResponse({"error": "Unable to generate resume files. Please try again later."}, status=500)

    response_data = {"pdf_base64": pdf_base64, "docx_base64": docx_base64, "html_content": html_content}
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
