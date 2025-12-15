import { useState } from 'react';
import { Brain, Users, BarChart3, HardDrive, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface ConsentSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: React.ReactNode;
  details: string[];
  canDisable: boolean;
}

interface ConsentControlsProps {
  settings: ConsentSetting[];
  onToggle: (id: string) => void;
}

export function ConsentControls({
  settings,
  onToggle,
}: ConsentControlsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl mb-3">Consent & Permissions</h3>
        <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
          Every feature requires your explicit consent. You can change these anytime.
        </p>
      </div>

      {/* Settings */}
      <div className="space-y-5">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="rounded-2xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] overflow-hidden shadow-ambient-sm"
          >
            {/* Main toggle */}
            <div className="p-7">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${
                    setting.enabled
                      ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
                      : 'bg-[var(--color-base-raised)] text-[var(--color-text-muted)]'
                  }`}>
                    {setting.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base">{setting.label}</h4>
                      {!setting.canDisable && (
                        <span className="px-3 py-1 rounded-lg text-xs bg-[var(--color-base-raised)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-[1.7]">
                      {setting.description}
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => setting.canDisable && onToggle(setting.id)}
                  disabled={!setting.canDisable}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    setting.enabled
                      ? 'bg-[var(--color-accent-gold)]'
                      : 'bg-[var(--color-base-raised)]'
                  } ${!setting.canDisable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <motion.div
                    animate={{
                      x: setting.enabled ? 28 : 2,
                    }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-1 w-5 h-5 rounded-full bg-white"
                  />
                </button>
              </div>

              {/* Expand details button */}
              {setting.details.length > 0 && (
                <button
                  onClick={() => setExpandedId(expandedId === setting.id ? null : setting.id)}
                  className="mt-4 flex items-center gap-2 text-sm text-[var(--color-accent-gold)] hover:underline"
                >
                  {expandedId === setting.id ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{expandedId === setting.id ? 'Hide' : 'Show'} details</span>
                </button>
              )}
            </div>

            {/* Details (expanded) */}
            {expandedId === setting.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="border-t border-[var(--color-border-subtle)] bg-[var(--color-base-raised)] px-4 py-3"
              >
                <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                  {setting.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          The Mirror is designed to operate locally by default. Features requiring server 
          interaction (like Commons) are opt-in and clearly labeled. You can revoke consent 
          at any time without losing your local data.
        </p>
      </div>
    </div>
  );
}

// Default consent settings structure
export const defaultConsentSettings: ConsentSetting[] = [
  {
    id: 'local-storage',
    label: 'Local Storage',
    description: 'Store reflections on your device for offline access',
    enabled: true,
    canDisable: false,
    icon: <HardDrive size={18} />,
    details: [
      'Reflections are saved to your browser\'s local storage',
      'Data persists across sessions',
      'No data is sent to external servers',
      'You can export and delete at any time',
    ],
  },
  {
    id: 'ai-processing',
    label: 'AI Processing',
    description: 'Enable Mirrorback, pattern detection, and semantic search',
    enabled: true,
    canDisable: true,
    icon: <Brain size={18} />,
    details: [
      'Your reflections are processed by AI to generate Mirrorback responses',
      'Pattern detection analyzes themes across reflections',
      'Semantic search uses embeddings for better results',
      'Processing happens locally when possible, or via encrypted API',
      'Your data is never used to train public AI models',
    ],
  },
  {
    id: 'commons',
    label: 'Commons Participation',
    description: 'Share reflections publicly and engage with others',
    enabled: false,
    canDisable: true,
    icon: <Users size={18} />,
    details: [
      'Shared reflections are visible to other Commons members',
      'You can witness and respond to others\' reflections',
      'You control what gets shared (nothing is automatic)',
      'You can share anonymously',
      'Leaving Commons deletes all your shared content',
    ],
  },
  {
    id: 'analytics',
    label: 'Anonymous Analytics',
    description: 'Help improve The Mirror with usage data',
    enabled: false,
    canDisable: true,
    icon: <BarChart3 size={18} />,
    details: [
      'Only aggregated, anonymous usage patterns are collected',
      'No personal information or reflection content is included',
      'No IP addresses or location tracking',
      'Used solely to improve the platform',
      'You can opt out anytime without penalty',
    ],
  },
];