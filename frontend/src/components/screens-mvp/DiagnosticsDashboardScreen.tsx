import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Database, Cpu, HardDrive, Zap, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    details: string;
  }[];
}

interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
  totalReflections: number;
  criticalInterventions: number;
  regenerationRate: number;
}

const mockSystemHealth: SystemHealth = {
  overall: 'healthy',
  components: [
    {
      name: 'Constitutional Enforcement',
      status: 'healthy',
      details: 'All checks passing, 0 bypasses detected',
    },
    {
      name: 'Local Storage',
      status: 'healthy',
      details: '2.3GB used of 5GB allocated',
    },
    {
      name: 'Encryption Layer',
      status: 'healthy',
      details: 'AES-256 active, keys rotated 3 days ago',
    },
    {
      name: 'Model Integrity',
      status: 'warning',
      details: 'Last verification 8 days ago (recommended: weekly)',
    },
    {
      name: 'Sync Engine',
      status: 'healthy',
      details: '3 devices connected, last sync 2 minutes ago',
    },
  ],
};

const mockPerformanceMetrics: PerformanceMetrics = {
  avgResponseTime: 2100,
  p95ResponseTime: 3800,
  p99ResponseTime: 5200,
  successRate: 99.2,
  totalReflections: 1247,
  criticalInterventions: 18,
  regenerationRate: 12.4,
};

