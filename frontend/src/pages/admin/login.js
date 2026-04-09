/**
 * Premium Admin Login Page - Split Screen Design with Professional Theme
 * Left: Municipal/Admin illustration, Right: Admin Login Form
 * Professional, corporate theme with dark blue tones
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const inputRefs = useRef({});

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error('Please enter administrative credentials');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.user.role !== 'admin') {
        toast.error('This portal is restricted to municipal administrators only');
        return;
      }

      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('Admin access granted. Welcome!');
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 600);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid admin credentials');
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
      {/* Admin-Themed Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[12%] right-[-12%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/8 blur-[140px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[12%] left-[-15%] w-[45vw] h-[45vw] rounded-full bg-cyan-500/8 blur-[140px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-indigo-600/4 blur-[160px]" />
      </div>

      <div className="relative z-10 w-full h-screen max-h-screen flex items-center">
        {/* Branding/Hero Section - Admin */}
        <div className="hidden lg:flex w-1/2 h-full flex-col justify-center px-12">
          <motion.div variants={brandingVariants} className="max-w-md space-y-12">
            {/* Logo & Branding */}
            <div className="space-y-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-600 via-indigo-600 to-cyan-500 rounded-3xl shadow-[0_0_40px_rgba(79,70,229,0.4)] backdrop-blur-xl border border-white/10"
              >
                <span className="text-5xl filter drop-shadow-lg">🏛️</span>
              </motion.div>
              <div>
                <p className="text-sm tracking-[0.3em] text-cyan-400 font-bold mb-2 uppercase">Admin Portal</p>
                <h1 className="text-5xl font-black bg-gradient-to-r from-white via-indigo-100 to-cyan-200 bg-clip-text text-transparent leading-tight">
                  Municipal Control Center
                </h1>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-4">
              <p className="text-xl font-bold text-white leading-relaxed">
                Manage civic issues, process complaints, and deliver municipal services with precision.
              </p>
              <p className="text-gray-400 text-base font-light">
                Authorized personnel only. All access is logged and monitored for security and accountability.
              </p>
            </div>

            {/* Admin Features */}
            <div className="space-y-5">
              {[
                { icon: '📊', title: 'Real-Time Analytics', desc: 'Monitor complaint trends and resolution metrics' },
                { icon: '👥', title: 'User Management', desc: 'Manage taluk assignments and municipal staff' },
                { icon: '🔔', title: 'Smart Notifications', desc: 'Broadcast updates to targeted communities' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{feature.icon}</span>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/20 backdrop-blur">
              <p className="text-xs text-gray-400 flex items-start gap-3">
                <span className="text-lg mt-0.5">🔒</span>
                <span>
                  This is a restricted administrative portal. Unauthorized access attempts are logged and reported.
                </span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Admin Login Form */}
        <motion.div variants={formVariants} className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:p-0">
          <div className="w-full max-w-md">
            {/* Back Button */}
            <Link href="/">
              <button className="mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-medium">
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back to Home
              </button>
            </Link>

            {/* Admin Form Card */}
            <div className="glass-panel-premium rounded-3xl p-8 lg:p-10 space-y-8 relative overflow-hidden border border-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-transparent pointer-events-none" />

              {/* Header */}
              <div className="text-center space-y-4 relative z-10">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                >
                  <span className="text-3xl">🔐</span>
                </motion.div>
                <div>
                  <h2 className="text-4xl font-black bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                    Admin Access
                  </h2>
                  <p className="text-gray-400 font-light text-sm mt-2">
                    Enter your administrative credentials to access the control center
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                {/* Email Input */}
                <div className="floating-label-group">
                  <label className={`floating-label ${focusedField === 'email' || email ? 'floating-label-active' : ''}`}>
                    Admin Email
                  </label>
                  <input
                    ref={(el) => (inputRefs.current.email = el)}
                    type="email"
                    placeholder=" "
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field-admin pt-6"
                    autoFocus
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg pointer-events-none">📧</span>
                </div>

                {/* Password Input */}
                <div className="floating-label-group">
                  <label className={`floating-label ${focusedField === 'password' || password ? 'floating-label-active' : ''}`}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      ref={(el) => (inputRefs.current.password = el)}
                      type={showPassword ? 'text' : 'password'}
                      placeholder=" "
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="input-field-admin pr-12 pt-6"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors font-medium text-xs"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Admin Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading || !email || !password}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="btn-primary-admin w-full py-4 mt-4 text-base font-semibold"
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
                      Authorizing Access...
                    </span>
                  ) : (
                    'Access Dashboard'
                  )}
                </motion.button>
              </form>

              {/* Security Info */}
              <div className="pt-6 border-t border-white/10 relative z-10">
                <p className="text-xs text-gray-500 text-center mb-4 flex items-center justify-center gap-2">
                  <span>🔒</span>
                  All sessions are encrypted and logged for security
                </p>
              </div>

              {/* Footer Links */}
              <div className="pt-4 border-t border-white/10 text-center relative z-10 space-y-2">
                <p className="text-gray-400 text-sm">
                  <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                    Forgot password?
                  </Link>
                </p>
                <p className="text-gray-400 text-sm">
                  Citizen account?{' '}
                  <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                    Use standard login
                  </Link>
                </p>
                <p className="text-gray-500 text-xs">
                  Need help?{' '}
                  <Link href="/" className="text-gray-400 hover:text-gray-300 underline">
                    Contact support
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
