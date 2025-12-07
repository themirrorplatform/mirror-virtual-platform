import React from 'react';
import { Navigation } from './Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fixed Navigation */}
      <Navigation />

      {/* Main Content - Add padding top to account for fixed header */}
      <main className="pt-[80px]">{children}</main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}
