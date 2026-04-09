/**
 * Password Reset Page
 * OTP-based password reset via email
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const inputRefs = useRef({});

  const requestOtp = async (event) => {
    event.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password/request`, { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!email || !otp || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password/reset`, {
        email,
        otp,
        newPassword,
        confirmPassword
      });
      toast.success('Password reset successful. Please log in.');
      router.push('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-100 relative overflow-hidden"
    >
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-primary/8 blur-[140px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary/8 blur-[140px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        <Link href="/login">
          <button className="mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-medium">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to Login
          </button>
        </Link>

        <div className="glass-panel-premium rounded-3xl p-8 lg:p-10 space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

          <div className="text-center space-y-3 relative z-10">
            <h2 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Reset Password
            </h2>
            <p className="text-gray-400 font-light text-sm">
              {step === 1
                ? 'Enter your email to receive a one-time password'
                : 'Enter the OTP and choose a new password'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={requestOtp} className="space-y-6 relative z-10">
              <div className="floating-label-group">
                <label className={`floating-label ${focusedField === 'email' || email ? 'floating-label-active' : ''}`}>
                  Email Address
                </label>
                <input
                  ref={(el) => (inputRefs.current.email = el)}
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="input-field pt-6"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading || !email}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary w-full py-4 text-base font-semibold"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-6 relative z-10">
              <div className="floating-label-group">
                <label className={`floating-label ${focusedField === 'otp' || otp ? 'floating-label-active' : ''}`}>
                  OTP Code
                </label>
                <input
                  ref={(el) => (inputRefs.current.otp = el)}
                  type="text"
                  placeholder=" "
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  onFocus={() => setFocusedField('otp')}
                  onBlur={() => setFocusedField(null)}
                  className="input-field pt-6"
                  maxLength={6}
                  required
                />
              </div>

              <div className="floating-label-group">
                <label className={`floating-label ${focusedField === 'newPassword' || newPassword ? 'floating-label-active' : ''}`}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    ref={(el) => (inputRefs.current.newPassword = el)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder=" "
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    onFocus={() => setFocusedField('newPassword')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pr-12 pt-6"
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

              <div className="floating-label-group">
                <label className={`floating-label ${focusedField === 'confirmPassword' || confirmPassword ? 'floating-label-active' : ''}`}>
                  Confirm Password
                </label>
                <input
                  ref={(el) => (inputRefs.current.confirmPassword = el)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder=" "
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className="input-field pt-6"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading || !otp || !newPassword || !confirmPassword}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="btn-primary w-full py-4 text-base font-semibold"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                Resend OTP
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
