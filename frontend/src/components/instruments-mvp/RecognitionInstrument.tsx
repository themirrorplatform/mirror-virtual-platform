import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock, ExternalLink, Download, RefreshCw, QrCode, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Layer } from './LayerHUD';

type RecognitionStatus = 'recognized' | 'conditional' | 'suspended' | 'revoked' | 'checking';
type ReasonClass = 'initial' | 'routine' | 'verification-failure' | 'constitutional-violation' | 'security-issue';

interface RecognitionCheck {
  timestamp: string;
  status: RecognitionStatus;
  reason: string;
}

interface RecognitionInstrumentProps {
  status: RecognitionStatus;
  layer: Layer;
  lastCheck: string;
  ttl: number; // seconds remaining
  reasonClass: ReasonClass;
  registryUrl?: string;
  checksum: string;
  history: RecognitionCheck[];
  onRecheck: () => Promise<void>;
  onExportReceipt: () => void;
  onViewRegistry?: () => void;
  onClose: () => void;
}

const statusConfig = {
  recognized: {
    icon: CheckCircle,
    color: 'var(--color-success)',
    label: 'Recognized',
    description: 'Operating with full legitimacy'
  },
  conditional: {
    icon: AlertTriangle,
    color: 'var(--color-warning)',
    label: 'Conditional',
    description: 'Limited recognition with conditions'
  },
  suspended: {
    icon: XCircle,
    color: 'var(--color-error)',
    label: 'Suspended',
    description: 'Recognition temporarily suspended'
  },
  revoked: {
    icon: XCircle,
    color: 'var(--color-error)',
    label: 'Revoked',
    description: 'Recognition has been revoked'
  },
  checking: {
    icon: RefreshCw,
    color: 'var(--color-text-muted)',
    label: 'Checking...',
    description: 'Verification in progress'
  }
};

const reasonClassLabels = {
  'initial': 'Initial verification',
  'routine': 'Routine recheck',
  'verification-failure': 'Verification failed',
  'constitutional-violation': 'Constitutional violation detected',
  'security-issue': 'Security issue identified'
};

