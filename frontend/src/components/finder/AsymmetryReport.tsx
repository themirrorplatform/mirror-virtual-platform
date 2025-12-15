/**
 * Asymmetry Report - Detailed risk analysis for doors
 * 
 * Features:
 * - Visual risk score (0-100)
 * - Exit friction indicator
 * - Data demand ratio
 * - Boolean flags (opacity, coercion, control, lock-in)
 * - Evidence tier display
 * - "What does this mean?" tooltips
 * - Community attestation count
 */

import { motion } from 'framer-motion';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Eye,
  User,
  Lock,
  Database,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AsymmetryData {
  doorId: string;
  doorTitle: string;
  overallRisk: number; // 0-100
  exitFriction: 'low' | 'medium' | 'high';
  dataDemandRatio: number; // 0-1
  opacity: boolean; // true = transparent
  identityCoercion: boolean; // true = coerced
  unilateralControl: boolean; // true = unilateral
  lockInTerms: boolean; // true = lock-in present
  evidenceTier: 'declared' | 'attested' | 'observed';
  attestationCount: number;
  lastUpdated: Date;
}

interface AsymmetryReportProps {
  data: AsymmetryData;
  onClose: () => void;
  showDetails?: boolean;
}

const EXIT_FRICTION_CONFIG = {
  low: { 
    label: 'Low', 
    color: '#10B981',
    description: 'Easy to leave, no barriers',
    icon: <CheckCircle size={20} />
  },
  medium: { 
    label: 'Medium', 
    color: '#F59E0B',
    description: 'Some barriers, but manageable',
    icon: <AlertTriangle size={20} />
  },
  high: { 
    label: 'High', 
    color: '#EF4444',
    description: 'Difficult to leave, significant barriers',
    icon: <Shield size={20} />
  },
};

const EVIDENCE_TIER_CONFIG = {
  declared: {
    label: 'Declared',
    description: 'Creator self-reported this data',
    color: '#64748B',
  },
  attested: {
    label: 'Attested',
    description: 'Community members verified this data',
    color: '#3B82F6',
  },
  observed: {
    label: 'Observed',
    description: 'System measured this data directly',
    color: '#10B981',
  },
};

export function AsymmetryReport({
  data,
  onClose,
  showDetails = true,
}: AsymmetryReportProps) {
  const riskLevel = getRiskLevel(data.overallRisk);
  const exitFrictionConfig = EXIT_FRICTION_CONFIG[data.exitFriction];
  const evidenceTierConfig = EVIDENCE_TIER_CONFIG[data.evidenceTier];

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
              <div className="flex items-start gap-3">
                <Shield size={24} className="text-[var(--color-accent-blue)] mt-1" />
                <div>
                  <h3 className="mb-1">Asymmetry Report</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {data.doorTitle}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            {/* Overall Risk Score */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Overall Risk</h4>
                <Badge 
                  variant={riskLevel.variant}
                  size="lg"
                >
                  {data.overallRisk}/100
                </Badge>
              </div>

              <div className="relative">
                <div className="w-full h-8 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.overallRisk}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: riskLevel.color }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  {riskLevel.description}
                </p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Key Metrics</h4>

              {/* Exit Friction */}
              <MetricCard
                icon={<LogOut size={20} />}
                label="Exit Friction"
                value={exitFrictionConfig.label}
                description={exitFrictionConfig.description}
                color={exitFrictionConfig.color}
                tooltip="How easy it is to leave this door once entered"
              />

              {/* Data Demand Ratio */}
              <MetricCard
                icon={<Database size={20} />}
                label="Data Demand Ratio"
                value={`${Math.round(data.dataDemandRatio * 100)}%`}
                description={getDataDemandDescription(data.dataDemandRatio)}
                color={data.dataDemandRatio < 0.5 ? '#10B981' : '#F59E0B'}
                tooltip="Percentage of data you give vs. receive"
              >
                <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden mt-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.dataDemandRatio * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: data.dataDemandRatio < 0.5 ? '#10B981' : '#F59E0B' }}
                  />
                </div>
              </MetricCard>
            </div>

            {/* Boolean Flags */}
            {showDetails && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Safety Checks</h4>
                <div className="grid grid-cols-2 gap-3">
                  <BooleanFlag
                    icon={<Eye size={18} />}
                    label="Transparency"
                    value={data.opacity}
                    positiveLabel="Transparent"
                    negativeLabel="Opaque"
                    tooltip="Can you see how this door operates?"
                  />
                  <BooleanFlag
                    icon={<User size={18} />}
                    label="Identity"
                    value={!data.identityCoercion}
                    positiveLabel="Optional"
                    negativeLabel="Coerced"
                    tooltip="Are you forced to reveal your identity?"
                  />
                  <BooleanFlag
                    icon={<Shield size={18} />}
                    label="Control"
                    value={!data.unilateralControl}
                    positiveLabel="Mutual"
                    negativeLabel="Unilateral"
                    tooltip="Do both sides have equal power?"
                  />
                  <BooleanFlag
                    icon={<Lock size={18} />}
                    label="Lock-in"
                    value={!data.lockInTerms}
                    positiveLabel="None"
                    negativeLabel="Present"
                    tooltip="Are there terms that lock you in?"
                  />
                </div>
              </div>
            )}

            {/* Evidence & Attestation */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Verification</h4>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)]">
                <div>
                  <p className="text-sm font-medium mb-1">Evidence Tier</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {evidenceTierConfig.description}
                  </p>
                </div>
                <Badge 
                  variant={
                    data.evidenceTier === 'observed' ? 'success' : 
                    data.evidenceTier === 'attested' ? 'primary' : 'secondary'
                  }
                >
                  {evidenceTierConfig.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-hover)]">
                <div>
                  <p className="text-sm font-medium mb-1">Community Attestations</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {data.attestationCount} user{data.attestationCount !== 1 ? 's' : ''} verified this data
                  </p>
                </div>
                <Badge variant="secondary">
                  {data.attestationCount}
                </Badge>
              </div>

              <div className="text-xs text-[var(--color-text-muted)]">
                Last updated {formatDate(data.lastUpdated)}
              </div>
            </div>

            {/* Explainer */}
            <Card className="border-2 border-[var(--color-accent-blue)]">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                <div className="text-xs text-[var(--color-text-secondary)]">
                  <p className="mb-2">
                    <strong>Asymmetry reports protect your sovereignty.</strong> They measure 
                    power imbalances in doors before you enter.
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    Higher risk scores mean more caution needed. You can always exit, but 
                    some doors make it harder than others.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  color: string;
  tooltip?: string;
  children?: React.ReactNode;
}

