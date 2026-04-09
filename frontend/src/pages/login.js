/**
 * Premium User Login Page - Split Screen Design
 * Left: Branding/Hero, Right: Login Form
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const inputRefs = useRef({});

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('Welcome back! Redirecting...');
      setTimeout(() => {
        router.push(response.data.user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
      }, 800);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  const formVariants = {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  const brandingVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-100 relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-primary/8 blur-[140px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary/8 blur-[140px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[160px]" />
      </div>

      <div className="relative z-10 w-full h-screen max-h-screen flex items-center">
        <div className="hidden lg:flex w-1/2 h-full flex-col justify-center padding-12">
          <motion.div variants={brandingVariants} className="max-w-md space-y-12 px-12">
            {/* Logo & Branding */}
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-primary to-secondary rounded-3xl shadow-[0_0_30px_rgba(99,102,241,0.4)] backdrop-blur-lg"
              >
                <span className="text-4xl filter drop-shadow-lg">🏛️</span>
              </motion.div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent leading-tight">
                Civic Connect
              </h1>
            </div>

            {/* Tagline */}
            <div className="space-y-3">
              <p className="text-2xl font-bold text-white">
                Smart Civic Communication System
              </p>
              <p className="text-gray-300 text-lg font-light leading-relaxed">
                Report and track municipal issues seamlessly. Your voice matters in building a better community.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: '📍', title: 'Real-Time Tracking', desc: 'Monitor your complaint status instantly' },
                { icon: '🔔', title: 'Instant Notifications', desc: 'Get updates directly to your phone' },
                { icon: '👥', title: 'Community First', desc: 'Join thousands making a difference' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <span className="text-3xl">{feature.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Form Section */}
        <motion.div variants={formVariants} className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:p-0">
          <div className="w-full max-w-md">
            {/* Back Button */}
            <Link href="/">
              <button className="mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-medium">
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back to Home
              </button>
            </Link>

            {/* Form Card */}
            <div className="glass-panel-premium rounded-3xl p-8 lg:p-10 space-y-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

              {/* Header */}
              <div className="text-center space-y-3 relative z-10">
                <h2 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Welcome Back
                </h2>
                <p className="text-gray-400 font-light text-sm">
                  Sign in to access your Civic Connect account
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                {/* Email Input */}
                <div className="floating-label-group">
                  <label className={`floating-label ${focusedField === 'email' || email ? 'floating-label-active' : ''}`}>
                    Email Address
                  </label>
                  <input
                    ref={(el) => (inputRefs.current.email = el)}
                    id="login-email"
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pt-6"
                    autoFocus
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="floating-label-group">
                  <label className={`floating-label ${focusedField === 'password' || password ? 'floating-label-active' : ''}`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      ref={(el) => (inputRefs.current.password = el)}
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder=" "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="input-field pr-12 pt-6"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors font-medium text-xs"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading || !email || !password}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-primary w-full py-4 mt-2 text-base font-semibold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>
              </form>

              {/* Footer Links */}
              <div className="pt-6 border-t border-white/10 space-y-3 relative z-10">
                <p className="text-center text-gray-400 text-sm">
                  <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                    Forgot password?
                  </Link>
                </p>
                <p className="text-center text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    Create one
                  </Link>
                </p>
                <p className="text-center text-gray-500 text-sm">
                  Municipal staff?{' '}
                  <Link href="/admin/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                    Admin Portal
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
