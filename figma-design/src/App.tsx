/**
 * The Mirror - Constitutional Architecture
 * Single-frame instrument OS
 * No onboarding screens. No persistent UI. Summoned instruments only.
 */

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MirrorField } from './components/MirrorField';
import { CommandPalette, InstrumentId } from './components/CommandPalette';
import { DraggableInstrument } from './components/DraggableInstrument';
import { ReceiptSystem } from './components/ReceiptSystem';
import { useMirrorState } from './hooks/useMirrorState';
import { useAppState } from './hooks/useAppState';
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard';
import { getLicensesForLayer, EXPORT_LICENSE } from './utils/mockLicenses';
import { getActiveForks, getForkById } from './utils/mockForks';

// Constitutional instruments
import { EntryInstrument } from './components/instruments/EntryInstrument';
import { SpeechContractInstrument } from './components/instruments/SpeechContractInstrument';
import { LicenseStackInstrument } from './components/instruments/LicenseStackInstrument';
import { ConstitutionStackInstrument } from './components/instruments/ConstitutionStackInstrument';
import { ForkEntryInstrument } from './components/instruments/ForkEntryInstrument';
import { WorldviewLensInstrument } from './components/instruments/WorldviewLensInstrument';
import { ExportInstrument } from './components/instruments/ExportInstrument';
import { ProvenanceInstrument } from './components/instruments/ProvenanceInstrument';
import { RefusalInstrument } from './components/instruments/RefusalInstrument';

// Import screens as instrument content
import { MirrorScreen } from './components/screens/MirrorScreen';
import { ThreadsScreen } from './components/screens/ThreadsScreen';
import { WorldScreen } from './components/screens/WorldScreen';
import { ArchiveScreen } from './components/screens/ArchiveScreen';
import { SelfScreen } from './components/screens/SelfScreen';
import { IdentityGraphScreen } from './components/screens/IdentityGraphScreen';
import { CrisisScreen } from './components/screens/CrisisScreen';
import { ConstitutionScreen } from './components/screens/ConstitutionScreen';
import { ForksScreen } from './components/screens/ForksScreen';
import { ExportScreen } from './components/screens/ExportScreen';
import { DataPortabilityScreen } from './components/screens/DataPortabilityScreen';
import { ComponentShowcaseScreen } from './components/screens/ComponentShowcaseScreen';

// Backend-integrated screens (NEW!)
import { MirrorScreenIntegrated } from './components/screens/MirrorScreenIntegrated';
import { ThreadsScreenIntegrated } from './components/screens/ThreadsScreenIntegrated';
import { ArchiveScreenIntegrated } from './components/screens/ArchiveScreenIntegrated';
import { WorldScreenIntegrated } from './components/screens/WorldScreenIntegrated';
import { SelfScreenIntegrated } from './components/screens/SelfScreenIntegrated';

// Empty states and sync
import { FirstTimeWelcome } from './components/EmptyStates';
import { SyncStatusBar } from './components/SyncPanel';

// Icons
import { 
  MessageSquare, Sparkles, Link2, Clock, User, Globe,
  FileText, Shield, Archive, AlertCircle, Eye, Download,
  Search, GitFork, BookOpen, Mic, Layers, Ban
} from 'lucide-react';

import './styles/globals.css';

