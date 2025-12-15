import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';
import { RealmRouter, Realm, useRealmNavigation } from './components/RealmRouter';
import { CrisisModal } from './components/CrisisModal';
import { storage } from './utils/storage';

// Import realm screens
import { MirrorScreen } from './components/screens/MirrorScreen';
import { ThreadsScreen } from './components/screens/ThreadsScreen';
import { WorldScreen } from './components/screens/WorldScreen';
import { ArchiveScreen } from './components/screens/ArchiveScreen';
import { SelfScreen } from './components/screens/SelfScreen';

import './styles/globals.css';

export default function App() {
  // Core state
  const [currentRealm, setCurrentRealm] = useState<Realm>('mirror');
  const [settings, setSettings] = useState(storage.getSettings());
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<'sovereign' | 'commons' | 'builder'>('sovereign');

  // Constitutional state
  const [constitutionalState, setConstitutionalState] = useState(storage.getConstitutionalState());

  // Realm navigation
  const { navigateToRealm, canAccessWorld } = useRealmNavigation(
    currentRealm,
    setCurrentRealm,
    settings.commonsEnabled
  );

  // Persist settings changes
  useEffect(() => {
    storage.saveSetting('commonsEnabled', settings.commonsEnabled);
  }, [settings.commonsEnabled]);

  // Handle navigation requests
  const handleNavigate = (view: string) => {
    // Map view strings to realms
    const realmMap: Record<string, Realm> = {
      'mirror': 'mirror',
      'threads': 'threads',
      'world': 'world',
      'archive': 'archive',
      'self': 'self',
    };

    const realm = realmMap[view];
    if (realm) {
      navigateToRealm(realm);
    }
  };

  // Render current realm screen
  const renderRealmScreen = () => {
    switch (currentRealm) {
      case 'mirror':
        return (
          <MirrorScreen
            aiEnabled={true}
            currentLayer={currentLayer}
            activeWorldviews={constitutionalState.worldviews.filter(w => w.isActive).map(w => w.name)}
          />
        );

      case 'threads':
        return <ThreadsScreen />;

      case 'world':
        return <WorldScreen />;

      case 'archive':
        return <ArchiveScreen />;

      case 'self':
        return <SelfScreen />;

      default:
        return <MirrorScreen aiEnabled={true} currentLayer={currentLayer} activeWorldviews={[]} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[var(--color-base)] text-[var(--color-text-primary)] overflow-hidden">
        {/* Sidebar Navigation */}
        <Navigation
          activeView={currentRealm}
          onNavigate={handleNavigate}
          commonsEnabled={settings.commonsEnabled}
          onCrisis={() => setShowCrisisModal(true)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <RealmRouter currentRealm={currentRealm}>
            {renderRealmScreen()}
          </RealmRouter>
        </main>

        {/* Crisis Modal */}
        {showCrisisModal && (
          <CrisisModal
            isOpen={showCrisisModal}
            onClose={() => setShowCrisisModal(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
