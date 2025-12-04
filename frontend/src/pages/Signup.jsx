import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import authService from '../services/auth';

const Signup = () => {
    const [userType, setUserType] = useState('employee'); // 'employee' or 'company'
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        phone: '',
        // Company-specific fields
        company_name: '',
        company_website: '',
        industry: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);

        try {
            const signupData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.first_name,
                last_name: formData.last_name,
                user_type: userType,
                phone: formData.phone
            };

            // Add company-specific fields if user type is company
            if (userType === 'company') {
                signupData.company_name = formData.company_name;
                signupData.company_website = formData.company_website;
                signupData.industry = formData.industry;
            }

            await authService.signup(signupData);

            // Redirect based on user type
            if (userType === 'company') {
                navigate('/recruiter/dashboard');
            } else {
                navigate('/talentpath/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || 'Failed to sign up. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden py-12 px-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
            </div>

            <div className="relative z-10 w-full max-w-5xl">
                {/* Role Selection */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white text-center mb-8">Create Your Account</h1>
                    <div className="flex gap-4 max-w-2xl mx-auto">
                        <button
                            type="button"
                            onClick={() => setUserType('employee')}
                            className={`flex-1 p-6 rounded-xl border-2 transition-all ${userType === 'employee'
                                ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/50'
                                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <UserIcon className="w-12 h-12 mx-auto mb-3 text-white" />
                            <h3 className="text-xl font-bold text-white mb-2">User</h3>
                            <p className="text-gray-300 text-sm">I Deserve Better</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => setUserType('company')}
                            className={`flex-1 p-6 rounded-xl border-2 transition-all ${userType === 'company'
                                ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-500/50'
                                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 text-white" />
                            <h3 className="text-xl font-bold text-white mb-2">Organization</h3>
                            <p className="text-gray-300 text-sm">I Want Achievers</p>
                        </button>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-800 p-8 md:p-12">
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Username */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            {/* First Name */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {userType === 'company' ? 'Contact First Name' : 'First Name'}
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="First name"
                                />
                            </div>

                            {/* Last Name */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    {userType === 'company' ? 'Contact Last Name' : 'Last Name'}
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Last name"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            {/* Company-specific fields */}
                            {userType === 'company' && (
                                <>
                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="Your company name"
                                            required={userType === 'company'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Company Website
                                        </label>
                                        <input
                                            type="url"
                                            name="company_website"
                                            value={formData.company_website}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="https://company.com"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-gray-300 text-sm font-medium mb-2">
                                            Industry
                                        </label>
                                        <input
                                            type="text"
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                                            placeholder="e.g., Technology, Healthcare, Finance"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Password */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Create a strong password"
                                    required
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-gray-300 text-sm font-medium mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full font-bold py-4 rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${userType === 'company'
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white'
                                }`}
                        >
                            {loading ? 'Creating Account...' : `Sign Up as ${userType === 'company' ? 'Company' : 'Employee'}`}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
