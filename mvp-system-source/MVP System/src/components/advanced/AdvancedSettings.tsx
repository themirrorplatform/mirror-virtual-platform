/**
 * Advanced Settings - Power user configuration
 * 
 * Features:
 * - Advanced preferences
 * - Experimental features
 * - Developer tools
 * - Data management
 * - Clear controls
 * - Constitutional constraints
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings,
  Zap,
  Shield,
  Database,
  Code,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronDown,
  CheckCircle
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface SettingOption {
  id: string;
  label: string;
  description: string;
  type: 'boolean' | 'select' | 'number' | 'text';
  value: any;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
  experimental?: boolean;
  dangerous?: boolean;
}

interface SettingGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  settings: SettingOption[];
}

interface AdvancedSettingsProps {
  groups: SettingGroup[];
  onSettingChange: (settingId: string, value: any) => void;
  onReset?: () => void;
}

export function AdvancedSettings({ groups, onSettingChange, onReset }: AdvancedSettingsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['general']));
  const [showDangerous, setShowDangerous] = useState(false);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-medium mb-1">Advanced Settings</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Configuration for power users
            </p>
          </div>
          {onReset && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset All
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {groups.map(group => (
            <SettingGroupSection
              key={group.id}
              group={group}
              isExpanded={expandedGroups.has(group.id)}
              onToggle={() => toggleGroup(group.id)}
              onSettingChange={onSettingChange}
              showDangerous={showDangerous}
            />
          ))}
        </div>

        {/* Show Dangerous Settings Toggle */}
        <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
          <button
            onClick={() => setShowDangerous(!showDangerous)}
            className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {showDangerous ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDangerous ? 'Hide' : 'Show'} dangerous settings
          </button>
        </div>
      </Card>
    </div>
  );
}

// Setting Group Section

interface SettingGroupSectionProps {
  group: SettingGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onSettingChange: (settingId: string, value: any) => void;
  showDangerous: boolean;
}

