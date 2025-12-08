import React, { useState, useEffect } from 'react';
import { LoginScreen } from './LoginScreen';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileSidebar } from './MobileSidebar';
import { ReflectScreen } from './ReflectScreen';
import { ThreadView } from './ThreadView';
import { ProfileView } from './ProfileView';
import { IdentityGraph } from './IdentityGraph';

type ViewType = 'reflect' | 'graph' | 'thread' | 'profile';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('reflect');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'reflect':
        return <ReflectScreen />;
      case 'graph':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-[#E5E5E5] mb-6">Identity Graph</h2>
            <IdentityGraph />
          </div>
        );
      case 'thread':
        return <ThreadView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <ReflectScreen />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(203, 163, 93, 0.15) 0%, transparent 50%)',
        }}
      />

      {/* Main layout */}
      <div className="relative h-full flex">
        {/* Desktop sidebar */}
        {!isMobile && (
          <Sidebar
            activeView={activeView}
            onViewChange={setActiveView}
            username="You"
          />
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>

      {/* Mobile navigation */}
      {isMobile && (
        <>
          <MobileNav
            activeView={activeView}
            onViewChange={setActiveView}
            onMenuClick={() => setIsMobileSidebarOpen(true)}
          />
          <MobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            username="You"
          />
        </>
      )}
    </div>
  );
}
