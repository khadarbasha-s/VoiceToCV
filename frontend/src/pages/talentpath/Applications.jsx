import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '../../components/talentpath/EmptyState';

/**
 * Applications Page - View all job applications and their status
 */
const Applications = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const url = filter 
        ? `/api/talentpath/applications/?status=${filter}`
        : '/api/talentpath/applications/';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-purple-100 text-purple-800',
      shortlisted: 'bg-green-100 text-green-800',
      interview: 'bg-teal-100 text-teal-800',
      offered: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    };

    return styles[status] || styles.submitted;
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="mt-2 text-gray-600">Track your job application status</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { value: '', label: 'All' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'shortlisted', label: 'Shortlisted' },
            { value: 'interview', label: 'Interview' },
            { value: 'offered', label: 'Offered' },
            { value: 'rejected', label: 'Rejected' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <EmptyState 
            type="applications" 
            action={{ 
              label: 'Browse Jobs', 
              onClick: () => navigate('/talentpath/jobs') 
            }} 
          />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.application_id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/talentpath/applications/${app.application_id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Job Info */}
                    <div className="flex items-start gap-4 mb-4">
                      {app.job.company_logo ? (
                        <img
                          src={app.job.company_logo}
                          alt={app.job.company_name}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-600">
                            {app.job.company_name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
                          {app.job.title}
                        </h3>
                        <p className="text-gray-600 font-medium">{app.job.company_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Applied on {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Match Score */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Match Score:</span>
                        <span className="font-semibold text-teal-600">{app.match_score.toFixed(0)}%</span>
                      </div>
                      
                      {app.viewed_by_recruiter && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Viewed by recruiter</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;




