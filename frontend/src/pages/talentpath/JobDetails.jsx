import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, ClockIcon, CurrencyDollarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import ApplyButton from '../../components/talentpath/ApplyButton';
import SkillsChip from '../../components/talentpath/SkillsChip';
import MatchScoreCircle from '../../components/talentpath/MatchScoreCircle';
import JobCard from '../../components/talentpath/JobCard';

/**
 * JobDetails Page - Detailed job information with apply functionality
 */
const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [similarJobs, setSimilarJobs] = useState([]);
  const [matchScore, setMatchScore] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    fetchJobDetails();
    fetchSimilarJobs();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/talentpath/jobs/${jobId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data);

        // Try to get match score from recommendations
        const recsResponse = await fetch('/api/talentpath/jobs/recommended/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (recsResponse.ok) {
          const recsData = await recsResponse.json();
          const recommendation = recsData.find(r => r.job.job_id === jobId);
          if (recommendation) {
            setMatchScore(recommendation);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarJobs = async () => {
    try {
      const response = await fetch(`/api/talentpath/jobs/${jobId}/similar/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSimilarJobs(data);
      }
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
    }
  };

  const handleApply = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      const response = await fetch(`/api/talentpath/jobs/${jobId}/apply/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ cover_letter: coverLetter })
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        navigate('/talentpath/applications');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to submit application');
    }
  };

  const handleSaveJob = async () => {
    try {
      if (job.is_saved) {
        await fetch(`/api/talentpath/jobs/${jobId}/unsave/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } else {
        await fetch(`/api/talentpath/jobs/${jobId}/save/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      fetchJobDetails();
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
          <button
            onClick={() => navigate('/talentpath/jobs')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Browse Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-start gap-6">
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company_name}
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BuildingOfficeIcon className="w-10 h-10 text-blue-600" />
                  </div>
                )}

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                  <p className="text-xl text-gray-700 font-medium">{job.company_name}</p>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-5 h-5" />
                      <span>{job.is_remote ? 'Remote' : job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BriefcaseIcon className="w-5 h-5" />
                      <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-5 h-5" />
                      <span className="capitalize">{job.experience_level} level</span>
                    </div>
                    {job.salary_disclosed && (
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-5 h-5" />
                        <span>
                          ${(job.salary_min / 1000).toFixed(0)}K - ${(job.salary_max / 1000).toFixed(0)}K
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <ApplyButton
                  jobId={jobId}
                  hasApplied={job.has_applied}
                  onApply={() => setShowApplyModal(true)}
                />
                <button
                  onClick={handleSaveJob}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  {job.is_saved ? 'Saved ✓' : 'Save Job'}
                </button>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
              </div>
            </div>

            {/* Responsibilities */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h2>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Requirements</h2>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
              </div>
            </div>

            {/* Nice to Have */}
            {job.nice_to_have && (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Nice to Have</h2>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{job.nice_to_have}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Match Score */}
            {matchScore && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Your Match Score
                </h3>
                <div className="flex justify-center mb-4">
                  <MatchScoreCircle score={matchScore.match_score} size="large" />
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  {matchScore.match_explanation}
                </p>

                {/* Matched Skills */}
                {matchScore.matched_skills_details && matchScore.matched_skills_details.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Matched Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {matchScore.matched_skills_details.map((skill) => (
                        <SkillsChip key={skill.id} skill={skill.name} matched />
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {matchScore.missing_skills_details && matchScore.missing_skills_details.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills to Improve</h4>
                    <div className="flex flex-wrap gap-2">
                      {matchScore.missing_skills_details.map((skill) => (
                        <SkillsChip key={skill.id} skill={skill.name} required />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Required Skills */}
            {job.required_skills && job.required_skills.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.filter(s => s.is_required).map((skillObj) => (
                    <SkillsChip key={skillObj.id} skill={skillObj.skill.name} required />
                  ))}
                </div>
              </div>
            )}

            {/* Company Info */}
            {job.recruiter && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About Company</h3>
                <p className="text-sm text-gray-700 mb-4">{job.recruiter.company_description}</p>
                {job.recruiter.company_website && (
                  <a
                    href={job.recruiter.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Visit Website →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {similarJobs.slice(0, 4).map((simJob) => (
                <JobCard key={simJob.job_id} job={simJob} onSave={handleSaveJob} onUnsave={handleSaveJob} />
              ))}
            </div>
          </div>
        )}

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Apply for {job.title}</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell the recruiter why you're a great fit for this role..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleApply}
                  className="flex-1 px-6 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors"
                >
                  Submit Application
                </button>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;




