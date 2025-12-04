from rest_framework import serializers
from .models import CVSession, UserCV, Education, Experience, Skill, Project, Certification


class CVSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CVSession
        fields = '__all__'


# ==================== STRUCTURED CV SERIALIZERS ====================

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'degree', 'institute', 'start_year', 'end_year', 'gpa', 'order']


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = ['id', 'company', 'role', 'start_date', 'end_date', 'description', 'order']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'category', 'name', 'proficiency']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'project_name', 'description', 'technologies', 'date', 'order']


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = ['id', 'name', 'issuer', 'year', 'order']


class UserCVSerializer(serializers.ModelSerializer):
    education = EducationSerializer(many=True, read_only=True)
    experience = ExperienceSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    
    class Meta:
        model = UserCV
        fields = [
            'id', 'full_name', 'email', 'phone', 'address',
            'github', 'linkedin', 'portfolio', 'summary',
            'education', 'experience', 'skills', 'projects', 'certifications',
            'created_at', 'updated_at', 'is_active'
        ]