export default function App() {
  // Core state management (constitutional)
  const {
    state,
    receipts,
    switchLayer,
    enterFork,
    exitFork,
    applyWorldview,
    removeWorldview,
    acknowledgeLicense,
    addReceipt,
    dismissReceipt,
    toggleCrisisMode,
    completeEntry,
    setModality,
    toggleParticles,
    setTheme,
  } = useMirrorState();
  
  // UI state (ephemeral)
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeInstruments, setActiveInstruments] = useState<InstrumentId[]>([]);
  
  // Constitutional instrument state
  const [showEntry, setShowEntry] = useState(false);
  const [showSpeechContract, setShowSpeechContract] = useState(false);
  const [showLicenseStack, setShowLicenseStack] = useState(false);
  const [showConstitutionStack, setShowConstitutionStack] = useState(false);
  const [showForkEntry, setShowForkEntry] = useState(false);
  const [showWorldviewLens, setShowWorldviewLens] = useState(false);
  const [showExportInstrument, setShowExportInstrument] = useState(false);
  const [showProvenanceInstrument, setShowProvenanceInstrument] = useState(false);
  const [showRefusalInstrument, setShowRefusalInstrument] = useState(false);
  
  // Pending action after entry/license flow
  const [pendingAction, setPendingAction] = useState<InstrumentId | null>(null);

  // Global keyboard shortcuts
  useGlobalKeyboard({
    openCommandPalette: () => setShowCommandPalette(true),
    openCrisis: () => {
      toggleCrisisMode(true);
      if (!activeInstruments.includes('crisis')) {
        setActiveInstruments(['crisis']);
      }
    },
    closeAllInstruments: () => {
      setActiveInstruments([]);
      toggleCrisisMode(false);
    },
    closePalette: showCommandPalette ? () => setShowCommandPalette(false) : undefined,
  });

  const handleSelectInstrument = (id: InstrumentId) => {
    console.log('Selecting instrument:', id);
    
    // Check if action requires entry completion (first boundary)
    const requiresEntry = ['world', 'export', 'fork', 'layer', 'governance'];
    
    if (!state.hasSeenEntry && requiresEntry.includes(id)) {
      setPendingAction(id);
      setShowEntry(true);
      setShowCommandPalette(false);
      return;
    }

    // Handle constitutional instruments differently
    const constitutionalInstruments: Record<string, () => void> = {
      'speech_contract': () => setShowSpeechContract(true),
      'license_stack': () => setShowLicenseStack(true),
      'constitution_stack': () => setShowConstitutionStack(true),
      'fork_entry': () => setShowForkEntry(true),
      'worldview_lens': () => setShowWorldviewLens(true),
      'export_instrument': () => setShowExportInstrument(true),
      'provenance': () => setShowProvenanceInstrument(true),
      'refusal': () => setShowRefusalInstrument(true),
    };

    if (constitutionalInstruments[id]) {
      constitutionalInstruments[id]();
      setShowCommandPalette(false);
      return;
    }

    // Standard instrument summoning
    if (!activeInstruments.includes(id)) {
      // Builder layer allows up to 4 instruments
      const maxInstruments = state.layer === 'builder' ? 4 : 2;
      
      if (activeInstruments.length >= maxInstruments) {
        addReceipt({
          type: 'refusal',
          title: `Max instruments reached (${maxInstruments})`,
          details: {
            layer: state.layer,
            maxInstruments,
          },
        });
        return;
      }

      console.log('Adding instrument to active:', id);
      setActiveInstruments([...activeInstruments, id]);
    }

    if (id === 'crisis') {
      toggleCrisisMode(true);
    }

    setShowCommandPalette(false);
  };

  const handleCloseInstrument = (id: InstrumentId) => {
    setActiveInstruments(activeInstruments.filter(i => i !== id));
    
    if (id === 'crisis') {
      toggleCrisisMode(false);
    }
  };

  const handleEntryComplete = (config: {
    layer: 'sovereign' | 'commons' | 'builder';
    acknowledgedLicenses: string[];
    acknowledgedConstitutions: string[];
  }) => {
    // Update state
    completeEntry(config.layer);
    
    // Acknowledge licenses
    config.acknowledgedLicenses.forEach(license => {
      acknowledgeLicense(license);
    });
    
    // Create receipt
    addReceipt({
      type: 'layer_switch',
      title: `Layer: ${config.layer}`,
      details: {
        layer: config.layer,
        licenses: config.acknowledgedLicenses,
        constitutions: config.acknowledgedConstitutions,
      },
    });

    setShowEntry(false);

    // Execute pending action if any
    if (pendingAction) {
      handleSelectInstrument(pendingAction);
      setPendingAction(null);
    }
  };

  const handleLayerSwitch = (newLayer: 'sovereign' | 'commons' | 'builder') => {
    const oldLayer = state.layer;
    
    // Show speech contract to disclose what changes
    setShowSpeechContract(true);
    
    // After disclosure, update layer
    switchLayer(newLayer);
  };

  const getInstrumentIcon = (id: InstrumentId): React.ReactNode => {
    const icons: Record<InstrumentId, React.ReactNode> = {
      reflection: <MessageSquare size={20} />,
      mirrorback: <Sparkles size={20} />,
      threads: <Link2 size={20} />,
      time: <Clock size={20} />,
      identity: <User size={20} />,
      world: <Globe size={20} />,
      constitution: <FileText size={20} />,
      crisis: <AlertCircle size={20} />,
      voice: <MessageSquare size={20} />,
      document: <FileText size={20} />,
      video: <MessageSquare size={20} />,
      consent: <Shield size={20} />,
      vault: <Archive size={20} />,
      fork: <GitFork size={20} />,
      amendment: <FileText size={20} />,
      layer: <Shield size={20} />,
      worldview: <Eye size={20} />,
      export: <Download size={20} />,
      memory: <Search size={20} />,
      governance: <Globe size={20} />,
      showcase: <BookOpen size={20} />,
    };
    return icons[id] || <FileText size={20} />;
  };

  const renderInstrument = (id: InstrumentId) => {
    console.log('Rendering instrument:', id);
    
    const instrumentMap: Record<InstrumentId, {
      title: string;
      content: React.ReactNode;
      category?: 'input' | 'reflection' | 'time' | 'identity' | 'commons' | 'sovereignty' | 'builder';
    }> = {
      reflection: {
        title: 'Mirror',
        content: <MirrorScreenIntegrated />,
        category: 'input',
      },
      voice: {
        title: 'Voice',
        content: <MirrorScreen />,
        category: 'input',
      },
      video: {
        title: 'Video',
        content: <MirrorScreen />,
        category: 'input',
      },
      document: {
        title: 'Document',
        content: <MirrorScreen />,
        category: 'input',
      },
      mirrorback: {
        title: 'Mirrorback',
        content: <div className="p-8">Mirrorback content</div>,
        category: 'reflection',
      },
      threads: {
        title: 'Threads',
        content: <ThreadsScreenIntegrated />,
        category: 'time',
      },
      time: {
        title: 'Archive',
        content: <ArchiveScreenIntegrated />,
        category: 'time',
      },
      memory: {
        title: 'Memory',
        content: <ArchiveScreenIntegrated />,
        category: 'time',
      },
      identity: {
        title: 'Identity',
        content: <SelfScreenIntegrated />,
        category: 'identity',
      },
      worldview: {
        title: 'Identity Graph',
        content: <IdentityGraphScreen />,
        category: 'identity',
      },
      world: {
        title: 'World',
        content: <WorldScreenIntegrated />,
        category: 'commons',
      },
      governance: {
        title: 'Governance',
        content: <div className="p-8">Governance content</div>,
        category: 'commons',
      },
      crisis: {
        title: 'Crisis Support',
        content: <CrisisScreen />,
        category: 'sovereignty',
      },
      constitution: {
        title: 'Constitution',
        content: <ConstitutionScreen />,
        category: 'sovereignty',
      },
      fork: {
        title: 'Forks',
        content: <ForksScreen 
          onEnterFork={(forkId) => {
            enterFork(forkId);
            addReceipt({
              type: 'fork_entry',
              title: `Entered fork: ${forkId}`,
              details: { forkId },
            });
          }}
          onExitFork={() => {
            exitFork();
            addReceipt({
              type: 'fork_exit',
              title: 'Exited fork',
              details: {},
            });
          }}
          currentFork={state.fork}
        />,
        category: 'builder',
      },
      amendment: {
        title: 'Fork Browser',
        content: <div className="p-8">Fork browser</div>,
        category: 'builder',
      },
      layer: {
        title: 'Layer',
        content: (
          <div className="p-8">
            <h3 className="mb-4">Switch Layer</h3>
            <div className="space-y-3">
              {(['sovereign', 'commons', 'builder'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => handleLayerSwitch(l)}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all capitalize
                    ${state.layer === l
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                    }
                  `}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        ),
        category: 'builder',
      },
      consent: {
        title: 'Consent',
        content: <div className="p-8">Consent controls</div>,
        category: 'sovereignty',
      },
      vault: {
        title: 'Data Vault',
        content: <DataPortabilityScreen />,
        category: 'sovereignty',
      },
      export: {
        title: 'Export',
        content: <ExportScreen />,
        category: 'sovereignty',
      },
      showcase: {
        title: 'Component Showcase',
        content: <ComponentShowcaseScreen />,
        category: 'builder',
      },
    };

    const config = instrumentMap[id];
    if (!config) return null;

    return (
      <DraggableInstrument
        key={id}
        id={id}
        title={config.title}
        icon={getInstrumentIcon(id)}
        onClose={() => handleCloseInstrument(id)}
        category={config.category}
      >
        {config.content}
      </DraggableInstrument>
    );
  };

  return (
    <ErrorBoundary>
      <MirrorField 
        layer={state.layer} 
        crisisMode={state.crisisMode}
        hasActiveInstruments={activeInstruments.length > 0 || showEntry || showCommandPalette}
      >
        {/* Sync Status Bar */}
        <SyncStatusBar />

        {/* Entry instrument (first boundary moment) */}
        <AnimatePresence>
          {showEntry && (
            <EntryInstrument
              onComplete={handleEntryComplete}
              onDismiss={() => {
                setShowEntry(false);
                setPendingAction(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Constitutional instruments */}
        <AnimatePresence>
          {showSpeechContract && (
            <SpeechContractInstrument
              onClose={() => setShowSpeechContract(false)}
            />
          )}
          
          {showLicenseStack && (
            <LicenseStackInstrument
              licenses={getLicensesForLayer(state.layer)}
              onAcknowledge={(licenseIds) => {
                licenseIds.forEach(id => acknowledgeLicense(id));
                setShowLicenseStack(false);
              }}
              onReturn={() => setShowLicenseStack(false)}
            />
          )}
          
          {showConstitutionStack && (
            <ConstitutionStackInstrument
              onClose={() => setShowConstitutionStack(false)}
            />
          )}
          
          {/* Fork Entry - TODO: Wire through ForksScreen */}
          {/* {showForkEntry && (
            <ForkEntryInstrument
              fork={getForkById(state.fork || 'stoic-mirror')}
              onEnter={(forkId) => {
                enterFork(forkId);
                setShowForkEntry(false);
              }}
              onReturn={() => setShowForkEntry(false)}
            />
          )} */}
          
          {showWorldviewLens && (
            <WorldviewLensInstrument
              onClose={() => setShowWorldviewLens(false)}
              onApply={(worldviewId) => {
                applyWorldview(worldviewId);
              }}
              onRemove={(worldviewId) => {
                removeWorldview(worldviewId);
              }}
              activeWorldviews={state.worldviews}
            />
          )}
          
          {showExportInstrument && (
            <ExportInstrument
              onClose={() => setShowExportInstrument(false)}
              onExportComplete={(receipt) => {
                addReceipt({
                  type: 'export',
                  title: 'Export complete',
                  details: receipt,
                });
                setShowExportInstrument(false);
              }}
            />
          )}
          
          {showProvenanceInstrument && (
            <ProvenanceInstrument
              onClose={() => setShowProvenanceInstrument(false)}
            />
          )}
          
          {showRefusalInstrument && (
            <RefusalInstrument
              onClose={() => setShowRefusalInstrument(false)}
              invariantClass="epistemic"
              requestedAction="advice"
            />
          )}
        </AnimatePresence>

        {/* Command palette */}
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onSelectInstrument={handleSelectInstrument}
          commonsEnabled={state.layer === 'commons'}
          activeInstruments={activeInstruments}
        />

        {/* Active instruments */}
        <AnimatePresence>
          {activeInstruments.map(id => renderInstrument(id))}
        </AnimatePresence>

        {/* Receipt system (replaces toasts) */}
        <ReceiptSystem
          receipts={receipts}
          onDismiss={dismissReceipt}
        />

        {/* No persistent hints or instructions */}
        {/* The field remains silent unless invoked */}
      </MirrorField>
    </ErrorBoundary>
  );
}