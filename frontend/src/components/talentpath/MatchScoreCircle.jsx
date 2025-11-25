import React from 'react';

/**
 * MatchScoreCircle Component - Visual representation of job match score
 * Uses teal accent for accessibility
 */
const MatchScoreCircle = ({ score, size = 'medium' }) => {
  const sizes = {
    small: { circle: 60, stroke: 4, text: 'text-lg' },
    medium: { circle: 100, stroke: 6, text: 'text-2xl' },
    large: { circle: 140, stroke: 8, text: 'text-4xl' },
  };

  const config = sizes[size] || sizes.medium;
  const radius = (config.circle - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (score >= 80) return '#1ABC9C'; // Teal - Excellent match
    if (score >= 60) return '#0057B8'; // Blue - Good match
    if (score >= 40) return '#FFA500'; // Orange - Fair match
    return '#6B7280'; // Gray - Low match
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={config.circle} height={config.circle} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={config.circle / 2}
          cy={config.circle / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={config.stroke}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={config.circle / 2}
          cy={config.circle / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={config.stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${config.text} font-bold text-gray-900`}>{Math.round(score)}%</span>
        <span className="text-xs text-gray-500">Match</span>
      </div>
    </div>
  );
};

export default MatchScoreCircle;





