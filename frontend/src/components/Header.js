/**
 * Header Component
 */

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="glass-header sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent cursor-pointer">
            CivicHub
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          {user ? (
            <>
              {user.role === 'citizen' && (
                <>
                  <Link href="/dashboard">
                    <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Dashboard</span>
                  </Link>
                  <Link href="/complaint/submit">
                    <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Submit Complaint</span>
                  </Link>
                </>
              )}
              
              {user.role === 'admin' && (
                <>
                  <Link href="/admin/dashboard">
                    <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Admin Dashboard</span>
                  </Link>
                  <Link href="/admin/complaints">
                    <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">All Complaints</span>
                  </Link>
                </>
              )}

              <Link href="/notifications">
                <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Notifications</span>
              </Link>

              <button
                onClick={logout}
                className="btn-primary text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="text-gray-300 hover:text-white transition-colors cursor-pointer">Login</span>
              </Link>
              <Link href="/register">
                <span className="btn-primary text-sm">Register</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-gray-300 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-dark-bg/95 backdrop-blur-xl py-4 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          {user ? (
            <>
              {user.role === 'citizen' && (
                <>
                  <Link href="/dashboard">
                    <span className="block py-2 text-gray-300 hover:text-white transition-colors">Dashboard</span>
                  </Link>
                  <Link href="/complaint/submit">
                    <span className="block py-2 text-gray-300 hover:text-white transition-colors">Submit Complaint</span>
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link href="/admin/dashboard">
                    <span className="block py-2 text-gray-300 hover:text-white transition-colors">Admin Dashboard</span>
                  </Link>
                  <Link href="/admin/complaints">
                    <span className="block py-2 text-gray-300 hover:text-white transition-colors">All Complaints</span>
                  </Link>
                </>
              )}
              <Link href="/notifications">
                <span className="block py-2 text-gray-300 hover:text-white transition-colors">Notifications</span>
              </Link>
              <button onClick={logout} className="block w-full text-left py-2 text-danger hover:text-red-400 transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <span className="block py-2 text-gray-300 hover:text-white transition-colors">Login</span>
              </Link>
              <Link href="/register">
                <span className="block py-2 font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Register</span>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
