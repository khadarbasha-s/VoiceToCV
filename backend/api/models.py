from django.db import models
import uuid
from django.utils import timezone

class CVSession(models.Model):
    session_id = models.CharField(max_length=64, default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    cv_json = models.JSONField(default=dict)
    conversation = models.JSONField(default=list)
    is_complete = models.BooleanField(default=False)

    def __str__(self):
        return str(self.session_id)