function MetricCard({ icon, label, value, description, color, tooltip, children }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div style={{ color }}>{icon}</div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{label}</span>
            {tooltip && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                >
                  <HelpCircle size={14} />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 top-6 w-48 p-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-lg z-10">
                    <p className="text-xs text-[var(--color-text-secondary)]">{tooltip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Badge variant="secondary" style={{ backgroundColor: `${color}20`, color }}>
          {value}
        </Badge>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      {children}
    </div>
  );
}

interface BooleanFlagProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  positiveLabel: string;
  negativeLabel: string;
  tooltip?: string;
}

function BooleanFlag({ icon, label, value, positiveLabel, negativeLabel, tooltip }: BooleanFlagProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="p-3 rounded-lg border-2"
      style={{
        borderColor: value ? '#10B981' : '#EF4444',
        backgroundColor: value ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div style={{ color: value ? '#10B981' : '#EF4444' }}>
            {icon}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium">{label}</span>
            {tooltip && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                >
                  <HelpCircle size={12} />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 top-5 w-40 p-2 rounded-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-lg z-10">
                    <p className="text-xs text-[var(--color-text-secondary)]">{tooltip}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {value ? (
          <CheckCircle size={14} className="text-[#10B981]" />
        ) : (
          <X size={14} className="text-[#EF4444]" />
        )}
      </div>
      <p 
        className="text-xs font-medium"
        style={{ color: value ? '#10B981' : '#EF4444' }}
      >
        {value ? positiveLabel : negativeLabel}
      </p>
    </div>
  );
}

// Utility Functions

function getRiskLevel(score: number): {
  variant: 'success' | 'warning' | 'error';
  color: string;
  description: string;
} {
  if (score < 33) {
    return {
      variant: 'success',
      color: '#10B981',
      description: 'Low risk - generally safe to enter',
    };
  }
  if (score < 66) {
    return {
      variant: 'warning',
      color: '#F59E0B',
      description: 'Medium risk - proceed with caution',
    };
  }
  return {
    variant: 'error',
    color: '#EF4444',
    description: 'High risk - significant asymmetry detected',
  };
}

function getDataDemandDescription(ratio: number): string {
  if (ratio < 0.3) return 'You receive more data than you give';
  if (ratio < 0.5) return 'Balanced data exchange';
  if (ratio < 0.7) return 'You give slightly more data';
  return 'You give significantly more data';
}

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

export type { AsymmetryData };

// Fix missing import
import { useState } from 'react';

