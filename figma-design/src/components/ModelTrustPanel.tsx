import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  HardDrive,
  FileSignature,
  Eye,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ModelInfo {
  name: string;
  version: string;
  origin: 'local' | 'vendor' | 'fork';
  signatureStatus: 'verified' | 'user-verified' | 'unverified';
  lastAuditHash: string;
  lastAuditTime: string;
  constitutionalCompliance: 'compliant' | 'pending' | 'violation';
  trainingConstraints: string[];
  dataEncryption: 'locked' | 'unlocked';
  hardwareBinding: boolean;
  storageLocation: string;
  lastBackup: string;
  exportChecksum: string;
}

export function ModelTrustPanel() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['trust', 'security']));

  // Mock model data
  const modelInfo: ModelInfo = {
    name: 'MirrorCore',
    version: 'v1.0.3',
    origin: 'local',
    signatureStatus: 'verified',
    lastAuditHash: '8f4a9c2e...7d6b1f3a',
    lastAuditTime: '2 hours ago',
    constitutionalCompliance: 'compliant',
    trainingConstraints: [
      'No persuasive optimization',
      'No behavior prediction',
      'No engagement maximization',
      'Crisis detection only (no diagnosis)',
      'Explicit consent required for all learning',
    ],
    dataEncryption: 'locked',
    hardwareBinding: true,
    storageLocation: 'Local Device (Encrypted)',
    lastBackup: '2 days ago',
    exportChecksum: 'SHA-256: a3f2e8d9...4c7b1e6f',
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getTrustBadge = () => {
    switch (modelInfo.signatureStatus) {
      case 'verified':
        return {
          icon: <CheckCircle2 size={20} />,
          label: 'Cryptographically Verified',
          color: 'text-[var(--color-accent-green)]',
          bgColor: 'bg-[var(--color-accent-green)]/20',
          description: 'This model has been cryptographically verified against the official MirrorCore signature.',
        };
      case 'user-verified':
        return {
          icon: <Shield size={20} />,
          label: 'User-Verified Fork',
          color: 'text-[var(--color-accent-gold)]',
          bgColor: 'bg-[var(--color-accent-gold)]/20',
          description: 'This is a fork you created and verified. You are responsible for its integrity.',
        };
      case 'unverified':
        return {
          icon: <AlertTriangle size={20} />,
          label: 'Unverified',
          color: 'text-[var(--color-accent-red)]',
          bgColor: 'bg-[var(--color-accent-red)]/20',
          description: 'This model could not be verified. Proceed with extreme caution.',
        };
    }
  };

  const getComplianceBadge = () => {
    switch (modelInfo.constitutionalCompliance) {
      case 'compliant':
        return {
          icon: <CheckCircle2 size={16} />,
          label: 'Compliant',
          color: 'text-[var(--color-accent-green)]',
          bgColor: 'bg-[var(--color-accent-green)]/20',
        };
      case 'pending':
        return {
          icon: <AlertTriangle size={16} />,
          label: 'Pending Review',
          color: 'text-[var(--color-accent-gold)]',
          bgColor: 'bg-[var(--color-accent-gold)]/20',
        };
      case 'violation':
        return {
          icon: <XCircle size={16} />,
          label: 'Constitutional Violation',
          color: 'text-[var(--color-accent-red)]',
          bgColor: 'bg-[var(--color-accent-red)]/20',
        };
    }
  };

  const trustBadge = getTrustBadge();
  const complianceBadge = getComplianceBadge();

  return (
    <div className="space-y-4">
      {/* Model Identity */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="mb-1">{modelInfo.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Active mirror model • {modelInfo.version}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${trustBadge.bgColor} ${trustBadge.color}`}>
            {trustBadge.icon}
            <span className="text-sm">{trustBadge.label}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
          <p className="text-sm text-[var(--color-text-secondary)]">{trustBadge.description}</p>
        </div>
      </Card>

      {/* Trust & Verification */}
      <Card>
        <button
          onClick={() => toggleSection('trust')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <FileSignature size={20} className="text-[var(--color-accent-gold)]" />
            <h4>Trust & Verification</h4>
          </div>
          {expandedSections.has('trust') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.has('trust') && (
          <div className="space-y-3">
            <TrustRow
              label="Signature verification"
              value={modelInfo.signatureStatus}
              status={modelInfo.signatureStatus === 'verified' ? 'success' : modelInfo.signatureStatus === 'user-verified' ? 'warning' : 'error'}
            />
            <TrustRow label="Origin" value={modelInfo.origin} status="neutral" />
            <TrustRow label="Last audit hash" value={modelInfo.lastAuditHash} status="neutral" mono />
            <TrustRow label="Last verification" value={modelInfo.lastAuditTime} status="neutral" />

            <div className="pt-3 border-t border-[var(--color-border-subtle)]">
              <Button variant="ghost" size="sm" className="w-full">
                <Eye size={16} className="mr-2" />
                View Full Audit Log
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Constitutional Compliance */}
      <Card>
        <button
          onClick={() => toggleSection('constitutional')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-[var(--color-accent-gold)]" />
            <h4>Constitutional Compliance</h4>
          </div>
          {expandedSections.has('constitutional') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.has('constitutional') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-secondary)]">Status</span>
              <div className={`px-2 py-1 rounded flex items-center gap-2 ${complianceBadge.bgColor} ${complianceBadge.color}`}>
                {complianceBadge.icon}
                <span className="text-xs">{complianceBadge.label}</span>
              </div>
            </div>

            <div>
              <div className="text-sm mb-2 text-[var(--color-text-secondary)]">Training Constraints</div>
              <div className="space-y-2">
                {modelInfo.trainingConstraints.map((constraint, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm p-2 rounded bg-[var(--color-base-raised)]"
                  >
                    <CheckCircle2 size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
                    <span className="text-[var(--color-text-secondary)]">{constraint}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border-subtle)]">
              <Button variant="ghost" size="sm" className="w-full">
                <Eye size={16} className="mr-2" />
                View Full Constitution
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Data Security */}
      <Card>
        <button
          onClick={() => toggleSection('security')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Lock size={20} className="text-[var(--color-accent-gold)]" />
            <h4>Data Security</h4>
          </div>
          {expandedSections.has('security') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.has('security') && (
          <div className="space-y-3">
            <TrustRow
              label="Encryption state"
              value={modelInfo.dataEncryption === 'locked' ? 'Locked (AES-256)' : 'Unlocked'}
              status={modelInfo.dataEncryption === 'locked' ? 'success' : 'error'}
            />
            <TrustRow
              label="Hardware binding"
              value={modelInfo.hardwareBinding ? 'Enabled' : 'Disabled'}
              status={modelInfo.hardwareBinding ? 'success' : 'warning'}
            />
            <TrustRow label="Storage location" value={modelInfo.storageLocation} status="neutral" />
            <TrustRow label="Last backup" value={modelInfo.lastBackup} status="neutral" />
            <TrustRow label="Export checksum" value={modelInfo.exportChecksum} status="neutral" mono />

            <div className="pt-3 border-t border-[var(--color-border-subtle)] flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1">
                <HardDrive size={16} className="mr-2" />
                Backup Now
              </Button>
              <Button variant="ghost" size="sm" className="flex-1">
                <Settings size={16} className="mr-2" />
                Configure
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Supply Chain */}
      <Card>
        <button
          onClick={() => toggleSection('supply')}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-[var(--color-accent-gold)]" />
            <h4>Model Supply Chain</h4>
          </div>
          {expandedSections.has('supply') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {expandedSections.has('supply') && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
              <div className="text-sm mb-2 text-[var(--color-text-secondary)]">Origin Chain</div>
              <div className="space-y-2">
                <SupplyChainStep
                  step="Source"
                  value="MirrorCore Official Repo"
                  verified={true}
                />
                <SupplyChainStep
                  step="Build"
                  value="Local compilation on your device"
                  verified={true}
                />
                <SupplyChainStep
                  step="Verification"
                  value="Cryptographic signature match"
                  verified={true}
                />
              </div>
            </div>

            <div className="text-xs text-[var(--color-text-muted)] p-3 rounded bg-[var(--color-base-raised)]">
              <p className="mb-2">
                <strong className="text-[var(--color-text-secondary)]">What this means:</strong>
              </p>
              <p>
                This model was built locally from verified source code. No third-party servers were involved in
                compilation. The cryptographic signature confirms it matches the official MirrorCore constitution.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Danger Zone */}
      <Card variant="subtle">
        <h4 className="mb-3 text-[var(--color-accent-red)]">Model Replacement</h4>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Replace the active model with a fork or alternative. Your data remains intact but reflection behavior
          will change.
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[var(--color-accent-red)]">
            Load Fork
          </Button>
          <Button variant="ghost" size="sm" className="text-[var(--color-accent-red)]">
            Reset to Official
          </Button>
        </div>
      </Card>
    </div>
  );
}

function TrustRow({
  label,
  value,
  status,
  mono = false,
}: {
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error' | 'neutral';
  mono?: boolean;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-[var(--color-accent-green)]';
      case 'warning':
        return 'text-[var(--color-accent-gold)]';
      case 'error':
        return 'text-[var(--color-accent-red)]';
      case 'neutral':
        return 'text-[var(--color-text-primary)]';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={14} className="text-[var(--color-accent-green)]" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-[var(--color-accent-gold)]" />;
      case 'error':
        return <XCircle size={14} className="text-[var(--color-accent-red)]" />;
      case 'neutral':
        return null;
    }
  };

  return (
    <div className="flex justify-between items-start text-sm gap-4">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {getStatusIcon()}
        <span className={`${getStatusColor()} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
      </div>
    </div>
  );
}

function SupplyChainStep({
  step,
  value,
  verified,
}: {
  step: string;
  value: string;
  verified: boolean;
}) {
  return (
    <div className="flex items-start gap-3 pb-2 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0">
      <div className="flex-shrink-0 mt-0.5">
        {verified ? (
          <CheckCircle2 size={16} className="text-[var(--color-accent-green)]" />
        ) : (
          <XCircle size={16} className="text-[var(--color-accent-red)]" />
        )}
      </div>
      <div className="flex-1">
        <div className="text-xs text-[var(--color-text-muted)] mb-0.5">{step}</div>
        <div className="text-sm text-[var(--color-text-primary)]">{value}</div>
      </div>
    </div>
  );
}
