import { useState } from 'react';
import { Navigation } from './Navigation';
import { Hero } from './Hero';
import { Sidebar } from './Sidebar';
import { DiscussionFeed } from './DiscussionFeed';
import { MirrorXAssistant } from './MirrorXAssistant';
import { ThreadsView } from './ThreadsView';
import { IdentityView } from './IdentityView';
import { SelfView } from './SelfView';

export function MainPlatform() {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [currentView, setCurrentView] = useState('home');

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
      <Navigation 
        onToggleAI={() => setShowAIAssistant(!showAIAssistant)} 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="relative">
        {renderView()}
      </div>

      {showAIAssistant && (
        <MirrorXAssistant onClose={() => setShowAIAssistant(false)} />
      )}
    </div>
  );
}