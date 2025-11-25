"""
TalentPath Setup Script
Run this after migrations to populate initial data
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voice_to_cv.settings')
django.setup()

from django.contrib.auth.models import User
from jobs.models import Skill, Recruiter, Job, JobSkill
import random

def create_skills():
    """Create initial skill set"""
    skills_data = [
        # Technical Skills
        ('Python', 'Technical'),
        ('JavaScript', 'Technical'),
        ('React', 'Technical'),
        ('Node.js', 'Technical'),
        ('Django', 'Technical'),
        ('Java', 'Technical'),
        ('C++', 'Technical'),
        ('SQL', 'Technical'),
        ('PostgreSQL', 'Technical'),
        ('MongoDB', 'Technical'),
        ('Docker', 'Technical'),
        ('Kubernetes', 'Technical'),
        ('AWS', 'Technical'),
        ('Azure', 'Technical'),
        ('Git', 'Technical'),
        ('HTML/CSS', 'Technical'),
        ('TypeScript', 'Technical'),
        ('Vue.js', 'Technical'),
        ('Angular', 'Technical'),
        ('REST API', 'Technical'),
        ('GraphQL', 'Technical'),
        ('Machine Learning', 'Technical'),
        ('Data Analysis', 'Technical'),
        ('DevOps', 'Technical'),
        
        # Soft Skills
        ('Communication', 'Soft'),
        ('Leadership', 'Soft'),
        ('Team Collaboration', 'Soft'),
        ('Problem Solving', 'Soft'),
        ('Time Management', 'Soft'),
        ('Critical Thinking', 'Soft'),
        ('Adaptability', 'Soft'),
        ('Creativity', 'Soft'),
        
        # Languages
        ('English', 'Language'),
        ('Spanish', 'Language'),
        ('French', 'Language'),
        ('German', 'Language'),
        ('Mandarin', 'Language'),
    ]
    
    created_count = 0
    for name, category in skills_data:
        skill, created = Skill.objects.get_or_create(
            name=name,
            defaults={'category': category}
        )
        if created:
            created_count += 1
            print(f"✓ Created skill: {name}")
    
    print(f"\n✅ Created {created_count} new skills")
    return Skill.objects.all()


def create_sample_recruiters():
    """Create sample recruiter accounts"""
    recruiters_data = [
        {
            'username': 'techcorp_hr',
            'email': 'hr@techcorp.com',
            'first_name': 'Sarah',
            'last_name': 'Johnson',
            'company_name': 'TechCorp Inc.',
            'company_description': 'Leading technology company specializing in cloud solutions.',
            'industry': 'Technology',
            'company_size': '1000-5000',
        },
        {
            'username': 'startup_recruiter',
            'email': 'jobs@innovatestart.com',
            'first_name': 'Mike',
            'last_name': 'Chen',
            'company_name': 'InnovateStart',
            'company_description': 'Fast-growing startup in AI and machine learning.',
            'industry': 'Technology',
            'company_size': '11-50',
        },
        {
            'username': 'bigtech_hiring',
            'email': 'careers@bigtech.com',
            'first_name': 'Emily',
            'last_name': 'Williams',
            'company_name': 'BigTech Solutions',
            'company_description': 'Global leader in enterprise software solutions.',
            'industry': 'Technology',
            'company_size': '5000+',
        }
    ]
    
    created_count = 0
    recruiters = []
    
    for data in recruiters_data:
        user, user_created = User.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name']
            }
        )
        
        if user_created:
            user.set_password('recruiter123')  # Default password
            user.save()
        
        recruiter, rec_created = Recruiter.objects.get_or_create(
            user=user,
            defaults={
                'company_name': data['company_name'],
                'company_description': data['company_description'],
                'industry': data['industry'],
                'company_size': data['company_size'],
                'phone': '+1-555-0100',
                'verified': True
            }
        )
        
        if rec_created:
            created_count += 1
            print(f"✓ Created recruiter: {data['company_name']}")
            
        recruiters.append(recruiter)
    
    print(f"\n✅ Created {created_count} new recruiters")
    return recruiters


def create_sample_jobs(recruiters, skills):
    """Create sample job postings"""
    jobs_data = [
        {
            'title': 'Senior Full Stack Developer',
            'location': 'San Francisco, CA',
            'is_remote': True,
            'job_type': 'full-time',
            'experience_level': 'senior',
            'min_experience': 5,
            'max_experience': 10,
            'salary_min': 120000,
            'salary_max': 180000,
            'description': 'We are looking for an experienced Full Stack Developer to join our growing team. You will work on cutting-edge web applications using modern technologies.',
            'responsibilities': '• Design and develop scalable web applications\n• Collaborate with cross-functional teams\n• Write clean, maintainable code\n• Participate in code reviews\n• Mentor junior developers',
            'requirements': '• 5+ years of full stack development experience\n• Strong proficiency in React and Node.js\n• Experience with SQL databases\n• Excellent problem-solving skills\n• Strong communication skills',
            'nice_to_have': '• Experience with AWS or Azure\n• Knowledge of Docker and Kubernetes\n• Open source contributions',
            'required_skills': ['Python', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
        },
        {
            'title': 'Frontend Developer',
            'location': 'New York, NY',
            'is_remote': False,
            'job_type': 'full-time',
            'experience_level': 'mid',
            'min_experience': 2,
            'max_experience': 5,
            'salary_min': 80000,
            'salary_max': 120000,
            'description': 'Join our team as a Frontend Developer and help us build beautiful, responsive user interfaces.',
            'responsibilities': '• Develop user-facing features using React\n• Ensure technical feasibility of UI/UX designs\n• Optimize applications for maximum speed\n• Collaborate with backend developers',
            'requirements': '• 2+ years of frontend development experience\n• Proficiency in React and JavaScript\n• Experience with HTML/CSS\n• Understanding of responsive design',
            'nice_to_have': '• TypeScript experience\n• Experience with state management (Redux)\n• UI/UX design skills',
            'required_skills': ['JavaScript', 'React', 'HTML/CSS', 'TypeScript'],
        },
        {
            'title': 'Machine Learning Engineer',
            'location': 'Remote',
            'is_remote': True,
            'job_type': 'full-time',
            'experience_level': 'senior',
            'min_experience': 4,
            'max_experience': 8,
            'salary_min': 130000,
            'salary_max': 190000,
            'description': 'We\'re seeking a talented ML Engineer to develop and deploy machine learning models at scale.',
            'responsibilities': '• Design and implement ML models\n• Deploy models to production\n• Optimize model performance\n• Collaborate with data scientists',
            'requirements': '• 4+ years of ML engineering experience\n• Strong Python programming skills\n• Experience with TensorFlow or PyTorch\n• Understanding of ML algorithms',
            'nice_to_have': '• PhD in Computer Science or related field\n• Publications in ML conferences\n• Experience with MLOps',
            'required_skills': ['Python', 'Machine Learning', 'Data Analysis', 'AWS'],
        },
        {
            'title': 'DevOps Engineer',
            'location': 'Austin, TX',
            'is_remote': True,
            'job_type': 'full-time',
            'experience_level': 'mid',
            'min_experience': 3,
            'max_experience': 6,
            'salary_min': 100000,
            'salary_max': 150000,
            'description': 'Join our DevOps team to build and maintain our cloud infrastructure.',
            'responsibilities': '• Manage cloud infrastructure\n• Implement CI/CD pipelines\n• Monitor system performance\n• Automate deployment processes',
            'requirements': '• 3+ years of DevOps experience\n• Experience with AWS or Azure\n• Proficiency in Docker and Kubernetes\n• Strong scripting skills',
            'nice_to_have': '• Terraform or Ansible experience\n• Security certifications\n• Experience with monitoring tools',
            'required_skills': ['DevOps', 'Docker', 'Kubernetes', 'AWS', 'Python'],
        },
        {
            'title': 'Junior Python Developer',
            'location': 'Boston, MA',
            'is_remote': False,
            'job_type': 'full-time',
            'experience_level': 'entry',
            'min_experience': 0,
            'max_experience': 2,
            'salary_min': 60000,
            'salary_max': 85000,
            'description': 'Great opportunity for a junior developer to learn and grow in a supportive environment.',
            'responsibilities': '• Write Python code under supervision\n• Learn our development processes\n• Participate in team meetings\n• Fix bugs and implement features',
            'requirements': '• Bachelor\'s degree in Computer Science or related field\n• Basic Python knowledge\n• Eagerness to learn\n• Good communication skills',
            'nice_to_have': '• Personal projects or portfolio\n• Internship experience\n• Knowledge of web frameworks',
            'required_skills': ['Python', 'Git', 'SQL'],
        }
    ]
    
    created_count = 0
    
    for i, job_data in enumerate(jobs_data):
        recruiter = recruiters[i % len(recruiters)]
        
        required_skill_names = job_data.pop('required_skills')
        
        job, job_created = Job.objects.get_or_create(
            title=job_data['title'],
            recruiter=recruiter,
            defaults={
                **job_data,
                'company_name': recruiter.company_name
            }
        )
        
        if job_created:
            created_count += 1
            print(f"✓ Created job: {job_data['title']} at {recruiter.company_name}")
            
            # Add required skills
            for skill_name in required_skill_names:
                skill = skills.filter(name=skill_name).first()
                if skill:
                    JobSkill.objects.create(
                        job=job,
                        skill=skill,
                        is_required=True,
                        importance=random.randint(7, 10)
                    )
    
    print(f"\n✅ Created {created_count} new jobs")


def main():
    print("=" * 50)
    print("TalentPath Setup Script")
    print("=" * 50)
    print()
    
    print("Step 1: Creating skills...")
    skills = create_skills()
    print()
    
    print("Step 2: Creating sample recruiters...")
    recruiters = create_sample_recruiters()
    print()
    
    print("Step 3: Creating sample jobs...")
    create_sample_jobs(recruiters, skills)
    print()
    
    print("=" * 50)
    print("✅ Setup Complete!")
    print("=" * 50)
    print()
    print("Sample Recruiter Credentials:")
    print("Username: techcorp_hr")
    print("Password: recruiter123")
    print()
    print("You can now:")
    print("1. Run the backend server: python manage.py runserver")
    print("2. Run the frontend: cd frontend && npm start")
    print("3. Visit: http://localhost:3000/talentpath/dashboard")
    print()


if __name__ == '__main__':
    main()





