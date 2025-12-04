import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/auth';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
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
            await authService.signup({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            navigate('/talentpath/dashboard');
        } catch (err) {
            setError(err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || 'Failed to sign up. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900 rounded-full blur-[120px] opacity-30"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900 rounded-full blur-[120px] opacity-30"></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl bg-[#0a0a12] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-800">
                {/* Left Side - Decorative */}
                <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-900 to-purple-900 relative items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[#0a0a12] opacity-20"></div>
                    {/* Diagonal Slice Effect */}
                    <div className="absolute -right-12 top-0 bottom-0 w-24 bg-[#0a0a12] transform -skew-x-12 z-10"></div>

                    <div className="relative z-20 text-center p-8">
                        <h2 className="text-4xl font-bold text-white mb-4">JOIN<br />US!</h2>
                        <p className="text-gray-300 text-lg max-w-xs mx-auto">
                            Start your journey with us today.
                        </p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                    {/* Neon Border Effect on Right */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]"></div>

                    <h2 className="text-3xl font-bold text-white mb-8">Sign Up</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full bg-[#13131f] border-b border-gray-700 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Choose a username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-[#13131f] border-b border-gray-700 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full bg-[#13131f] border-b border-gray-700 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Create a password"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-1">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full bg-[#13131f] border-b border-gray-700 text-white px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] hover:shadow-[0_0_30px_rgba(37,99,235,0.7)] transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
