import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinIcon, BriefcaseIcon, ClockIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

/**
 * JobCard Component - Displays job listing in card format
 * Theme: Royal Blue (#0057B8) with Teal accent (#1ABC9C)
 */
const JobCard = ({ job, onSave, onUnsave, matchScore }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/talentpath/jobs/${job.job_id}`);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (job.is_saved) {
      onUnsave(job.job_id);
    } else {
      onSave(job.job_id);
    }
  };

  const formatSalary = () => {
    if (!job.salary_disclosed || !job.salary_min) return 'Salary undisclosed';
    const min = (job.salary_min / 1000).toFixed(0);
    const max = (job.salary_max / 1000).toFixed(0);
    return `$${min}K - $${max}K ${job.salary_currency}`;
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer relative"
    >
      {/* Save Button */}
      <button
        onClick={handleSaveClick}
        className="absolute top-4 right-4 text-gray-400 hover:text-teal-500 transition-colors"
        aria-label={job.is_saved ? 'Unsave job' : 'Save job'}
      >
        {job.is_saved ? (
          <BookmarkSolidIcon className="w-6 h-6 text-teal-500" />
        ) : (
          <BookmarkIcon className="w-6 h-6" />
        )}
      </button>

      {/* Match Score Badge */}
      {matchScore && (
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-teal-100 text-teal-800">
            {matchScore}% Match
          </span>
        </div>
      )}

      {/* Company Logo & Info */}
      <div className="flex items-start gap-4 mt-8">
        {job.company_logo ? (
          <img
            src={job.company_logo}
            alt={job.company_name}
            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">
              {job.company_name.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600">
            {job.title}
          </h3>
          <p className="text-gray-600 font-medium">{job.company_name}</p>
        </div>
      </div>

      {/* Job Details */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <MapPinIcon className="w-4 h-4" />
          <span>{job.is_remote ? 'Remote' : job.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <BriefcaseIcon className="w-4 h-4" />
          <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4 h-4" />
          <span className="capitalize">{job.experience_level} level</span>
        </div>
      </div>

      {/* Salary */}
      <div className="mt-4">
        <p className="text-lg font-semibold text-blue-600">{formatSalary()}</p>
      </div>

      {/* Apply Status */}
      {job.has_applied && (
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✓ Applied
          </span>
        </div>
      )}

      {/* Posted Date */}
      <div className="mt-4 text-xs text-gray-500">
        Posted {new Date(job.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default JobCard;