function SettingGroupSection({
  group,
  isExpanded,
  onToggle,
  onSettingChange,
  showDangerous,
}: SettingGroupSectionProps) {
  const Icon = group.icon;
  const visibleSettings = group.settings.filter(s => !s.dangerous || showDangerous);

  if (visibleSettings.length === 0) return null;

  return (
    <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-[var(--color-accent-blue)]" />
          <span className="font-medium">{group.name}</span>
          {group.settings.some(s => s.experimental) && (
            <Badge variant="default" className="text-xs">Experimental</Badge>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4 border-t border-[var(--color-border-subtle)]">
              {visibleSettings.map(setting => (
                <SettingControl
                  key={setting.id}
                  setting={setting}
                  onChange={(value) => onSettingChange(setting.id, value)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Setting Control

interface SettingControlProps {
  setting: SettingOption;
  onChange: (value: any) => void;
}

function SettingControl({ setting, onChange }: SettingControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <label className="text-sm font-medium">{setting.label}</label>
            {setting.experimental && (
              <Badge variant="default" className="text-xs">Experimental</Badge>
            )}
            {setting.dangerous && (
              <Badge variant="error" className="text-xs">
                <AlertTriangle size={10} />
                Dangerous
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">{setting.description}</p>
        </div>

        {setting.type === 'boolean' && (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={setting.value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </label>
        )}
      </div>

      {setting.type === 'select' && setting.options && (
        <select
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
        >
          {setting.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {setting.type === 'number' && (
        <input
          type="number"
          value={setting.value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={setting.min}
          max={setting.max}
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
        />
      )}

      {setting.type === 'text' && (
        <input
          type="text"
          value={setting.value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-border-subtle)]"
        />
      )}

      {setting.dangerous && (
        <div className="p-2 rounded bg-[var(--color-border-error)]/10 border-l-2 border-[var(--color-border-error)]">
          <p className="text-xs text-[var(--color-border-error)]">
            Warning: Changing this setting may affect system behavior
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Experimental Features Panel
 */
interface ExperimentalFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  status: 'alpha' | 'beta' | 'stable';
}

interface ExperimentalFeaturesProps {
  features: ExperimentalFeature[];
  onToggle: (featureId: string) => void;
}

export function ExperimentalFeatures({ features, onToggle }: ExperimentalFeaturesProps) {
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-[var(--color-accent-yellow)]" />
          <h3 className="font-medium">Experimental Features</h3>
        </div>

        <div className="p-3 rounded-lg bg-[var(--color-accent-yellow)]/10 border-l-4 border-[var(--color-accent-yellow)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            These features are under development. They may change or break.
          </p>
        </div>

        <div className="space-y-2">
          {features.map(feature => (
            <div
              key={feature.id}
              className="flex items-start justify-between gap-4 p-3 rounded-lg bg-[var(--color-surface-hover)]"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium">{feature.name}</h4>
                  <Badge 
                    variant={
                      feature.status === 'stable' ? 'success' :
                      feature.status === 'beta' ? 'default' : 'error'
                    }
                    className="text-xs"
                  >
                    {feature.status}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{feature.description}</p>
              </div>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={feature.enabled}
                  onChange={() => onToggle(feature.id)}
                  className="w-4 h-4 rounded"
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/**
 * Developer Tools
 */
export function DeveloperTools() {
  const [showDevTools, setShowDevTools] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const clearStorage = () => {
    if (confirm('Clear all local storage? This cannot be undone.')) {
      localStorage.clear();
      setLogs([...logs, 'Local storage cleared']);
    }
  };

  const exportState = () => {
    const state = {
      localStorage: { ...localStorage },
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'state-export.json';
    a.click();
    URL.revokeObjectURL(url);
    setLogs([...logs, 'State exported']);
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Code size={20} className="text-[var(--color-accent-purple)]" />
          <h3 className="font-medium">Developer Tools</h3>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowDevTools(!showDevTools)}>
            {showDevTools ? 'Hide' : 'Show'} Tools
          </Button>
        </div>

        {showDevTools && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" onClick={clearStorage}>
                Clear Storage
              </Button>
              <Button variant="ghost" size="sm" onClick={exportState}>
                Export State
              </Button>
            </div>

            {logs.length > 0 && (
              <div className="p-3 rounded-lg bg-[var(--color-surface-card)] font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="text-[var(--color-text-muted)]">
                    [{new Date().toLocaleTimeString()}] {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Data Management
 */
interface DataManagementProps {
  storageUsed: number;
  storageLimit: number;
  onClearCache: () => void;
  onOptimize: () => void;
}

export function DataManagement({
  storageUsed,
  storageLimit,
  onClearCache,
  onOptimize,
}: DataManagementProps) {
  const percentage = (storageUsed / storageLimit) * 100;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-[var(--color-accent-blue)]" />
          <h3 className="font-medium">Data Management</h3>
        </div>

        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Storage Used</span>
            <span className="text-[var(--color-text-muted)]">
              {formatBytes(storageUsed)} / {formatBytes(storageLimit)}
            </span>
          </div>
          <div className="h-2 bg-[var(--color-surface-hover)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                percentage > 90
                  ? 'bg-[var(--color-border-error)]'
                  : percentage > 70
                  ? 'bg-[var(--color-accent-yellow)]'
                  : 'bg-[var(--color-accent-blue)]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClearCache}>
            Clear Cache
          </Button>
          <Button variant="ghost" size="sm" onClick={onOptimize}>
            Optimize Storage
          </Button>
        </div>

        {percentage > 90 && (
          <div className="p-3 rounded-lg bg-[var(--color-border-error)]/10 border-l-4 border-[var(--color-border-error)]">
            <p className="text-sm text-[var(--color-border-error)]">
              Storage is nearly full. Consider exporting and cleaning up old data.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Default Setting Groups
 */
export const defaultSettingGroups: SettingGroup[] = [
  {
    id: 'general',
    name: 'General',
    icon: Settings,
    settings: [
      {
        id: 'auto-save',
        label: 'Auto-save',
        description: 'Automatically save reflections as you write',
        type: 'boolean',
        value: true,
      },
      {
        id: 'save-interval',
        label: 'Save interval',
        description: 'How often to auto-save (seconds)',
        type: 'number',
        value: 30,
        min: 10,
        max: 300,
      },
    ],
  },
  {
    id: 'privacy',
    name: 'Privacy & Security',
    icon: Shield,
    settings: [
      {
        id: 'local-only',
        label: 'Local-only mode',
        description: 'Never sync data to any server',
        type: 'boolean',
        value: false,
      },
      {
        id: 'encryption',
        label: 'Local encryption',
        description: 'Encrypt data before storing locally',
        type: 'boolean',
        value: false,
        experimental: true,
      },
    ],
  },
  {
    id: 'developer',
    name: 'Developer',
    icon: Code,
    settings: [
      {
        id: 'debug-mode',
        label: 'Debug mode',
        description: 'Show detailed error messages and logs',
        type: 'boolean',
        value: false,
      },
      {
        id: 'reset-all',
        label: 'Reset all data',
        description: 'Delete all reflections and settings',
        type: 'boolean',
        value: false,
        dangerous: true,
      },
    ],
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export type { SettingOption, SettingGroup, AdvancedSettingsProps, ExperimentalFeature };
