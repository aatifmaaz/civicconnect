/**
 * Main Layout Component
 */

import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, title = 'Civic App' }) {
  return (
    <>
      <Head>
        <title>{title} - Smart Civic Communication</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Smart Civic Communication & Issue Management System" />
      </Head>
      
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        {children}
      </main>
      
      <Footer />
    </>
  );
}
