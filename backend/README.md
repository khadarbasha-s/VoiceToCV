# Voice-to-CV Backend (Django)

## Prerequisites
- Python 3.11+
- Node.js (for frontend)
- ffmpeg (for audio handling)
- OS libraries for WeasyPrint: cairo, pango, gdk-pixbuf, libffi (install via apt/brew)

## Setup (Linux/macOS)
1. Clone or copy backend folder.
2. Create virtual env:
   python3 -m venv .venv
   source .venv/bin/activate
3. Install packages:
   pip install -r requirements.txt

4. Create .env from .env.example and set OPENAI_API_KEY and DJANGO_SECRET_KEY.

5. Run migrations:
   python manage.py migrate

6. Create superuser (optional):
   python manage.py createsuperuser

7. Run server:
   python manage.py runserver

## Notes
- faster-whisper will download models on first run; choose model sizes carefully.
- For production consider using Gunicorn + Nginx and proper static handling.
- WeasyPrint requires OS-level dependencies. On Ubuntu:
  sudo apt-get install libffi-dev libpango1.0-0 libcairo2 libgdk-pixbuf2.0-0

## Endpoints
- POST /api/session/create/ -> create new session (returns session_id)
- POST /api/voice-input/ -> upload audio + session_id
- POST /api/process-text/ -> send text + session_id
- GET  /api/generate-cv/{session_id}/ -> returns base64 pdf/docx
- GET  /api/session/{session_id}/ -> session data
