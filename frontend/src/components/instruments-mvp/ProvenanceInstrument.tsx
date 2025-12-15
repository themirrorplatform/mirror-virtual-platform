/**
 * Provenance & Recognition Instrument
 * Trust primitives. Shows what's local vs remote, recognition state, integrity.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Server, Smartphone, AlertCircle, Check, Clock, FileSignature } from 'lucide-react';

interface ProvenanceState {
  execution: 'local' | 'remote' | 'hybrid';
  modelIdentity: string;
  providerIdentity?: string;
  lastVerified: Date;
  signatureStatus: 'valid' | 'invalid' | 'unverified';
  checksum: string;
  auditLog: AuditEntry[];
}

interface RecognitionState {
  status: 'recognized' | 'conditional' | 'suspended' | 'revoked';
  ttl: Date | null;
  lastCheck: Date;
  reasonClass?: string;
  registryUrl?: string;
}

interface AuditEntry {
  timestamp: Date;
  event: string;
  details: string;
}

interface ProvenanceInstrumentProps {
  provenance: ProvenanceState;
  recognition: RecognitionState;
  onRefresh: () => void;
  onViewAudit: () => void;
  onClose: () => void;
}

export function ProvenanceInstrument({
  provenance,
  recognition,
  onRefresh,
  onViewAudit,
  onClose,
}: ProvenanceInstrumentProps) {
  const [view, setView] = useState<'overview' | 'provenance' | 'recognition' | 'audit'>('overview');

  const recognitionColor = {
    recognized: 'text-green-400',
    conditional: 'text-yellow-400',
    suspended: 'text-orange-400',
    revoked: 'text-red-400',
  };

  const executionIcon = {
    local: <Smartphone size={20} />,
    remote: <Server size={20} />,
    hybrid: <div className="flex gap-1"><Smartphone size={16} /><Server size={16} /></div>,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border-subtle)] flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="mb-1">Provenance & Recognition</h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Trust state and execution verification
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-all"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* View tabs */}
          <div className="flex gap-2">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'provenance' as const, label: 'Provenance' },
              { id: 'recognition' as const, label: 'Recognition' },
              { id: 'audit' as const, label: 'Audit Log' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm transition-all
                  ${view === tab.id
                    ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {view === 'overview' && (
            <OverviewView
              provenance={provenance}
              recognition={recognition}
              recognitionColor={recognitionColor}
              executionIcon={executionIcon}
            />
          )}
          {view === 'provenance' && (
            <ProvenanceView provenance={provenance} executionIcon={executionIcon} />
          )}
          {view === 'recognition' && (
            <RecognitionView recognition={recognition} recognitionColor={recognitionColor} />
          )}
          {view === 'audit' && (
            <AuditView auditLog={provenance.auditLog} />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border-subtle)] flex gap-3 flex-shrink-0">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Refresh Status
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] transition-all"
          >
            Return to Field
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function OverviewView({ provenance, recognition, recognitionColor, executionIcon }: any) {
  return (
    <div className="space-y-6">
      {/* Quick status */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recognition */}
        <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={20} className={recognitionColor[recognition.status]} />
            <h3 className="text-sm">Recognition</h3>
          </div>
          <div className={`text-lg capitalize mb-1 ${recognitionColor[recognition.status]}`}>
            {recognition.status}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            Last checked: {recognition.lastCheck.toLocaleString()}
          </div>
        </div>

        {/* Execution */}
        <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3 mb-3">
            {executionIcon[provenance.execution]}
            <h3 className="text-sm">Execution</h3>
          </div>
          <div className="text-lg capitalize mb-1">
            {provenance.execution}
          </div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {provenance.modelIdentity}
          </div>
        </div>
      </div>

      {/* Signature status */}
      <div className={`
        p-4 rounded-xl border-2
        ${provenance.signatureStatus === 'valid' 
          ? 'bg-green-500/5 border-green-500/30' 
          : provenance.signatureStatus === 'invalid'
          ? 'bg-red-500/5 border-red-500/30'
          : 'bg-yellow-500/5 border-yellow-500/30'
        }
      `}>
        <div className="flex items-center gap-2 mb-2">
          <FileSignature size={16} />
          <h4 className="text-sm">Signature Status</h4>
        </div>
        <div className={`
          text-sm capitalize
          ${provenance.signatureStatus === 'valid' ? 'text-green-400' : ''}
          ${provenance.signatureStatus === 'invalid' ? 'text-red-400' : ''}
          ${provenance.signatureStatus === 'unverified' ? 'text-yellow-400' : ''}
        `}>
          {provenance.signatureStatus}
        </div>
      </div>

      {/* TTL warning */}
      {recognition.ttl && new Date() > new Date(recognition.ttl.getTime() - 24 * 60 * 60 * 1000) && (
        <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/30">
          <div className="flex items-start gap-2">
            <Clock size={16} className="text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-400">
              Recognition expires in {Math.ceil((recognition.ttl.getTime() - Date.now()) / (1000 * 60 * 60))} hours
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProvenanceView({ provenance, executionIcon }: any) {
  return (
    <div className="space-y-6">
      {/* Execution mode */}
      <div>
        <h3 className="mb-4">Execution Mode</h3>
        <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3 mb-4">
            {executionIcon[provenance.execution]}
            <div className="text-lg capitalize">{provenance.execution}</div>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Model Identity</span>
              <span className="font-mono">{provenance.modelIdentity}</span>
            </div>
            {provenance.providerIdentity && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Provider</span>
                <span>{provenance.providerIdentity}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Last Verified</span>
              <span>{provenance.lastVerified.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrity */}
      <div>
        <h3 className="mb-4">Integrity</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Signature Status</div>
            <div className={`
              ${provenance.signatureStatus === 'valid' ? 'text-green-400' : ''}
              ${provenance.signatureStatus === 'invalid' ? 'text-red-400' : ''}
              ${provenance.signatureStatus === 'unverified' ? 'text-yellow-400' : ''}
            `}>
              <div className="flex items-center gap-2 mb-2">
                {provenance.signatureStatus === 'valid' && <Check size={16} />}
                {provenance.signatureStatus === 'invalid' && <AlertCircle size={16} />}
                <span className="capitalize">{provenance.signatureStatus}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Checksum (SHA-256)</div>
            <code className="text-xs font-mono break-all">{provenance.checksum}</code>
          </div>
        </div>
      </div>

      {/* What this means */}
      <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
        <div className="text-sm text-[var(--color-text-secondary)]">
          {provenance.execution === 'local' && 'All processing occurs on your device. No external dependencies.'}
          {provenance.execution === 'remote' && 'Processing occurs on external servers. Data leaves your device.'}
          {provenance.execution === 'hybrid' && 'Some processing is local, some is remote. Review data routing.'}
        </div>
      </div>
    </div>
  );
}

function RecognitionView({ recognition, recognitionColor }: any) {
  return (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <h3 className="mb-4">Recognition Status</h3>
        <div className="p-6 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]">
          <div className={`text-2xl capitalize mb-4 ${recognitionColor[recognition.status]}`}>
            {recognition.status}
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Last Check</span>
              <span>{recognition.lastCheck.toLocaleString()}</span>
            </div>
            {recognition.ttl && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Expires</span>
                <span>{recognition.ttl.toLocaleString()}</span>
              </div>
            )}
            {recognition.reasonClass && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Reason Class</span>
                <span>{recognition.reasonClass}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* What it means */}
      <div>
        <h3 className="mb-4">What This Means</h3>
        <div className="space-y-3 text-sm">
          {recognition.status === 'recognized' && (
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/30 text-green-400">
              This instance is recognized as legitimate. All features available.
            </div>
          )}
          {recognition.status === 'conditional' && (
            <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/30 text-yellow-400">
              Recognition is conditional. Some features may be limited until full verification.
            </div>
          )}
          {recognition.status === 'suspended' && (
            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/30 text-orange-400">
              Recognition has been temporarily suspended. Review reason class and contact support.
            </div>
          )}
          {recognition.status === 'revoked' && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/30 text-red-400">
              Recognition has been revoked. This instance may not be legitimate.
            </div>
          )}
        </div>
      </div>

      {/* Registry link */}
      {recognition.registryUrl && (
        <div>
          <h3 className="mb-4">Registry</h3>
          <a
            href={recognition.registryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-emphasis)] transition-all text-sm"
          >
            <div className="flex items-center justify-between">
              <span>View in recognition registry</span>
              <span>→</span>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}

function AuditView({ auditLog }: { auditLog: AuditEntry[] }) {
  return (
    <div className="space-y-3">
      {auditLog.length > 0 ? (
        auditLog.map((entry, i) => (
          <div
            key={i}
            className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)]"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm">{entry.event}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {entry.timestamp.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {entry.details}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          No audit entries
        </div>
      )}
    </div>
  );
}

// Example data
export const EXAMPLE_PROVENANCE: ProvenanceState = {
  execution: 'local',
  modelIdentity: 'Mirror-Core-v1.0-local',
  lastVerified: new Date(),
  signatureStatus: 'valid',
  checksum: 'a3f5c8d2e9b1f4a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
  auditLog: [
    {
      timestamp: new Date(),
      event: 'System initialized',
      details: 'Mirror Core v1.0 started in Sovereign mode',
    },
    {
      timestamp: new Date(Date.now() - 3600000),
      event: 'Recognition verified',
      details: 'TTL extended for 30 days',
    },
  ],
};

export const EXAMPLE_RECOGNITION: RecognitionState = {
  status: 'recognized',
  ttl: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  lastCheck: new Date(),
  registryUrl: 'https://registry.mirror.example/instance/abc123',
};