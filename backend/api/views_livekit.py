import os
import time
from django.http import JsonResponse
from rest_framework.decorators import api_view
from livekit.api import AccessToken, VideoGrants


@api_view(["POST"])
def get_livekit_token(request):
    """
    Return a short-lived LiveKit access token for the caller. The frontend must
    supply a room name (defaults to "voice-cv-room") and an identity for the
    participant. The LiveKit websocket URL is returned alongside the token so
    the client can initiate the connection without hard-coding the value.
    """
    room_name = request.data.get("room", "voice-cv-room")
    identity = request.data.get("username") or f"user-{int(time.time())}"

    api_key = os.getenv("LIVEKIT_API_KEY", "devkey")
    api_secret = os.getenv("LIVEKIT_API_SECRET", "secret")
    ws_url = os.getenv("LIVEKIT_WS_URL", "ws://localhost:7880")

    token = AccessToken(api_key=api_key, api_secret=api_secret)
    token.with_identity(identity)
    token.with_name(identity)

    grant = VideoGrants(
        room_join=True,
        room=room_name,
        can_publish=True,
        can_subscribe=True,
    )
    token.add_grant(grant)
    token.with_expiration(int(time.time()) + 60 * 60)  # 1 hour lifetime

    return JsonResponse({"token": token.to_jwt(), "url": ws_url})
