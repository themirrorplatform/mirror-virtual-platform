/**
 * Finder Settings - User control over Finder behavior
 * 
 * Controls:
 * - Mode selector (first_mirror, active, manual, random, off)
 * - Bandwidth limit slider (1-10 doors)
 * - Blocked nodes list
 * - Timing preferences
 * - Reset to defaults
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Power, 
  Activity,
  Hand,
  Shuffle,
  Ban,
  Clock,
  RotateCcw,
  Info,
  Trash2,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type FinderMode = 'first_mirror' | 'active' | 'manual' | 'random' | 'off';

interface FinderSettingsData {
  mode: FinderMode;
  bandwidthLimit: number; // 1-10
  blockedNodes: string[];
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string; // HH:MM
  refreshFrequency: number; // minutes
}

interface FinderSettingsProps {
  settings: FinderSettingsData;
  onUpdateSettings: (settings: Partial<FinderSettingsData>) => void;
  onResetDefaults?: () => void;
  onClose?: () => void;
}

const MODES = [
  {
    id: 'first_mirror' as FinderMode,
    name: 'First Mirror',
    icon: <Activity size={20} />,
    description: 'Recommended for first-time users. Gentle, explanatory routing.',
    color: '#3B82F6',
  },
  {
    id: 'active' as FinderMode,
    name: 'Active',
    icon: <Power size={20} />,
    description: 'Constitutional routing based on posture and lenses.',
    color: '#10B981',
  },
  {
    id: 'manual' as FinderMode,
    name: 'Manual',
    icon: <Hand size={20} />,
    description: 'No automatic routing. You request doors explicitly.',
    color: '#F59E0B',
  },
  {
    id: 'random' as FinderMode,
    name: 'Random',
    icon: <Shuffle size={20} />,
    description: 'Ignore TPV, show random doors. For serendipity.',
    color: '#8B5CF6',
  },
  {
    id: 'off' as FinderMode,
    name: 'Off',
    icon: <Ban size={20} />,
    description: 'Finder is completely disabled. No doors shown.',
    color: '#64748B',
  },
];

export function FinderSettings({
  settings,
  onUpdateSettings,
  onResetDefaults,
  onClose,
}: FinderSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose?.();
  };

  const handleReset = () => {
    if (onResetDefaults) {
      onResetDefaults();
      onClose?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Settings size={24} className="text-[var(--color-accent-blue)]" />
                <div>
                  <h2 className="mb-1">Finder Settings</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Control how recommendations are routed
                  </p>
                </div>
              </div>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X size={20} />
                </Button>
              )}
            </div>

            {/* Mode Selector */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Finder Mode</h3>
              <div className="space-y-2">
                {MODES.map((mode) => (
                  <ModeCard
                    key={mode.id}
                    mode={mode}
                    isSelected={localSettings.mode === mode.id}
                    onSelect={() => setLocalSettings({ ...localSettings, mode: mode.id })}
                  />
                ))}
              </div>
            </div>

            {/* Bandwidth Limit */}
            {localSettings.mode !== 'off' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Bandwidth Limit</h3>
                  <Badge variant="primary" size="sm">
                    {localSettings.bandwidthLimit} door{localSettings.bandwidthLimit !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={localSettings.bandwidthLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
                    setLocalSettings({ 
                      ...localSettings, 
                      bandwidthLimit: parseInt(e.target.value) 
                    })
                  }
                  className="w-full h-2 bg-[var(--color-border-subtle)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-blue)]"
                />
                <p className="text-xs text-[var(--color-text-muted)]">
                  How many doors appear at once. Lower = less overwhelm. Higher = more exploration.
                </p>
              </div>
            )}

            {/* Quiet Hours */}
            {localSettings.mode !== 'off' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[var(--color-text-muted)]" />
                    <h3 className="text-sm font-medium">Quiet Hours</h3>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.quietHoursEnabled}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setLocalSettings({
                          ...localSettings,
                          quietHoursEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-[var(--color-border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-blue)]"></div>
                  </label>
                </div>

                {localSettings.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                        Start
                      </label>
                      <input
                        type="time"
                        value={localSettings.quietHoursStart || '22:00'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setLocalSettings({
                            ...localSettings,
                            quietHoursStart: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                        End
                      </label>
                      <input
                        type="time"
                        value={localSettings.quietHoursEnd || '07:00'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                          setLocalSettings({
                            ...localSettings,
                            quietHoursEnd: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-sm"
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-[var(--color-text-muted)]">
                  No door refreshes during quiet hours. Existing doors remain visible.
                </p>
              </div>
            )}

            {/* Blocked Nodes */}
            {localSettings.mode !== 'off' && localSettings.blockedNodes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ban size={16} className="text-[var(--color-text-muted)]" />
                  <h3 className="text-sm font-medium">Blocked Nodes</h3>
                </div>
                <div className="space-y-2">
                  {localSettings.blockedNodes.map((nodeId) => (
                    <div
                      key={nodeId}
                      className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface-hover)]"
                    >
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {nodeId}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            blockedNodes: localSettings.blockedNodes.filter(
                              (id) => id !== nodeId
                            ),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <Card>
              <div className="flex items-start gap-3">
                <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                <div className="text-xs text-[var(--color-text-secondary)]">
                  <p>
                    These settings control <strong>how</strong> doors are selected, not <strong>what</strong> you see. 
                    You can always hide individual doors or turn the Finder off entirely.
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              {onResetDefaults && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <RotateCcw size={16} />
                  Reset to Defaults
                </Button>
              )}
              <div className="flex items-center gap-2 ml-auto">
                {onClose && (
                  <Button variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                <Button variant="primary" onClick={handleSave}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

interface ModeCardProps {
  mode: {
    id: FinderMode;
    name: string;
    icon: React.ReactNode;
    description: string;
    color: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

function ModeCard({ mode, isSelected, onSelect }: ModeCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full p-3 rounded-lg border-2 transition-all text-left"
      style={{
        borderColor: isSelected ? mode.color : 'var(--color-border-subtle)',
        backgroundColor: isSelected
          ? `${mode.color}10`
          : 'var(--color-surface-card)',
      }}
    >
      <div className="flex items-start gap-3">
        <div style={{ color: isSelected ? mode.color : 'var(--color-text-muted)' }}>
          {mode.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-medium"
              style={{ color: isSelected ? mode.color : 'var(--color-text-primary)' }}
            >
              {mode.name}
            </span>
            {isSelected && (
              <Badge variant="primary" size="sm">
                Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {mode.description}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export type { FinderSettingsData };




