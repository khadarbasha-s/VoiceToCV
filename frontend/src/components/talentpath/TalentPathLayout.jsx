import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  BookmarkIcon,
  UserIcon,
  BellIcon,
  ArrowLeftOnRectangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import authService from '../../services/auth';

/**
 * TalentPathLayout - Main layout for TalentPath portal
 * Blue theme with accessible navigation
 */
const TalentPathLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const navigation = [
    { name: 'Dashboard', href: '/talentpath/dashboard', icon: HomeIcon },
    { name: 'Search Jobs', href: '/talentpath/jobs', icon: MagnifyingGlassIcon },
    { name: 'My Applications', href: '/talentpath/applications', icon: BriefcaseIcon },
    { name: 'Saved Jobs', href: '/talentpath/saved', icon: BookmarkIcon },
    { name: 'Profile', href: '/talentpath/profile', icon: UserIcon },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/talentpath/dashboard" className="flex items-center gap-3">
              <img src="/logo.png" alt="AVASAR Logo" className="w-10 h-10 rounded-lg" />
              <div>
                <h1 className="text-xl font-bold">AVASAR</h1>
                <p className="text-xs text-blue-100">Find Your Perfect Job</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/talentpath/dashboard"
                className={`text-sm font-medium transition-colors ${location.pathname === '/talentpath/dashboard'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
                  }`}
              >
                Dashboard
              </Link>
              <Link
                to="/talentpath/jobs"
                className={`text-sm font-medium transition-colors ${location.pathname === '/talentpath/jobs'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
                  }`}
              >
                Jobs
              </Link>
              <Link
                to="/home"
                className={`text-sm font-medium transition-colors ${location.pathname === '/home'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                  }`}
              >
                Create CV
              </Link>
              <Link
                to="/recruiter/jobs/create"
                className="hover:text-teal-300 transition-colors font-medium"
              >
                Post Job
              </Link>

              {/* Notifications */}
              <Link
                to="/talentpath/notifications"
                className="relative hover:text-teal-300 transition-colors"
                title="Notifications"
              >
                <BellIcon className="w-6 h-6" />
              </Link>

              {/* Profile Dropdown - Click to Open */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 hover:text-teal-300 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium">Profile</span>
                </button>

                {/* Dropdown Menu - Click Based */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <Link
                      to="/talentpath/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 inline mr-2 text-gray-500" />
                      My Profile
                    </Link>
                    <Link
                      to="/recruiter/jobs/create"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <PlusIcon className="w-4 h-4 inline mr-2 text-gray-500" />
                      Post Job
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowLeftOnRectangleIcon className="w-4 h-4 inline mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="grid grid-cols-4 gap-1">
          <Link
            to="/talentpath/dashboard"
            className={`flex flex-col items-center justify-center py-3 ${isActive('/talentpath/dashboard')
              ? 'text-blue-600 font-semibold'
              : 'text-gray-600'
              }`}
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>

          <Link
            to="/talentpath/jobs"
            className={`flex flex-col items-center justify-center py-3 ${isActive('/talentpath/jobs')
              ? 'text-blue-600 font-semibold'
              : 'text-gray-600'
              }`}
          >
            <MagnifyingGlassIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Jobs</span>
          </Link>

          <Link
            to="/talentpath/applications"
            className={`flex flex-col items-center justify-center py-3 ${isActive('/talentpath/applications')
              ? 'text-blue-600 font-semibold'
              : 'text-gray-600'
              }`}
          >
            <BriefcaseIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Apps</span>
          </Link>

          <Link
            to="/talentpath/notifications"
            className={`flex flex-col items-center justify-center py-3 ${isActive('/talentpath/notifications')
              ? 'text-blue-600 font-semibold'
              : 'text-gray-600'
              }`}
          >
            <BellIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Alerts</span>
          </Link>

          <Link
            to="/talentpath/profile"
            className={`flex flex-col items-center justify-center py-3 ${isActive('/talentpath/profile')
              ? 'text-blue-600 font-semibold'
              : 'text-gray-600'
              }`}
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">TalentPath</h3>
              <p className="text-sm text-gray-600">
                AI-powered job matching platform connecting talent with opportunities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/talentpath/jobs" className="hover:text-blue-600">Browse Jobs</Link></li>
                <li><Link to="/talentpath/dashboard" className="hover:text-blue-600">Dashboard</Link></li>
                <li><Link to="/talentpath/profile" className="hover:text-blue-600">Profile</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">For Recruiters</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/recruiter/login" className="hover:text-blue-600">Recruiter Login</Link></li>
                <li><Link to="/recruiter/signup" className="hover:text-blue-600">Post Jobs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact Us</a></li>
                <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            © 2024 TalentPath. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TalentPathLayout;




