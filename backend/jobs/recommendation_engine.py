"""
TalentPath Job Recommendation Engine
AI-powered job matching with explainable recommendations
"""

from typing import List, Dict, Tuple
from django.db.models import Q
from .models import Job, JobSkill, Skill, Resume, JobRecommendation, UserSkill
import re


class JobRecommendationEngine:
    """
    Matches jobs to users based on:
    - Skills (weighted)
    - Experience level
    - Job title/role keywords
    - Projects
    - Location preferences
    """

    def __init__(self, user, resume: Resume = None):
        self.user = user
        self.resume = resume or user.resumes.filter(is_active=True).first()
        self.cv_data = self.resume.cv_data if self.resume else {}

    def get_recommendations(self, limit: int = 20) -> List[JobRecommendation]:
        """Generate top job recommendations for user"""
        if not self.resume:
            return []

        # Get active jobs
        jobs = Job.objects.filter(is_active=True).prefetch_related('required_skills__skill')

        recommendations = []
        for job in jobs:
            score, explanation, matched, missing = self.calculate_match_score(job)
            
            if score >= 30:  # Minimum threshold
                recommendations.append({
                    'job': job,
                    'score': score,
                    'explanation': explanation,
                    'matched_skills': matched,
                    'missing_skills': missing
                })

        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        # Create or update recommendation records
        result = []
        for rec in recommendations[:limit]:
            obj, created = JobRecommendation.objects.update_or_create(
                user=self.user,
                job=rec['job'],
                defaults={
                    'match_score': rec['score'],
                    'match_explanation': rec['explanation'],
                    'matched_skills': rec['matched_skills'],
                    'missing_skills': rec['missing_skills']
                }
            )
            result.append(obj)

        return result

    def calculate_match_score(self, job: Job) -> Tuple[float, str, List[int], List[int]]:
        """
        Calculate match score between user and job
        Returns: (score, explanation, matched_skill_ids, missing_skill_ids)
        """
        score = 0.0
        explanation_parts = []
        matched_skills = []
        missing_skills = []

        # 1. Skills Matching (50% weight)
        skill_score, skill_explanation, matched, missing = self._match_skills(job)
        score += skill_score * 0.5
        explanation_parts.append(skill_explanation)
        matched_skills = matched
        missing_skills = missing

        # 2. Experience Matching (20% weight)
        exp_score, exp_explanation = self._match_experience(job)
        score += exp_score * 0.2
        explanation_parts.append(exp_explanation)

        # 3. Job Title/Role Matching (15% weight)
        title_score, title_explanation = self._match_job_title(job)
        score += title_score * 0.15
        explanation_parts.append(title_explanation)

        # 4. Location Matching (10% weight)
        location_score, location_explanation = self._match_location(job)
        score += location_score * 0.1
        explanation_parts.append(location_explanation)

        # 5. Projects/Keywords Matching (5% weight)
        project_score, project_explanation = self._match_projects(job)
        score += project_score * 0.05
        explanation_parts.append(project_explanation)

        explanation = " ".join(explanation_parts)
        return round(score, 2), explanation, matched_skills, missing_skills

    def _match_skills(self, job: Job) -> Tuple[float, str, List[int], List[int]]:
        """Match user skills with job requirements"""
        user_skills = set()
        cv_skills = self.cv_data.get('skills', [])
        
        # Extract skills from CV
        for skill_item in cv_skills:
            if isinstance(skill_item, dict):
                user_skills.add(skill_item.get('name', '').lower())
            else:
                user_skills.add(str(skill_item).lower())

        # Get job required skills
        job_skills = job.required_skills.all()
        if not job_skills:
            return 50.0, "No specific skills required.", [], []

        matched = []
        missing = []
        required_matched = 0
        required_total = 0
        optional_matched = 0
        optional_total = 0

        for job_skill in job_skills:
            skill_name = job_skill.skill.name.lower()
            
            if job_skill.is_required:
                required_total += 1
                if any(s in skill_name or skill_name in s for s in user_skills):
                    required_matched += 1
                    matched.append(job_skill.skill.id)
                else:
                    missing.append(job_skill.skill.id)
            else:
                optional_total += 1
                if any(s in skill_name or skill_name in s for s in user_skills):
                    optional_matched += 1
                    matched.append(job_skill.skill.id)
                else:
                    missing.append(job_skill.skill.id)

        # Calculate score
        required_score = (required_matched / required_total * 70) if required_total > 0 else 0
        optional_score = (optional_matched / optional_total * 30) if optional_total > 0 else 30
        total_score = required_score + optional_score

        # Build explanation
        if required_total > 0:
            explanation = f"You match {required_matched}/{required_total} required skills."
        else:
            explanation = "Skills match well."

        if optional_total > 0:
            explanation += f" Plus {optional_matched}/{optional_total} preferred skills."

        return total_score, explanation, matched, missing

    def _match_experience(self, job: Job) -> Tuple[float, str]:
        """Match experience level"""
        experiences = self.cv_data.get('experience', [])
        total_years = len(experiences)  # Simplified calculation

        min_exp = job.min_experience
        max_exp = job.max_experience

        if min_exp <= total_years <= max_exp:
            score = 100.0
            explanation = f"Your {total_years} years of experience fits perfectly."
        elif total_years < min_exp:
            gap = min_exp - total_years
            score = max(0, 100 - (gap * 20))
            explanation = f"You have {total_years} years, job requires {min_exp}+ years."
        else:
            score = 80.0
            explanation = f"You're overqualified with {total_years} years of experience."

        return score, explanation

    def _match_job_title(self, job: Job) -> Tuple[float, str]:
        """Match job title with user's current/past roles"""
        job_title = job.title.lower()
        
        # Get user's experience titles
        experiences = self.cv_data.get('experience', [])
        user_titles = []
        for exp in experiences:
            if isinstance(exp, dict):
                title = exp.get('job_title', '') or exp.get('position', '')
                if title:
                    user_titles.append(title.lower())

        # Check for keyword matches
        job_keywords = self._extract_keywords(job_title)
        
        score = 0.0
        for user_title in user_titles:
            user_keywords = self._extract_keywords(user_title)
            common = job_keywords.intersection(user_keywords)
            if common:
                score = 100.0
                explanation = f"Your experience as '{user_titles[0]}' matches this role."
                return score, explanation

        # Partial match
        personal_info = self.cv_data.get('personal_info', {})
        current_role = personal_info.get('job_title', '') or personal_info.get('current_position', '')
        
        if current_role:
            current_keywords = self._extract_keywords(current_role.lower())
            common = job_keywords.intersection(current_keywords)
            if common:
                score = 80.0
                explanation = f"Your current role aligns with this position."
                return score, explanation

        return 50.0, "Job title is somewhat related to your background."

    def _match_location(self, job: Job) -> Tuple[float, str]:
        """Match location preferences"""
        if job.is_remote:
            return 100.0, "This is a remote position."

        user_location = self.cv_data.get('personal_info', {}).get('location', '').lower()
        job_location = job.location.lower()

        if not user_location:
            return 50.0, f"Location: {job.location}."

        # Simple string matching
        if user_location in job_location or job_location in user_location:
            return 100.0, f"Job is in your location: {job.location}."
        else:
            return 30.0, f"Job location ({job.location}) differs from yours."

    def _match_projects(self, job: Job) -> Tuple[float, str]:
        """Match projects with job requirements"""
        projects = self.cv_data.get('projects', [])
        if not projects:
            return 50.0, ""

        job_description = (job.description + " " + job.requirements).lower()
        
        # Extract keywords from projects
        project_keywords = set()
        for project in projects:
            if isinstance(project, dict):
                name = project.get('name', '')
                desc = project.get('description', '')
                tech = project.get('technologies', [])
                
                project_keywords.update(self._extract_keywords(name))
                project_keywords.update(self._extract_keywords(desc))
                if isinstance(tech, list):
                    for t in tech:
                        project_keywords.add(str(t).lower())

        # Count matches
        matches = sum(1 for keyword in project_keywords if keyword in job_description)
        
        if matches > 3:
            return 100.0, "Your projects strongly align with this role."
        elif matches > 0:
            return 70.0, "Some of your projects are relevant."
        else:
            return 50.0, ""

    def _extract_keywords(self, text: str) -> set:
        """Extract meaningful keywords from text"""
        # Remove common words
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                     'of', 'with', 'by', 'as', 'is', 'was', 'are', 'been', 'be', 'have', 
                     'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'}
        
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = {w for w in words if len(w) > 2 and w not in stopwords}
        return keywords


def generate_recommendations_for_user(user, limit=20):
    """Helper function to generate recommendations"""
    engine = JobRecommendationEngine(user)
    return engine.get_recommendations(limit=limit)





