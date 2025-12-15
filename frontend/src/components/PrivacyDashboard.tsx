/**
 * Privacy Dashboard - Constitutional Transparency
 * Shows data flow, processing, and user controls
 */

import { Shield, Eye, Database, Lock, Download } from 'lucide-react';

interface PrivacyDashboardProps {
  className?: string;
}

export function PrivacyDashboard({ className = '' }: PrivacyDashboardProps) {
  const dataCategories = [
    {
      name: 'Reflections',
      icon: <Database size={20} />,
      status: 'Local + Encrypted',
      color: 'text-green-500',
      count: '42 stored',
    },
    {
      name: 'Identity Graph',
      icon: <Eye size={20} />,
      status: 'Private',
      color: 'text-blue-500',
      count: '12 axes',
    },
    {
      name: 'AI Processing',
      icon: <Shield size={20} />,
      status: 'Opt-in Only',
      color: 'text-[var(--color-accent-gold)]',
      count: 'Never automatic',
    },
  ];

  const principles = [
    'You own all your data',
    'Export anytime, any format',
    'AI never required',
    'No tracking or analytics',
    'Local-first processing',
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-xl font-serif text-[var(--color-accent-gold)] mb-2">
          Privacy Dashboard
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Constitutional transparency: you see everything we do
        </p>
      </div>

      {/* Data Categories */}
      <div className="space-y-3">
        {dataCategories.map((category) => (
          <div
            key={category.name}
            className="p-4 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-black/20 ${category.color}`}>
                  {category.icon}
                </div>
                <div>
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {category.name}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {category.status}
                  </div>
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {category.count}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Constitutional Principles */}
      <div className="p-4 bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 rounded-lg">
        <h4 className="text-sm font-medium text-[var(--color-accent-gold)] mb-3 flex items-center gap-2">
          <Lock size={16} />
          Constitutional Guarantees
        </h4>
        <ul className="space-y-2">
          {principles.map((principle) => (
            <li
              key={principle}
              className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)]" />
              {principle}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-base-raised)] transition-all flex items-center justify-center gap-2">
          <Download size={16} />
          Export All Data
        </button>
        <button className="flex-1 px-4 py-2 bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] rounded-lg hover:bg-[var(--color-accent-gold)]/30 transition-all flex items-center justify-center gap-2">
          <Shield size={16} />
          View Audit Log
        </button>
      </div>

      <div className="text-xs text-[var(--color-text-muted)] text-center pt-4 border-t border-[var(--color-border-subtle)]">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}
