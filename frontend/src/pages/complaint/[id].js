/**
 * Complaint Detail Page
 * Premium Dark Mode View
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { complaintAPI } from '../../services/api';
import { formatDatetime, getStatusColor } from '../../utils/helpers';
import { motion } from 'framer-motion';

export default function ComplaintDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchComplaintDetail();
    }
  }, [id]);

  const fetchComplaintDetail = async () => {
    setLoading(true);
    try {
      const response = await complaintAPI.getById(id);
      setComplaint(response.data.complaint);
      
      // Fetch activity history
      try {
        const historyRes = await complaintAPI.getLogs(id);
        setHistory(historyRes.data?.data || response.data?.history || []);
      } catch (err) {
        setHistory(response.data?.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch complaint:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    resolved: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    closed: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
  };

  if (loading) {
    return <Layout title="Complaint Detail"><LoadingSpinner /></Layout>;
  }

  if (!complaint) {
    return (
      <Layout title="Complaint Detail">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass-panel text-center p-12 rounded-2xl">
            <h2 className="text-2xl font-bold text-red-400 text-shadow">Complaint not found</h2>
            <p className="text-gray-500 mt-2">The record you are looking for does not exist.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentStatus = statusMap[complaint.status] || statusMap.pending;

  return (
    <Layout title="Complaint Details">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-8 shadow-2xl mb-8 relative overflow-hidden"
        >
          {/* Subtle Glow tied to status */}
          <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-[100px] pointer-events-none ${currentStatus.bg.replace('/20','')}`} />

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-white/10 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{complaint.title}</h1>
              <p className="text-gray-400 font-mono text-sm tracking-wider">REF ID: {complaint.tracking_id || `#${complaint.id}`}</p>
            </div>
            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border} shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]`}>
               <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              <span className="font-semibold text-sm tracking-wide">{complaint.status.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</h3>
                <p className="text-lg text-gray-200">{complaint.category}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Submitted By</h3>
                <p className="text-lg text-gray-200">{complaint.submitted_by}</p>
                <p className="text-gray-400 text-sm mt-0.5 font-mono">{complaint.phone}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location Details</h3>
                <p className="text-gray-200 font-mono text-sm">
                  {Number(complaint.latitude || 0).toFixed(6)}, {Number(complaint.longitude || 0).toFixed(6)}
                </p>
                {complaint.address && (
                  <p className="text-gray-400 mt-1">{complaint.address}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Timeline</h3>
                <div className="text-sm">
                  <p className="text-gray-400"><span className="text-gray-300">Reported:</span> {formatDatetime(complaint.created_at)}</p>
                  {complaint.resolved_at && (
                    <p className="text-success mt-1"><span className="text-gray-300">Resolved:</span> {formatDatetime(complaint.resolved_at)}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority Level</h3>
                <span className={`inline-block px-3 py-1 rounded border capitalize text-sm font-medium
                  ${complaint.priority === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    complaint.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-gray-500/10 text-gray-300 border-gray-500/20'}`}
                >
                  {complaint.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8 p-6 rounded-xl bg-white/5 border border-white/5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Incident Description</h3>
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{complaint.description}</p>
          </div>

          {/* Image */}
          {complaint.image_url && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Evidence Photo</h3>
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur">
                <img
                  src={complaint.image_url}
                  alt="Complaint Evidence"
                  className="w-full max-h-[500px] object-contain transition-transform hover:scale-[1.02] duration-500"
                />
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          {complaint.resolution_notes && (
            <div className="mb-4 mt-6 p-6 rounded-xl bg-green-500/10 border border-green-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px]"></div>
              <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3 relative z-10">Official Resolution Notes</h3>
              <p className="text-green-100/90 leading-relaxed relative z-10">{complaint.resolution_notes}</p>
            </div>
          )}
        </motion.div>

        {/* Activity History */}
        {history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-xl font-bold text-white mb-8 border-b border-white/10 pb-4">Lifecycle Audit Trail</h2>

            <div className="space-y-0">
              {history.map((activity, index) => (
                <div key={index} className="flex gap-6 relative">
                  {/* Timeline Line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-white/10"></div>
                  )}
                  
                  {/* Timeline Dot */}
                  <div className="relative mt-1">
                    <div className="w-6 h-6 rounded-full bg-dark-bg border-[3px] border-primary flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)] z-10 relative"></div>
                  </div>

                  <div className="pb-8">
                    <p className="font-semibold text-gray-200">{activity.action}</p>
                    {activity.old_status && (
                       <p className="text-gray-400 text-sm mt-1 mb-1 font-medium bg-white/5 inline-block px-3 py-1 rounded-md border border-white/5">
                        <span className="text-gray-500 line-through mr-2">{activity.old_status}</span> 
                        <span className="text-gray-300">→</span> 
                        <span className="text-primary ml-2">{activity.new_status}</span>
                      </p>
                    )}
                    {activity.notes && <p className="text-gray-400 text-sm italic mt-1 pb-1 border-l-2 border-white/5 pl-3">"{activity.notes}"</p>}
                    <p className="text-gray-500 text-xs mt-2 font-mono flex items-center gap-2">
                       🕒 {formatDatetime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="btn-secondary px-8 py-3"
          >
            ← Return to Dashboard
          </button>
        </div>
      </div>
    </Layout>
  );
}
