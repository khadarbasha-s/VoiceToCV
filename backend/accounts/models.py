from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    """Extended user profile with role information"""
    USER_TYPE_CHOICES = [
        ('employee', 'Employee'),
        ('company', 'Company'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_profile')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='employee')
    phone = models.CharField(max_length=20, blank=True)
    
    # Company-specific fields (only used if user_type is 'company')
    company_name = models.CharField(max_length=200, blank=True)
    company_website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"
    
    def __str__(self):
        return f"{self.user.username} ({self.get_user_type_display()})"
