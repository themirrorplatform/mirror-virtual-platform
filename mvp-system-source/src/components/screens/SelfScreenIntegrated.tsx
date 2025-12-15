/**
 * Self Screen (Backend Integrated)
 * 
 * Identity & sovereignty - settings, axes, data controls
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  Download, 
  Upload,
  Trash2,
  Plus,
  Eye,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { useAppState, useSettings } from '../../hooks/useAppState';
import { Card } from '../Card';
import { Button } from '../Button';
import { Input } from '../Input';
import { EmptyStateView, LoadingState } from '../EmptyStates';

type Tab = 'identity' | 'settings' | 'data' | 'accessibility';

export function SelfScreenIntegrated() {
  const {
    identityAxes,
    createIdentityAxis,
    updateIdentityAxis,
    deleteIdentityAxis,
    exportAllData,
    importData,
    clearAllData,
    isLoading,
  } = useAppState();

  const { settings, updateSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [isCreatingAxis, setIsCreatingAxis] = useState(false);
  const [newAxisName, setNewAxisName] = useState('');
  const [newAxisColor, setNewAxisColor] = useState('#3B82F6');

  const handleCreateAxis = async () => {
    if (!newAxisName.trim()) return;

    try {
      await createIdentityAxis(newAxisName.trim(), newAxisColor);
      setNewAxisName('');
      setNewAxisColor('#3B82F6');
      setIsCreatingAxis(false);
    } catch (error) {
      console.error('Failed to create axis:', error);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportAllData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirror-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      alert('Data imported successfully');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format.');
    }
  };

  const handleClearData = async () => {
    if (!confirm('Delete ALL data? This cannot be undone. Export first if needed.')) {
      return;
    }

    if (!confirm('Are you absolutely sure? This will delete everything.')) {
      return;
    }

    await clearAllData();
  };

  if (isLoading) {
    return <LoadingState message="Loading..." />;
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
        <div className="p-4 space-y-1">
          <TabButton
            icon={User}
            label="Identity Axes"
            active={activeTab === 'identity'}
            onClick={() => setActiveTab('identity')}
          />
          <TabButton
            icon={Settings}
            label="Settings"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
          <TabButton
            icon={Download}
            label="Data Sovereignty"
            active={activeTab === 'data'}
            onClick={() => setActiveTab('data')}
          />
          <TabButton
            icon={Eye}
            label="Accessibility"
            active={activeTab === 'accessibility'}
            onClick={() => setActiveTab('accessibility')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'identity' && (
              <IdentityAxesPanel
                axes={identityAxes}
                isCreatingAxis={isCreatingAxis}
                newAxisName={newAxisName}
                newAxisColor={newAxisColor}
                onCreateAxis={handleCreateAxis}
                onStartCreating={() => setIsCreatingAxis(true)}
                onCancelCreating={() => {
                  setIsCreatingAxis(false);
                  setNewAxisName('');
                }}
                onNameChange={setNewAxisName}
                onColorChange={setNewAxisColor}
                onDeleteAxis={deleteIdentityAxis}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel
                settings={settings}
                onUpdateSettings={updateSettings}
              />
            )}

            {activeTab === 'data' && (
              <DataSovereigntyPanel
                onExport={handleExport}
                onImport={handleImport}
                onClearData={handleClearData}
              />
            )}

            {activeTab === 'accessibility' && (
              <AccessibilityPanel
                settings={settings}
                onUpdateSettings={updateSettings}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Tab Button
function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// Identity Axes Panel
function IdentityAxesPanel({
  axes,
  isCreatingAxis,
  newAxisName,
  newAxisColor,
  onCreateAxis,
  onStartCreating,
  onCancelCreating,
  onNameChange,
  onColorChange,
  onDeleteAxis,
}: any) {
  return (
    <motion.div
      key="identity"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-2">Identity Axes</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Perspectives from which you reflect
          </p>
        </div>
        {!isCreatingAxis && (
          <Button onClick={onStartCreating}>
            <Plus size={16} />
            Add Axis
          </Button>
        )}
      </div>

      {/* Create New Axis */}
      <AnimatePresence>
        {isCreatingAxis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card variant="emphasis">
              <div className="space-y-4">
                <h3 className="font-medium">New Identity Axis</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm block mb-2">Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Parent, Professional, Creative"
                      value={newAxisName}
                      onChange={(e) => onNameChange(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm block mb-2">Color</label>
                    <input
                      type="color"
                      value={newAxisColor}
                      onChange={(e) => onColorChange(e.target.value)}
                      className="w-full h-10 rounded-lg border border-[var(--color-border-subtle)]"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={onCreateAxis} disabled={!newAxisName.trim()}>
                    Create
                  </Button>
                  <Button variant="ghost" onClick={onCancelCreating}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing Axes */}
      {axes.length === 0 ? (
        <EmptyStateView type="identity-axes" />
      ) : (
        <div className="space-y-3">
          {axes.map((axis: any) => (
            <Card key={axis.id} className="hover:border-[var(--color-border-emphasis)] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: axis.color }}
                  />
                  <div>
                    <h4 className="font-medium">{axis.name}</h4>
                    {axis.description && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        {axis.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${axis.name}" axis?`)) {
                      onDeleteAxis(axis.id);
                    }
                  }}
                  className="p-2 text-[var(--color-border-error)] hover:bg-[var(--color-border-error)]/10 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Settings Panel
function SettingsPanel({ settings, onUpdateSettings }: any) {
  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-medium mb-2">Settings</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Configure your experience
        </p>
      </div>

      {/* Theme */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium">Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map(theme => {
              const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
              return (
                <button
                  key={theme}
                  onClick={() => onUpdateSettings({ theme })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors capitalize ${
                    settings.theme === theme
                      ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)]'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-sm">{theme}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card>
        <div className="space-y-4">
          <h3 className="font-medium">Preferences</h3>
          
          <label className="flex items-center justify-between">
            <span className="text-sm">Ambient particles</span>
            <input
              type="checkbox"
              checked={settings.preferences.particlesEnabled}
              onChange={(e) =>
                onUpdateSettings({
                  preferences: {
                    ...settings.preferences,
                    particlesEnabled: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded"
            />
          </label>

          <div>
            <label className="text-sm block mb-2">Default Layer</label>
            <select
              value={settings.preferences.defaultLayer}
              onChange={(e) =>
                onUpdateSettings({
                  preferences: {
                    ...settings.preferences,
                    defaultLayer: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
            >
              <option value="sovereign">Sovereign</option>
              <option value="commons">Commons</option>
              <option value="builder">Builder</option>
            </select>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Data Sovereignty Panel
function DataSovereigntyPanel({ onExport, onImport, onClearData }: any) {
  return (
    <motion.div
      key="data"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-medium mb-2">Data Sovereignty</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Your data belongs to you
        </p>
      </div>

      {/* Export */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Download size={20} className="text-[var(--color-accent-blue)] mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Export All Data</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                Download all your reflections, threads, and settings as JSON
              </p>
              <Button onClick={onExport}>
                <Download size={16} />
                Export
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Import */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Upload size={20} className="text-[var(--color-accent-green)] mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Import Data</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                Restore from a previous export
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".json"
                  onChange={onImport}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent-green)] text-white hover:bg-[var(--color-accent-green)]/90 transition-colors cursor-pointer">
                  <Upload size={16} />
                  Import
                </span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Delete All */}
      <Card className="border-[var(--color-border-error)]">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Trash2 size={20} className="text-[var(--color-border-error)] mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Delete All Data</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                Permanently delete all reflections and settings. Cannot be undone.
              </p>
              <Button variant="ghost" onClick={onClearData}>
                <Trash2 size={16} />
                Delete Everything
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Accessibility Panel
function AccessibilityPanel({ settings, onUpdateSettings }: any) {
  return (
    <motion.div
      key="accessibility"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-medium mb-2">Accessibility</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Customize for better accessibility
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block mb-1">High Contrast</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                Increase contrast for better visibility
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.accessibility.highContrast}
              onChange={(e) =>
                onUpdateSettings({
                  accessibility: {
                    ...settings.accessibility,
                    highContrast: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block mb-1">Large Text</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                Increase base text size
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.accessibility.largeText}
              onChange={(e) =>
                onUpdateSettings({
                  accessibility: {
                    ...settings.accessibility,
                    largeText: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium block mb-1">Reduce Motion</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                Minimize animations and transitions
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.accessibility.reducedMotion}
              onChange={(e) =>
                onUpdateSettings({
                  accessibility: {
                    ...settings.accessibility,
                    reducedMotion: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded"
            />
          </label>
        </div>
      </Card>
    </motion.div>
  );
}
