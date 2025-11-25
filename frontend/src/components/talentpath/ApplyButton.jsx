import React, { useState } from 'react';

/**
 * ApplyButton Component - Primary CTA for job applications
 * Teal color for high contrast and accessibility
 */
const ApplyButton = ({ jobId, hasApplied, onApply, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (hasApplied || disabled || loading) return;

    setLoading(true);
    try {
      await onApply(jobId);
    } finally {
      setLoading(false);
    }
  };

  if (hasApplied) {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold bg-green-100 text-green-800 border border-green-300 cursor-not-allowed"
      >
        ✓ Applied
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all ${
        disabled || loading
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-lg transform hover:-translate-y-0.5'
      }`}
    >
      {loading ? 'Applying...' : 'Apply Now'}
    </button>
  );
};

export default ApplyButton;





