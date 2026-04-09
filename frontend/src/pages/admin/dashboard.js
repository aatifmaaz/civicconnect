
/**
 * Advanced Admin Dashboard
 * Municipality staff dashboard for complaints, analytics, and municipality updates
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import apiClient from '../../services/api';
import { districts, getTaluksForDistrict } from '../../utils/taluks';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MapComponentWithNoSSR = dynamic(
  () => import('../../components/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-white/5 h-[420px] w-full rounded-[28px] border border-white/10 flex items-center justify-center text-slate-400">
        Loading secure maps...
      </div>
    )
  }
);

const validTransitions = {
  Pending: ['Verified', 'Rejected'],
  Verified: ['In Progress', 'On Hold'],
  'In Progress': ['Resolved', 'On Hold'],
  'On Hold': ['In Progress'],
  Resolved: ['Closed'],
  Closed: [],
  Rejected: []
};

const statusTheme = {
  Pending: { badge: 'bg-slate-500/18 text-slate-200 border-slate-400/20', dot: 'bg-slate-400' },
  Verified: { badge: 'bg-blue-500/18 text-blue-200 border-blue-400/20', dot: 'bg-blue-400' },
  'In Progress': { badge: 'bg-amber-500/18 text-amber-200 border-amber-400/20', dot: 'bg-amber-400' },
  'On Hold': { badge: 'bg-orange-500/18 text-orange-200 border-orange-400/20', dot: 'bg-orange-400' },
  Resolved: { badge: 'bg-emerald-500/18 text-emerald-200 border-emerald-400/20', dot: 'bg-emerald-400' },
  Closed: { badge: 'bg-teal-500/18 text-teal-200 border-teal-400/20', dot: 'bg-teal-400' },
  Rejected: { badge: 'bg-rose-500/18 text-rose-200 border-rose-400/20', dot: 'bg-rose-400' }
};

const quickViews = ['Pending', 'Verified', 'In Progress', 'On Hold', 'Resolved', 'Closed', 'Rejected'];

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', short: 'DB' },
  { id: 'complaints', label: 'Complaints', short: 'CP' },
  { id: 'map', label: 'Map View', short: 'MP' },
  { id: 'analytics', label: 'Analytics', short: 'AN' },
  { id: 'updates', label: 'Updates', short: 'UP' },
  { id: 'settings', label: 'Settings', short: 'ST' }
];

const getUpdateIcon = (type) => {
  if (type === 'announcement') return 'AN';
  if (type === 'status') return 'ST';
  return 'UP';
};

const formatDateTime = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleString();
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [talukFilter, setTalukFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', isPermanent: false, expiresAt: '', district: '', taluk: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignDistrict, setAssignDistrict] = useState('');
  const [assignTaluk, setAssignTaluk] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const availableAssignTaluks = assignDistrict ? getTaluksForDistrict(assignDistrict) : [];
  const currentAdminRecord = users.find((entry) => entry.id === user?.id);
  const isSuperAdmin = currentAdminRecord ? !currentAdminRecord.taluk : !user?.taluk;

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    syncUserAndLoadAdminDashboard(token);
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user, statusFilter]);

  useEffect(() => {
    if (user && activeView === 'settings') {
      fetchUsers();
      fetchAnnouncements();
    }
  }, [activeView, user]);

  const syncUserAndLoadAdminDashboard = async (token) => {
    try {
      const response = await apiClient.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const freshUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(freshUser));
      localStorage.setItem('userRole', freshUser.role);
      setUser(freshUser);
      if (freshUser.role !== 'admin') {
        router.replace('/dashboard');
        return;
      }
      fetchDashboard();
    } catch (error) {
      toast.error('Session expired. Please sign in again.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      router.push('/admin/login');
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      const payload = response.data;
      const dashboard = payload.stats || payload.data || {};
      const overall = dashboard.overall || {};
      const statusDistribution = dashboard.statusDistribution || [];
      const getCount = (statusName) => Number(statusDistribution.find((entry) => entry.status === statusName)?.count || 0);
      setStats({
        total: Number(overall.total_complaints || payload.totalComplaints || 0),
        pending: Number(overall.pending_complaints || getCount('Pending')),
        in_progress: Number(overall.in_progress_complaints || getCount('In Progress')),
        resolved: Number(overall.resolved_complaints || getCount('Resolved'))
      });
    } catch (error) {
      toast.error('Error syncing dashboard metrics');
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/complaints', { params: { status: statusFilter } });
      setComplaints(response.data.data || []);
    } catch (error) {
      toast.error('Error retrieving complaint records');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await apiClient.get('/admin/users', { params: { limit: 100 } });
      setUsers(response.data.data || []);
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const response = await apiClient.get('/admin/announcements');
      setAnnouncements(response.data.data || []);
    } catch (error) {
      toast.error('Error fetching municipality updates');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const handleAnnouncementFieldChange = (field, value) => {
    setAnnouncementForm((current) => ({ ...current, [field]: value, ...(field === 'isPermanent' && value ? { expiresAt: '' } : {}) }));
  };

  const resetAnnouncementForm = () => setAnnouncementForm({ title: '', content: '', isPermanent: false, expiresAt: '', district: '', taluk: '' });

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast.error('Please add both a title and update content');
      return;
    }
    if (!announcementForm.district || !announcementForm.taluk) {
      toast.error('Please select both district and taluk for this update');
      return;
    }
    if (!announcementForm.isPermanent && !announcementForm.expiresAt) {
      toast.error('Please choose when this update should expire');
      return;
    }
    setAnnouncementSubmitting(true);
    try {
      await apiClient.post('/admin/announcements', {
        title: announcementForm.title.trim(),
        content: announcementForm.content.trim(),
        isPermanent: announcementForm.isPermanent,
        expiresAt: announcementForm.isPermanent ? null : announcementForm.expiresAt,
        district: announcementForm.district,
        taluk: announcementForm.taluk
      });
      toast.success('Municipality update published');
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to publish municipality update');
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    setDeletingAnnouncementId(announcementId);
    try {
      await apiClient.delete(`/admin/announcements/${announcementId}`);
      toast.success('Municipality update removed');
      setAnnouncements((current) => current.filter((item) => item.id !== announcementId));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to remove municipality update');
    } finally {
      setDeletingAnnouncementId(null);
    }
  };
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setStatusUpdating(true);
      await apiClient.patch(`/complaints/${id}/status`, { status: newStatus, notes: actionNotes });
      toast.success('Status updated successfully. User has been notified via email');
      setExpandedId(null);
      setActionNotes('');
      fetchComplaints();
      fetchDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/users/${deleteTarget.id}`);
      toast.success(`User "${deleteTarget.name}" deleted successfully`);
      setUsers((prev) => prev.filter((entry) => entry.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAssignModal = (targetUser) => {
    setAssignTarget(targetUser);
    setAssignDistrict(targetUser.district || '');
    setAssignTaluk(targetUser.taluk || '');
  };

  const closeAssignModal = () => {
    if (assignLoading) return;
    setAssignTarget(null);
    setAssignDistrict('');
    setAssignTaluk('');
  };

  const handleAssignTaluk = async () => {
    if (!assignTarget || !assignDistrict || !assignTaluk) {
      toast.error('Please select both District and Taluk');
      return;
    }
    setAssignLoading(true);
    try {
      await apiClient.patch(`/admin/users/${assignTarget.id}/assign-taluk`, { district: assignDistrict, taluk: assignTaluk });
      toast.success(`Admin "${assignTarget.name}" assigned to ${assignTaluk}, ${assignDistrict}`);
      setUsers((prev) => prev.map((entry) => entry.id === assignTarget.id ? { ...entry, district: assignDistrict, taluk: assignTaluk } : entry));
      closeAssignModal();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to assign taluk');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    toast.info('Securely logged out');
    router.push('/admin/login');
  };

  const complaintTaluks = useMemo(() => Array.from(new Set(complaints.map((complaint) => complaint.taluk).filter(Boolean))), [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const searchTarget = `${complaint.title} ${complaint.category} ${complaint.address || ''} ${complaint.taluk || ''} ${complaint.district || ''}`.toLowerCase();
      const matchesSearch = !searchTerm.trim() || searchTarget.includes(searchTerm.trim().toLowerCase());
      const matchesTaluk = talukFilter === 'all' || complaint.taluk === talukFilter;
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;
        const createdAt = new Date(complaint.created_at).getTime();
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        if (dateFilter === 'today') return now - createdAt <= day;
        if (dateFilter === 'week') return now - createdAt <= 7 * day;
        if (dateFilter === 'month') return now - createdAt <= 30 * day;
        return true;
      })();
      return matchesSearch && matchesTaluk && matchesDate;
    });
  }, [complaints, searchTerm, talukFilter, dateFilter]);

  const updateTimeline = useMemo(() => {
    const complaintUpdates = filteredComplaints.slice(0, 5).map((complaint) => ({
      id: `complaint-${complaint.id}`,
      type: 'status',
      title: complaint.title,
      subtitle: `${complaint.status} in ${complaint.taluk || 'Unassigned taluk'}`,
      timestamp: complaint.updated_at || complaint.created_at,
      description: complaint.resolution_notes || complaint.address || 'Complaint is actively being tracked in the command center.'
    }));

    const announcementUpdates = announcements.slice(0, 5).map((announcement) => ({
      id: `announcement-${announcement.id}`,
      type: 'announcement',
      title: announcement.title,
      subtitle: announcement.visibility_status || 'Municipality update',
      timestamp: announcement.created_at,
      description: announcement.content
    }));

    return [...announcementUpdates, ...complaintUpdates]
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
      .slice(0, 8);
  }, [filteredComplaints, announcements]);

  const categoryData = useMemo(() => {
    const categories = {};
    filteredComplaints.forEach((complaint) => {
      categories[complaint.category] = (categories[complaint.category] || 0) + 1;
    });
    return {
      labels: Object.keys(categories).map((key) => key.toUpperCase()),
      datasets: [{
        label: 'Complaints',
        data: Object.values(categories),
        backgroundColor: 'rgba(56, 189, 248, 0.72)',
        borderColor: 'rgba(14, 165, 233, 1)',
        borderWidth: 1,
        borderRadius: 10
      }]
    };
  }, [filteredComplaints]);

  const statusData = {
    labels: ['Pending', 'In Progress', 'Resolved'],
    datasets: [{
      data: [stats.pending, stats.in_progress, stats.resolved],
      backgroundColor: ['rgba(148, 163, 184, 0.9)', 'rgba(245, 158, 11, 0.9)', 'rgba(16, 185, 129, 0.9)'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: 'rgba(226, 232, 240, 0.78)' } } },
    scales: {
      y: { ticks: { color: 'rgba(148, 163, 184, 0.78)' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { ticks: { color: 'rgba(148, 163, 184, 0.78)' }, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: 'rgba(226, 232, 240, 0.78)', padding: 18 } } },
    cutout: '74%'
  };

  const renderOverviewCards = () => {
    const cards = [
      { label: 'Total Complaints', value: stats.total, tone: 'from-cyan-500/30 to-sky-500/10' },
      { label: 'Pending', value: stats.pending, tone: 'from-slate-500/30 to-slate-400/10' },
      { label: 'In Progress', value: stats.in_progress, tone: 'from-amber-500/30 to-orange-500/10' },
      { label: 'Resolved', value: stats.resolved, tone: 'from-emerald-500/30 to-teal-500/10' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => (
          <motion.div key={card.label} whileHover={{ y: -6, scale: 1.01 }} className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[0_20px_50px_rgba(15,23,42,0.35)]">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.tone} opacity-90`} />
            <div className="relative z-10">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-400">{card.label}</p>
              <h3 className="mt-4 text-4xl font-black text-white">{card.value}</h3>
              <p className="mt-3 text-sm text-slate-300">Updated from the active municipality data stream.</p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderTimeline = () => (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Municipality Updates</p>
          <h3 className="text-2xl font-semibold text-white mt-2">Latest actions and notices</h3>
        </div>
        <button type="button" onClick={() => setActiveView('settings')} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10 transition-colors">Manage Updates</button>
      </div>
      <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
        {updateTimeline.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-slate-400">No recent municipality activity is available yet.</div>
        ) : updateTimeline.map((item, index) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center text-xs font-black ${item.type === 'announcement' ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100' : 'border-amber-400/20 bg-amber-400/10 text-amber-100'}`}>{getUpdateIcon(item.type)}</div>
              {index < updateTimeline.length - 1 && <div className="w-px flex-1 bg-white/10 mt-3" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-sm text-slate-400 mt-1">{item.subtitle}</p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">{formatDateTime(item.timestamp)}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  const renderComplaintCard = (complaint) => {
    const theme = statusTheme[complaint.status] || statusTheme.Pending;
    const transitions = validTransitions[complaint.status] || [];
    const isExpanded = expandedId === complaint.id;

    return (
      <motion.div key={complaint.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[28px] border ${isExpanded ? 'border-cyan-400/20 bg-white/[0.06]' : 'border-white/10 bg-white/[0.04]'} shadow-[0_18px_40px_rgba(15,23,42,0.22)] overflow-hidden`}>
        <button type="button" onClick={() => setExpandedId(isExpanded ? null : complaint.id)} className="w-full text-left px-6 py-5 hover:bg-white/[0.02] transition-colors">
          <div className="flex flex-col xl:flex-row xl:items-start gap-5 xl:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="text-xs font-mono tracking-wider text-cyan-200/70">{complaint.tracking_id || `#${complaint.id}`}</span>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${theme.badge}`}><span className={`h-2 w-2 rounded-full ${theme.dot}`} />{complaint.status}</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{complaint.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300 line-clamp-2">{complaint.description}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 gap-3 xl:min-w-[360px]">
              <div><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Category</p><p className="mt-2 text-sm text-slate-200">{complaint.category}</p></div>
              <div><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Taluk</p><p className="mt-2 text-sm text-slate-200">{complaint.taluk || 'Unassigned'}</p></div>
              <div><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Date</p><p className="mt-2 text-sm text-slate-200">{new Date(complaint.created_at).toLocaleDateString()}</p></div>
              <div><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Priority</p><p className="mt-2 text-sm uppercase text-slate-200">{complaint.priority}</p></div>
            </div>
          </div>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-white/10">
              <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6 p-6">
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Complaint Details</p>
                    <p className="mt-4 text-sm leading-8 text-slate-300">{complaint.description}</p>
                    <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm">
                      <div><p className="text-slate-500 text-[11px] uppercase tracking-[0.22em]">Location</p><p className="mt-2 text-slate-200">{complaint.address || 'No address available'}</p></div>
                      <div><p className="text-slate-500 text-[11px] uppercase tracking-[0.22em]">District</p><p className="mt-2 text-slate-200">{complaint.district || 'Not tagged'}</p></div>
                    </div>
                  </div>
                  {complaint.image_url && (
                    <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div><p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Evidence</p><p className="text-white font-medium mt-2">Attached image preview</p></div>
                        <button type="button" onClick={() => setSelectedImage({ url: complaint.image_url, title: complaint.title })} className="px-4 py-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 text-sm hover:bg-cyan-400/20 transition-colors">View Image</button>
                      </div>
                      <button type="button" onClick={() => setSelectedImage({ url: complaint.image_url, title: complaint.title })} className="block w-full">
                        <img src={complaint.image_url} alt={complaint.title} className="h-52 w-full object-cover rounded-2xl border border-white/10" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Status Control</p>
                    <p className="mt-2 text-white font-medium">Transition this complaint</p>
                    <div className="mt-5 space-y-4">
                      <select className="w-full bg-[#071521] border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:border-cyan-400 outline-none transition-colors disabled:opacity-50" onChange={(event) => { if (event.target.value) handleStatusUpdate(complaint.id, event.target.value); }} disabled={statusUpdating || transitions.length === 0} value="">
                        <option value="" disabled>{statusUpdating ? 'Updating...' : 'Transition to...'}</option>
                        {transitions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      {(transitions.includes('On Hold') || transitions.includes('Rejected') || transitions.includes('Resolved')) && <textarea rows="4" placeholder="Optional notes for state change..." className="w-full bg-[#071521] border border-white/10 text-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-cyan-400 outline-none transition-colors resize-none" value={actionNotes} onChange={(event) => setActionNotes(event.target.value)} disabled={statusUpdating} />}
                    </div>
                    {transitions.length === 0 && <p className="text-xs text-emerald-300 mt-4 border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 rounded-xl inline-flex">Terminal state reached.</p>}
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Tracking Summary</p>
                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Reporter</span><span className="text-slate-200 text-right">{complaint.name || complaint.user_name || 'Citizen'}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Created</span><span className="text-slate-200 text-right">{formatDateTime(complaint.created_at)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Last update</span><span className="text-slate-200 text-right">{formatDateTime(complaint.updated_at || complaint.created_at)}</span></div>
                      <div className="flex justify-between gap-4"><span className="text-slate-500">Taluk scope</span><span className="text-slate-200 text-right">{complaint.taluk || 'Global'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderDashboardView = () => (
    <div className="space-y-8">
      {renderOverviewCards()}
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Complaints Register</p><h3 className="text-2xl font-semibold text-white mt-2">Priority queue</h3></div>
            <button type="button" onClick={() => setActiveView('complaints')} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10 transition-colors">Open Register</button>
          </div>
          <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
            {filteredComplaints.slice(0, 4).map(renderComplaintCard)}
            {filteredComplaints.length === 0 && <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center text-slate-400">No complaints match the current status and filters.</div>}
          </div>
        </div>
        {renderTimeline()}
      </div>
    </div>
  );

  const renderComplaintsView = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
        <div className="flex flex-col xl:flex-row xl:items-end gap-5 xl:justify-between">
          <div><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Complaint Management</p><h2 className="text-3xl font-semibold text-white mt-2">Search, filter, and manage complaints</h2></div>
          <div className="flex flex-wrap gap-3">{quickViews.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-full text-sm border transition-all ${statusFilter === status ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>{status}</button>)}</div>
        </div>
        <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-2">Search</p><input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search title, category, taluk" className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500" /></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-2">Taluk</p><select value={talukFilter} onChange={(event) => setTalukFilter(event.target.value)} className="select-elegant-admin w-full"><option value="all" className="bg-slate-900">All taluks</option>{complaintTaluks.map((taluk) => <option key={taluk} value={taluk} className="bg-slate-900">{taluk}</option>)}</select></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-2">Date</p><select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="w-full bg-transparent outline-none text-sm text-slate-100"><option value="all" className="bg-slate-900">Any time</option><option value="today" className="bg-slate-900">Last 24 hours</option><option value="week" className="bg-slate-900">Last 7 days</option><option value="month" className="bg-slate-900">Last 30 days</option></select></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 flex items-center justify-between"><div><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Showing</p><p className="mt-2 text-sm text-white">{filteredComplaints.length} complaint{filteredComplaints.length === 1 ? '' : 's'}</p></div><button type="button" onClick={() => { setSearchTerm(''); setTalukFilter('all'); setDateFilter('all'); }} className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10 transition-colors">Reset</button></div>
        </div>
      </div>
      <div className="space-y-4">{filteredComplaints.map(renderComplaintCard)}{filteredComplaints.length === 0 && !loading && <div className="rounded-[28px] border border-dashed border-white/10 px-5 py-16 text-center text-slate-400">No complaints match your current filters.</div>}</div>
    </div>
  );

  const renderMapView = () => (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5"><MapComponentWithNoSSR complaints={filteredComplaints} /></div>
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6"><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Map Intelligence</p><h3 className="text-2xl font-semibold text-white mt-2">Complaint geography</h3><div className="mt-6 space-y-4"><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-slate-400">Visible complaint points</p><p className="mt-2 text-3xl font-black text-white">{filteredComplaints.filter((item) => item.latitude && item.longitude).length}</p></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-slate-400">Taluk coverage in current scope</p><p className="mt-2 text-3xl font-black text-white">{complaintTaluks.length}</p></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-sm text-slate-400">Map note</p><p className="mt-2 text-sm leading-7 text-slate-300">Marker color reflects current status. Use the complaints view for full details and resolution actions.</p></div></div></div>
      </div>
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="grid xl:grid-cols-2 gap-6">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6"><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Status Distribution</p><h3 className="text-2xl font-semibold text-white mt-2">Current complaint mix</h3><div className="mt-8 h-[320px] relative"><Doughnut data={statusData} options={doughnutOptions} /><div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-3xl font-black text-white">{stats.total}</span><span className="text-xs uppercase tracking-[0.24em] text-slate-400">Total</span></div></div></div>
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6"><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Category Analysis</p><h3 className="text-2xl font-semibold text-white mt-2">Volume by complaint type</h3><div className="mt-8 h-[320px]">{filteredComplaints.length > 0 ? <Bar data={categoryData} options={chartOptions} /> : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No complaint data is available for the current filter.</div>}</div></div>
    </div>
  );
  const renderUpdatesView = () => (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
          <div className="mb-6"><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Municipality Updates</p><h3 className="text-2xl font-semibold text-white mt-2">Publish an admin notice</h3><p className="text-sm text-slate-400 mt-2">Permanent notices stay until removed manually. Timed notices disappear automatically after their expiry.</p></div>
          <form onSubmit={handleCreateAnnouncement} className="space-y-5">
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Title</label><input type="text" value={announcementForm.title} onChange={(event) => handleAnnouncementFieldChange('title', event.target.value)} className="input-field" placeholder="Water supply maintenance notice" maxLength={200} /></div>
            <div><label className="block text-sm font-medium text-slate-300 mb-2">Update content</label><textarea value={announcementForm.content} onChange={(event) => handleAnnouncementFieldChange('content', event.target.value)} className="input-field min-h-[160px] resize-y" placeholder="Explain what residents should know, what action is happening, and who is affected." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">District</label>
                <select
                  value={announcementForm.district}
                  onChange={(event) => handleAnnouncementFieldChange('district', event.target.value)}
                  className="select-elegant-admin"
                >
                  <option value="">Select district</option>
                  {districts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Taluk</label>
                <select
                  value={announcementForm.taluk}
                  onChange={(event) => handleAnnouncementFieldChange('taluk', event.target.value)}
                  className="select-elegant-admin"
                  disabled={!announcementForm.district}
                >
                  <option value="">
                    {announcementForm.district ? 'Select taluk' : 'First select a district'}
                  </option>
                  {announcementForm.district &&
                    getTaluksForDistrict(announcementForm.district).map((taluk) => (
                      <option key={taluk} value={taluk}>
                        {taluk}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-4">
              <label className="flex items-center gap-3 text-sm text-slate-200"><input type="checkbox" checked={announcementForm.isPermanent} onChange={(event) => handleAnnouncementFieldChange('isPermanent', event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-dark-bg" />Keep this as a permanent update</label>
              <div><label className="block text-sm font-medium text-slate-300 mb-2">Visible until</label><input type="datetime-local" value={announcementForm.expiresAt} onChange={(event) => handleAnnouncementFieldChange('expiresAt', event.target.value)} className="input-field" disabled={announcementForm.isPermanent} /></div>
            </div>
            <button type="submit" disabled={announcementSubmitting} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold hover:brightness-110 transition-all disabled:opacity-60">{announcementSubmitting ? 'Publishing...' : 'Publish Municipality Update'}</button>
          </form>
        </div>
        <div className="rounded-[30px] border border-white/10 bg-black/10 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10 bg-white/[0.03]"><p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live Feed Control</p><h3 className="text-xl font-semibold text-white mt-2">Manage published updates</h3></div>
          <div className="p-6 space-y-4 max-h-[620px] overflow-y-auto">
            {announcementsLoading ? <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div> : announcements.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-slate-400">No municipality updates have been published yet.</div> : announcements.map((announcement) => <div key={announcement.id} className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5"><div className="flex items-start justify-between gap-3"><div><h4 className="text-white font-semibold text-lg">{announcement.title}</h4><p className="text-xs text-slate-500 mt-1">By {announcement.created_by_name || 'Municipality'} on {formatDateTime(announcement.created_at)}</p></div><span className={`px-3 py-1 rounded-full text-xs border ${announcement.visibility_status === 'Permanent' ? 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20' : announcement.visibility_status === 'Active' ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20' : 'bg-slate-500/10 text-slate-300 border-slate-400/20'}`}>{announcement.visibility_status}</span></div><p className="text-sm text-slate-300 leading-7 mt-4">{announcement.content}</p><div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs text-slate-500">{announcement.is_permanent ? 'Visible until manually removed' : `Expires on ${formatDateTime(announcement.expires_at)}`}</div><button type="button" onClick={() => handleDeleteAnnouncement(announcement.id)} disabled={deletingAnnouncementId === announcement.id} className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-200 border border-rose-400/20 hover:bg-rose-500/20 transition-colors text-sm font-medium disabled:opacity-60">{deletingAnnouncementId === announcement.id ? 'Removing...' : 'Delete Update'}</button></div></div>)}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
        <div className="flex items-center justify-between gap-4 mb-6"><div><p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Municipality Access</p><h3 className="text-2xl font-semibold text-white mt-2">Users and taluk assignments</h3></div><span className="text-sm text-slate-400">{users.length} registered users</span></div>
        {usersLoading ? <div className="flex items-center justify-center py-16"><div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div> : <div className="overflow-x-auto"><table className="w-full text-left border-collapse min-w-[900px]"><thead><tr className="border-b border-white/10"><th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-slate-500">ID</th><th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-slate-500">Name</th><th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-slate-500">Email</th><th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-slate-500">Role</th><th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-slate-500">Taluk / District</th><th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-slate-500">Status</th><th className="px-4 py-4 text-xs uppercase tracking-[0.22em] text-slate-500 text-right">Action</th></tr></thead><tbody className="divide-y divide-white/5">{users.map((entry) => <tr key={entry.id} className="hover:bg-white/[0.03] transition-colors"><td className="px-4 py-4 text-sm text-slate-500 font-mono">#{entry.id}</td><td className="px-4 py-4 text-sm text-white font-medium">{entry.name}</td><td className="px-4 py-4 text-sm text-slate-300">{entry.email}</td><td className="px-4 py-4 text-sm"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${entry.role === 'admin' ? 'bg-indigo-500/18 text-indigo-200 border-indigo-400/20' : 'bg-teal-500/18 text-teal-200 border-teal-400/20'}`}>{entry.role}</span></td><td className="px-4 py-4 text-sm text-slate-300">{entry.taluk && entry.district ? `${entry.taluk} / ${entry.district}` : 'Global'}</td><td className="px-4 py-4 text-sm"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${entry.is_active ? 'bg-emerald-500/18 text-emerald-200 border-emerald-400/20' : 'bg-rose-500/18 text-rose-200 border-rose-400/20'}`}>{entry.is_active ? 'Active' : 'Inactive'}</span></td><td className="px-4 py-4 text-right"><div className="flex justify-end gap-2">{entry.role === 'admin' && isSuperAdmin && entry.id !== user?.id && <button type="button" onClick={() => openAssignModal(entry)} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-200 border border-indigo-400/20 rounded-xl hover:bg-indigo-500/20 transition-all text-xs font-medium">Assign Taluk</button>}{entry.role !== 'admin' && <button type="button" onClick={() => setDeleteTarget(entry)} className="px-3 py-1.5 bg-rose-500/10 text-rose-200 border border-rose-400/20 rounded-xl hover:bg-rose-500/20 transition-all text-xs font-medium">Delete</button>}</div></td></tr>)}</tbody></table></div>}
      </div>

      {/* Additional Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">System Information</p>
          <h3 className="text-2xl font-semibold text-white mt-2">Your administrative account</h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.06em]">Admin Name</p>
              <p className="text-white font-semibold mt-2">{user?.name || 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.06em]">Email Address</p>
              <p className="text-white font-semibold mt-2">{user?.email || 'Loading...'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.06em]">Account Type</p>
              <p className="text-white font-semibold mt-2">{isSuperAdmin ? '🌐 Super Administrator' : '🏛️ Municipal Administrator'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.06em]">Scope</p>
              <p className="text-white font-semibold mt-2">{isSuperAdmin ? 'All Municipalities' : `${user?.taluk || 'Loading'} (${user?.district || 'Loading'})`}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">System Statistics</p>
          <h3 className="text-2xl font-semibold text-white mt-2">At a glance</h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.06em]">Total Users</p>
              <p className="text-3xl font-black text-white mt-2">{users.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.06em]">Total Complaints</p>
              <p className="text-3xl font-black text-white mt-2">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-slate-400 uppercase tracking-[0.06em]">Active Updates</p>
              <p className="text-3xl font-black text-white mt-2">{announcements.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#03101b] text-slate-100 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute top-[-10%] right-[-8%] h-[38vw] w-[38vw] rounded-full bg-cyan-500/8 blur-[130px]" /><div className="absolute bottom-[-12%] left-[-10%] h-[42vw] w-[42vw] rounded-full bg-indigo-500/10 blur-[140px]" /></div>
      <div className="relative z-10 flex min-h-screen">
        <aside className={`hidden lg:flex flex-col border-r border-white/10 bg-[#03131f]/80 backdrop-blur-2xl transition-all duration-300 ${sidebarCollapsed ? 'w-24' : 'w-80'}`}><div className="px-5 py-6 border-b border-white/10 flex items-center justify-between gap-3"><div className="flex items-center gap-3 min-w-0"><div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-black tracking-[0.24em] text-white">CC</div>{!sidebarCollapsed && <div><p className="text-white font-semibold">Municipality Console</p><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Smart civic command center</p></div>}</div><button type="button" onClick={() => setSidebarCollapsed((current) => !current)} className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-colors">{sidebarCollapsed ? '>' : '<'}</button></div><div className="px-4 py-5 space-y-2">{sidebarItems.map((item) => <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${activeView === item.id ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100 shadow-[0_14px_30px_rgba(14,165,233,0.16)]' : 'border-transparent bg-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}><span className={`h-10 w-10 rounded-xl flex items-center justify-center text-xs font-black ${activeView === item.id ? 'bg-cyan-400/12' : 'bg-white/5'}`}>{item.short}</span>{!sidebarCollapsed && <span className="font-medium">{item.label}</span>}</button>)}</div><div className="mt-auto px-4 pb-5"><div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4"><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Active Scope</p><p className="mt-3 text-white font-semibold">{isSuperAdmin ? 'All Municipalities' : `${user?.taluk || 'Taluk'} Desk`}</p><p className="mt-2 text-sm text-slate-400">{isSuperAdmin ? 'Global admin visibility' : `${user?.district || 'District'} routing enabled`}</p></div></div></aside>
        <div className="flex-1 min-w-0">
          <motion.header initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="sticky top-0 z-40 border-b border-white/10 bg-[#03131f]/78 backdrop-blur-2xl"><div className="px-4 sm:px-6 xl:px-8 py-4 flex flex-col lg:flex-row lg:items-center gap-4 lg:justify-between"><div><p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Municipality + complaints system</p><h1 className="text-2xl sm:text-3xl font-black text-white mt-2">{sidebarItems.find((item) => item.id === activeView)?.label || 'Dashboard'}</h1></div><div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end"><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 min-w-[260px]"><p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-1">Search complaints</p><input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Title, category, taluk" className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500" /></div><div className="flex items-center gap-3"><button type="button" onClick={() => setActiveView('settings')} className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs font-black text-slate-200">{announcements.length > 9 ? '9+' : announcements.length || 0}</button><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 min-w-[220px]"><p className="text-xs text-slate-400">Logged in as</p><div className="flex items-center justify-between gap-3 mt-1"><div><p className="text-sm font-semibold text-white">{user?.name}</p><p className="text-xs text-slate-500">{isSuperAdmin ? 'Super Admin' : 'Municipality Admin'}</p></div><button onClick={handleLogout} className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-200 border border-rose-400/20 text-xs font-medium hover:bg-rose-500/20 transition-colors">Logout</button></div></div></div></div></div></motion.header>
          <div className="px-4 sm:px-6 xl:px-8 py-8 space-y-8">{activeView === 'dashboard' && renderDashboardView()}{activeView === 'complaints' && renderComplaintsView()}{activeView === 'map' && renderMapView()}{activeView === 'analytics' && renderAnalyticsView()}{activeView === 'updates' && renderUpdatesView()}{activeView === 'settings' && renderSettingsView()}</div>
        </div>
      </div>
      <AnimatePresence>{selectedImage && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4"><div className="max-w-5xl w-full rounded-[32px] border border-white/10 bg-[#03131f]/92 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)]"><div className="flex items-center justify-between gap-4 mb-4"><div><p className="text-xs uppercase tracking-[0.22em] text-slate-500">Image Preview</p><p className="text-white font-semibold mt-2">{selectedImage.title}</p></div><button onClick={() => setSelectedImage(null)} className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors">X</button></div><img src={selectedImage.url} alt={selectedImage.title} className="w-full max-h-[75vh] object-contain rounded-[24px] border border-white/10 bg-black/20" /></div></motion.div>}</AnimatePresence>
      <AnimatePresence>{assignTarget && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"><motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="rounded-[30px] border border-indigo-400/20 bg-[#03131f]/96 p-8 max-w-lg w-full shadow-[0_0_40px_rgba(79,70,229,0.15)]"><h3 className="text-xl font-bold text-white mb-2">Assign Municipality</h3><p className="text-slate-400 text-sm mb-6">Routing complaints for <span className="text-white font-semibold">{assignTarget.name}</span>.</p><div className="space-y-4"><div><label className="block text-sm font-medium text-slate-300 mb-2">District</label><select value={assignDistrict} onChange={(event) => { setAssignDistrict(event.target.value); setAssignTaluk(''); }} className="select-elegant-admin" disabled={assignLoading}><option value="">Select District</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></div><div><label className="block text-sm font-medium text-slate-300 mb-2">Taluk</label><select value={assignTaluk} onChange={(event) => setAssignTaluk(event.target.value)} className="select-elegant-admin" disabled={assignLoading || !assignDistrict}><option value="">{assignDistrict ? 'Select Taluk' : 'Select District first'}</option>{availableAssignTaluks.map((taluk) => <option key={taluk} value={taluk}>{taluk}</option>)}</select></div></div><div className="flex gap-3 mt-8"><button type="button" onClick={closeAssignModal} disabled={assignLoading} className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-2xl hover:bg-white/10 transition-colors font-medium text-sm disabled:opacity-50">Cancel</button><button type="button" onClick={handleAssignTaluk} disabled={assignLoading || !assignDistrict || !assignTaluk} className="flex-1 py-3 bg-indigo-600/80 border border-indigo-400/30 text-white rounded-2xl hover:bg-indigo-600 transition-colors font-medium text-sm disabled:opacity-50">{assignLoading ? 'Saving...' : 'Save Assignment'}</button></div></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{deleteTarget && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"><motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="rounded-[30px] border border-rose-400/20 bg-[#03131f]/96 p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)]"><h3 className="text-xl font-bold text-white text-center mb-2">Delete User Account</h3><p className="text-slate-400 text-center text-sm mb-1">You are about to permanently delete:</p><p className="text-white font-semibold text-center mb-1">{deleteTarget.name}</p><p className="text-slate-500 text-center text-xs mb-6">{deleteTarget.email}</p><p className="text-rose-200 text-center text-xs mb-8 bg-rose-500/10 border border-rose-400/20 rounded-2xl p-3">This will also permanently delete all their complaints. This action cannot be undone.</p><div className="flex gap-3"><button type="button" onClick={() => setDeleteTarget(null)} disabled={deleteLoading} className="flex-1 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-2xl hover:bg-white/10 transition-colors font-medium text-sm disabled:opacity-50">Cancel</button><button type="button" onClick={handleDeleteUser} disabled={deleteLoading} className="flex-1 py-3 bg-rose-600/80 border border-rose-400/30 text-white rounded-2xl hover:bg-rose-600 transition-colors font-medium text-sm disabled:opacity-50">{deleteLoading ? 'Deleting...' : 'Confirm Delete'}</button></div></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}
