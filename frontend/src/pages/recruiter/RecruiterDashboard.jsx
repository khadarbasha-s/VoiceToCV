import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BriefcaseIcon, 
  UserGroupIcon, 
  EyeIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';

/**
 * RecruiterDashboard - Dashboard for HR/Recruiters
 * Manage job postings and review applications
 */
const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_jobs: 0,
    active_jobs: 0,
    total_applications: 0,
    pending_applications: 0
  });
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await fetch('http://127.0.0.1:8000/api/talentpath/dashboard/recruiter/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch jobs
      const jobsResponse = await fetch('http://127.0.0.1:8000/api/talentpath/recruiter/jobs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recruiter Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage your job postings and applications</p>
          </div>
          <button
            onClick={() => navigate('/recruiter/jobs/create')}
            className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors shadow-lg"
          >
            <PlusIcon className="w-5 h-5" />
            Post New Job
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_jobs}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Jobs</p>
                <p className="text-3xl font-bold text-green-600">{stats.active_jobs}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <BriefcaseIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_applications}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending_applications}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <EyeIcon className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Job Postings</h2>
          </div>
          
          {jobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">No jobs posted yet</p>
              <button
                onClick={() => navigate('/recruiter/jobs/create')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Post Your First Job
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/recruiter/jobs/${job.job_id}/applicants`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {job.location} • {job.job_type} • Posted {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{job.applications_count}</p>
                        <p className="text-xs text-gray-600">Applications</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{job.views_count}</p>
                        <p className="text-xs text-gray-600">Views</p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        job.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.is_active ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;




