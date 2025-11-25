import React from 'react';

/**
 * SkillsChip Component - Display skills with match status
 * Accessible colors for color-blind users
 */
const SkillsChip = ({ skill, matched = false, required = false }) => {
  const getChipStyle = () => {
    if (matched) {
      return 'bg-teal-100 text-teal-800 border-teal-300';
    } else if (required) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else {
      return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getChipStyle()} transition-all`}
    >
      {matched && <span className="mr-1">✓</span>}
      {required && !matched && <span className="mr-1">!</span>}
      {skill}
    </span>
  );
};

export default SkillsChip;





