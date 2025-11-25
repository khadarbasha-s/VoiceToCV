import React from 'react';

/**
 * FilterSidebar Component - Job search filters
 * Accessible form with clear labels
 */
const FilterSidebar = ({ filters, onFilterChange }) => {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

      {/* Job Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Job Type
        </label>
        <select
          value={filters.job_type || ''}
          onChange={(e) => handleChange('job_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Types</option>
          <option value="full-time">Full Time</option>
          <option value="part-time">Part Time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
          <option value="freelance">Freelance</option>
        </select>
      </div>

      {/* Experience Level */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Experience Level
        </label>
        <select
          value={filters.experience_level || ''}
          onChange={(e) => handleChange('experience_level', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Levels</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
          <option value="lead">Lead/Principal</option>
        </select>
      </div>

      {/* Location */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={filters.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Enter city or country"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Remote */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.remote === 'true'}
            onChange={(e) => handleChange('remote', e.target.checked ? 'true' : '')}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Remote Only</span>
        </label>
      </div>

      {/* Minimum Salary */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Salary (USD)
        </label>
        <input
          type="number"
          value={filters.salary_min || ''}
          onChange={(e) => handleChange('salary_min', e.target.value)}
          placeholder="e.g., 50000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Reset Button */}
      <button
        onClick={() => onFilterChange({})}
        className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;





