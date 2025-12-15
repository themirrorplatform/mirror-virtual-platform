/**
 * AsymmetryReport Component
 * Displays structural risk metrics for a reflective condition
 */

import React from 'react';
import { useAsymmetryReport } from '@/lib/hooks/useFinder';
import { AlertTriangle, Shield, Lock, Eye, Scale, Award, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AsymmetryReportProps {
  nodeId: string;
  onClose?: () => void;
}

// ────────────────────────────────────────────────────────────────────────────
// FRICTION LEVELS
// ────────────────────────────────────────────────────────────────────────────

const FRICTION_CONFIG = {
  low: {
    color: 'text-green-700 bg-green-50 border-green-200',
    icon: Shield,
    label: 'Low Friction',
    description: 'Easy to exit if needed',
  },
  medium: {
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: AlertTriangle,
    label: 'Medium Friction',
    description: 'Some barriers to exit',
  },
  high: {
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: AlertTriangle,
    label: 'High Friction',
    description: 'Difficult to exit',
  },
};

const EVIDENCE_TIERS = {
  declared: { label: 'Declared', color: 'bg-gray-100 text-gray-700' },
  attested: { label: 'Attested', color: 'bg-blue-100 text-blue-700' },
  observed: { label: 'Observed', color: 'bg-green-100 text-green-700' },
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export function AsymmetryReport({ nodeId, onClose }: AsymmetryReportProps) {
  const { data, isLoading } = useAsymmetryReport(nodeId);

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const frictionConfig = FRICTION_CONFIG[data.exit_friction as keyof typeof FRICTION_CONFIG];
  const FrictionIcon = frictionConfig.icon;
  const evidenceTier = EVIDENCE_TIERS[data.evidence_tier as keyof typeof EVIDENCE_TIERS];

  // Calculate risk score
  const riskFactors = [
    data.opacity,
    data.identity_coercion,
    data.unilateral_control,
    data.lock_in_terms,
    data.exit_friction === 'high',
  ].filter(Boolean).length;

  const riskLevel = riskFactors === 0 ? 'low' : riskFactors <= 2 ? 'medium' : 'high';
  const riskColor = {
    low: 'text-green-700',
    medium: 'text-amber-700',
    high: 'text-red-700',
  }[riskLevel];

  return (
    <div className="w-full max-w-2xl bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Asymmetry Report
            </h2>
            <p className="text-sm text-gray-600">
              Structural risk assessment — not ideological judgment
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Exit Friction */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FrictionIcon className="w-4 h-4" />
            Exit Friction
          </h3>
          <div className={cn('p-4 rounded-lg border-2', frictionConfig.color)}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{frictionConfig.label}</span>
              <span className="text-xs opacity-75">{data.exit_friction.toUpperCase()}</span>
            </div>
            <p className="text-sm opacity-90">{frictionConfig.description}</p>
          </div>
        </div>

        {/* Data Demand Ratio */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Data Demand Ratio
            <button className="group relative">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                How much data must you give vs. what you receive? 0.0 = balanced, 1.0 = extractive
              </div>
            </button>
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    data.data_demand_ratio < 0.3 ? 'bg-green-500' :
                    data.data_demand_ratio < 0.7 ? 'bg-amber-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${data.data_demand_ratio * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-12">
                {(data.data_demand_ratio * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {data.data_demand_ratio < 0.3
                ? 'Balanced or generous exchange'
                : data.data_demand_ratio < 0.7
                ? 'Some asymmetry present'
                : 'High extraction risk'}
            </p>
          </div>
        </div>

        {/* Risk Flags */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Risk Flags
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <RiskFlag
              icon={Eye}
              label="Opacity"
              active={data.opacity}
              description="Terms or operations not fully visible"
            />
            <RiskFlag
              icon={Lock}
              label="Identity Coercion"
              active={data.identity_coercion}
              description="Requires real identity revelation"
            />
            <RiskFlag
              icon={Shield}
              label="Unilateral Control"
              active={data.unilateral_control}
              description="One party controls terms/access"
            />
            <RiskFlag
              icon={Lock}
              label="Lock-in Terms"
              active={data.lock_in_terms}
              description="Difficult to revoke or change"
            />
          </div>
        </div>

        {/* Overall Risk Score */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">
              Overall Risk Assessment
            </span>
            <span className={cn('text-2xl font-bold', riskColor)}>
              {riskFactors}/5
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {riskLevel === 'low'
              ? 'This door appears structurally balanced with low asymmetry.'
              : riskLevel === 'medium'
              ? 'Some structural asymmetries present. Review risk flags before entering.'
              : 'High structural asymmetry detected. Proceed with caution.'}
          </p>
        </div>

        {/* Evidence Tier */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Evidence Tier</span>
          </div>
          <span className={cn('px-3 py-1 rounded-full text-xs font-medium', evidenceTier.color)}>
            {evidenceTier.label}
          </span>
        </div>

        {/* Constitutional Note */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900 leading-relaxed">
            <strong>Constitutional Commitment:</strong> Asymmetry reports measure structural power dynamics, not content quality. A high-asymmetry space can still be valuable — you decide if it's worth the trade-offs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// RISK FLAG SUB-COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface RiskFlagProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  description: string;
}

function RiskFlag({ icon: Icon, label, active, description }: RiskFlagProps) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border-2 transition-all',
        active
          ? 'border-red-200 bg-red-50'
          : 'border-gray-200 bg-white opacity-60'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', active ? 'text-red-600' : 'text-gray-400')} />
        <span className={cn('text-sm font-medium', active ? 'text-red-900' : 'text-gray-600')}>
          {label}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-tight">
        {description}
      </p>
      {active && (
        <div className="mt-2 inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
          Present
        </div>
      )}
    </div>
  );
}

