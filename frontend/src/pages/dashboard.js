/**
 * Citizen Dashboard Premium Dark
 * Track complaints, view status, and statistics
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { announcementAPI } from '../services/api';
import DashboardNavbar from '../components/DashboardNavbar';
import SummaryCards from '../components/SummaryCards';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    syncUserAndLoadDashboard(token);
  }, [router]);

  const syncUserAndLoadDashboard = async (token) => {
    try {
      const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const freshUser = profileResponse.data.user;
      localStorage.setItem('user', JSON.stringify(freshUser));
      localStorage.setItem('userRole', freshUser.role);
      setUser(freshUser);

      if (freshUser.role === 'admin') {
        router.replace('/admin/dashboard');
        return;
      }

      await Promise.all([
        fetchComplaints(token),
        fetchAnnouncements(freshUser)
      ]);
    } catch (error) {
      console.error('Error syncing user profile:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      router.push('/login');
    }
  };

  const fetchComplaints = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/complaints/my-complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.data || [];
      setComplaints(data);
      setStats({
        total: data.length,
        pending: data.filter((complaint) => complaint.status === 'Pending').length,
        resolved: data.filter((complaint) => complaint.status === 'Resolved').length,
      });
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async (userData) => {
    try {
      const userTaluk = userData?.taluk;
      
      if (!userTaluk) {
        console.warn('User taluk is not set; fetching only global announcements');
      }
      
      // Send user's taluk to backend for strict filtering
      // Backend will only return announcements for this taluk or global announcements
      const response = await announcementAPI.getActive(userTaluk);
      const announcementsRaw = response.data.data || [];

      // Client-side safeguard: Final validation that we only show correct announcements
      // This prevents accidental display of wrong-taluk announcements due to any backend/frontend mismatches
      const filtered = announcementsRaw.filter((a) => {
        // Always show global announcements (no taluk specified)
        if (!a.taluk) return true;
        
        // For taluk-specific announcements, only show if user's taluk matches
        if (!userTaluk) {
          console.warn(`Filtering out taluk-specific announcement ${a.id} for user without taluk`);
          return false;
        }
        
        const announcementTaluk = String(a.taluk).trim().toLowerCase();
        const userTalukNorm = String(userTaluk).trim().toLowerCase();
        
        if (announcementTaluk !== userTalukNorm) {
          console.warn(`Filtering out announcement ${a.id} (taluk: ${a.taluk}) for user from taluk: ${userTaluk}`);
          return false;
        }
        
        return true;
      });

      setAnnouncements(filtered);
    } catch (error) {
      console.error('Error fetching municipality updates:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const filteredComplaints = complaints.filter((complaint) => (filter === 'All' ? true : complaint.status === filter));

  const statusStyles = {
    Pending: 'badge bg-gray-500/20 text-gray-400 border-gray-500/30',
    Verified: 'badge bg-blue-500/20 text-blue-400 border-blue-500/30',
    'In Progress': 'badge-info',
    'On Hold': 'badge bg-orange-500/20 text-orange-400 border-orange-500/30',
    Resolved: 'badge-success',
    Closed: 'badge bg-emerald-800/20 text-emerald-500 border-emerald-600/30',
    Rejected: 'badge bg-red-500/20 text-red-400 border-red-500/30',
  };

  const priorityColors = {
    low: 'text-gray-400',
    medium: 'text-info',
    high: 'text-warning',
    critical: 'text-danger',
  };

  const trackingStages = [
    { key: 'Pending', label: 'Complaint Received', shortLabel: 'Received' },
    { key: 'Verified', label: 'Under Review', shortLabel: 'Review' },
    { key: 'In Progress', label: 'Work In Progress', shortLabel: 'Action' },
    { key: 'Resolved', label: 'Issue Resolved', shortLabel: 'Resolved' },
    { key: 'Closed', label: 'Case Closed', shortLabel: 'Closed' },
  ];

  const getTrackingState = (status) => {
    if (status === 'Rejected') {
      return {
        variant: 'rejected',
        headline: 'Complaint could not be accepted',
        nextStep: 'Review the authority note and submit an updated report if the issue still needs attention.',
      };
    }

    if (status === 'On Hold') {
      return {
        variant: 'paused',
        headline: 'Complaint is temporarily on hold',
        nextStep: 'The municipal team has paused action for now. Check the latest note to see what happens next.',
      };
    }

    const currentIndex = trackingStages.findIndex((stage) => stage.key === status);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextStage = trackingStages[safeIndex + 1];

    return {
      variant: 'linear',
      currentIndex: safeIndex,
      headline: trackingStages[safeIndex]?.label || status,
      nextStep: nextStage
        ? `Next step: ${nextStage.label}.`
        : 'Next step: no further action needed from you right now.',
    };
  };

  const renderTrackingStatus = (complaint, compact = false) => {
    const trackingState = getTrackingState(complaint.status);

    return (
      <div className={`rounded-2xl border border-white/10 bg-white/[0.03] ${compact ? 'px-4 py-4' : 'px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'}`}>
        {trackingState.variant === 'linear' ? (
          <>
            <div className={`flex items-center justify-between gap-3 ${compact ? 'mb-4' : 'mb-5'}`}>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Tracking Status</p>
                <p className={`text-white font-semibold mt-1 ${compact ? '' : 'text-lg'}`}>{trackingState.headline}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Next</p>
                <p className={`text-primary-hover mt-1 ${compact ? 'text-sm' : 'text-base font-medium'}`}>
                  {trackingState.currentIndex < trackingStages.length - 1
                    ? trackingStages[trackingState.currentIndex + 1].shortLabel
                    : 'Completed'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 items-start">
              {trackingStages.map((stage, stageIndex) => {
                const isComplete = stageIndex < trackingState.currentIndex;
                const isCurrent = stageIndex === trackingState.currentIndex;

                return (
                  <div key={stage.key} className="relative">
                    {stageIndex < trackingStages.length - 1 && (
                      <div className="absolute top-3 left-[55%] w-[90%] h-[2px] bg-white/10" />
                    )}
                    {stageIndex < trackingState.currentIndex && stageIndex < trackingStages.length - 1 && (
                      <div className="absolute top-3 left-[55%] w-[90%] h-[2px] bg-emerald-400" />
                    )}
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                          isComplete
                            ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_0_18px_rgba(74,222,128,0.35)]'
                            : isCurrent
                              ? 'bg-primary text-white border-primary shadow-[0_0_18px_rgba(99,102,241,0.35)]'
                              : 'bg-dark-bg text-gray-500 border-white/15'
                        }`}
                      >
                        {isComplete ? '?' : stageIndex + 1}
                      </div>
                      <p className={`mt-2 text-[11px] leading-4 ${isCurrent ? 'text-white' : isComplete ? 'text-emerald-300' : 'text-gray-500'}`}>
                        {stage.shortLabel}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Tracking Status</p>
              <p className={`font-semibold mt-1 ${trackingState.variant === 'rejected' ? 'text-red-300' : 'text-orange-300'} ${compact ? '' : 'text-lg'}`}>
                {trackingState.headline}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs border ${
              trackingState.variant === 'rejected'
                ? 'bg-red-500/10 text-red-300 border-red-500/20'
                : 'bg-orange-500/10 text-orange-300 border-orange-500/20'
            }`}>
              {complaint.status}
            </div>
          </div>
        )}

        <p className={`text-gray-400 leading-relaxed ${compact ? 'text-sm mt-4' : 'text-sm mt-5'}`}>
          {trackingState.nextStep}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[120px] mix-blend-screen" />
      </div>

      <DashboardNavbar user={user} onLogout={handleLogout} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        <SummaryCards stats={stats} />

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-panel rounded-[28px] border border-cyan-400/10 overflow-hidden mb-8"
        >
          <div className="px-6 py-5 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(99,102,241,0.05))]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Municipality Updates</p>
              <h2 className="text-xl font-semibold text-white mt-1">Latest notices from your civic team</h2>
            </div>
            <div className="text-sm text-gray-400">
              {announcements.length > 0 ? `${announcements.length} active update${announcements.length > 1 ? 's' : ''}` : 'No active updates'}
            </div>
          </div>

          <div className="p-6">
            {announcements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-5 py-8 text-center text-gray-400">
                No municipality update is live right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{announcement.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Posted by {announcement.created_by_name || 'Municipality'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs border ${announcement.is_permanent ? 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20' : 'bg-amber-500/10 text-amber-200 border-amber-400/20'}`}>
                        {announcement.is_permanent ? 'Permanent' : 'Timed'}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-7 text-sm">{announcement.content}</p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                      <span>{new Date(announcement.created_at).toLocaleString()}</span>
                      <span>
                        {announcement.is_permanent
                          ? 'Visible until removed manually'
                          : `Visible until ${new Date(announcement.expires_at).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        <div className="glass-panel rounded-2xl p-2 mb-8 flex gap-2 overflow-x-auto custom-scrollbar">
          {['All', 'Pending', 'Verified', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                filter === status
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {filteredComplaints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel rounded-2xl p-16 text-center border-dashed border-white/20"
            >
              <span className="text-6xl block mb-6 opacity-50 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">??</span>
              <p className="text-gray-400 text-lg font-medium">No complaints found in this category.</p>
            </motion.div>
          ) : (
            filteredComplaints.map((complaint, idx) => {
              const isExpanded = expandedId === complaint.id;

              return (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass-panel rounded-2xl hover:border-white/20 transition-all p-6 group cursor-pointer ${isExpanded ? 'border-primary/50 bg-white/[0.03]' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : complaint.id)}
                >
                  <div className="block">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex-1">
                        <p className="text-primary/70 text-xs font-mono mb-1 tracking-wider">{complaint.tracking_id || `#${complaint.id}`}</p>
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-hover transition-colors">{complaint.title}</h3>
                        {!isExpanded && <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{complaint.description}</p>}
                      </div>
                      <div className="flex-shrink-0">
                        <div className={statusStyles[complaint.status] || 'badge bg-gray-800 text-gray-300'}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 mr-1 animate-pulse"></span>
                          {complaint.status}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center text-sm border-t border-white/10 pt-4 mt-4">
                      <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 text-gray-300">
                          <span className="opacity-50">??</span> {complaint.category}
                        </span>
                        <span className={`flex items-center gap-1.5 font-medium ${priorityColors[complaint.priority]}`}>
                          <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                          {complaint.priority.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-500 font-medium flex items-center gap-3">
                        {new Date(complaint.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="text-primary-hover">{isExpanded ? '?' : '?'}</span>
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-4">
                            {renderTrackingStatus(complaint, false)}
                          </div>

                          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
                            <div className="relative z-10">
                              <div className="flex items-center justify-between gap-4 mb-5">
                                <div>
                                  <p className="text-[11px] uppercase tracking-[0.24em] text-gray-500">Issue Brief</p>
                                  <h4 className="text-white font-semibold mt-1 text-lg">Description</h4>
                                </div>
                                <div className="px-3 py-1 rounded-full border border-white/10 bg-black/20 text-xs text-gray-300 font-mono">
                                  {complaint.tracking_id || `#${complaint.id}`}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 mb-5">
                                <p className="text-gray-200 text-sm md:text-[15px] leading-7">
                                  {complaint.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-gray-300">
                                  <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-1">Location</p>
                                  <p>{complaint.address || 'Address not provided'}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-gray-300">
                                  <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-1">Filed On</p>
                                  <p>{new Date(complaint.created_at).toLocaleString()}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-gray-300">
                                  <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-1">District</p>
                                  <p>{complaint.district || 'Not tagged'}</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-gray-300">
                                  <p className="text-[11px] uppercase tracking-[0.22em] text-gray-500 mb-1">Taluk</p>
                                  <p>{complaint.taluk || 'Not tagged'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {complaint.resolution_notes && (
                            <div className="bg-primary/10 border border-primary/20 rounded-[24px] p-5">
                              <h4 className="text-primary font-semibold mb-2">Authority Notice</h4>
                              <p className="text-gray-300 text-sm leading-relaxed">{complaint.resolution_notes}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
