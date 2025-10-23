from rest_framework import serializers
from .models import CVSession

class CVSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVSession
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at",)
