from django.contrib import admin
from .models import CVSession

@admin.register(CVSession)
class CVSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'created_at', 'is_complete']
    readonly_fields = ['session_id', 'created_at', 'updated_at']
