/**
 * Submit Complaint Page
 * Modern form to report civic issues in premium dark mode
 * Location is auto-detected and locked — users cannot change it
 * District/Taluk auto-detected from location or manually selectable
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import apiClient from '../../services/api';
import { districts, getTaluksForDistrict, detectDistrictAndTaluk } from '../../utils/taluks';

export default function SubmitComplaint() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [locationStatus, setLocationStatus] = useState('detecting'); // 'detecting' | 'success' | 'error'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'pothole',
    address: '',
    latitude: '',
    longitude: '',
    priority: 'medium',
    district: '',
    taluk: ''
  });
  // Compute available taluks based on selected district
  const availableTaluks = formData.district ? getTaluksForDistrict(formData.district) : [];

  // ─── Location detector ────────────────────────────────────────────────────────
  const detectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('error');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        try {
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          const addr = geoRes.data?.address || {};
          const formattedAddress =
            geoRes.data?.display_name ||
            [
              addr.road,
              addr.suburb,
              addr.city || addr.town || addr.village,
              addr.state,
              addr.country
            ].filter(Boolean).join(', ') ||
            `${lat}, ${lng}`;

          // Build components-like array for taluk detection
          const components = Object.entries(addr).map(([key, val]) => ({
            long_name: val,
            short_name: val
          }));

          const detected = detectDistrictAndTaluk(components);

          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: formattedAddress,
            district: detected.district || '',
            taluk: detected.taluk || ''
          }));
          setLocationStatus('success');

          if (detected.district && detected.taluk) {
            toast.success(`Location detected ✓ — ${detected.taluk}, ${detected.district}`);
          } else {
            toast.success('Location detected ✓ — Please select your District & Taluk manually');
          }
        } catch {
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: `${lat}, ${lng}`
          }));
          setLocationStatus('success');
          toast.success('Location detected ✓ — Please select your District & Taluk');
        }
      },
      (err) => {
        setLocationStatus('error');
        const msg =
          err.code === 1
            ? 'Location permission denied. Please allow access and retry.'
            : 'Unable to determine your location. Please retry.';
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ─── Auto-detect on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Never allow editing location fields
    if (['latitude', 'longitude', 'address'].includes(name)) return;

    // If district changes, reset taluk
    if (name === 'district') {
      setFormData(prev => ({ ...prev, district: value, taluk: '' }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    setImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Location must be detected before submitting');
      return;
    }

    if (!formData.district || !formData.taluk) {
      toast.error('Please select your District and Taluk');
      return;
    }

    setLoading(true);
    try {
      const payload = Object.keys(formData).reduce((acc, key) => {
        if (formData[key]) {
          acc[key] = formData[key];
        }
        return acc;
      }, {});

      let response;
      if (image) {
        const submitFormData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
          submitFormData.append(key, value);
        });
        submitFormData.append('image', image);

        response = await apiClient.post('/complaints/create', submitFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await apiClient.post('/complaints/create', payload);
      }

      toast.success(`Complaint submitted successfully! Tracking ID: ${response.data.trackingId}`);
      setTimeout(() => router.push('/dashboard'), 3500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  // ─── Location status badge ────────────────────────────────────────────────────
  const LocationBadge = () => {
    if (locationStatus === 'detecting') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
          <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          Detecting your location…
        </div>
      );
    }
    if (locationStatus === 'success') {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          <span>✓</span>
          Location detected &amp; locked — cannot be changed
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
        <span>⚠</span>
        <span>Location unavailable</span>
        <button
          type="button"
          onClick={detectLocation}
          className="ml-auto underline text-red-300 hover:text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 py-12 px-4 relative overflow-hidden">
      {/* Dark Orbs Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[150px] mix-blend-screen animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-secondary/10 blur-[150px] mix-blend-screen animate-blob animation-delay-4000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
        className="max-w-2xl mx-auto relative z-10"
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
        </button>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl space-y-8 relative overflow-hidden text-left">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="space-y-2 relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)] mb-2">
              <span className="text-3xl filter drop-shadow-md">🚨</span>
            </div>
            <h1 className="text-3xl font-black text-white">Report an Issue</h1>
            <p className="text-gray-400 font-light">Help us fix your city&apos;s problems</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

            {/* Title */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Issue Title <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Large pothole on Main Street"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="input-field"
              />
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Detailed Description <span className="text-primary">*</span>
              </label>
              <textarea
                name="description"
                placeholder="Provide detailed information about the issue..."
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="input-field rounded-xl resize-none"
              />
            </motion.div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category <span className="text-primary">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="pothole" className="bg-dark-bg">🕳️ Pothole / Road</option>
                  <option value="streetlight" className="bg-dark-bg">💡 Street Light</option>
                  <option value="water" className="bg-dark-bg">💧 Water Supply</option>
                  <option value="electricity" className="bg-dark-bg">⚡ Electricity / Power Cut</option>
                  <option value="drainage" className="bg-dark-bg">🚰 Drainage</option>
                  <option value="garbage" className="bg-dark-bg">🗑️ Garbage</option>
                  <option value="cleanliness" className="bg-dark-bg">🧹 Cleanliness</option>
                  <option value="other" className="bg-dark-bg">📍 Other</option>
                </select>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="low" className="bg-dark-bg">🟢 Low</option>
                  <option value="medium" className="bg-dark-bg">🟡 Medium</option>
                  <option value="high" className="bg-dark-bg">🟠 High</option>
                  <option value="critical" className="bg-dark-bg">🔴 Critical</option>
                </select>
              </motion.div>
            </div>

            {/* District & Taluk Dropdowns */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.27 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    District <span className="text-primary">*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="" className="bg-dark-bg">— Select District —</option>
                    {districts.map(d => (
                      <option key={d} value={d} className="bg-dark-bg">{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Taluk (Municipality) <span className="text-primary">*</span>
                  </label>
                  <select
                    name="taluk"
                    value={formData.taluk}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    disabled={!formData.district}
                  >
                    <option value="" className="bg-dark-bg">
                      {formData.district ? '— Select Taluk —' : '— Select District first —'}
                    </option>
                    {availableTaluks.map(t => (
                      <option key={t} value={t} className="bg-dark-bg">{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              {formData.district && formData.taluk && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  <span>✓</span> Complaint will be routed to <strong>{formData.taluk}</strong> municipality, <strong>{formData.district}</strong> district
                </p>
              )}
            </motion.div>

            {/* Image Upload */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evidence Photo <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <div className="border border-dashed border-white/20 bg-white/5 rounded-xl p-8 text-center hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-input"
                />
                <label htmlFor="image-input" className="cursor-pointer block w-full">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {image ? '✅' : '📷'}
                  </div>
                  <div className="text-gray-200 font-medium">
                    {image ? image.name : 'Click to upload evidence'}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">Max 5MB (JPEG or PNG)</div>
                </label>
              </div>
            </motion.div>

            {/* Location — READ-ONLY, auto-filled */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  📍 Location <span className="text-primary">*</span>
                </label>
                <span className="text-xs text-gray-500 italic">Auto-detected · cannot be changed</span>
              </div>

              {/* Status badge */}
              <LocationBadge />

              {/* Lat / Lng display */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 ml-1 mb-1 block">Latitude</label>
                  <input
                    type="text"
                    value={formData.latitude}
                    readOnly
                    placeholder="Detecting…"
                    className="input-field text-sm font-mono opacity-70 cursor-not-allowed select-none"
                    style={{ caretColor: 'transparent' }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 ml-1 mb-1 block">Longitude</label>
                  <input
                    type="text"
                    value={formData.longitude}
                    readOnly
                    placeholder="Detecting…"
                    className="input-field text-sm font-mono opacity-70 cursor-not-allowed select-none"
                    style={{ caretColor: 'transparent' }}
                  />
                </div>
              </div>

              {/* Address display */}
              <div>
                <label className="text-xs text-gray-500 ml-1 mb-1 block">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  readOnly
                  placeholder="Detecting address…"
                  className="input-field opacity-70 cursor-not-allowed select-none"
                  style={{ caretColor: 'transparent' }}
                />
              </div>

              <p className="text-xs text-gray-600 flex items-center gap-1">
                <span>🔒</span>
                Location is captured from your device GPS and verified via Google Maps.
                It cannot be modified to prevent false reports.
              </p>
            </motion.div>

            {/* Submit */}
            <div className="pt-4 pb-2">
              <button
                type="submit"
                disabled={loading || locationStatus === 'detecting'}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? 'Submitting to Authorities…'
                  : locationStatus === 'detecting'
                    ? 'Waiting for location…'
                    : 'Submit Official Report'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
