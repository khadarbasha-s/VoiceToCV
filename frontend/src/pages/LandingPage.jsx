import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    SparklesIcon,
    BriefcaseIcon,
    UserGroupIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ArrowRightIcon
} from '@heroicons/react/24/outline';

const LandingPage = () => {
    const features = [
        {
            icon: SparklesIcon,
            title: "AI-Powered CV Generation",
            description: "Create professional CVs using voice or text with our intelligent AI assistant."
        },
        {
            icon: BriefcaseIcon,
            title: "Smart Job Matching",
            description: "Get matched with perfect job opportunities based on your skills and experience."
        },
        {
            icon: UserGroupIcon,
            title: "For Job Seekers & Recruiters",
            description: "A complete platform connecting talent with opportunities seamlessly."
        },
        {
            icon: ChartBarIcon,
            title: "Track Your Applications",
            description: "Monitor your job applications and get real-time updates on your progress."
        }
    ];

    const stats = [
        { value: "10k+", label: "Active Jobs" },
        { value: "500+", label: "Companies" },
        { value: "50k+", label: "Candidates" },
        { value: "98%", label: "Success Rate" }
    ];

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900 rounded-full blur-[150px] opacity-20"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900 rounded-full blur-[150px] opacity-20"></div>
                <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-teal-900 rounded-full blur-[120px] opacity-10"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="AVASAR Logo" className="w-10 h-10 rounded-lg shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
                    <span className="text-2xl font-bold tracking-tight">AVASAR</span>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-6 py-2 rounded-full border border-gray-700 hover:border-purple-500 transition-colors text-sm font-medium">
                        Login
                    </Link>
                    <Link to="/signup" className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all text-sm font-bold">
                        Sign Up
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-8">
                <div className="pt-20 pb-32 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                            Your Career Journey <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400">
                                Starts Here
                            </span>
                        </h1>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-gray-400 text-lg md:text-xl max-w-2xl mb-12"
                    >
                        AVASAR is your all-in-one AI-powered career platform. Generate professional CVs,
                        discover perfect job matches, and connect with top companies—all in one place.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 mb-20"
                    >
                        <Link
                            to="/signup"
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-1 flex items-center gap-2"
                        >
                            Get Started Free
                            <ArrowRightIcon className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/home"
                            className="px-8 py-4 border border-gray-700 rounded-full font-bold text-lg hover:bg-gray-900 transition-all"
                        >
                            Try AI CV Builder
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-gray-800 pt-12 w-full"
                    >
                        {stats.map((stat, index) => (
                            <div key={index}>
                                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                                <p className="text-gray-500 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Features Section */}
                <div className="py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Succeed</span>
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Powerful features designed to accelerate your career growth
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 hover:border-purple-500 transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.2)]"
                            >
                                <feature.icon className="w-12 h-12 text-purple-400 mb-4" />
                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                                <p className="text-gray-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* How It Works */}
                <div className="py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            How It Works
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Get started in three simple steps
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Create Your Profile", desc: "Sign up and build your professional profile with our AI assistant" },
                            { step: "02", title: "Get Matched", desc: "Our AI finds the perfect job opportunities based on your skills" },
                            { step: "03", title: "Apply & Succeed", desc: "Apply with one click and track your applications in real-time" }
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                className="text-center"
                            >
                                <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-gray-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="py-20 text-center"
                >
                    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-3xl p-12 backdrop-blur-sm">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Transform Your Career?
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                            Join thousands of professionals who have found their dream jobs with AVASAR
                        </p>
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-1"
                        >
                            Start Your Journey
                            <ArrowRightIcon className="w-5 h-5" />
                        </Link>
                    </div>
                </motion.div>

                {/* Footer */}
                <footer className="py-12 border-t border-gray-800 mt-20">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/logo.png" alt="AVASAR Logo" className="w-8 h-8 rounded-lg" />
                                <span className="text-xl font-bold">AVASAR</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                AI-powered career platform connecting talent with opportunities.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">For Job Seekers</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="/talentpath/jobs" className="hover:text-purple-400 transition-colors">Browse Jobs</Link></li>
                                <li><Link to="/home" className="hover:text-purple-400 transition-colors">Create CV</Link></li>
                                <li><Link to="/signup" className="hover:text-purple-400 transition-colors">Sign Up</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">For Recruiters</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="/recruiter/jobs/create" className="hover:text-purple-400 transition-colors">Post Jobs</Link></li>
                                <li><Link to="/login" className="hover:text-purple-400 transition-colors">Recruiter Login</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link to="/about" className="hover:text-purple-400 transition-colors">About Us</Link></li>
                                <li><a href="#" className="hover:text-purple-400 transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
                        © 2024 AVASAR. All rights reserved.
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
