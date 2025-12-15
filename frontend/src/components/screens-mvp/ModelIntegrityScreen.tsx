import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Package,
  FileCheck,
  ChevronRight,
  Eye,
  Lock,
} from 'lucide-react';

interface Model {
  id: string;
  name: string;
  provider: string;
  version: string;
  verificationStatus: 'verified' | 'unverified' | 'failed';
  lastVerified: string;
  checksum: string;
  signature: string;
  inUse: boolean;
}

interface VerificationLog {
  id: string;
  timestamp: string;
  check: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
}

export function ModelIntegrityScreen() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showVerificationLog, setShowVerificationLog] = useState(false);

  const models: Model[] = [
    {
      id: '1',
      name: 'MirrorCore',
      provider: 'Mirror Foundation',
      version: '1.0.3',
      verificationStatus: 'verified',
      lastVerified: '2 hours ago',
      checksum: 'sha256:a3f5b9c2d1e8...',
      signature: 'Valid (Guardian Key 1)',
      inUse: true,
    },
    {
      id: '2',
      name: 'MirrorCore Beta',
      provider: 'Mirror Foundation',
      version: '1.1.0-beta.2',
      verificationStatus: 'verified',
      lastVerified: '1 day ago',
      checksum: 'sha256:d8e1c2b9a5f3...',
      signature: 'Valid (Guardian Key 2)',
      inUse: false,
    },
    {
      id: '3',
      name: 'Gentle Reflector',
      provider: 'Community Fork',
      version: '0.9.1',
      verificationStatus: 'unverified',
      lastVerified: 'Never',
      checksum: 'sha256:e9f3a1b2c8d5...',
      signature: 'Not signed',
      inUse: false,
    },
  ];

  const verificationLogs: VerificationLog[] = [
    {
      id: '1',
      timestamp: '2024-12-09 14:32:15',
      check: 'Checksum Verification',
      status: 'passed',
      details: 'Model checksum matches expected value from manifest',
    },
    {
      id: '2',
      timestamp: '2024-12-09 14:32:16',
      check: 'Guardian Signature',
      status: 'passed',
      details: 'Signature validated against Guardian public key #1',
    },
    {
      id: '3',
      timestamp: '2024-12-09 14:32:17',
      check: 'Constitutional Guardrails',
      status: 'passed',
      details: 'All constitutional constraints present in model config',
    },
    {
      id: '4',
      timestamp: '2024-12-09 14:32:18',
      check: 'Behavioral Audit',
      status: 'passed',
      details: 'Tested against 127 refusal scenarios - all correct',
    },
    {
      id: '5',
      timestamp: '2024-12-09 14:32:19',
      check: 'Provenance Chain',
      status: 'passed',
      details: 'Model lineage verified back to MirrorCore v1.0.0',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-gold)]/20">
            <Shield size={32} className="text-[var(--color-accent-gold)]" />
          </div>
          <div>
            <h1 className="mb-1">Model Integrity & Verification</h1>
            <p className="text-[var(--color-text-secondary)]">
              Transparency into what's running and why you can trust it
            </p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <Lock size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                <strong>The Mirror will NOT run an unverified model.</strong> Every model is cryptographically 
                verified, signed by guardians, and tested against constitutional constraints before it can reflect with you.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                This isn't just security theater—it's proof that the intelligence serving you is the intelligence 
                you chose, unmodified and untampered.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Models List */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        {models.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            onViewDetails={() => {
              setSelectedModel(model);
              setShowVerificationLog(true);
            }}
          />
        ))}
      </div>

      {/* What Gets Verified */}
      <Card className="mb-6">
        <h3 className="mb-4">What Gets Verified</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VerificationCheckItem
            icon={<FileCheck size={20} />}
            title="Checksum Integrity"
            description="Model binary matches cryptographic hash in signed manifest"
          />
          <VerificationCheckItem
            icon={<Shield size={20} />}
            title="Guardian Signature"
            description="At least one guardian has cryptographically signed this model"
          />
          <VerificationCheckItem
            icon={<Lock size={20} />}
            title="Constitutional Constraints"
            description="All refusal boundaries and guardrails are present and active"
          />
          <VerificationCheckItem
            icon={<Package size={20} />}
            title="Provenance Chain"
            description="Model lineage traced back to known, trusted source"
          />
          <VerificationCheckItem
            icon={<Eye size={20} />}
            title="Behavioral Audit"
            description="Tested against refusal scenarios to ensure constitutional compliance"
          />
          <VerificationCheckItem
            icon={<Clock size={20} />}
            title="Freshness Check"
            description="Verification is recent (within 7 days) or re-verified on startup"
          />
        </div>
      </Card>

      {/* Verification Log Drawer */}
      {showVerificationLog && selectedModel && (
        <div className="fixed inset-0 bg-[var(--color-overlay-scrim)] z-50 flex items-center justify-end">
          <div
            className="absolute inset-0"
            onClick={() => setShowVerificationLog(false)}
          />
          <div className="relative w-full max-w-2xl h-full bg-[var(--color-base-raised)] border-l border-[var(--color-border-strong)] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--color-base-raised)] border-b border-[var(--color-border-subtle)] p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="mb-1">Verification Log</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {selectedModel.name} v{selectedModel.version}
                  </p>
                </div>
                <button
                  onClick={() => setShowVerificationLog(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedModel.verificationStatus === 'verified' ? (
                  <>
                    <CheckCircle2 size={20} className="text-[var(--color-accent-green)]" />
                    <span className="text-sm text-[var(--color-accent-green)]">Verified</span>
                  </>
                ) : selectedModel.verificationStatus === 'failed' ? (
                  <>
                    <XCircle size={20} className="text-[var(--color-accent-red)]" />
                    <span className="text-sm text-[var(--color-accent-red)]">Failed Verification</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} className="text-[var(--color-accent-gold)]" />
                    <span className="text-sm text-[var(--color-accent-gold)]">Not Verified</span>
                  </>
                )}
                <span className="text-xs text-[var(--color-text-muted)]">
                  Last checked: {selectedModel.lastVerified}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Model Details */}
              <Card>
                <h4 className="mb-3">Model Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Provider:</span>
                    <span className="text-[var(--color-text-primary)]">{selectedModel.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Version:</span>
                    <span className="text-[var(--color-text-primary)]">{selectedModel.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Checksum:</span>
                    <span className="font-mono text-xs text-[var(--color-text-primary)]">
                      {selectedModel.checksum}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Signature:</span>
                    <span className="text-[var(--color-text-primary)]">{selectedModel.signature}</span>
                  </div>
                </div>
              </Card>

              {/* Verification Steps */}
              <div>
                <h4 className="mb-3">Verification Steps</h4>
                <div className="space-y-3">
                  {verificationLogs.map((log) => (
                    <VerificationLogEntry key={log.id} log={log} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelCard({
  model,
  onViewDetails,
}: {
  model: Model;
  onViewDetails: () => void;
}) {
  return (
    <Card className="hover:border-[var(--color-accent-gold)] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Status Icon */}
          <div className="p-3 rounded-lg bg-[var(--color-base-raised)]">
            {model.verificationStatus === 'verified' ? (
              <CheckCircle2 size={24} className="text-[var(--color-accent-green)]" />
            ) : model.verificationStatus === 'failed' ? (
              <XCircle size={24} className="text-[var(--color-accent-red)]" />
            ) : (
              <AlertTriangle size={24} className="text-[var(--color-accent-gold)]" />
            )}
          </div>

          {/* Model Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3>{model.name}</h3>
              {model.inUse && (
                <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]">
                  In Use
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {model.provider} • v{model.version}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--color-text-muted)]">Status: </span>
                <span
                  className={
                    model.verificationStatus === 'verified'
                      ? 'text-[var(--color-accent-green)]'
                      : model.verificationStatus === 'failed'
                      ? 'text-[var(--color-accent-red)]'
                      : 'text-[var(--color-accent-gold)]'
                  }
                >
                  {model.verificationStatus === 'verified'
                    ? 'Verified'
                    : model.verificationStatus === 'failed'
                    ? 'Failed'
                    : 'Unverified'}
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Last Verified: </span>
                <span className="text-[var(--color-text-primary)]">{model.lastVerified}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Checksum: </span>
                <span className="font-mono text-xs text-[var(--color-text-primary)]">
                  {model.checksum.slice(0, 20)}...
                </span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Signature: </span>
                <span className="text-[var(--color-text-primary)]">{model.signature}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Button variant="ghost" onClick={onViewDetails}>
          View Log
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </Card>
  );
}

function VerificationCheckItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-base-raised)]">
      <div className="text-[var(--color-accent-green)] mt-0.5">{icon}</div>
      <div>
        <h5 className="text-sm mb-1">{title}</h5>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
    </div>
  );
}

function VerificationLogEntry({ log }: { log: VerificationLog }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {log.status === 'passed' ? (
            <CheckCircle2 size={16} className="text-[var(--color-accent-green)]" />
          ) : log.status === 'failed' ? (
            <XCircle size={16} className="text-[var(--color-accent-red)]" />
          ) : (
            <AlertTriangle size={16} className="text-[var(--color-accent-gold)]" />
          )}
          <h5 className="text-sm">{log.check}</h5>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">{log.timestamp}</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] pl-6">{log.details}</p>
    </div>
  );
}


