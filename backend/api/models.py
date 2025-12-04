from django.db import models
from django.contrib.auth.models import User
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


# ==================== STRUCTURED CV MODELS ====================

class UserCV(models.Model):
    """Main CV model linked to a user"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cv_profile')
    
    # Personal Information
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    portfolio = models.URLField(blank=True)
    
    # Summary/Objective
    summary = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "User CV"
        verbose_name_plural = "User CVs"
    
    def __str__(self):
        return f"{self.full_name}'s CV"


class Education(models.Model):
    """Education details"""
    cv = models.ForeignKey(UserCV, on_delete=models.CASCADE, related_name='education')
    
    degree = models.CharField(max_length=200)
    institute = models.CharField(max_length=300)
    start_year = models.CharField(max_length=4, blank=True)
    end_year = models.CharField(max_length=4, blank=True)
    gpa = models.CharField(max_length=20, blank=True)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-order', '-end_year']
    
    def __str__(self):
        return f"{self.degree} at {self.institute}"


class Experience(models.Model):
    """Work experience"""
    cv = models.ForeignKey(UserCV, on_delete=models.CASCADE, related_name='experience')
    
    company = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    start_date = models.CharField(max_length=50)
    end_date = models.CharField(max_length=50)  # Can be "Present"
    description = models.TextField()
    
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-order', '-start_date']
    
    def __str__(self):
        return f"{self.role} at {self.company}"


class Skill(models.Model):
    """Skills with categories"""
    cv = models.ForeignKey(UserCV, on_delete=models.CASCADE, related_name='skills')
    
    category = models.CharField(max_length=100, default='General')  # e.g., "Programming", "Frameworks"
    name = models.CharField(max_length=100)
    proficiency = models.CharField(
        max_length=20,
        choices=[
            ('Beginner', 'Beginner'),
            ('Intermediate', 'Intermediate'),
            ('Advanced', 'Advanced'),
            ('Expert', 'Expert')
        ],
        default='Intermediate'
    )
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class Project(models.Model):
    """Projects"""
    cv = models.ForeignKey(UserCV, on_delete=models.CASCADE, related_name='projects')
    
    project_name = models.CharField(max_length=200)
    description = models.TextField()
    technologies = models.CharField(max_length=500, blank=True)
    date = models.CharField(max_length=50, blank=True)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-order', '-date']
    
    def __str__(self):
        return self.project_name


class Certification(models.Model):
    """Certifications"""
    cv = models.ForeignKey(UserCV, on_delete=models.CASCADE, related_name='certifications')
    
    name = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200)
    year = models.CharField(max_length=4, blank=True)
    
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-order', '-year']
    
    def __str__(self):
        return f"{self.name} by {self.issuer}"
