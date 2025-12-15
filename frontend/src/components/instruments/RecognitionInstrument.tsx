/**
 * Recognition Instrument
 * Show recognition status and history
 * Constitutional transparency for trust state
 */

import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, XCircle, Clock, X } from 'lucide-react';

type RecognitionStatus = 'recognized' | 'conditional' | 'suspended' | 'revoked';

interface RecognitionEvent {
  id: string;
  timestamp: Date;
  status: RecognitionStatus;
  reason: string;
  constitutionalBasis?: string;
}

interface RecognitionInstrumentProps {
  currentStatus: RecognitionStatus;
  history: RecognitionEvent[];
  onClose: () => void;
}

export function RecognitionInstrument({
  currentStatus,
  history,
  onClose,
}: RecognitionInstrumentProps) {
  const statusConfig = {
    recognized: {
      icon: CheckCircle,
      color: 'text-green-400 bg-green-500/10',
      label: 'Recognized',
      description: 'Full constitutional standing. All features available.',
    },
    conditional: {
      icon: AlertCircle,
      color: 'text-yellow-400 bg-yellow-500/10',
      label: 'Conditional',
      description: 'Limited standing. Some features restricted pending review.',
    },
    suspended: {
      icon: XCircle,
      color: 'text-orange-400 bg-orange-500/10',
      label: 'Suspended',
      description: 'Standing temporarily suspended. Review in progress.',
    },
    revoked: {
      icon: XCircle,
      color: 'text-red-400 bg-red-500/10',
      label: 'Revoked',
      description: 'Constitutional standing revoked. Access restricted.',
    },
  };

  const current = statusConfig[currentStatus];
  const CurrentIcon = current.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl ${current.color} flex items-center justify-center`}>
                <CurrentIcon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Recognition Status</h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Your constitutional standing in the Mirror
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current status */}
          <div className={`p-6 rounded-xl border-2 ${current.color.split(' ')[1]} border-opacity-30`}>
            <div className="flex items-center gap-3 mb-3">
              <CurrentIcon size={24} className={current.color.split(' ')[0]} />
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{current.label}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">{current.description}</p>
              </div>
            </div>
          </div>

          {/* What this means */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-[var(--color-text-primary)]">What this means</h3>
            <div className="space-y-2">
              {getStatusDetails(currentStatus).map((detail, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)]"
                >
                  {detail}
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-[var(--color-text-primary)]">
                <Clock size={18} />
                <span>Recognition History</span>
              </h3>
              <div className="space-y-3">
                {history.map((event) => {
                  const eventConfig = statusConfig[event.status];
                  const EventIcon = eventConfig.icon;
                  
                  return (
                    <div
                      key={event.id}
                      className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${eventConfig.color} flex items-center justify-center flex-shrink-0`}>
                          <EventIcon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[var(--color-text-primary)]">
                              {eventConfig.label}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                            {event.reason}
                          </p>
                          {event.constitutionalBasis && (
                            <div className="text-xs text-[var(--color-text-muted)] p-2 rounded bg-[var(--color-accent-gold)]/5">
                              Constitutional basis: {event.constitutionalBasis}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatusDetails(status: RecognitionStatus): string[] {
  const details = {
    recognized: [
      'You can create and view reflections',
      'Full access to identity graph features',
      'Ability to participate in governance',
      'Export capabilities enabled',
      'Fork creation allowed',
    ],
    conditional: [
      'You can create reflections (limited)',
      'Identity graph access restricted',
      'Governance participation limited',
      'Export available for personal data only',
      'Fork creation requires review',
    ],
    suspended: [
      'Reflection creation paused',
      'Read-only access to existing data',
      'No governance participation',
      'Export available for personal data',
      'Under constitutional review',
    ],
    revoked: [
      'No new reflections allowed',
      'Read-only access to personal data',
      'Governance participation prohibited',
      'Export available for data portability',
      'Constitutional violation detected',
    ],
  };
  return details[status];
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const EXAMPLE_HISTORY: RecognitionEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 86400000 * 30),
    status: 'recognized',
    reason: 'Initial recognition granted',
    constitutionalBasis: 'Article I: Sovereignty - User acknowledged constitution',
  },
];

