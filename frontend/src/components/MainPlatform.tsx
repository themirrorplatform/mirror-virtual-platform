import { useState } from 'react';
import { Navigation } from './Navigation';
import { Hero } from './Hero';
import { Sidebar } from './Sidebar';
import { DiscussionFeed } from './DiscussionFeed';
import { MirrorXAssistant } from './MirrorXAssistant';
import { ThreadsView } from './ThreadsView';
import { IdentityView } from './IdentityView';
import { SelfView } from './SelfView';
import { MobileNav } from './MobileNav';
import { MobileSidebar } from './MobileSidebar';

export function MainPlatform() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [tone, setTone] = useState('soft');

  const renderView = () => {
    switch (currentView) {
      case 'threads':
        return <ThreadsView />;
      case 'identity':
        return <IdentityView />;
      case 'self':
        return <SelfView />;
      case 'settings':
        return <SelfView />; // Settings view uses Self components
      default:
        return (
          <>
            <Hero />
            <div className="max-w-[1534px] mx-auto px-[16px] py-[48px]">
              <div className="grid grid-cols-1 lg:grid-cols-[310px_1fr] gap-[48px]">
                <Sidebar />
                <DiscussionFeed />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <Navigation 
          onToggleAI={() => setShowAIAssistant(!showAIAssistant)} 
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav 
          activeView={currentView}
          onViewChange={setCurrentView}
        />
      </div>
      
      <div className="relative">
        {renderView()}
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        tone={tone}
        threads={[]}
        activeThreadId={null}
        onToneChange={setTone}
        onThreadSelect={() => {}}
        onNewThread={() => {}}
      />

      {showAIAssistant && (
        <MirrorXAssistant onClose={() => setShowAIAssistant(false)} />
      )}
    </div>
  );
}