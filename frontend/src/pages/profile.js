/**
 * User Profile Page
 * View and edit user profile information
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import DashboardNavbar from '../components/DashboardNavbar';
import { districts, getTaluksForDistrict } from '../utils/taluks';

export default function Profile() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    district: '',
    taluk: '',
  });

  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserProfile(token);
  }, [router]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data.user;
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        district: userData.district || '',
        taluk: userData.taluk || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      const { name, email, address } = formData;

      const response = await axios.put(
        `${API_URL}/auth/profile`,
        { name, email, address },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
      </div>
    );
  }

  const availableTaluks = formData.district ? getTaluksForDistrict(formData.district) : [];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[-15%] w-[55vw] h-[55vw] rounded-full bg-primary/8 blur-[140px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-secondary/8 blur-[140px] mix-blend-screen animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[160px]" />
      </div>

      {/* Navbar */}
      <div className="relative z-20">
        <DashboardNavbar />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <button className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-medium">
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Back to Dashboard
              </button>
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-gray-400 text-lg">
              View and manage your account information
            </p>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel-premium rounded-3xl p-8 lg:p-10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            {/* Profile Header */}
            <div className="flex items-center justify-between gap-6 pb-8 border-b border-white/10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                  <span className="text-5xl filter drop-shadow-lg">👤</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                  <p className="text-gray-400 mt-1">{user?.email}</p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold border border-primary/30">
                      {user?.role === 'admin' ? 'Administrator' : 'Citizen'}
                    </span>
                    {user?.district && (
                      <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-semibold border border-secondary/30">
                        {user.district}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isEditing && (
                <motion.button
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300 font-semibold text-white flex items-center gap-2"
                >
                  <span>✎</span>
                  Edit Profile
                </motion.button>
              )}
            </div>

            {/* Profile Information */}
            {!isEditing ? (
              <div className="mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-slate-400 mb-2">Full Name</p>
                    <p className="text-lg font-semibold text-white">{user?.name}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-slate-400 mb-2">Email Address</p>
                    <p className="text-lg font-semibold text-white break-all">{user?.email}</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-slate-400 mb-2">Phone Number</p>
                    <p className="text-lg font-semibold text-white">{user?.phone || 'Not provided'}</p>
                  </div>

                  {/* Address */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-slate-400 mb-2">Address</p>
                    <p className="text-lg font-semibold text-white">{user?.address || 'Not provided'}</p>
                  </div>

                  {/* District */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-slate-400 mb-2">District</p>
                    <p className="text-lg font-semibold text-white">{user?.district || 'Not provided'}</p>
                  </div>

                  {/* Taluk */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.06em] text-slate-400 mb-2">Taluk</p>
                    <p className="text-lg font-semibold text-white">{user?.taluk || 'Not provided'}</p>
                  </div>
                </div>

                {/* Account Info */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-[0.06em] mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-400">Account Type</p>
                      <p className="text-sm font-semibold text-white capitalize">{user?.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Member Since</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(user?.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Form */
              <form onSubmit={handleSaveProfile} className="mt-8 space-y-6">
                {/* Name */}
                <div className="floating-label-group">
                  <label
                    className={`floating-label ${focusedField === 'name' || formData.name ? 'floating-label-active' : ''}`}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder=" "
                    value={formData.name}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pt-6"
                    required
                  />
                </div>

                {/* Email */}
                <div className="floating-label-group">
                  <label
                    className={`floating-label ${focusedField === 'email' || formData.email ? 'floating-label-active' : ''}`}
                  >
                    Email Address
                  </label>
                  <input
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

                {/* Phone (Read-only) */}
                <div className="floating-label-group">
                  <label className="floating-label floating-label-active">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    disabled
                    className="input-field pt-6 opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-2">Phone number cannot be changed</p>
                </div>

                {/* Address */}
                <div className="floating-label-group">
                  <label
                    className={`floating-label ${focusedField === 'address' || formData.address ? 'floating-label-active' : ''}`}
                  >
                    Address
                  </label>
                  <textarea
                    name="address"
                    placeholder=" "
                    value={formData.address}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField(null)}
                    className="input-field pt-6 resize-none min-h-[80px]"
                  />
                </div>

                {/* District (Read-only) */}
                <div className="floating-label-group">
                  <label className="floating-label floating-label-active">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    disabled
                    className="input-field pt-6 opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-2">District cannot be changed</p>
                </div>

                {/* Taluk (Read-only) */}
                <div className="floating-label-group">
                  <label className="floating-label floating-label-active">Taluk</label>
                  <input
                    type="text"
                    value={formData.taluk}
                    disabled
                    className="input-field pt-6 opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-2">Taluk cannot be changed</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-white/10">
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ y: -2, scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-300 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 font-semibold text-white border border-white/20"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Additional Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Quick Actions */}
          <div className="glass-panel-premium rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/dashboard">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-200 font-medium text-sm">
                    📊 View My Complaints
                  </button>
                </Link>
                <Link href="/complaint/submit">
                  <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-200 font-medium text-sm">
                    ➕ Report New Issue
                  </button>
                </Link>
                <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-200 font-medium text-sm">
                  🔐 Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="glass-panel-premium rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-gray-300 text-sm">Profile Completeness</span>
                  <span className="text-primary font-bold">100%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                  <span className="text-gray-300 text-sm">Account Verification</span>
                  <span className="text-secondary font-bold">✓ Verified</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
