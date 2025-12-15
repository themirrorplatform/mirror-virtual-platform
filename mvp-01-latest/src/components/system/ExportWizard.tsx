/**
 * Export Wizard - Guide users through data export
 * 
 * Features:
 * - Step-by-step export process
 * - Format selection (JSON, Markdown, PDF)
 * - Date range selector
 * - Content type selection
 * - Include/exclude options
 * - Privacy review
 * - Download progress
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download,
  FileText,
  FileJson,
  File,
  Calendar,
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface ExportWizardProps {
  onExport: (config: ExportConfig) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

interface ExportConfig {
  format: 'json' | 'markdown' | 'pdf';
  dateRange: 'all' | '7d' | '30d' | '90d' | 'custom';
  customDateStart?: Date;
  customDateEnd?: Date;
  includeTypes: string[];
  includePrivate: boolean;
  includeMetadata: boolean;
  includeAttachments: boolean;
}

type ExportStep = 'format' | 'content' | 'options' | 'review' | 'export';

const FORMAT_CONFIG = {
  json: {
    label: 'JSON',
    description: 'Machine-readable format for importing elsewhere',
    icon: FileJson,
    color: '#3B82F6',
    features: ['Complete data', 'Metadata included', 'Easy to process'],
  },
  markdown: {
    label: 'Markdown',
    description: 'Human-readable text format',
    icon: FileText,
    color: '#8B5CF6',
    features: ['Readable text', 'Portable', 'Version control friendly'],
  },
  pdf: {
    label: 'PDF',
    description: 'Printable document format',
    icon: File,
    color: '#10B981',
    features: ['Printable', 'Fixed layout', 'Easy to share'],
  },
};

export function ExportWizard({ onExport, onCancel, isOpen }: ExportWizardProps) {
  const [step, setStep] = useState<ExportStep>('format');
  const [config, setConfig] = useState<ExportConfig>({
    format: 'json',
    dateRange: 'all',
    includeTypes: ['reflection', 'mirrorback', 'thread', 'response'],
    includePrivate: true,
    includeMetadata: true,
    includeAttachments: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const steps: ExportStep[] = ['format', 'content', 'options', 'review', 'export'];
  const currentStepIndex = steps.indexOf(step);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setStep('export');
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      setExportProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await onExport(config);
    setIsExporting(false);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Download size={24} className="text-[var(--color-accent-blue)]" />
                <div>
                  <h2 className="mb-1">Export Your Data</h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Step {currentStepIndex + 1} of {steps.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-[var(--color-accent-blue)] rounded-full"
              />
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {step === 'format' && (
                <FormatStep config={config} setConfig={setConfig} />
              )}
              {step === 'content' && (
                <ContentStep config={config} setConfig={setConfig} />
              )}
              {step === 'options' && (
                <OptionsStep config={config} setConfig={setConfig} />
              )}
              {step === 'review' && (
                <ReviewStep config={config} />
              )}
              {step === 'export' && (
                <ExportStep progress={exportProgress} isComplete={exportProgress === 100} />
              )}
            </AnimatePresence>

            {/* Actions */}
            {step !== 'export' && (
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
                <Button
                  variant="ghost"
                  onClick={currentStepIndex === 0 ? onCancel : handleBack}
                >
                  <ChevronLeft size={16} className="mr-2" />
                  {currentStepIndex === 0 ? 'Cancel' : 'Back'}
                </Button>

                <Button
                  variant="primary"
                  onClick={step === 'review' ? handleExport : handleNext}
                  disabled={isExporting}
                >
                  {step === 'review' ? 'Export' : 'Continue'}
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Step Components

function FormatStep({ config, setConfig }: { config: ExportConfig; setConfig: (c: ExportConfig) => void }) {
  return (
    <motion.div
      key="format"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h3 className="mb-2">Choose Export Format</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Select the format that best suits your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(FORMAT_CONFIG).map(([key, formatConfig]) => {
          const Icon = formatConfig.icon;
          const isSelected = config.format === key;

          return (
            <button
              key={key}
              onClick={() => setConfig({ ...config, format: key as ExportConfig['format'] })}
              className={`p-4 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-2 shadow-md'
                  : 'border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-blue)]'
              }`}
              style={{
                borderColor: isSelected ? formatConfig.color : undefined,
                backgroundColor: isSelected ? `${formatConfig.color}10` : undefined,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon size={24} style={{ color: formatConfig.color }} />
                <h4 className="font-medium">{formatConfig.label}</h4>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                {formatConfig.description}
              </p>
              <ul className="space-y-1">
                {formatConfig.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Check size={12} className="text-[var(--color-accent-green)]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ContentStep({ config, setConfig }: { config: ExportConfig; setConfig: (c: ExportConfig) => void }) {
  const contentTypes = [
    { id: 'reflection', label: 'Reflections', description: 'Your main writing' },
    { id: 'mirrorback', label: 'Mirrorbacks', description: 'AI reflections' },
    { id: 'thread', label: 'Threads', description: 'Conversation threads' },
    { id: 'response', label: 'Responses', description: 'Commons responses' },
  ];

  return (
    <motion.div
      key="content"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h3 className="mb-2">Select Content</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Choose what to include in your export
        </p>
      </div>

      {/* Content Types */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium">Content Types</h5>
        <div className="space-y-2">
          {contentTypes.map((type) => (
            <label
              key={type.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer hover:bg-[var(--color-accent-blue)]/10"
            >
              <input
                type="checkbox"
                checked={config.includeTypes.includes(type.id)}
                onChange={(e) => {
                  setConfig({
                    ...config,
                    includeTypes: e.target.checked
                      ? [...config.includeTypes, type.id]
                      : config.includeTypes.filter((t) => t !== type.id),
                  });
                }}
                className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
              />
              <div>
                <span className="text-sm font-medium block mb-1">{type.label}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{type.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium">Date Range</h5>
        <div className="flex flex-wrap gap-2">
          {(['all', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setConfig({ ...config, dateRange: range })}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                config.dateRange === range
                  ? 'bg-[var(--color-accent-blue)] text-white'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function OptionsStep({ config, setConfig }: { config: ExportConfig; setConfig: (c: ExportConfig) => void }) {
  return (
    <motion.div
      key="options"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h3 className="mb-2">Export Options</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Configure additional export settings
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer">
          <input
            type="checkbox"
            checked={config.includePrivate}
            onChange={(e) => setConfig({ ...config, includePrivate: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Include Private Content</span>
              {config.includePrivate ? <Eye size={14} /> : <EyeOff size={14} />}
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              Export content marked as private or personal
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer">
          <input
            type="checkbox"
            checked={config.includeMetadata}
            onChange={(e) => setConfig({ ...config, includeMetadata: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
          />
          <div>
            <span className="text-sm font-medium block mb-1">Include Metadata</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              Timestamps, tags, lens information, and other metadata
            </span>
          </div>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-hover)] cursor-pointer">
          <input
            type="checkbox"
            checked={config.includeAttachments}
            onChange={(e) => setConfig({ ...config, includeAttachments: e.target.checked })}
            className="mt-1 w-5 h-5 rounded border-[var(--color-border-subtle)]"
          />
          <div>
            <span className="text-sm font-medium block mb-1">Include Attachments</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              Images, files, and other attached content (may increase file size)
            </span>
          </div>
        </label>
      </div>
    </motion.div>
  );
}

function ReviewStep({ config }: { config: ExportConfig }) {
  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div>
        <h3 className="mb-2">Review & Confirm</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Double-check your export settings before proceeding
        </p>
      </div>

      <Card variant="emphasis">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-[var(--color-text-muted)]">Format</span>
              <p className="text-sm font-medium">{FORMAT_CONFIG[config.format].label}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)]">Date Range</span>
              <p className="text-sm font-medium">
                {config.dateRange === 'all' ? 'All Time' : `Last ${config.dateRange.toUpperCase()}`}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs text-[var(--color-text-muted)]">Content Types</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.includeTypes.map((type) => (
                <Badge key={type} variant="secondary" size="sm">
                  {type}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-[var(--color-text-muted)]">Options</span>
            <ul className="mt-1 space-y-1 text-sm">
              {config.includePrivate && <li>✓ Private content included</li>}
              {config.includeMetadata && <li>✓ Metadata included</li>}
              {config.includeAttachments && <li>✓ Attachments included</li>}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>Your data stays private.</strong> This export happens entirely on your 
              device. Nothing is sent to external servers.
            </p>
            <p className="text-[var(--color-text-muted)]">
              The exported file will download to your device. Store it securely.
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ExportStep({ progress, isComplete }: { progress: number; isComplete: boolean }) {
  return (
    <motion.div
      key="export"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        {isComplete ? (
          <>
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-green)]/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-[var(--color-accent-green)]" />
            </div>
            <h3 className="mb-2">Export Complete!</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your data has been exported successfully
            </p>
          </>
        ) : (
          <>
            <Download size={48} className="mx-auto mb-4 text-[var(--color-accent-blue)]" />
            <h3 className="mb-2">Exporting...</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Please wait while we prepare your data
            </p>
          </>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-muted)]">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-[var(--color-accent-blue)] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}

export type { ExportConfig };
