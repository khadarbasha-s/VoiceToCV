import React from 'react';
import { MagnifyingGlassIcon, BriefcaseIcon, BookmarkIcon } from '@heroicons/react/24/outline';

/**
 * EmptyState Component - Display when no results found
 */
const EmptyState = ({ type = 'jobs', message, action }) => {
  const icons = {
    jobs: MagnifyingGlassIcon,
    applications: BriefcaseIcon,
    saved: BookmarkIcon,
  };

  const Icon = icons[type] || icons.jobs;

  const defaultMessages = {
    jobs: 'No jobs found matching your criteria',
    applications: 'You haven\'t applied to any jobs yet',
    saved: 'You haven\'t saved any jobs yet',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Icon className="w-12 h-12 text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {message || defaultMessages[type]}
      </h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Try adjusting your filters or search terms to find what you're looking for.
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;





