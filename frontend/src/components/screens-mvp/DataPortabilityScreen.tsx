import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  Upload,
  HardDrive,
  Shield,
  GitBranch,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export function DataPortabilityScreen({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [storageStats] = useState({
    total: 2847,
    reflections: 2341,
    identities: 23,
    tensions: 12,
    logs: 156,
    forks: 3,
    lastBackup: '2024-12-08 14:32',
    totalSize: '2.3 MB',
  });

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-green)]/20">
            <Package size={32} className="text-[var(--color-accent-green)]" />
          </div>
          <div>
            <h1 className="mb-1">Data Portability</h1>
            <p className="text-[var(--color-text-secondary)]">
              Your data, your formats, your freedom to leave
            </p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                True sovereignty means you can always leave. Export your complete history in open formats, 
                import from other instances, or migrate to any compatible system.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                No proprietary locks. No vendor dependencies. No permission required.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="text-center">
          <HardDrive size={24} className="text-[var(--color-accent-blue)] mx-auto mb-2" />
          <div className="text-2xl mb-1">{storageStats.totalSize}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Total Storage</div>
        </Card>
        <Card className="text-center">
          <Package size={24} className="text-[var(--color-accent-green)] mx-auto mb-2" />
          <div className="text-2xl mb-1">{storageStats.total.toLocaleString()}</div>
          <div className="text-sm text-[var(--color-text-muted)]">Total Items</div>
        </Card>
        <Card className="text-center">
          <Download size={24} className="text-[var(--color-accent-purple)] mx-auto mb-2" />
          <div className="text-2xl mb-1">12</div>
          <div className="text-sm text-[var(--color-text-muted)]">Exports Created</div>
        </Card>
        <Card className="text-center">
          <RefreshCw size={24} className="text-[var(--color-accent-gold)] mx-auto mb-2" />
          <div className="text-2xl mb-1">2 days ago</div>
          <div className="text-sm text-[var(--color-text-muted)]">Last Backup</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Export */}
        <Card>
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-[var(--color-accent-green)]/20">
              <Download size={24} className="text-[var(--color-accent-green)]" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2">Export Your Data</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Download everything in open formats: JSON, Markdown, PDF, or CSV. 
                Take your complete history anywhere.
              </p>
              <div className="space-y-2 mb-4">
                <FeatureItem text="All reflections and Mirrorbacks" />
                <FeatureItem text="Identity graph with connections" />
                <FeatureItem text="Patterns, tensions, and insights" />
                <FeatureItem text="Constitutional logs and fork configs" />
                <FeatureItem text="Encrypted or unencrypted" />
              </div>
              <Button 
                variant="primary"
                onClick={() => onNavigate?.('export')}
              >
                <Download size={16} className="mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </Card>

        {/* Import */}
        <Card>
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-[var(--color-accent-blue)]/20">
              <Upload size={24} className="text-[var(--color-accent-blue)]" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2">Import Data</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Restore from backup, migrate from another device, or merge data 
                from multiple Mirror instances.
              </p>
              <div className="space-y-2 mb-4">
                <FeatureItem text="Automatic format detection" />
                <FeatureItem text="Conflict resolution options" />
                <FeatureItem text="Integrity validation" />
                <FeatureItem text="Safe merging with backups" />
                <FeatureItem text="Backwards compatibility" />
              </div>
              <Button 
                variant="secondary"
                onClick={() => onNavigate?.('import')}
              >
                <Upload size={16} className="mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Breakdown */}
      <Card className="mb-6">
        <h3 className="mb-4">Your Data Breakdown</h3>
        <div className="space-y-3">
          <DataCategoryRow
            label="Reflections & Mirrorbacks"
            count={storageStats.reflections}
            size="890 KB"
            percentage={82}
          />
          <DataCategoryRow
            label="Identity Graph"
            count={storageStats.identities}
            size="156 KB"
            percentage={6}
          />
          <DataCategoryRow
            label="Constitutional Logs"
            count={storageStats.logs}
            size="234 KB"
            percentage={8}
          />
          <DataCategoryRow
            label="Patterns & Tensions"
            count={storageStats.tensions}
            size="89 KB"
            percentage={3}
          />
          <DataCategoryRow
            label="Fork Configurations"
            count={storageStats.forks}
            size="67 KB"
            percentage={1}
          />
        </div>
      </Card>

      {/* Portability Guarantees */}
      <Card>
        <h3 className="mb-4">Portability Guarantees</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GuaranteeCard
            icon={<CheckCircle2 size={20} />}
            title="Open Formats"
            description="All exports use open standards (JSON, Markdown, CSV) readable by any tool"
          />
          <GuaranteeCard
            icon={<CheckCircle2 size={20} />}
            title="No Lock-In"
            description="Your data isn't trapped. Export anytime without restriction or fees"
          />
          <GuaranteeCard
            icon={<CheckCircle2 size={20} />}
            title="Complete Export"
            description="Get everything: every reflection, every pattern, every configuration"
          />
          <GuaranteeCard
            icon={<CheckCircle2 size={20} />}
            title="Re-importable"
            description="All exports can be imported back into any Mirror instance"
          />
          <GuaranteeCard
            icon={<CheckCircle2 size={20} />}
            title="Schema Included"
            description="Every export includes documentation explaining the data structure"
          />
          <GuaranteeCard
            icon={<CheckCircle2 size={20} />}
            title="Privacy Preserved"
            description="Optional encryption ensures your data stays private during transfer"
          />
        </div>
      </Card>

      {/* External Integrations */}
      <Card className="mt-6">
        <h3 className="mb-4">Compatible Systems</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Mirror exports are compatible with these tools and platforms:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <IntegrationCard
            name="Obsidian"
            description="Import as markdown notes with frontmatter"
            supported={true}
          />
          <IntegrationCard
            name="Notion"
            description="Import via CSV or JSON"
            supported={true}
          />
          <IntegrationCard
            name="Roam Research"
            description="Import as daily notes"
            supported={true}
          />
          <IntegrationCard
            name="Logseq"
            description="Markdown format fully compatible"
            supported={true}
          />
          <IntegrationCard
            name="Day One"
            description="Convert reflections to journal entries"
            supported={true}
          />
          <IntegrationCard
            name="Custom Scripts"
            description="JSON format for programmatic access"
            supported={true}
          />
        </div>
      </Card>

      {/* Warning */}
      <Card variant="subtle" className="mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="mb-2">About Data Sovereignty</h4>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              Portability is a constitutional right, not a feature. The Mirror is designed so you can 
              always leave with everything you've created.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              If The Mirror ever fails you, betrays its principles, or simply stops serving your needs—
              export your data and walk away. No vendor lock-in means true sovereignty.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-green)]" />
      <span>{text}</span>
    </div>
  );
}

function DataCategoryRow({
  label,
  count,
  size,
  percentage,
}: {
  label: string;
  count: number;
  size: string;
  percentage: number;
}) {
  return (
    <div className="pb-3 border-b border-[var(--color-border-subtle)] last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm text-[var(--color-text-primary)]">{label}</div>
          <div className="text-xs text-[var(--color-text-muted)]">
            {count.toLocaleString()} items • {size}
          </div>
        </div>
        <div className="text-sm text-[var(--color-text-secondary)]">{percentage}%</div>
      </div>
      <div className="h-1.5 bg-[var(--color-base-raised)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent-blue)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function GuaranteeCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
      <div className="flex items-start gap-3">
        <div className="text-[var(--color-accent-green)] flex-shrink-0">{icon}</div>
        <div>
          <h5 className="text-sm mb-1">{title}</h5>
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({
  name,
  description,
  supported,
}: {
  name: string;
  description: string;
  supported: boolean;
}) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between mb-1">
        <h5 className="text-sm">{name}</h5>
        {supported && (
          <CheckCircle2 size={14} className="text-[var(--color-accent-green)]" />
        )}
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}


