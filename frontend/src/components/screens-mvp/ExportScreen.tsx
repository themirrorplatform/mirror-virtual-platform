import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  FileText,
  Database,
  Shield,
  Package,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  Calendar,
  Network,
  Settings,
} from 'lucide-react';

type ExportFormat = 'json' | 'markdown' | 'pdf' | 'csv';
type ExportScope = 'all' | 'reflections-only' | 'identity-graph' | 'custom';

interface ExportConfig {
  format: ExportFormat;
  scope: ExportScope;
  includeMetadata: boolean;
  includeTimestamps: boolean;
  includeRatings: boolean;
  includeIdentities: boolean;
  includeTensions: boolean;
  includeConstitutionalLogs: boolean;
  includeForkConfigs: boolean;
  encryption: 'none' | 'password' | 'pgp';
}

export function ExportScreen() {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'json',
    scope: 'all',
    includeMetadata: true,
    includeTimestamps: true,
    includeRatings: true,
    includeIdentities: true,
    includeTensions: true,
    includeConstitutionalLogs: true,
    includeForkConfigs: true,
    encryption: 'password',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const updateConfig = <K extends keyof ExportConfig>(key: K, value: ExportConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    setIsExporting(true);
    
    // Generate export data
    const exportData = {
      version: '1.3.0',
      exportedAt: new Date().toISOString(),
      format: config.format,
      encryption: config.encryption,
      data: {
        reflections: config.includeMetadata ? mockReflectionData() : [],
        identities: config.includeIdentities ? mockIdentityData() : [],
        tensions: config.includeTensions ? mockTensionData() : [],
        timestamps: config.includeTimestamps,
        ratings: config.includeRatings,
        constitutionalLogs: config.includeConstitutionalLogs ? mockConstitutionalLogs() : [],
        forkConfigs: config.includeForkConfigs ? mockForkConfigs() : [],
      },
      metadata: {
        estimatedSize: estimatedSize,
        categories: dataCategories,
      }
    };
    
    // Simulate export process
    setTimeout(() => {
      // Create and download file
      const dataStr = config.format === 'json' 
        ? JSON.stringify(exportData, null, 2)
        : convertToMarkdown(exportData);
      
      const blob = new Blob([dataStr], { 
        type: config.format === 'json' ? 'application/json' : 'text/markdown' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mirror-export-${Date.now()}.${config.format === 'json' ? 'json' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsExporting(false);
      setExportComplete(true);
    }, 2000);
  };

  const estimatedSize = calculateEstimatedSize(config);
  const dataCategories = getIncludedCategories(config);

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-green)]/20">
            <Download size={32} className="text-[var(--color-accent-green)]" />
          </div>
          <div>
            <h1 className="mb-1">Export Your Data</h1>
            <p className="text-[var(--color-text-secondary)]">
              Take everything with you—reflections, insights, and sovereignty
            </p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                Your data is yours. Export everything in open formats you can read, edit, and migrate. 
                No proprietary locks, no vendor dependencies, no permission required.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                This isn't just a backup—it's proof you can walk away at any time.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickExportCard
          icon={<Package size={24} />}
          title="Complete Archive"
          description="Everything: reflections, identities, patterns, configs"
          format="JSON + Markdown"
          size="~2.3 MB"
          onClick={() => {
            updateConfig('scope', 'all');
            updateConfig('format', 'json');
          }}
        />
        <QuickExportCard
          icon={<FileText size={24} />}
          title="Reflections Only"
          description="All your writing in human-readable format"
          format="Markdown"
          size="~890 KB"
          onClick={() => {
            updateConfig('scope', 'reflections-only');
            updateConfig('format', 'markdown');
          }}
        />
        <QuickExportCard
          icon={<Network size={24} />}
          title="Identity Graph"
          description="Your identity map with connections"
          format="JSON"
          size="~156 KB"
          onClick={() => {
            updateConfig('scope', 'identity-graph');
            updateConfig('format', 'json');
          }}
        />
      </div>

      {/* Custom Configuration */}
      <Card className="mb-6">
        <h3 className="mb-6">Custom Export</h3>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <h4 className="text-sm mb-3">Export Format</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormatButton
                label="JSON"
                description="Machine-readable"
                selected={config.format === 'json'}
                onClick={() => updateConfig('format', 'json')}
              />
              <FormatButton
                label="Markdown"
                description="Human-readable"
                selected={config.format === 'markdown'}
                onClick={() => updateConfig('format', 'markdown')}
              />
              <FormatButton
                label="PDF"
                description="Print-ready"
                selected={config.format === 'pdf'}
                onClick={() => updateConfig('format', 'pdf')}
              />
              <FormatButton
                label="CSV"
                description="Spreadsheet"
                selected={config.format === 'csv'}
                onClick={() => updateConfig('format', 'csv')}
              />
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <h4 className="text-sm mb-3">What to Include</h4>
            <div className="space-y-2">
              <CheckboxOption
                label="Reflections & Mirrorbacks"
                description="All your writing and Mirror responses"
                checked={config.includeMetadata}
                onChange={(val) => updateConfig('includeMetadata', val)}
              />
              <CheckboxOption
                label="Identity Graph"
                description="Detected identities and their relationships"
                checked={config.includeIdentities}
                onChange={(val) => updateConfig('includeIdentities', val)}
              />
              <CheckboxOption
                label="Patterns & Tensions"
                description="Recurring themes and contradictions"
                checked={config.includeTensions}
                onChange={(val) => updateConfig('includeTensions', val)}
              />
              <CheckboxOption
                label="Timestamps & Metadata"
                description="When reflections occurred and context"
                checked={config.includeTimestamps}
                onChange={(val) => updateConfig('includeTimestamps', val)}
              />
              <CheckboxOption
                label="Your Ratings"
                description="How helpful each Mirrorback was"
                checked={config.includeRatings}
                onChange={(val) => updateConfig('includeRatings', val)}
              />
              <CheckboxOption
                label="Constitutional Audit Logs"
                description="History of governance decisions and violations"
                checked={config.includeConstitutionalLogs}
                onChange={(val) => updateConfig('includeConstitutionalLogs', val)}
              />
              <CheckboxOption
                label="Fork Configurations"
                description="Your custom behavior modifications"
                checked={config.includeForkConfigs}
                onChange={(val) => updateConfig('includeForkConfigs', val)}
              />
            </div>
          </div>

          {/* Encryption */}
          <div>
            <h4 className="text-sm mb-3">Encryption</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <EncryptionOption
                label="None"
                description="Unencrypted export"
                icon={<Eye size={16} />}
                selected={config.encryption === 'none'}
                onClick={() => updateConfig('encryption', 'none')}
              />
              <EncryptionOption
                label="Password Protected"
                description="Industry-standard AES-256 encryption"
                icon={<Lock size={20} />}
                selected={config.encryption === 'password'}
                onClick={() => updateConfig('encryption', 'password')}
              />
              <EncryptionOption
                label="PGP Key"
                description="Public key encryption"
                icon={<Shield size={16} />}
                selected={config.encryption === 'pgp'}
                onClick={() => updateConfig('encryption', 'pgp')}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Export Preview */}
      <Card variant="subtle" className="mb-6">
        <h4 className="mb-4">Export Preview</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Format:</span>
            <span className="text-[var(--color-text-primary)] uppercase">{config.format}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Encryption:</span>
            <span className="text-[var(--color-text-primary)] capitalize">{config.encryption}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Estimated Size:</span>
            <span className="text-[var(--color-text-primary)]">{estimatedSize}</span>
          </div>
          <div className="flex items-start justify-between text-sm">
            <span className="text-[var(--color-text-muted)]">Includes:</span>
            <div className="text-right">
              {dataCategories.map((cat, i) => (
                <div key={i} className="text-[var(--color-text-primary)]">
                  {cat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Export Button */}
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting || exportComplete}
          className="flex-1"
        >
          {isExporting ? (
            <>Generating Export...</>
          ) : exportComplete ? (
            <>
              <CheckCircle2 size={16} className="mr-2" />
              Export Complete
            </>
          ) : (
            <>
              <Download size={16} className="mr-2" />
              Export Data
            </>
          )}
        </Button>
        {exportComplete && (
          <Button variant="ghost" onClick={() => setExportComplete(false)}>
            Export Again
          </Button>
        )}
      </div>

      {/* Export History */}
      <Card className="mt-8">
        <h3 className="mb-4">Recent Exports</h3>
        <div className="space-y-3">
          <ExportHistoryItem
            date="2024-12-08 14:32"
            format="JSON"
            size="2.3 MB"
            scope="Complete Archive"
          />
          <ExportHistoryItem
            date="2024-12-01 09:15"
            format="Markdown"
            size="890 KB"
            scope="Reflections Only"
          />
          <ExportHistoryItem
            date="2024-11-28 16:45"
            format="JSON"
            size="2.1 MB"
            scope="Complete Archive"
          />
        </div>
      </Card>

      {/* Portability Info */}
      <Card variant="subtle" className="mt-6">
        <div className="flex items-start gap-3">
          <Database size={20} className="text-[var(--color-accent-blue)] mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="mb-2">About Portability</h4>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              Your exports are designed for maximum portability:
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-accent-green)]">✓</span>
                <span>Open formats readable by any text editor or database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-accent-green)]">✓</span>
                <span>No proprietary encoding or vendor lock-in</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-accent-green)]">✓</span>
                <span>Can be re-imported into any Mirror instance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-accent-green)]">✓</span>
                <span>Compatible with PKM tools (Obsidian, Notion, Roam)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--color-accent-green)]">✓</span>
                <span>Includes full schema documentation</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function QuickExportCard({
  icon,
  title,
  description,
  format,
  size,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  format: string;
  size: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-all text-left"
    >
      <div className="text-[var(--color-accent-blue)] mb-3">{icon}</div>
      <h4 className="text-sm mb-1">{title}</h4>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">{description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-muted)]">{format}</span>
        <span className="text-[var(--color-text-secondary)]">{size}</span>
      </div>
    </button>
  );
}