export function DiagnosticsDashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity size={32} className="text-[var(--color-accent-blue)]" />
          <h1>System Diagnostics</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Real-time health, performance, and operational metrics
        </p>
      </div>

      {/* System Health Overview */}
      <Card className={`mb-8 ${
        mockSystemHealth.overall === 'healthy' 
          ? 'bg-[var(--color-accent-green)]/5 border-[var(--color-accent-green)]/30'
          : mockSystemHealth.overall === 'warning'
          ? 'bg-[var(--color-accent-orange)]/5 border-[var(--color-accent-orange)]/30'
          : 'bg-[var(--color-accent-red)]/5 border-[var(--color-accent-red)]/30'
      }`}>
        <div className="flex items-start gap-4">
          {mockSystemHealth.overall === 'healthy' ? (
            <CheckCircle size={32} className="text-[var(--color-accent-green)] flex-shrink-0" />
          ) : (
            <AlertTriangle size={32} className="text-[var(--color-accent-orange)] flex-shrink-0" />
          )}
          <div className="flex-1">
            <h2 className="mb-2">System Status: {mockSystemHealth.overall === 'healthy' ? 'Healthy' : 'Needs Attention'}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              All core systems operational. {mockSystemHealth.components.filter(c => c.status === 'warning').length} component(s) need attention.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mockSystemHealth.components.map((component, index) => (
                <ComponentStatus key={index} component={component} />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        <PeriodButton
          active={selectedPeriod === '24h'}
          onClick={() => setSelectedPeriod('24h')}
        >
          24 Hours
        </PeriodButton>
        <PeriodButton
          active={selectedPeriod === '7d'}
          onClick={() => setSelectedPeriod('7d')}
        >
          7 Days
        </PeriodButton>
        <PeriodButton
          active={selectedPeriod === '30d'}
          onClick={() => setSelectedPeriod('30d')}
        >
          30 Days
        </PeriodButton>
        <PeriodButton
          active={selectedPeriod === 'all'}
          onClick={() => setSelectedPeriod('all')}
        >
          All Time
        </PeriodButton>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={<Zap size={24} className="text-[var(--color-accent-blue)]" />}
          label="Avg Response Time"
          value={`${mockPerformanceMetrics.avgResponseTime}ms`}
          trend={-8.2}
          trendLabel="vs last period"
        />
        <MetricCard
          icon={<CheckCircle size={24} className="text-[var(--color-accent-green)]" />}
          label="Success Rate"
          value={`${mockPerformanceMetrics.successRate}%`}
          trend={0.3}
          trendLabel="vs last period"
        />
        <MetricCard
          icon={<Database size={24} className="text-[var(--color-accent-purple)]" />}
          label="Total Reflections"
          value={mockPerformanceMetrics.totalReflections.toString()}
          trend={12.4}
          trendLabel="vs last period"
        />
        <MetricCard
          icon={<AlertTriangle size={24} className="text-[var(--color-accent-orange)]" />}
          label="Critic Interventions"
          value={mockPerformanceMetrics.criticalInterventions.toString()}
          trend={-15.2}
          trendLabel="vs last period"
        />
      </div>

      {/* Detailed Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Response Time Distribution */}
        <Card>
          <h3 className="mb-4">Response Time Distribution</h3>
          <div className="space-y-4">
            <PercentileBar
              label="Average"
              value={mockPerformanceMetrics.avgResponseTime}
              maxValue={mockPerformanceMetrics.p99ResponseTime}
              color="blue"
            />
            <PercentileBar
              label="95th Percentile"
              value={mockPerformanceMetrics.p95ResponseTime}
              maxValue={mockPerformanceMetrics.p99ResponseTime}
              color="purple"
            />
            <PercentileBar
              label="99th Percentile"
              value={mockPerformanceMetrics.p99ResponseTime}
              maxValue={mockPerformanceMetrics.p99ResponseTime}
              color="gold"
            />
          </div>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <h3 className="mb-4">Response Quality</h3>
          <div className="space-y-4">
            <QualityMetric
              label="Constitutional Compliance"
              value={98.6}
              threshold={95}
            />
            <QualityMetric
              label="First-Pass Success Rate"
              value={87.6}
              threshold={80}
            />
            <QualityMetric
              label="Regeneration Rate"
              value={mockPerformanceMetrics.regenerationRate}
              threshold={15}
              inverse
            />
          </div>
        </Card>
      </div>

      {/* Constitutional Enforcement Stats */}
      <Card className="mb-8">
        <h3 className="mb-4">Constitutional Enforcement (Last {selectedPeriod})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ConstitutionalStat
            rule="No Prediction"
            violations={2}
            total={mockPerformanceMetrics.totalReflections}
          />
          <ConstitutionalStat
            rule="No Diagnosis"
            violations={0}
            total={mockPerformanceMetrics.totalReflections}
          />
          <ConstitutionalStat
            rule="No Persuasion"
            violations={12}
            total={mockPerformanceMetrics.totalReflections}
          />
          <ConstitutionalStat
            rule="No Reassurance"
            violations={4}
            total={mockPerformanceMetrics.totalReflections}
          />
          <ConstitutionalStat
            rule="Grounded in Present"
            violations={0}
            total={mockPerformanceMetrics.totalReflections}
          />
        </div>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <HardDrive size={20} className="text-[var(--color-accent-blue)]" />
            <h4>Storage</h4>
          </div>
          <div className="space-y-3">
            <ResourceBar
              label="Reflections"
              used={2.1}
              total={5.0}
              unit="GB"
            />
            <ResourceBar
              label="Media"
              used={0.2}
              total={5.0}
              unit="GB"
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-4">
              Total: 2.3 GB of 5 GB used
            </p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Cpu size={20} className="text-[var(--color-accent-purple)]" />
            <h4>Processing</h4>
          </div>
          <div className="space-y-3">
            <StatRow label="Avg CPU per reflection" value="12%" />
            <StatRow label="Peak CPU usage" value="34%" />
            <StatRow label="Concurrent reflections" value="1" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Database size={20} className="text-[var(--color-accent-green)]" />
            <h4>Sync & Network</h4>
          </div>
          <div className="space-y-3">
            <StatRow label="Devices synced" value="3" />
            <StatRow label="Last sync" value="2 min ago" />
            <StatRow label="Data transferred" value="142 KB" />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <Button variant="secondary">
          Export Diagnostics Report
        </Button>
        <Button variant="secondary">
          Run System Health Check
        </Button>
        <Button variant="secondary">
          Clear Performance Cache
        </Button>
      </div>
    </div>
  );
}

