"""
TalentPath Job Portal Models
Complete database schema for job matching, applications, and recommendations
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class UserProfile(models.Model):
    """Extended user profile with CV data"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    profile_picture = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)
    years_of_experience = models.IntegerField(default=0)
    current_job_title = models.CharField(max_length=200, blank=True)
    preferred_job_type = models.CharField(max_length=50, blank=True)  # Full-time, Part-time, Contract
    expected_salary = models.IntegerField(null=True, blank=True)
    profile_completeness = models.IntegerField(default=0)  # 0-100%
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Resume(models.Model):
    """User's uploaded/generated resumes"""
    resume_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    cv_data = models.JSONField()  # Stores the complete CV JSON from VoiceToCV
    file_url = models.URLField(blank=True)  # Storage URL for PDF/DOCX
    is_active = models.BooleanField(default=True)  # Currently active resume
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Resume for {self.user.username}"

    @property
    def skills_list(self):
        """Extract skills from CV data"""
        return self.cv_data.get('skills', [])

    @property
    def experience_years(self):
        """Calculate total years of experience"""
        experiences = self.cv_data.get('experience', [])
        # Simple calculation - can be enhanced
        return len(experiences)


class Skill(models.Model):
    """Master skill list for matching"""
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50)  # Technical, Soft, Language, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserSkill(models.Model):
    """User's skills extracted from resume"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    proficiency = models.CharField(max_length=20, default='Intermediate')  # Beginner, Intermediate, Expert
    years_of_experience = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'skill']

    def __str__(self):
        return f"{self.user.username} - {self.skill.name}"


class Recruiter(models.Model):
    """Recruiter/HR profiles"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruiter_profile')
    company_name = models.CharField(max_length=200)
    company_logo = models.URLField(blank=True)
    company_website = models.URLField(blank=True)
    company_description = models.TextField(blank=True)
    company_size = models.CharField(max_length=50, blank=True)  # 1-10, 11-50, 51-200, etc.
    industry = models.CharField(max_length=100, blank=True)
    verified = models.BooleanField(default=False)
    phone = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name} - {self.user.username}"


class Job(models.Model):
    """Job postings"""
    JOB_TYPE_CHOICES = [
        ('full-time', 'Full Time'),
        ('part-time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('freelance', 'Freelance'),
    ]

    EXPERIENCE_LEVEL_CHOICES = [
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('lead', 'Lead/Principal'),
    ]

    job_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE, related_name='jobs', null=True, blank=True)
    title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200)
    location = models.CharField(max_length=100)
    is_remote = models.BooleanField(default=False)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full-time')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, default='mid')
    min_experience = models.IntegerField(default=0)
    max_experience = models.IntegerField(default=10)
    
    description = models.TextField()
    responsibilities = models.TextField()
    requirements = models.TextField()
    nice_to_have = models.TextField(blank=True)
    
    salary_min = models.IntegerField(null=True, blank=True)
    salary_max = models.IntegerField(null=True, blank=True)
    salary_currency = models.CharField(max_length=10, default='USD')
    salary_disclosed = models.BooleanField(default=True)
    
    applications_count = models.IntegerField(default=0)
    views_count = models.IntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['location']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} at {self.company_name}"


class JobSkill(models.Model):
    """Skills required for a job"""
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='required_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    is_required = models.BooleanField(default=True)  # Required vs Nice-to-have
    importance = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])

    class Meta:
        unique_together = ['job', 'skill']

    def __str__(self):
        return f"{self.job.title} - {self.skill.name}"


class Application(models.Model):
    """Job applications"""
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('shortlisted', 'Shortlisted'),
        ('interview', 'Interview'),
        ('offered', 'Offered'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]

    application_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    cover_letter = models.TextField(blank=True)
    
    match_score = models.FloatField(default=0.0)  # 0-100
    matched_skills = models.JSONField(default=list)  # List of matched skill IDs
    missing_skills = models.JSONField(default=list)  # List of missing skill IDs
    
    recruiter_notes = models.TextField(blank=True)
    viewed_by_recruiter = models.BooleanField(default=False)
    viewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['job', 'user']  # One application per job per user

    def __str__(self):
        return f"{self.user.username} -> {self.job.title}"


class SavedJob(models.Model):
    """Jobs saved by users for later"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_jobs')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='saved_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'job']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} saved {self.job.title}"


class JobRecommendation(models.Model):
    """AI-generated job recommendations"""
    recommendation_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recommendations')
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='recommendations')
    
    match_score = models.FloatField()  # 0-100
    matched_skills = models.JSONField(default=list)
    missing_skills = models.JSONField(default=list)
    match_explanation = models.TextField()  # Explainable AI
    
    clicked = models.BooleanField(default=False)
    applied = models.BooleanField(default=False)
    dismissed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-match_score', '-created_at']
        unique_together = ['user', 'job']

    def __str__(self):
        return f"Recommend {self.job.title} to {self.user.username} ({self.match_score}%)"


class Notification(models.Model):
    """User notifications"""
    NOTIFICATION_TYPES = [
        ('application_status', 'Application Status Update'),
        ('new_recommendation', 'New Job Recommendation'),
        ('message', 'Message from Recruiter'),
        ('interview', 'Interview Invitation'),
        ('system', 'System Notification'),
    ]

    notification_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.URLField(blank=True)
    
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

