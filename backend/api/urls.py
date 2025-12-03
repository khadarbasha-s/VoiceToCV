from django.urls import path
from . import views
from .views_livekit import get_livekit_token

urlpatterns = [
    path("session/create/", views.create_session, name="create_session"),
    path("voice-input/", views.voice_input, name="voice_input"),
    path("process-text/", views.process_text, name="process_text"),
    path("generate-cv/<str:session_id>/", views.generate_cv, name="generate_cv"),
    path("session/<str:session_id>/", views.get_session, name="get_session"),
    path("chat/", views.chat, name="chat"),
    path("livekit/token/", get_livekit_token, name="livekit_token"),
]
