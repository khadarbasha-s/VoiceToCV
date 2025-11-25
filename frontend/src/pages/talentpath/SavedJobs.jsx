import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../../components/talentpath/JobCard';
import EmptyState from '../../components/talentpath/EmptyState';

/**
 * SavedJobs Page - View all saved jobs
 */
const SavedJobs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/talentpath/saved-jobs/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedJobs(data);
      }
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      await fetch(`/api/talentpath/jobs/${jobId}/unsave/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchSavedJobs(); // Refresh list
    } catch (error) {
      console.error('Error unsaving job:', error);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
          <p className="mt-2 text-gray-600">
            Jobs you've saved for later ({savedJobs.length})
          </p>
        </div>

        {/* Jobs List */}
        {savedJobs.length === 0 ? (
          <EmptyState 
            type="saved" 
            action={{ 
              label: 'Browse Jobs', 
              onClick: () => navigate('/talentpath/jobs') 
            }} 
          />
        ) : (
          <div className="space-y-4">
            {savedJobs.map((savedJob) => (
              <JobCard
                key={savedJob.job.job_id}
                job={savedJob.job}
                onUnsave={handleUnsaveJob}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;




