import React from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

/**
 * ProfileCard Component - User profile summary
 */
const ProfileCard = ({ profile }) => {
  const completenessColor = (percentage) => {
    if (percentage >= 80) return 'bg-teal-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-orange-500';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        {profile.profile_picture ? (
          <img
            src={profile.profile_picture}
            alt={profile.user?.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {profile.user?.first_name} {profile.user?.last_name}
          </h3>
          <p className="text-sm text-gray-600">{profile.current_job_title || 'Job Seeker'}</p>
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
          <span className="text-sm font-semibold text-gray-900">{profile.profile_completeness}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${completenessColor(profile.profile_completeness)} transition-all duration-500`}
            style={{ width: `${profile.profile_completeness}%` }}
          />
        </div>
        {profile.profile_completeness < 100 && (
          <p className="mt-2 text-xs text-gray-500">
            Complete your profile to get better job matches
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <p className="text-2xl font-bold text-blue-600">{profile.years_of_experience}</p>
          <p className="text-xs text-gray-600">Years Experience</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-teal-600">{profile.location || 'N/A'}</p>
          <p className="text-xs text-gray-600">Location</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;