function FormatButton({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border transition-colors ${
        selected
          ? 'bg-[var(--color-surface-emphasis)] border-[var(--color-accent-gold)]'
          : 'bg-[var(--color-base-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
      }`}
    >
      <div className="text-sm mb-1">{label}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{description}</div>
    </button>
  );
}

function CheckboxOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 p-3 rounded-lg bg-[var(--color-base-raised)] hover:bg-[var(--color-surface-card)] transition-colors text-left"
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
          checked
            ? 'bg-[var(--color-accent-green)] border-[var(--color-accent-green)]'
            : 'border-[var(--color-border-subtle)]'
        }`}
      >
        {checked && <CheckCircle2 size={14} className="text-white" />}
      </div>
      <div className="flex-1">
        <div className="text-sm text-[var(--color-text-primary)] mb-0.5">{label}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{description}</div>
      </div>
    </button>
  );
}

function EncryptionOption({
  label,
  description,
  icon,
  selected,
  onClick,
  recommended,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-colors relative ${
        selected
          ? 'bg-[var(--color-surface-emphasis)] border-[var(--color-accent-gold)]'
          : 'bg-[var(--color-base-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
      }`}
    >
      {recommended && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
          Recommended
        </span>
      )}
      <div className="text-[var(--color-accent-blue)] mb-2">{icon}</div>
      <div className="text-sm mb-1">{label}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{description}</div>
    </button>
  );
}

function ExportHistoryItem({
  date,
  format,
  size,
  scope,
}: {
  date: string;
  format: string;
  size: string;
  scope: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-base-raised)]">
      <div className="flex items-center gap-3">
        <Calendar size={16} className="text-[var(--color-text-muted)]" />
        <div>
          <div className="text-sm text-[var(--color-text-primary)]">{scope}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{date}</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
        <span className="uppercase">{format}</span>
        <span>{size}</span>
        <button className="text-[var(--color-accent-blue)] hover:underline">
          Download Again
        </button>
      </div>
    </div>
  );
}

function calculateEstimatedSize(config: ExportConfig): string {
  let baseSize = 0;
  
  if (config.includeMetadata) baseSize += 890;
  if (config.includeIdentities) baseSize += 156;
  if (config.includeTensions) baseSize += 89;
  if (config.includeTimestamps) baseSize += 45;
  if (config.includeRatings) baseSize += 12;
  if (config.includeConstitutionalLogs) baseSize += 234;
  if (config.includeForkConfigs) baseSize += 67;
  
  if (config.format === 'pdf') baseSize *= 1.8;
  if (config.format === 'markdown') baseSize *= 1.2;
  
  if (baseSize < 1024) return `${Math.round(baseSize)} KB`;
  return `${(baseSize / 1024).toFixed(1)} MB`;
}

function getIncludedCategories(config: ExportConfig): string[] {
  const categories = [];
  
  if (config.includeMetadata) categories.push('Reflections & Mirrorbacks');
  if (config.includeIdentities) categories.push('Identity Graph');
  if (config.includeTensions) categories.push('Patterns & Tensions');
  if (config.includeTimestamps) categories.push('Timestamps');
  if (config.includeRatings) categories.push('Ratings');
  if (config.includeConstitutionalLogs) categories.push('Constitutional Logs');
  if (config.includeForkConfigs) categories.push('Fork Configurations');
  
  return categories;
}

function mockReflectionData() {
  return [
    {
      id: '1',
      content: 'My first reflection on the day.',
      timestamp: '2024-12-08T14:32:00Z',
      rating: 4,
    },
    {
      id: '2',
      content: 'Thoughts on the project progress.',
      timestamp: '2024-12-08T15:45:00Z',
      rating: 5,
    },
  ];
}

function mockIdentityData() {
  return [
    {
      id: '1',
      name: 'Alice',
      relationships: ['Bob', 'Charlie'],
    },
    {
      id: '2',
      name: 'Bob',
      relationships: ['Alice'],
    },
  ];
}

function mockTensionData() {
  return [
    {
      id: '1',
      description: 'Conflict between project goals and team dynamics.',
      timestamp: '2024-12-08T16:00:00Z',
    },
    {
      id: '2',
      description: 'Disagreement on the best approach to a problem.',
      timestamp: '2024-12-08T17:15:00Z',
    },
  ];
}

function mockConstitutionalLogs() {
  return [
    {
      id: '1',
      action: 'Added new governance rule.',
      timestamp: '2024-12-08T18:30:00Z',
    },
    {
      id: '2',
      action: 'Removed outdated policy.',
      timestamp: '2024-12-08T19:45:00Z',
    },
  ];
}

function mockForkConfigs() {
  return [
    {
      id: '1',
      name: 'Increased response time.',
      timestamp: '2024-12-08T20:00:00Z',
    },
    {
      id: '2',
      name: 'Changed default language.',
      timestamp: '2024-12-08T21:15:00Z',
    },
  ];
}

function convertToMarkdown(data: any): string {
  let markdown = `# Mirror Export\n\n`;
  markdown += `## Metadata\n`;
  markdown += `Version: ${data.version}\n`;
  markdown += `Exported At: ${data.exportedAt}\n`;
  markdown += `Format: ${data.format}\n`;
  markdown += `Encryption: ${data.encryption}\n`;
  markdown += `Estimated Size: ${data.metadata.estimatedSize}\n`;
  markdown += `Includes: ${data.metadata.categories.join(', ')}\n\n`;
  
  markdown += `## Data\n`;
  markdown += `### Reflections\n`;
  data.data.reflections.forEach((reflection: any) => {
    markdown += `#### Reflection ${reflection.id}\n`;
    markdown += `Content: ${reflection.content}\n`;
    markdown += `Timestamp: ${reflection.timestamp}\n`;
    markdown += `Rating: ${reflection.rating}\n\n`;
  });
  
  markdown += `### Identities\n`;
  data.data.identities.forEach((identity: any) => {
    markdown += `#### Identity ${identity.id}\n`;
    markdown += `Name: ${identity.name}\n`;
    markdown += `Relationships: ${identity.relationships.join(', ')}\n\n`;
  });
  
  markdown += `### Tensions\n`;
  data.data.tensions.forEach((tension: any) => {
    markdown += `#### Tension ${tension.id}\n`;
    markdown += `Description: ${tension.description}\n`;
    markdown += `Timestamp: ${tension.timestamp}\n\n`;
  });
  
  markdown += `### Constitutional Logs\n`;
  data.data.constitutionalLogs.forEach((log: any) => {
    markdown += `#### Log ${log.id}\n`;
    markdown += `Action: ${log.action}\n`;
    markdown += `Timestamp: ${log.timestamp}\n\n`;
  });
  
  markdown += `### Fork Configurations\n`;
  data.data.forkConfigs.forEach((config: any) => {
    markdown += `#### Config ${config.id}\n`;
    markdown += `Name: ${config.name}\n`;
    markdown += `Timestamp: ${config.timestamp}\n\n`;
  });
  
  return markdown;
}

