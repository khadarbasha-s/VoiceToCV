"""
WSGI config for voice_to_cv project.
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voice_to_cv.settings')

application = get_wsgi_application()
