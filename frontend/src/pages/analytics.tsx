/**
 * Analytics Page
 * 
 * Differential privacy metrics and insights
 */

import { useUIMode } from '@/contexts/UIModeContext';
import { BarChart, TrendingUp, Users, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  const { isSimpleMode } = useUIMode();

  const stats = [
    {
      label: 'Total Reflections',
      value: '127',
      change: '+12%',
      icon: Activity,
    },
    {
      label: 'Identity Nodes',
      value: '23',
      change: '+3',
      icon: TrendingUp,
    },
    {
      label: 'Patterns Detected',
      value: '8',
      change: '+2',
      icon: BarChart,
    },
    {
      label: 'Active Days',
      value: '45',
      change: '93%',
      icon: Users,
    },
  ];

  const content = (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className="w-5 h-5 text-[var(--color-accent-violet)]" />
                <span className="text-xs text-[var(--color-accent-green)]">{stat.change}</span>
              </div>
              <div className="text-3xl font-semibold text-[var(--color-text-primary)] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--color-text-muted)]">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Privacy Notice */}
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Differential Privacy (ε=0.1)
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          All analytics use differential privacy with epsilon=0.1, ensuring mathematical privacy guarantees.
          Noise is added to prevent identification while maintaining statistical utility.
        </p>
      </div>

      {/* Placeholder for charts */}
      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Reflection Activity
        </h3>
        <div className="h-64 flex items-center justify-center text-[var(--color-text-muted)]">
          <div className="text-center">
            <BarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Charts coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isSimpleMode) {
    return (
      <div className="h-full flex flex-col">
        <header className="border-b border-[var(--color-border-subtle)] px-6 py-4">
          <h1 className="text-2xl font-serif text-[var(--color-accent-gold)]">Analytics</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Privacy-preserving insights • Differential privacy ε=0.1
          </p>
        </header>
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto custom-scrollbar p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-[var(--color-accent-gold)] mb-2">Analytics</h1>
          <p className="text-[var(--color-text-secondary)]">
            Privacy-preserving insights with differential privacy
          </p>
        </div>
        {content}
      </div>
    </div>
  );
}
