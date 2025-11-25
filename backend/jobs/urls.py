"""
TalentPath URL Configuration
All API endpoints for the job portal
"""

from django.urls import path
from . import views

urlpatterns = [
    # User Profile
    path('profile/', views.user_profile, name='user_profile'),
    path('resume/create/', views.create_resume_from_cv, name='create_resume'),
    
    # Job Search & Discovery
    path('jobs/', views.search_jobs, name='search_jobs'),
    path('jobs/<uuid:job_id>/', views.job_detail, name='job_detail'),
    path('jobs/<uuid:job_id>/similar/', views.similar_jobs, name='similar_jobs'),
    path('jobs/recommended/', views.recommended_jobs, name='recommended_jobs'),
    
    # Applications
    path('jobs/<uuid:job_id>/apply/', views.apply_to_job, name='apply_to_job'),
    path('applications/', views.my_applications, name='my_applications'),
    path('applications/<uuid:application_id>/', views.application_detail, name='application_detail'),
    path('applications/<uuid:application_id>/withdraw/', views.withdraw_application, name='withdraw_application'),
    
    # Saved Jobs
    path('jobs/<uuid:job_id>/save/', views.save_job, name='save_job'),
    path('jobs/<uuid:job_id>/unsave/', views.unsave_job, name='unsave_job'),
    path('saved-jobs/', views.saved_jobs, name='saved_jobs'),
    
    # Notifications
    path('notifications/', views.notifications, name='notifications'),
    path('notifications/<uuid:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    
    # Recruiter Endpoints
    path('recruiter/jobs/create/', views.create_job, name='create_job'),
    path('recruiter/jobs/', views.recruiter_jobs, name='recruiter_jobs'),
    path('recruiter/jobs/<uuid:job_id>/applicants/', views.job_applicants, name='job_applicants'),
    path('recruiter/applications/<uuid:application_id>/update/', views.update_application_status, name='update_application_status'),
    
    # Dashboard Stats
    path('dashboard/user/', views.user_dashboard_stats, name='user_dashboard_stats'),
    path('dashboard/recruiter/', views.recruiter_dashboard_stats, name='recruiter_dashboard_stats'),
]





