from django.urls import path
from . import views
from . import views_livekit

urlpatterns = [
    path("create_session/", views.create_session, name="create_session"),
    path("voice_input/", views.voice_input, name="voice_input"),
    path("process_text/", views.process_text, name="process_text"),
    path("session/<str:session_id>/", views.get_session, name="get_session"),
    path("generate_cv/<str:session_id>/", views.generate_cv, name="generate_cv"),
    path("chat/", views.chat, name="chat"),
    path("livekit/token/", views_livekit.get_livekit_token, name="livekit_token"),
    
    # New CV endpoints
    path("user/cv/", views.get_user_cv, name="get_user_cv"),
    path("user/cv/save/", views.save_user_cv, name="save_user_cv"),
]
