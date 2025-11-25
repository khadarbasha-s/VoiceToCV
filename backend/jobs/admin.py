"""
Django Admin Configuration for TalentPath
"""

from django.contrib import admin
from .models import (
    UserProfile, Resume, Skill, UserSkill, Recruiter, Job, JobSkill,
    Application, SavedJob, JobRecommendation, Notification
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'location', 'years_of_experience', 'profile_completeness', 'created_at']
    search_fields = ['user__username', 'user__email', 'location']
    list_filter = ['preferred_job_type', 'created_at']


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['resume_id', 'user', 'is_active', 'created_at']
    search_fields = ['user__username']
    list_filter = ['is_active', 'created_at']


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'created_at']
    search_fields = ['name', 'category']
    list_filter = ['category']


@admin.register(UserSkill)
class UserSkillAdmin(admin.ModelAdmin):
    list_display = ['user', 'skill', 'proficiency', 'years_of_experience']
    search_fields = ['user__username', 'skill__name']
    list_filter = ['proficiency']


@admin.register(Recruiter)
class RecruiterAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'user', 'industry', 'verified', 'created_at']
    search_fields = ['company_name', 'user__username', 'industry']
    list_filter = ['verified', 'industry', 'created_at']


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company_name', 'location', 'job_type', 'is_active', 'applications_count', 'created_at']
    search_fields = ['title', 'company_name', 'location']
    list_filter = ['job_type', 'experience_level', 'is_active', 'is_remote', 'created_at']
    readonly_fields = ['applications_count', 'views_count']


@admin.register(JobSkill)
class JobSkillAdmin(admin.ModelAdmin):
    list_display = ['job', 'skill', 'is_required', 'importance']
    search_fields = ['job__title', 'skill__name']
    list_filter = ['is_required']


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['user', 'job', 'status', 'match_score', 'viewed_by_recruiter', 'created_at']
    search_fields = ['user__username', 'job__title']
    list_filter = ['status', 'viewed_by_recruiter', 'created_at']
    readonly_fields = ['match_score', 'matched_skills', 'missing_skills']


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ['user', 'job', 'created_at']
    search_fields = ['user__username', 'job__title']


@admin.register(JobRecommendation)
class JobRecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'job', 'match_score', 'clicked', 'applied', 'created_at']
    search_fields = ['user__username', 'job__title']
    list_filter = ['clicked', 'applied', 'dismissed', 'created_at']
    readonly_fields = ['match_score', 'match_explanation']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'read', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    list_filter = ['notification_type', 'read', 'created_at']





