import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SummaryCards({ stats = { total: 0, pending: 0, resolved: 0 } }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"
    >
      <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-primary relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
        <div className="text-4xl font-black text-white mb-1 tracking-tight drop-shadow-md">{stats.total}</div>
        <div className="text-primary-hover font-medium text-sm tracking-wide uppercase">Total Complaints</div>
      </motion.div>

      <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-warning relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-warning/10 rounded-full blur-xl group-hover:bg-warning/20 transition-all" />
        <div className="text-4xl font-black text-white mb-1 tracking-tight drop-shadow-md">{stats.pending}</div>
        <div className="text-warning font-medium text-sm tracking-wide uppercase">Pending</div>
      </motion.div>

      <motion.div whileHover={{ y: -5 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-success relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-24 h-24 bg-success/10 rounded-full blur-xl group-hover:bg-success/20 transition-all" />
        <div className="text-4xl font-black text-white mb-1 tracking-tight drop-shadow-md">{stats.resolved}</div>
        <div className="text-success font-medium text-sm tracking-wide uppercase">Resolved</div>
      </motion.div>

      <Link
        href="/complaint/submit"
        className="group glass-panel rounded-2xl p-6 text-white flex flex-col items-center justify-center hover:border-primary/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-4xl mb-2 font-light group-hover:scale-110 transition-transform">+</span>
          <div className="font-semibold text-sm tracking-wide uppercase">New Complaint</div>
        </div>
      </Link>
    </motion.div>
  );
}
