import os
import tempfile
from django.http import JsonResponse, HttpResponse
from rest_framework.decorators import api_view
from rest_framework import status
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

    cv_json = session.cv_json

    # Validate that we have minimum required data
    if not cv_json.get("personal_info", {}).get("name"):
        return JsonResponse({"error": "CV data is incomplete. Please provide at least your name."}, status=400)

    # create HTML via template and then PDF & DOCX
    from utils.pdf_generator import generate_pdf_bytes
    from utils.docx_generator import generate_docx_bytes

    try:
        html_bytes = generate_pdf_bytes(cv_json)   # returns bytes of PDF
    except Exception as e:
        return JsonResponse({"error": f"PDF generation failed: {str(e)}"}, status=500)

    try:
        docx_bytes = generate_docx_bytes(cv_json) # returns bytes of DOCX
    except Exception as e:
        return JsonResponse({"error": f"DOCX generation failed: {str(e)}"}, status=500)

    # Check if we got PDF or HTML (fallback)
    import base64

    # First, let's see what type of data we got
    try:
        # Try to decode the bytes as text to see if it's HTML
        try:
            decoded_html = html_bytes.decode('utf-8')
            # Check if it contains HTML tags
            if '<html' in decoded_html.lower() or '<!doctype' in decoded_html.lower():
                # This is HTML content
                response_data = {
                    "html_content": decoded_html,
                    "docx_base64": base64.b64encode(docx_bytes).decode("utf-8"),
                    "note": "PDF generation not available - showing HTML preview instead"
                }
            else:
                # This is binary PDF data
                response_data = {
                    "pdf_base64": base64.b64encode(html_bytes).decode("utf-8"),
                    "docx_base64": base64.b64encode(docx_bytes).decode("utf-8")
                }
        except UnicodeDecodeError:
            # This is binary data (PDF), encode as base64
            response_data = {
                "pdf_base64": base64.b64encode(html_bytes).decode("utf-8"),
                "docx_base64": base64.b64encode(docx_bytes).decode("utf-8")
            }
    except Exception as e:
        return JsonResponse({"error": f"Error processing generated files: {str(e)}"}, status=500)

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
