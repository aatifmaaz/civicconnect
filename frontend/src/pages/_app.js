/**
 * _app.js - Next.js App Wrapper
 * Initializes providers, global configuration, and page transitions
 */

import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <motion.div
          key={router.pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="min-h-screen bg-dark-bg"
        >
          <Component {...pageProps} />
        </motion.div>
      </AnimatePresence>
      <ToastContainer 
        position="bottom-right" 
        theme="dark" 
        toastClassName="glass-panel text-white !rounded-xl !border-white/10"
        progressClassName="!bg-primary"
      />
    </AuthProvider>
  );
}
