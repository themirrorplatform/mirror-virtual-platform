import React from 'react';
import Link from 'next/link';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gold/20 bg-black/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-gold">
              🪞 The Mirror
            </Link>

            <div className="flex items-center space-x-6">
              <Link href="/" className="hover:text-gold transition">
                Feed
              </Link>
              <Link href="/reflect" className="hover:text-gold transition">
                Reflect
              </Link>
              <Link href="/me" className="hover:text-gold transition">
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}
