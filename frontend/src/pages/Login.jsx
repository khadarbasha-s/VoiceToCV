import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/talentpath/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(formData.username, formData.password);

      // Role-based routing
      const userType = response.user?.user_profile?.user_type;
      if (userType === 'company') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900 rounded-full blur-[120px] opacity-30"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900 rounded-full blur-[120px] opacity-30"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-[#0a0a12] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-800">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          {/* Neon Border Effect on Left */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-blue-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]"></div>

          <h2 className="text-3xl font-bold text-white mb-8">Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Username</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-[#13131f] border-b border-gray-700 text-white px-3 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your username"
                  required
                />
                <span className="absolute right-3 top-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#13131f] border-b border-gray-700 text-white px-3 py-3 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <span className="absolute right-3 top-3 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.7)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400 text-sm">
            Dont have an account?{' '}
            <Link to="/signup" className="text-purple-400 hover:text-purple-300 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Right Side - Decorative */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-900 to-blue-900 relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a12] opacity-20"></div>
          {/* Diagonal Slice Effect */}
          <div className="absolute -left-12 top-0 bottom-0 w-24 bg-[#0a0a12] transform -skew-x-12 z-10"></div>

          <div className="relative z-20 text-center p-8">
            <h2 className="text-4xl font-bold text-white mb-4">WELCOME<br />BACK!</h2>
            <p className="text-gray-300 text-lg max-w-xs mx-auto">
              Access your dashboard and continue your journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