function ComponentStatus({ 
  component 
}: { 
  component: SystemHealth['components'][0] 
}) {
  const getStatusColor = (status: typeof component.status) => {
    switch (status) {
      case 'healthy':
        return 'text-[var(--color-accent-green)]';
      case 'warning':
        return 'text-[var(--color-accent-orange)]';
      case 'critical':
        return 'text-[var(--color-accent-red)]';
    }
  };

  const getStatusIcon = (status: typeof component.status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="text-[var(--color-accent-green)]" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-[var(--color-accent-orange)]" />;
      case 'critical':
        return <AlertTriangle size={16} className="text-[var(--color-accent-red)]" />;
    }
  };

  return (
    <div className="p-3 rounded-lg bg-[var(--color-base-raised)]">
      <div className="flex items-center gap-2 mb-1">
        {getStatusIcon(component.status)}
        <h5 className="text-xs">{component.name}</h5>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        {component.details}
      </p>
    </div>
  );
}

function PeriodButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
        active
          ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/30'
          : 'bg-[var(--color-base-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]'
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  trend, 
  trendLabel 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend: number; 
  trendLabel: string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h5 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          {label}
        </h5>
      </div>
      <p className="text-3xl mb-2">{value}</p>
      <div className="flex items-center gap-1 text-xs">
        <TrendingUp 
          size={12} 
          className={trend > 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}
          style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }}
        />
        <span className={trend > 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
          {Math.abs(trend)}%
        </span>
        <span className="text-[var(--color-text-muted)]">{trendLabel}</span>
      </div>
    </Card>
  );
}

function PercentileBar({ 
  label, 
  value, 
  maxValue, 
  color 
}: { 
  label: string; 
  value: number; 
  maxValue: number; 
  color: 'blue' | 'purple' | 'gold';
}) {
  const percentage = (value / maxValue) * 100;
  const colorClass = {
    blue: 'bg-[var(--color-accent-blue)]',
    purple: 'bg-[var(--color-accent-purple)]',
    gold: 'bg-[var(--color-accent-gold)]',
  }[color];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-sm text-[var(--color-text-muted)]">{value}ms</span>
      </div>
      <div className="h-2 bg-[var(--color-base-raised)] rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function QualityMetric({ 
  label, 
  value, 
  threshold, 
  inverse = false 
}: { 
  label: string; 
  value: number; 
  threshold: number; 
  inverse?: boolean;
}) {
  const isGood = inverse ? value < threshold : value > threshold;
  
  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        <span className={`text-lg ${isGood ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-orange)]'}`}>
          {value.toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-[var(--color-base-default)] rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isGood ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-accent-orange)]'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ConstitutionalStat({ 
  rule, 
  violations, 
  total 
}: { 
  rule: string; 
  violations: number; 
  total: number;
}) {
  const complianceRate = ((total - violations) / total) * 100;
  
  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)]">
      <h5 className="text-xs mb-2 text-[var(--color-text-muted)]">{rule}</h5>
      <p className={`text-2xl mb-1 ${
        violations === 0 
          ? 'text-[var(--color-accent-green)]' 
          : violations < 5 
          ? 'text-[var(--color-accent-orange)]' 
          : 'text-[var(--color-accent-red)]'
      }`}>
        {violations}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        {complianceRate.toFixed(1)}% compliance
      </p>
    </div>
  );
}

function ResourceBar({ 
  label, 
  used, 
  total, 
  unit 
}: { 
  label: string; 
  used: number; 
  total: number; 
  unit: string;
}) {
  const percentage = (used / total) * 100;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">
          {used} {unit} / {total} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-[var(--color-base-default)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--color-accent-blue)] transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-xs text-[var(--color-text-accent)]">{value}</span>
    </div>
  );
}

