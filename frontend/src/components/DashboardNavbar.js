import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardNavbar({ user, onLogout }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-header sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] group-hover:scale-110 transition-transform">⚑</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Civic Connect
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex flex-col text-right mr-2">
            <span className="text-sm text-gray-300">Welcome back,</span>
            <span className="text-sm font-semibold text-white">{user?.name}</span>
          </div>
          <Link href="/profile">
            <button className="btn-primary text-sm">
              👤 Profile
            </button>
          </Link>
          <button onClick={onLogout} className="btn-danger text-sm">
            Logout
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
