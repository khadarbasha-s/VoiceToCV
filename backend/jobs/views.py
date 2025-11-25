"""
TalentPath API Views
Complete REST API for job portal functionality
"""

from rest_framework import status, viewsets, filters
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from .models import (
    UserProfile, Resume, Job, Application, SavedJob, 
    JobRecommendation, Notification, Recruiter, Skill, JobSkill
)
from .serializers import (
    UserProfileSerializer, ResumeSerializer, JobListSerializer, 
    JobDetailSerializer, ApplicationSerializer, ApplicationCreateSerializer,
    SavedJobSerializer, JobRecommendationSerializer, NotificationSerializer,
    JobCreateSerializer
)
from .recommendation_engine import generate_recommendations_for_user


# ==================== USER ENDPOINTS ====================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update user profile"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_resume_from_cv(request):
    """
    Create a resume record from VoiceToCV data
    Expected input: {'cv_data': {...}, 'file_url': 'optional'}
    """
    cv_data = request.data.get('cv_data')
    file_url = request.data.get('file_url', '')
    
    if not cv_data:
        return Response({'error': 'cv_data is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Deactivate previous resumes
    Resume.objects.filter(user=request.user).update(is_active=False)
    
    # Create new resume
    resume = Resume.objects.create(
        user=request.user,
        cv_data=cv_data,
        file_url=file_url,
        is_active=True
    )
    
    # Extract and create user skills
    _extract_skills_from_resume(request.user, cv_data)
    
    serializer = ResumeSerializer(resume)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


def _extract_skills_from_resume(user, cv_data):
    """Helper to extract skills from CV and create UserSkill records"""
    from .models import UserSkill
    
    skills = cv_data.get('skills', [])
    for skill_item in skills:
        if isinstance(skill_item, dict):
            skill_name = skill_item.get('name', '')
            proficiency = skill_item.get('level', 'Intermediate')
        else:
            skill_name = str(skill_item)
            proficiency = 'Intermediate'
        
        if skill_name:
            skill, _ = Skill.objects.get_or_create(
                name=skill_name,
                defaults={'category': 'Technical'}
            )
            UserSkill.objects.get_or_create(
                user=user,
                skill=skill,
                defaults={'proficiency': proficiency}
            )


# ==================== JOB SEARCH & DISCOVERY ====================

@api_view(['GET'])
def search_jobs(request):
    """
    Search and filter jobs
    Query params: keyword, location, job_type, experience_level, remote, salary_min
    """
    jobs = Job.objects.filter(is_active=True)
    
    # Filters
    keyword = request.GET.get('keyword', '')
    if keyword:
        jobs = jobs.filter(
            Q(title__icontains=keyword) |
            Q(description__icontains=keyword) |
            Q(company_name__icontains=keyword)
        )
    
    location = request.GET.get('location', '')
    if location:
        jobs = jobs.filter(location__icontains=location)
    
    job_type = request.GET.get('job_type', '')
    if job_type:
        jobs = jobs.filter(job_type=job_type)
    
    experience_level = request.GET.get('experience_level', '')
    if experience_level:
        jobs = jobs.filter(experience_level=experience_level)
    
    remote = request.GET.get('remote', '')
    if remote == 'true':
        jobs = jobs.filter(is_remote=True)
    
    salary_min = request.GET.get('salary_min', '')
    if salary_min:
        jobs = jobs.filter(salary_max__gte=int(salary_min))
    
    # Pagination
    page = int(request.GET.get('page', 1))
    page_size = int(request.GET.get('page_size', 20))
    start = (page - 1) * page_size
    end = start + page_size
    
    total = jobs.count()
    jobs = jobs.order_by('-created_at')[start:end]
    
    serializer = JobListSerializer(jobs, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': (total + page_size - 1) // page_size
    })


@api_view(['GET'])
def job_detail(request, job_id):
    """Get detailed job information"""
    job = get_object_or_404(Job, job_id=job_id, is_active=True)
    
    # Increment view count
    job.views_count += 1
    job.save(update_fields=['views_count'])
    
    serializer = JobDetailSerializer(job, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recommended_jobs(request):
    """Get AI-recommended jobs for user"""
    # Generate fresh recommendations
    recommendations = generate_recommendations_for_user(request.user, limit=20)
    
    serializer = JobRecommendationSerializer(recommendations, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def similar_jobs(request, job_id):
    """Get similar jobs based on a specific job"""
    job = get_object_or_404(Job, job_id=job_id)
    
    # Find jobs with similar skills and characteristics
    similar = Job.objects.filter(
        is_active=True,
        experience_level=job.experience_level
    ).exclude(job_id=job_id)
    
    # Filter by shared skills
    job_skill_ids = job.required_skills.values_list('skill_id', flat=True)
    if job_skill_ids:
        similar = similar.filter(required_skills__skill_id__in=job_skill_ids).distinct()
    
    similar = similar[:10]
    
    serializer = JobListSerializer(similar, many=True, context={'request': request})
    return Response(serializer.data)


# ==================== JOB APPLICATIONS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_job(request, job_id):
    """
    Apply to a job
    Auto-attaches active resume and calculates match score
    """
    job = get_object_or_404(Job, job_id=job_id, is_active=True)
    
    # Check if already applied
    if Application.objects.filter(user=request.user, job=job).exists():
        return Response({'error': 'You have already applied to this job'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Get active resume
    resume = Resume.objects.filter(user=request.user, is_active=True).first()
    if not resume:
        return Response({'error': 'Please create a resume first'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Calculate match score
    from .recommendation_engine import JobRecommendationEngine
    engine = JobRecommendationEngine(request.user, resume)
    score, explanation, matched, missing = engine.calculate_match_score(job)
    
    # Create application
    application = Application.objects.create(
        job=job,
        user=request.user,
        resume=resume,
        cover_letter=request.data.get('cover_letter', ''),
        match_score=score,
        matched_skills=matched,
        missing_skills=missing
    )
    
    # Update job applications count
    job.applications_count += 1
    job.save(update_fields=['applications_count'])
    
    # Send notification email to recruiter
    _send_application_email(application)
    
    # Create notification for user
    Notification.objects.create(
        user=request.user,
        notification_type='application_status',
        title='Application Submitted',
        message=f'Your application for {job.title} at {job.company_name} has been submitted successfully.',
        link=f'/applications/{application.application_id}'
    )
    
    serializer = ApplicationSerializer(application)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


def _send_application_email(application):
    """Send email notification to recruiter about new application"""
    try:
        recruiter_email = application.job.recruiter.user.email
        subject = f"New Application: {application.job.title}"
        message = f"""
        New application received!
        
        Job: {application.job.title}
        Applicant: {application.user.get_full_name() or application.user.username}
        Match Score: {application.match_score}%
        
        View application in your dashboard.
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recruiter_email],
            fail_silently=True
        )
    except Exception as e:
        print(f"Failed to send email: {e}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):
    """Get user's job applications"""
    applications = Application.objects.filter(user=request.user).order_by('-created_at')
    
    # Filter by status if provided
    status_filter = request.GET.get('status', '')
    if status_filter:
        applications = applications.filter(status=status_filter)
    
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def application_detail(request, application_id):
    """Get application details"""
    application = get_object_or_404(Application, application_id=application_id, user=request.user)
    serializer = ApplicationSerializer(application)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def withdraw_application(request, application_id):
    """Withdraw a job application"""
    application = get_object_or_404(Application, application_id=application_id, user=request.user)
    
    if application.status in ['offered', 'interview']:
        return Response({'error': 'Cannot withdraw application at this stage'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    application.status = 'withdrawn'
    application.save()
    
    return Response({'message': 'Application withdrawn successfully'})


# ==================== SAVED JOBS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_job(request, job_id):
    """Save a job for later"""
    job = get_object_or_404(Job, job_id=job_id)
    
    saved_job, created = SavedJob.objects.get_or_create(user=request.user, job=job)
    
    if created:
        return Response({'message': 'Job saved successfully'}, status=status.HTTP_201_CREATED)
    else:
        return Response({'message': 'Job already saved'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsave_job(request, job_id):
    """Remove job from saved list"""
    job = get_object_or_404(Job, job_id=job_id)
    SavedJob.objects.filter(user=request.user, job=job).delete()
    
    return Response({'message': 'Job removed from saved list'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saved_jobs(request):
    """Get user's saved jobs"""
    saved = SavedJob.objects.filter(user=request.user)
    serializer = SavedJobSerializer(saved, many=True, context={'request': request})
    return Response(serializer.data)


# ==================== NOTIFICATIONS ====================

@api_view(['GET'])
def notifications(request):
    """Get user notifications"""
    # Return empty list if not authenticated
    if not request.user.is_authenticated:
        return Response([])
    
    notifs = Notification.objects.filter(user=request.user).order_by('-created_at')[:50]
    serializer = NotificationSerializer(notifs, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
def mark_notification_read(request, notification_id):
    """Mark notification as read"""
    # Allow without authentication for testing
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    notif = get_object_or_404(Notification, notification_id=notification_id, user=request.user)
    notif.read = True
    notif.save()
    return Response({'message': 'Notification marked as read'})


# ==================== RECRUITER ENDPOINTS ====================

@api_view(['POST'])
def create_job(request):
    """Recruiter creates a new job posting"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Received job creation request with data: {request.data}")
    
    try:
        # Get or create a default recruiter if none exists
        recruiter = Recruiter.objects.first()
        if not recruiter:
            # Create a default recruiter for testing
            from django.contrib.auth.models import User
            default_user, _ = User.objects.get_or_create(
                username='default_recruiter',
                defaults={'email': 'recruiter@talentpath.com', 'password': 'password123'}
            )
            recruiter = Recruiter.objects.create(
                user=default_user,
                company_name='TalentPath',
                contact_email='recruiter@talentpath.com',
                contact_phone='0000000000'
            )
            logger.info(f"Created default recruiter: {recruiter.company_name}")
        
        serializer = JobCreateSerializer(data=request.data)
        if serializer.is_valid():
            job = serializer.save(recruiter=recruiter)
            logger.info(f"Job created successfully: {job.title} - {job.job_id}")
            return Response(JobDetailSerializer(job).data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Job creation validation failed: {serializer.errors}")
            return Response({
                'error': 'Validation failed',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.exception(f"Job creation failed with exception: {str(e)}")
        return Response({
            'error': f'Job creation failed: {str(e)}',
            'type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def recruiter_jobs(request):
    """Get jobs posted by recruiter"""
    # Get first recruiter or return empty list
    recruiter = Recruiter.objects.first()
    if not recruiter:
        return Response([])
    
    jobs = Job.objects.filter(recruiter=recruiter).annotate(
        applicants_count=Count('applications')
    ).order_by('-created_at')
    
    serializer = JobListSerializer(jobs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_applicants(request, job_id):
    """Get all applicants for a job"""
    job = get_object_or_404(Job, job_id=job_id)
    
    # Verify recruiter owns this job
    try:
        if job.recruiter != request.user.recruiter_profile:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    except Recruiter.DoesNotExist:
        return Response({'error': 'Not a recruiter'}, status=status.HTTP_403_FORBIDDEN)
    
    applications = Application.objects.filter(job=job).order_by('-match_score')
    
    # Filter by status
    status_filter = request.GET.get('status', '')
    if status_filter:
        applications = applications.filter(status=status_filter)
    
    serializer = ApplicationSerializer(applications, many=True)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_application_status(request, application_id):
    """Recruiter updates application status"""
    application = get_object_or_404(Application, application_id=application_id)
    
    # Verify recruiter owns this job
    try:
        if application.job.recruiter != request.user.recruiter_profile:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    except Recruiter.DoesNotExist:
        return Response({'error': 'Not a recruiter'}, status=status.HTTP_403_FORBIDDEN)
    
    new_status = request.data.get('status')
    notes = request.data.get('notes', '')
    
    if new_status:
        application.status = new_status
        application.recruiter_notes = notes
        application.viewed_by_recruiter = True
        application.viewed_at = timezone.now()
        application.save()
        
        # Notify user
        status_messages = {
            'reviewed': 'Your application has been reviewed',
            'shortlisted': 'Great news! You have been shortlisted',
            'interview': 'You have been invited for an interview',
            'offered': 'Congratulations! You have received an offer',
            'rejected': 'Application status updated'
        }
        
        Notification.objects.create(
            user=application.user,
            notification_type='application_status',
            title=f'Application Update: {application.job.title}',
            message=status_messages.get(new_status, 'Your application status has been updated'),
            link=f'/applications/{application.application_id}'
        )
    
    serializer = ApplicationSerializer(application)
    return Response(serializer.data)


# ==================== DASHBOARD STATS ====================

@api_view(['GET'])
def user_dashboard_stats(request):
    """Get dashboard statistics for user"""
    # Return default stats if not authenticated
    if not request.user.is_authenticated:
        return Response({
            'applications_count': 0,
            'saved_jobs_count': 0,
            'unread_notifications': 0,
            'profile_completeness': 75,
            'search_appearances': 0,
            'recruiter_actions': 0,
            'recent_applications': []
        })
    
    applications_count = Application.objects.filter(user=request.user).count()
    saved_jobs_count = SavedJob.objects.filter(user=request.user).count()
    unread_notifications = Notification.objects.filter(user=request.user, read=False).count()
    
    # Recent applications
    recent_applications = Application.objects.filter(user=request.user).order_by('-created_at')[:5]
    
    # Profile completeness
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    
    return Response({
        'applications_count': applications_count,
        'saved_jobs_count': saved_jobs_count,
        'unread_notifications': unread_notifications,
        'profile_completeness': profile.profile_completeness,
        'search_appearances': 0,
        'recruiter_actions': 0,
        'recent_applications': ApplicationSerializer(recent_applications, many=True).data
    })


@api_view(['GET'])
def recruiter_dashboard_stats(request):
    """Get dashboard statistics for recruiter"""
    # Get first recruiter or create default
    recruiter = Recruiter.objects.first()
    if not recruiter:
        return Response({
            'total_jobs': 0,
            'active_jobs': 0,
            'total_applications': 0,
            'pending_applications': 0
        })
    
    total_jobs = Job.objects.filter(recruiter=recruiter).count()
    active_jobs = Job.objects.filter(recruiter=recruiter, is_active=True).count()
    total_applications = Application.objects.filter(job__recruiter=recruiter).count()
    pending_applications = Application.objects.filter(
        job__recruiter=recruiter, 
        status='submitted',
        viewed_by_recruiter=False
    ).count()
    
    return Response({
        'total_jobs': total_jobs,
        'active_jobs': active_jobs,
        'total_applications': total_applications,
        'pending_applications': pending_applications
    })




