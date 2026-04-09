/**
 * Premium User Registration Page - Split Screen Design
 * Left: Branding/Hero, Right: Multi-step Registration Form
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { districts, getTaluksForDistrict } from '../utils/taluks';

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState('details'); // details | password
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    district: '',
    taluk: '',
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const inputRefs = useRef({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!formData.district) {
      toast.error('Please select your district');
      return;
    }
    if (!formData.taluk) {
      toast.error('Please select your taluk');
      return;
    }
    setStep('password');
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || null,
        district: formData.district,
        taluk: formData.taluk,
        password,
      });

      localStorage.setItem('authToken', response.data.accessToken);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('Account created! Welcome to Civic Connect 🎉');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
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
      transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
    },
    exit: { opacity: 0, x: -30, transition: { duration: 0.3 } },
  };

  const brandingVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] },
    },
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' };
    if (password.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '50%' };
    if (!/[^a-zA-Z0-9]/.test(password)) return { label: 'Good', color: 'bg-yellow-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };

  const strength = passwordStrength();
  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-100 relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-secondary/8 blur-[140px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-primary/8 blur-[140px] mix-blend-screen animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full h-screen max-h-screen flex items-center">
        {/* Branding Section */}
        <div className="hidden lg:flex w-1/2 h-full flex-col justify-center px-12">
          <motion.div variants={brandingVariants} className="max-w-md space-y-12">
            {/* Logo & Branding */}
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-secondary via-secondary to-primary rounded-3xl shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-lg"
              >
                <span className="text-4xl filter drop-shadow-lg">📝</span>
              </motion.div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent leading-tight">
                Join the Change
              </h1>
            </div>

            {/* Tagline */}
            <div className="space-y-3">
              <p className="text-2xl font-bold text-white">
                Smart Civic Communication System
              </p>
              <p className="text-gray-300 text-lg font-light leading-relaxed">
                Become part of a community working together to build a better tomorrow.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: '🗳️', title: 'Your Voice Counts', desc: 'Report issues and create real change' },
                { icon: '⚡', title: 'Fast Resolution', desc: 'Track complaints and get updates instantly' },
                { icon: '🤝', title: 'Community Power', desc: 'Join thousands of engaged citizens' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
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
        <motion.div
          variants={formVariants}
          className="w-full lg:w-1/2 flex items-center justify-center px-6 py-8 lg:p-0"
        >
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
                  {step === 'details' ? 'Create Account' : 'Set Password'}
                </h2>
                <p className="text-gray-400 font-light text-sm">
                  {step === 'details'
                    ? 'Tell us about yourself'
                    : 'Secure your account with a strong password'}
                </p>
              </div>

              {/* Step Progress */}
              <div className="flex gap-3 items-center relative z-10">
                {[1, 2].map((stepNum, i) => (
                  <div key={stepNum} className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        scale: step === (stepNum === 1 ? 'details' : 'password') ? 1.1 : 1,
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        step === (stepNum === 1 ? 'details' : 'password')
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                          : step === 'password' && stepNum === 1
                          ? 'bg-primary/40 text-white'
                          : 'bg-white/10 text-gray-500'
                      }`}
                    >
                      {step === 'password' && stepNum === 1 ? '✓' : stepNum}
                    </motion.div>
                    {i === 0 && (
                      <div
                        className={`h-1 w-12 rounded-full transition-all duration-500 ${
                          step === 'password' ? 'bg-primary shadow-[0_0_6px_rgba(99,102,241,0.6)]' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1: Personal Details */}
                {step === 'details' && (
                  <motion.form
                    key="details"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onSubmit={handleDetailsSubmit}
                    className="space-y-5 relative z-10"
                  >
                    {/* Full Name */}
                    <div className="floating-label-group">
                      <label className={`floating-label ${focusedField === 'name' || formData.name ? 'floating-label-active' : ''}`}>
                        Full Name
                      </label>
                      <input
                        ref={(el) => (inputRefs.current.name = el)}
                        id="reg-name"
                        type="text"
                        name="name"
                        placeholder=" "
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className="input-field pt-6"
                        autoFocus
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="floating-label-group">
                      <label className={`floating-label ${focusedField === 'phone' || formData.phone ? 'floating-label-active' : ''}`}>
                        Phone Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-6 text-gray-400 font-medium">+91</span>
                        <input
                          ref={(el) => (inputRefs.current.phone = el)}
                          id="reg-phone"
                          type="tel"
                          maxLength="10"
                          name="phone"
                          placeholder=" "
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })
                          }
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => setFocusedField(null)}
                          className="input-field pl-16 pt-6 tracking-wide font-medium font-mono"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="floating-label-group">
                      <label className={`floating-label ${focusedField === 'email' || formData.email ? 'floating-label-active' : ''}`}>
                        Email Address
                      </label>
                      <input
                        ref={(el) => (inputRefs.current.email = el)}
                        id="reg-email"
                        type="email"
                        name="email"
                        placeholder=" "
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        className="input-field pt-6"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="floating-label-group">
                      <label className={`floating-label text-xs ${focusedField === 'address' || formData.address ? 'floating-label-active' : ''}`}>
                        Address (Optional)
                      </label>
                      <textarea
                        ref={(el) => (inputRefs.current.address = el)}
                        id="reg-address"
                        name="address"
                        placeholder=" "
                        rows={2}
                        value={formData.address}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('address')}
                        onBlur={() => setFocusedField(null)}
                        className="input-field resize-none pt-6"
                      />
                    </div>

                    {/* District */}
                    <div className="floating-label-group">
                      <label className={`floating-label ${focusedField === 'district' || formData.district ? 'floating-label-active' : ''}`}>
                        District
                      </label>
                      <select
                        ref={(el) => (inputRefs.current.district = el)}
                        id="reg-district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('district')}
                        onBlur={() => setFocusedField(null)}
                        className="select-elegant pt-6"
                        required
                      >
                        <option value=""></option>
                        {districts.map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Taluk */}
                    <div className="floating-label-group">
                      <label className={`floating-label ${focusedField === 'taluk' || formData.taluk ? 'floating-label-active' : ''}`}>
                        Taluk
                      </label>
                      <select
                        ref={(el) => (inputRefs.current.taluk = el)}
                        id="reg-taluk"
                        name="taluk"
                        value={formData.taluk}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('taluk')}
                        onBlur={() => setFocusedField(null)}
                        className="select-elegant pt-6"
                        disabled={!formData.district}
                        required
                      >
                        <option value=""></option>
                        {formData.district
                          ? getTaluksForDistrict(formData.district).map((taluk) => (
                              <option key={taluk} value={taluk}>
                                {taluk}
                              </option>
                            ))
                          : null}
                      </select>
                    </div>

                    {/* Continue Button */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="btn-primary w-full py-4 mt-4 text-base font-semibold"
                    >
                      Continue to Password Setup →
                    </motion.button>
                  </motion.form>
                )}

                {/* Step 2: Set Password */}
                {step === 'password' && (
                  <motion.form
                    key="password"
                    variants={formVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onSubmit={handleCreateAccount}
                    className="space-y-5 relative z-10"
                  >
                    {/* Password */}
                    <div className="floating-label-group">
                      <label className={`floating-label ${focusedField === 'password' || password ? 'floating-label-active' : ''}`}>
                        Password
                      </label>
                      <div className="relative">
                        <input
                          ref={(el) => (inputRefs.current.password = el)}
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder=" "
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          className="input-field pr-12 pt-6"
                          autoFocus
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

                      {/* Password Strength Indicator */}
                      {strength && (
                        <div className="mt-3 space-y-2">
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              animate={{ width: strength.width }}
                              transition={{ duration: 0.3 }}
                              className={`h-full rounded-full transition-colors duration-300 ${strength.color}`}
                            />
                          </div>
                          <p className="text-xs text-gray-400 font-medium">
                            Strength: <span className="text-gray-300">{strength.label}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="floating-label-group">
                      <label className={`floating-label ${focusedField === 'confirmPassword' || confirmPassword ? 'floating-label-active' : ''}`}>
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          ref={(el) => (inputRefs.current.confirmPassword = el)}
                          id="reg-confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder=" "
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onFocus={() => setFocusedField('confirmPassword')}
                          onBlur={() => setFocusedField(null)}
                          className={`input-field pr-12 pt-6 ${
                            passwordsMismatch ? 'border-red-500/50 focus:border-red-500/80' : ''
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors font-medium text-xs"
                        >
                          {showConfirm ? 'Hide' : 'Show'}
                        </button>
                      </div>

                      {/* Password Match Indicator */}
                      {confirmPassword && (
                        <div className="mt-3 flex items-center gap-2">
                          {passwordsMatch ? (
                            <>
                              <span className="text-green-500 text-sm">✓</span>
                              <p className="text-xs text-green-400 font-medium">Passwords match</p>
                            </>
                          ) : (
                            <>
                              <span className="text-red-500 text-sm">✕</span>
                              <p className="text-xs text-red-400 font-medium">Passwords don't match</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Create Account Button */}
                    <motion.button
                      type="submit"
                      disabled={loading || !password || !passwordsMatch}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="btn-primary w-full py-4 mt-4 text-base font-semibold"
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
                          Creating Account...
                        </span>
                      ) : (
                        'Create Account 🚀'
                      )}
                    </motion.button>

                    {/* Back Button */}
                    <motion.button
                      type="button"
                      onClick={() => setStep('details')}
                      whileHover={{ scale: 1.01 }}
                      className="btn-secondary w-full py-3 text-sm font-medium"
                    >
                      ← Back to Details
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Footer */}
              <div className="pt-6 border-t border-white/10 text-center relative z-10 space-y-2">
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    Sign in
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
