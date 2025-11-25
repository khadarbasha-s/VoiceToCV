"""
DRF Serializers for TalentPath API
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile, Resume, Skill, UserSkill, Recruiter, Job, JobSkill,
    Application, SavedJob, JobRecommendation, Notification
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category']


class UserSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)

    class Meta:
        model = UserSkill
        fields = '__all__'


class ResumeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    skills_list = serializers.ReadOnlyField()
    experience_years = serializers.ReadOnlyField()

    class Meta:
        model = Resume
        fields = '__all__'


class RecruiterSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Recruiter
        fields = '__all__'


class JobSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)

    class Meta:
        model = JobSkill
        fields = ['id', 'skill', 'is_required', 'importance']


class JobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for job lists"""
    company_logo = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'job_id', 'title', 'company_name', 'company_logo', 'location', 
            'is_remote', 'job_type', 'experience_level', 'salary_min', 
            'salary_max', 'salary_currency', 'salary_disclosed',
            'is_saved', 'has_applied', 'created_at'
        ]

    def get_company_logo(self, obj):
        return obj.recruiter.company_logo if obj.recruiter else None

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(user=request.user, job=obj).exists()
        return False

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Application.objects.filter(user=request.user, job=obj).exists()
        return False


class JobDetailSerializer(serializers.ModelSerializer):
    """Full job details with all information"""
    required_skills = JobSkillSerializer(many=True, read_only=True)
    recruiter = RecruiterSerializer(read_only=True)
    is_saved = serializers.SerializerMethodField()
    has_applied = serializers.SerializerMethodField()
    company_logo = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = '__all__'

    def get_company_logo(self, obj):
        return obj.recruiter.company_logo if obj.recruiter else None

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return SavedJob.objects.filter(user=request.user, job=obj).exists()
        return False

    def get_has_applied(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Application.objects.filter(user=request.user, job=obj).exists()
        return False


class ApplicationSerializer(serializers.ModelSerializer):
    job = JobListSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    resume = ResumeSerializer(read_only=True)

    class Meta:
        model = Application
        fields = '__all__'


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating applications"""
    class Meta:
        model = Application
        fields = ['job', 'resume', 'cover_letter']


class SavedJobSerializer(serializers.ModelSerializer):
    job = JobListSerializer(read_only=True)

    class Meta:
        model = SavedJob
        fields = '__all__'


class JobRecommendationSerializer(serializers.ModelSerializer):
    job = JobListSerializer(read_only=True)
    matched_skills_details = serializers.SerializerMethodField()
    missing_skills_details = serializers.SerializerMethodField()

    class Meta:
        model = JobRecommendation
        fields = '__all__'

    def get_matched_skills_details(self, obj):
        skills = Skill.objects.filter(id__in=obj.matched_skills)
        return SkillSerializer(skills, many=True).data

    def get_missing_skills_details(self, obj):
        skills = Skill.objects.filter(id__in=obj.missing_skills)
        return SkillSerializer(skills, many=True).data


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class JobCreateSerializer(serializers.ModelSerializer):
    """Serializer for recruiter creating jobs"""
    skills = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    class Meta:
        model = Job
        exclude = ['recruiter', 'applications_count', 'views_count']

    def create(self, validated_data):
        skills_data = validated_data.pop('skills', [])
        job = Job.objects.create(**validated_data)
        
        # Add skills
        for skill_data in skills_data:
            skill_name = skill_data.get('name')
            is_required = skill_data.get('is_required', True)
            importance = skill_data.get('importance', 5)
            
            skill, _ = Skill.objects.get_or_create(
                name=skill_name,
                defaults={'category': skill_data.get('category', 'Technical')}
            )
            
            JobSkill.objects.create(
                job=job,
                skill=skill,
                is_required=is_required,
                importance=importance
            )
        
        return job