export function RecognitionInstrument({
  status,
  layer,
  lastCheck,
  ttl,
  reasonClass,
  registryUrl,
  checksum,
  history = [], // Add default empty array
  onRecheck,
  onExportReceipt,
  onViewRegistry,
  onClose
}: RecognitionInstrumentProps) {
  const [isRechecking, setIsRechecking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ttl);
  const [showHistory, setShowHistory] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [copiedChecksum, setCopiedChecksum] = useState(false);

  const config = statusConfig[status] || statusConfig['checking'];
  const Icon = config.icon;

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const handleRecheck = async () => {
    setIsRechecking(true);
    try {
      await onRecheck();
      setTimeRemaining(ttl); // Reset TTL after successful recheck
    } finally {
      setIsRechecking(false);
    }
  };

  const copyChecksum = () => {
    navigator.clipboard.writeText(checksum);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const ttlPercentage = (timeRemaining / ttl) * 100;
  const isExpiringSoon = ttlPercentage < 20;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] bg-[var(--color-surface-card)] border-2 rounded-3xl flex flex-col overflow-hidden shadow-ambient-xl"
        style={{ borderColor: config.color }}
        role="dialog"
        aria-label="Recognition status"
      >
        {/* Header */}
        <div className="p-10 pb-8 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start gap-5 mb-6">
            <motion.div
              className="p-4 rounded-2xl"
              style={{ backgroundColor: `${config.color}20` }}
              animate={status === 'checking' ? { rotate: 360 } : {}}
              transition={{
                duration: 2,
                repeat: status === 'checking' ? Infinity : 0,
                ease: 'linear'
              }}
            >
              <Icon size={28} style={{ color: config.color }} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[var(--color-text-primary)] mb-2">
                Recognition Status
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {config.description}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold mb-1" style={{ color: config.color }}>
                {config.label}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] capitalize tracking-wide">
                {layer} layer
              </div>
            </div>
          </div>

          {/* Status banner */}
          <div className="p-6 rounded-2xl" style={{
            backgroundColor: `${config.color}10`,
            border: `2px solid ${config.color}30`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-6">
                <div className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
                  {reasonClassLabels[reasonClass]}
                </div>
                <div className="text-sm text-[var(--color-text-primary)]">
                  Last checked: {new Date(lastCheck).toLocaleString()}
                </div>
              </div>
              {status !== 'checking' && (
                <button
                  onClick={handleRecheck}
                  disabled={isRechecking}
                  className="px-5 py-3 rounded-xl bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-emphasis)] text-[var(--color-text-primary)] text-sm transition-colors flex items-center gap-2.5 disabled:opacity-50 shadow-ambient-sm flex-shrink-0"
                >
                  <motion.div
                    animate={isRechecking ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: isRechecking ? Infinity : 0, ease: 'linear' }}
                  >
                    <RefreshCw size={16} />
                  </motion.div>
                  <span>{isRechecking ? 'Checking...' : 'Recheck'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          {/* TTL Countdown */}
          {status === 'recognized' && (
            <div className="p-6 rounded-2xl bg-[var(--color-surface-emphasis)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-[var(--color-text-muted)]" />
                  <span className="text-sm text-[var(--color-text-primary)]">
                    Time to next check
                  </span>
                </div>
                <motion.div
                  className={`text-xl font-mono font-bold ${
                    isExpiringSoon ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-primary)]'
                  }`}
                  animate={isExpiringSoon ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1, repeat: isExpiringSoon ? Infinity : 0 }}
                >
                  {formatTime(timeRemaining)}
                </motion.div>
              </div>
              <div className="h-2.5 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full"
                  style={{
                    backgroundColor: isExpiringSoon ? 'var(--color-warning)' : 'var(--color-success)'
                  }}
                  initial={{ width: '100%' }}
                  animate={{ width: `${ttlPercentage}%` }}
                />
              </div>
              {isExpiringSoon && (
                <p className="text-xs text-[var(--color-warning)] mt-2">
                  Recognition check needed soon
                </p>
              )}
            </div>
          )}

          {/* Checksum */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)]">
            <div className="text-xs text-[var(--color-text-muted)] mb-2">
              Identity Checksum
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-[var(--color-text-primary)] bg-[var(--color-surface-card)] px-3 py-2 rounded-lg overflow-x-auto">
                {checksum}
              </code>
              <button
                onClick={copyChecksum}
                className="px-3 py-2 rounded-lg bg-[var(--color-accent-gold)]/10 hover:bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-xs transition-colors shrink-0"
              >
                {copiedChecksum ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Registry Link */}
          {registryUrl && onViewRegistry && (
            <div className="p-4 rounded-2xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-[var(--color-text-primary)] mb-1">
                    Public Registry Verification
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Verify this instance against the public recognition registry
                  </p>
                </div>
                <button
                  onClick={onViewRegistry}
                  className="px-3 py-2 rounded-lg bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>View</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[var(--color-text-muted)]" />
                <span className="text-sm text-[var(--color-text-primary)]">
                  QR Code for Mobile Verification
                </span>
              </div>
              <motion.div
                animate={{ rotate: showQRCode ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showQRCode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 flex justify-center">
                    <div className="w-48 h-48 bg-white rounded-xl p-3 flex items-center justify-center">
                      <div className="text-xs text-center text-gray-500">
                        QR Code
                        <br />
                        {checksum.substring(0, 12)}...
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History */}
          <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="text-sm text-[var(--color-text-primary)]">
                Recognition History ({history.length})
              </div>
              <motion.div
                animate={{ rotate: showHistory ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {history.map((check, index) => {
                      const checkConfig = statusConfig[check.status];
                      const CheckIcon = checkConfig.icon;
                      
                      return (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
                        >
                          <div className="flex items-start gap-2">
                            <CheckIcon size={14} style={{ color: checkConfig.color }} className="mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium" style={{ color: checkConfig.color }}>
                                  {checkConfig.label}
                                </span>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                  {new Date(check.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                {check.reason}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <button
              onClick={onExportReceipt}
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>Export Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent-gold)]/10 hover:bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
          <p className="text-xs text-center text-[var(--color-text-muted)] mt-3">
            Recognition ensures this Mirror instance operates within constitutional bounds
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}