import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../../components/talentpath/JobCard';
import { 
  BriefcaseIcon, 
  BookmarkIcon, 
  BellIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

/**
 * TalentPath Dashboard - Naukri-style landing page
 * Shows profile completeness, recommended jobs, and stats
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, youMightLike, preferences
  const [stats, setStats] = useState({
    applications_count: 0,
    saved_jobs_count: 0,
    unread_notifications: 0,
    profile_completeness: 0,
    search_appearances: 0,
    recruiter_actions: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to get CV data from localStorage first
      const storedCV = localStorage.getItem('currentCV');
      if (storedCV) {
        try {
          const cvData = JSON.parse(storedCV);
          setProfile({
            name: cvData.personal_info?.name || 'User',
            email: cvData.personal_info?.email || '',
            phone: cvData.personal_info?.phone || '',
            title: cvData.experience?.[0]?.role || 'Professional',
            company: cvData.experience?.[0]?.company || '',
            location: cvData.personal_info?.address || '',
            skills: cvData.skills || {},
            experience: cvData.experience || [],
            education: cvData.education || {},
            projects: cvData.projects || [],
            profile_completeness: calculateProfileCompleteness(cvData)
          });
        } catch (e) {
          console.error('Error parsing CV data:', e);
        }
      }
      
      // Fetch real jobs from backend
      try {
        const jobsResponse = await fetch('http://127.0.0.1:8000/api/talentpath/jobs/', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (jobsResponse.ok) {
          const jobsData = await jobsResponse.json();
          console.log('Fetched jobs:', jobsData);
          
          // Format jobs for display
          const formattedJobs = jobsData.map(job => ({
            job_id: job.job_id,
            title: job.title,
            company_name: job.company_name,
            location: job.location,
            is_remote: job.is_remote,
            job_type: job.job_type,
            experience_level: job.experience_level,
            min_experience: job.min_experience,
            max_experience: job.max_experience,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            company_rating: 4.0, // Default rating
            description: job.description,
            created_at: formatDate(job.created_at),
            match_score: 85 // Default match score (can be calculated later)
          }));
          
          setRecommendations(formattedJobs);
        } else {
          console.error('Failed to fetch jobs');
          setRecommendations([]);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setRecommendations([]);
      }
      
      // Fetch user stats
      try {
        const statsResponse = await fetch('http://127.0.0.1:8000/api/talentpath/dashboard/user/', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats({
            applications_count: statsData.applications_count || 0,
            saved_jobs_count: statsData.saved_jobs_count || 0,
            unread_notifications: statsData.unread_notifications || 0,
            profile_completeness: profile?.profile_completeness || 75,
            search_appearances: statsData.search_appearances || 0,
            recruiter_actions: statsData.recruiter_actions || 0
          });
        } else {
          // Set default stats if API fails
          setStats({
            applications_count: 0,
            saved_jobs_count: 0,
            unread_notifications: 0,
            profile_completeness: profile?.profile_completeness || 75,
            search_appearances: 0,
            recruiter_actions: 0
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1d ago';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}m ago`;
  };

  const calculateProfileCompleteness = (cvData) => {
    let completeness = 0;
    const fields = [
      cvData.personal_info?.name,
      cvData.personal_info?.email,
      cvData.personal_info?.phone,
      cvData.experience?.length > 0,
      cvData.education?.degree,
      cvData.skills && Object.keys(cvData.skills).length > 0,
      cvData.projects?.length > 0
    ];
    
    const filledFields = fields.filter(Boolean).length;
    completeness = Math.round((filledFields / fields.length) * 100);
    return completeness;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Completion Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Profile Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  {/* Avatar with Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                      <UserCircleIcon className="w-16 h-16 text-white" />
                    </div>
                    {/* Completeness Badge - Bottom Right */}
                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-yellow-400 border-4 border-white flex items-center justify-center text-xs font-bold text-gray-900 shadow-md">
                      {stats.profile_completeness}%
                    </div>
                  </div>
                  
                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {profile?.name || 'Your Name'}
                    </h2>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      {profile?.title || 'Full Stack Developer'}
                    </p>
                    {profile?.company && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                        <span className="text-gray-400">@</span>
                        <span>{profile.company}</span>
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Last updated 2m ago
                    </p>
                  </div>
                </div>

                {/* Complete Profile Button */}
                <button
                  onClick={() => navigate('/talentpath/profile')}
                  className="w-full mt-5 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Complete profile
                </button>
              </div>

              {/* Profile Performance */}
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Profile performance</span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">Search appearances</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.search_appearances}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCircleIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">Recruiter actions</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{stats.recruiter_actions}</span>
                  </div>
                </div>

                <button className="w-full mt-3 text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center justify-center gap-1">
                  Get 3X boost to your profile performance
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/talentpath/applications')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200">
                      <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">My Applications</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{stats.applications_count}</span>
                </button>

                <button
                  onClick={() => navigate('/talentpath/saved')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-teal-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center group-hover:bg-teal-200">
                      <BookmarkIcon className="w-5 h-5 text-teal-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Saved Jobs</span>
                  </div>
                  <span className="text-xl font-bold text-teal-600">{stats.saved_jobs_count}</span>
                </button>

                <button
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200">
                      <BellIcon className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Notifications</span>
                  </div>
                  {stats.unread_notifications > 0 && (
                    <span className="text-xl font-bold text-orange-600">{stats.unread_notifications}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 shadow-sm p-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    How to Write an Introduction in 5 Steps
                  </h3>
                  <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
                    Know more →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Job Recommendations */}
          <div className="lg:col-span-2">
            {/* Diversity Banner (if applicable) */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      Diversity & inclusion
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Companies want to build inclusive teams, help us identify your disability status for better jobs.
                  </h3>
                  <div className="flex gap-3 mt-3">
                    <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                      I have a disability
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                      I don't have a disability
                    </button>
                  </div>
                </div>
                <button className="ml-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 text-sm">
                  Submit
                </button>
              </div>
            </div>

            {/* Recommended Jobs Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    Recommended jobs for you
                  </h2>
                  <button
                    onClick={() => navigate('/talentpath/jobs')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    View all
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-gray-200 -mb-4">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                      activeTab === 'profile'
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Profile ({recommendations.length})
                    {activeTab === 'profile' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('youMightLike')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                      activeTab === 'youMightLike'
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    You might like (26)
                    {activeTab === 'youMightLike' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                      activeTab === 'preferences'
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Preferences (0)
                    {activeTab === 'preferences' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Job Cards */}
              <div className="divide-y divide-gray-200">
                {recommendations.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-600 mb-4">No recommendations yet</p>
                    <button
                      onClick={() => navigate('/talentpath/jobs')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Browse All Jobs
                    </button>
                  </div>
                ) : (
                  recommendations.map((job) => (
                    <div
                      key={job.job_id}
                      className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/talentpath/jobs/${job.job_id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Company Logo Placeholder */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {job.company_name.charAt(0)}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 hover:text-blue-600 mb-1">
                                {job.title}
                              </h3>
                              <p className="text-sm text-gray-700 mb-2">
                                {job.company_name}
                              </p>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{job.location}</span>
                                </div>
                                {job.company_rating && (
                                  <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span>{job.company_rating}</span>
                                  </div>
                                )}
                              </div>

                              {/* Additional Info */}
                              {job.salary_min && (
                                <p className="text-sm text-gray-600 mb-2">
                                  ₹{(job.salary_min / 100000).toFixed(1)}-{(job.salary_max / 100000).toFixed(1)} LPA
                                </p>
                              )}

                              <p className="text-xs text-gray-500">
                                {job.created_at}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle save
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <BookmarkIcon className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Early Access Section */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🚀</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    23 Early access roles from top companies
                  </h3>
                  <p className="text-sm text-gray-600">
                    See what recruiters are searching for, even before they post a job
                  </p>
                </div>
                <button
                  onClick={() => navigate('/talentpath/jobs')}
                  className="px-6 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg"
                >
                  View all
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
