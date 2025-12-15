import { useState, useEffect } from 'react';
import { Settings, User, Shield, GitBranch, Network } from 'lucide-react';
import { IdentityAxes } from '../IdentityAxes';
import { DataSovereigntyPanel } from '../DataSovereigntyPanel';
import { ConsentControls, defaultConsentSettings } from '../ConsentControls';
import { ForksAndSandboxes } from '../ForksAndSandboxes';
import { storage } from '../../utils/storage';

type ViewMode = 'identity' | 'data' | 'consent' | 'forks';

interface IdentityAxis {
  id: string;
  label: string;
  value: string;
}

interface DataInfo {
  totalReflections: number;
  storageUsed: string;
  firstReflection: string;
  lastBackup: string;
}

interface Fork {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  amendments: any[];
  isActive: boolean;
}

interface SelfScreenProps {
  onNavigateToGraph?: () => void;
  onThemeChange?: (theme: 'light' | 'dark' | 'auto') => void;
  onToggleParticles?: () => void;
}

export function SelfScreen({ onNavigateToGraph, onThemeChange, onToggleParticles }: SelfScreenProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('identity');
  
  // Identity axes state
  const [identityAxes, setIdentityAxes] = useState<IdentityAxis[]>([
    { id: '1', label: 'Current focus', value: 'Learning to rest without guilt' },
    { id: '2', label: 'Energy pattern', value: 'Morning clarity, afternoon resistance' },
    { id: '3', label: 'Relationship to money', value: 'Anxious / Curious / Evolving' },
  ]);

  // Consent settings state
  const [consentSettings, setConsentSettings] = useState(defaultConsentSettings);

  // Forks state
  const [forks, setForks] = useState<Fork[]>([]);

  // Data info from storage
  const [dataInfo, setDataInfo] = useState<DataInfo>({
    totalReflections: 0,
    storageUsed: '0 KB',
    firstReflection: 'Never',
    lastBackup: 'Never',
  });

  // Load real data on mount
  useEffect(() => {
    loadDataInfo();
  }, []);

  const loadDataInfo = () => {
    const reflections = storage.getReflections();
    const storageInfo = storage.getStorageInfo();
    
    // Calculate storage size
    const sizeKB = Math.round(storageInfo.used / 1024);
    const sizeMB = sizeKB > 1024 ? (sizeKB / 1024).toFixed(2) : null;
    
    // Find first and last reflections
    const sorted = [...reflections].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    setDataInfo({
      totalReflections: reflections.length,
      storageUsed: sizeMB ? `${sizeMB} MB` : `${sizeKB} KB`,
      firstReflection: sorted[0] ? new Date(sorted[0].timestamp).toLocaleDateString() : 'No reflections yet',
      lastBackup: 'Not implemented yet',
    });
  };

  // Identity handlers
  const handleAddAxis = (label: string, value: string) => {
    const newAxis: IdentityAxis = {
      id: Date.now().toString(),
      label,
      value,
    };
    setIdentityAxes([...identityAxes, newAxis]);
  };

  const handleUpdateAxis = (id: string, label: string, value: string) => {
    setIdentityAxes(identityAxes.map(axis =>
      axis.id === id ? { ...axis, label, value } : axis
    ));
  };

  const handleDeleteAxis = (id: string) => {
    setIdentityAxes(identityAxes.filter(axis => axis.id !== id));
  };

  // Consent handlers
  const handleToggleConsent = (id: string) => {
    setConsentSettings(consentSettings.map(setting =>
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  // Data sovereignty handlers
  const handleExportAll = () => {
    console.log('Exporting all data...');
    // Create mock export
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      },
      reflections: identityAxes,
      settings: consentSettings,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mirror-full-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAll = () => {
    console.log('Deleting all data...');
    // In production, this would trigger a full data deletion
    alert('All data would be deleted (demo only)');
  };

  const handleViewData = () => {
    console.log('Viewing raw data...');
    // In production, this would show a data viewer modal
  };

  // Fork handlers
  const handleCreateFork = (name: string, description: string) => {
    const newFork: Fork = {
      id: `f${Date.now()}`,
      name,
      description,
      createdAt: 'Just now',
      amendments: [],
      isActive: false,
    };
    setForks([...forks, newFork]);
  };

  const handleActivateFork = (forkId: string) => {
    setForks(forks.map(fork => ({
      ...fork,
      isActive: fork.id === forkId,
    })));
  };

  const handleDeleteFork = (forkId: string) => {
    setForks(forks.filter(fork => fork.id !== forkId));
  };

  const handleMergeFork = (forkId: string) => {
    console.log('Merging fork:', forkId);
    // In production, this would merge the fork's amendments to main
    alert('Fork merged to main (demo only)');
  };

  const handleViewFork = (forkId: string) => {
    console.log('Viewing fork:', forkId);
    // In production, this would show fork details
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Self</h1>
        <p className="text-[var(--color-text-secondary)]">
          Identity defined by you. Data controlled by you.
        </p>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2 mb-8 border-b border-[var(--color-border-subtle)]">
        <button
          onClick={() => setViewMode('identity')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'identity'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <User size={16} />
          <span>Identity</span>
        </button>

        <button
          onClick={() => setViewMode('data')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'data'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Settings size={16} />
          <span>Data</span>
        </button>

        <button
          onClick={() => setViewMode('consent')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'consent'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <Shield size={16} />
          <span>Consent</span>
        </button>

        <button
          onClick={() => setViewMode('forks')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            viewMode === 'forks'
              ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          <GitBranch size={16} />
          <span>Forks</span>
        </button>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'identity' && (
        <div className="space-y-6">
          {/* Identity Graph CTA */}
          {onNavigateToGraph && (
            <div className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Network size={20} className="text-[var(--color-accent-gold)]" />
                    <h3 className="text-sm">Identity Graph</h3>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Visualize the relationships, tensions, and patterns across your identity nodes. 
                    Observe how different parts of you connect and contradict.
                  </p>
                  <button
                    onClick={onNavigateToGraph}
                    className="px-4 py-2 rounded-lg bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/30 transition-colors text-sm"
                  >
                    Open Graph View
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Identity Axes */}
          <IdentityAxes
            axes={identityAxes}
            onAddAxis={handleAddAxis}
            onUpdateAxis={handleUpdateAxis}
            onDeleteAxis={handleDeleteAxis}
          />
        </div>
      )}

      {viewMode === 'data' && (
        <div className="space-y-6">
          <DataSovereigntyPanel
            stats={dataInfo}
            onExportAll={handleExportAll}
            onDeleteAll={handleDeleteAll}
            onViewData={handleViewData}
          />
          
          {/* Preferences */}
          {(onThemeChange || onToggleParticles) && (
            <div className="p-6 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
              <h3 className="text-sm mb-4">Preferences</h3>
              
              <div className="space-y-4">
                {onThemeChange && (
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                      Theme
                    </label>
                    <div className="flex gap-2">
                      {(['auto', 'light', 'dark'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => onThemeChange(theme)}
                          className="px-4 py-2 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-colors text-sm capitalize"
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {onToggleParticles && (
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                      Ambient Particles
                    </label>
                    <button
                      onClick={onToggleParticles}
                      className="px-4 py-2 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-colors text-sm"
                    >
                      Toggle Particles
                    </button>
                    <p className="text-xs text-[var(--color-text-muted)] mt-2">
                      Max 12 particles (constitutional limit)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'consent' && (
        <ConsentControls
          settings={consentSettings}
          onToggle={handleToggleConsent}
        />
      )}

      {viewMode === 'forks' && (
        <ForksAndSandboxes
          forks={forks}
          onCreateFork={handleCreateFork}
          onActivateFork={handleActivateFork}
          onDeleteFork={handleDeleteFork}
          onMergeFork={handleMergeFork}
          onViewFork={handleViewFork}
        />
      )}
    </div>
  );
}