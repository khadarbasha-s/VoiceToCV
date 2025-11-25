import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

/**
 * Profile Page - Displays user's CV/Resume data
 * Extracted from CV generation
 */
const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = () => {
    try {
      // Get CV data from localStorage
      const storedCV = localStorage.getItem('currentCV');
      
      if (storedCV) {
        const cvData = JSON.parse(storedCV);
        setProfile(cvData);
      } else {
        // No profile data available
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.personal_info?.name,
      profile.personal_info?.email,
      profile.personal_info?.phone,
      profile.personal_info?.address,
      profile.experience?.length > 0,
      profile.education?.degree,
      profile.skills && Object.keys(profile.skills).length > 0,
      profile.projects?.length > 0
    ];
    
    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <UserCircleIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Profile Found</h2>
          <p className="text-gray-600 mb-6">
            Create your CV first to view your profile
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create CV Now
          </button>
        </div>
      </div>
    );
  }

  const completeness = calculateProfileCompleteness();
  const personalInfo = profile.personal_info || {};
  const education = profile.education || {};
  const experience = Array.isArray(profile.experience) ? profile.experience : [];
  const skills = profile.skills || {};
  const projects = Array.isArray(profile.projects) ? profile.projects : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Profile Completeness */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold">
                  {personalInfo.name?.charAt(0) || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {personalInfo.name || 'Your Name'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {experience[0]?.role || 'Professional'}
                  {experience[0]?.company && ` at ${experience[0].company}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="mb-2">
                <div className="text-sm text-gray-600 mb-1">Profile Completeness</div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-900">{completeness}%</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserCircleIcon className="w-6 h-6 text-blue-600" />
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <EnvelopeIcon className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm font-medium text-gray-900">
                  {personalInfo.email || 'Not provided'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <PhoneIcon className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div className="text-sm font-medium text-gray-900">
                  {personalInfo.phone || 'Not provided'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
              <MapPinIcon className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Location</div>
                <div className="text-sm font-medium text-gray-900">
                  {personalInfo.address || 'Not provided'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Experience */}
        {experience.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              Work Experience
            </h2>
            
            <div className="space-y-6">
              {experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {exp.role || exp.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {exp.company}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {exp.start_date || exp.start_year} - {exp.end_date || exp.end_year || 'Present'}
                    </span>
                  </div>
                  
                  {exp.description && (
                    <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                      {exp.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.degree && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AcademicCapIcon className="w-6 h-6 text-blue-600" />
              Education
            </h2>
            
            <div className="border-l-2 border-blue-200 pl-4">
              <h3 className="text-base font-semibold text-gray-900">
                {education.degree}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {education.institute}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {education.start_year && education.end_year && (
                  <span>{education.start_year} - {education.end_year}</span>
                )}
                {education.gpa && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">GPA:</span>
                    <span>{education.gpa}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Skills */}
        {Object.keys(skills).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CodeBracketIcon className="w-6 h-6 text-blue-600" />
              Skills
            </h2>
            
            <div className="space-y-4">
              {Object.entries(skills).map(([category, skillList]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(skillList) ? skillList : [skillList]).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              Projects
            </h2>
            
            <div className="space-y-6">
              {projects.map((project, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {project.project_name || project.name || `Project ${index + 1}`}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {project.description}
                    </p>
                  )}
                  {project.technologies && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.technologies.split(',').map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download CV Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Download Your Resume
              </h3>
              <p className="text-sm text-gray-600">
                Get your professionally formatted resume in DOCX format
              </p>
            </div>
            <button
              onClick={() => {
                const docxBase64 = localStorage.getItem('currentCVDocx');
                if (docxBase64) {
                  try {
                    const byteCharacters = atob(docxBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { 
                      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                    });
                    
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${personalInfo.name || 'resume'}_CV.docx`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error downloading CV:', error);
                    alert('Failed to download CV');
                  }
                } else {
                  alert('CV file not found. Please generate your CV again.');
                }
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <DocumentTextIcon className="w-5 h-5" />
              Download CV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

