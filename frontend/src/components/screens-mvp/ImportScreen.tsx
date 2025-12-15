import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Database,
  XCircle,
  Info,
} from 'lucide-react';

type ImportStatus = 'idle' | 'validating' | 'validated' | 'importing' | 'success' | 'error';
type ConflictResolution = 'keep-existing' | 'overwrite' | 'merge' | 'create-new';

interface ValidationResult {
  isValid: boolean;
  format: string;
  itemCounts: {
    reflections: number;
    identities: number;
    tensions: number;
    constitutionalLogs: number;
    forkConfigs: number;
  };
  conflicts: {
    type: 'reflection' | 'identity' | 'config';
    existingId: string;
    description: string;
  }[];
  warnings: string[];
  errors: string[];
}

export function ImportScreen() {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('merge');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      validateFile(file);
    }
  };

  const validateFile = (file: File) => {
    setStatus('validating');
    
    // Simulate validation
    setTimeout(() => {
      const mockResult: ValidationResult = {
        isValid: true,
        format: 'JSON v1.3',
        itemCounts: {
          reflections: 847,
          identities: 23,
          tensions: 12,
          constitutionalLogs: 156,
          forkConfigs: 3,
        },
        conflicts: [
          {
            type: 'identity',
            existingId: 'work-self',
            description: 'Identity "Work Self" already exists with different connections',
          },
          {
            type: 'config',
            existingId: 'mirrorback-tone',
            description: 'Fork configuration "Gentle Reflector" conflicts with installed version',
          },
        ],
        warnings: [
          'Import contains 12 reflections from excluded content domains (will be skipped)',
          'Some timestamps are in the future (clock sync issue?)',
        ],
        errors: [],
      };
      
      setValidationResult(mockResult);
      setStatus('validated');
    }, 1500);
  };

  const handleImport = () => {
    setStatus('importing');
    
    // Simulate import
    setTimeout(() => {
      setStatus('success');
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-[var(--color-accent-blue)]/20">
            <Upload size={32} className="text-[var(--color-accent-blue)]" />
          </div>
          <div>
            <h1 className="mb-1">Import Data</h1>
            <p className="text-[var(--color-text-secondary)]">
              Restore from backup or migrate from another Mirror instance
            </p>
          </div>
        </div>

        <Card>
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                Import previously exported data to restore reflections, continue from another device, 
                or merge insights from multiple Mirror instances.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                All imports are validated for integrity and conflicts are resolved safely.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Upload Area */}
      {status === 'idle' && (
        <Card>
          <div className="py-12 text-center">
            <input
              type="file"
              id="import-file"
              accept=".json,.md,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="import-file"
              className="cursor-pointer flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center mb-4">
                <Upload size={32} className="text-[var(--color-accent-blue)]" />
              </div>
              <h3 className="mb-2">Choose a file to import</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                JSON, Markdown, or CSV exported from The Mirror
              </p>
              <Button variant="primary">
                Browse Files
              </Button>
            </label>
          </div>
        </Card>
      )}

      {/* Validating */}
      {status === 'validating' && (
        <Card>
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center mb-4 mx-auto animate-pulse">
              <Database size={32} className="text-[var(--color-accent-blue)]" />
            </div>
            <h3 className="mb-2">Validating import file...</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Checking format, integrity, and conflicts
            </p>
          </div>
        </Card>
      )}

      {/* Validation Results */}
      {status === 'validated' && validationResult && (
        <>
          <Card className="mb-6">
            <div className="flex items-start gap-3 mb-6">
              {validationResult.isValid ? (
                <CheckCircle2 size={24} className="text-[var(--color-accent-green)] flex-shrink-0" />
              ) : (
                <XCircle size={24} className="text-[var(--color-accent-red)] flex-shrink-0" />
              )}
              <div>
                <h3 className="mb-1">
                  {validationResult.isValid ? 'File Validated Successfully' : 'Validation Failed'}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Format: {validationResult.format}
                  {selectedFile && ` • Size: ${(selectedFile.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
            </div>

            {/* Item Counts */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <ItemCount
                label="Reflections"
                count={validationResult.itemCounts.reflections}
              />
              <ItemCount
                label="Identities"
                count={validationResult.itemCounts.identities}
              />
              <ItemCount
                label="Tensions"
                count={validationResult.itemCounts.tensions}
              />
              <ItemCount
                label="Logs"
                count={validationResult.itemCounts.constitutionalLogs}
              />
              <ItemCount
                label="Forks"
                count={validationResult.itemCounts.forkConfigs}
              />
            </div>

            {/* Conflicts */}
            {validationResult.conflicts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm mb-3">Conflicts Detected</h4>
                <div className="space-y-2 mb-4">
                  {validationResult.conflicts.map((conflict, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-sm mb-1">
                            {conflict.type === 'reflection' ? 'Reflection' 
                            : conflict.type === 'identity' ? 'Identity'
                            : 'Configuration'} Conflict
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            {conflict.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conflict Resolution */}
                <div>
                  <h5 className="text-sm mb-3 text-[var(--color-text-secondary)]">
                    How should conflicts be resolved?
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ResolutionOption
                      label="Merge"
                      description="Combine data when possible, keeping both versions"
                      selected={conflictResolution === 'merge'}
                      onClick={() => setConflictResolution('merge')}
                    />
                    <ResolutionOption
                      label="Keep Existing"
                      description="Skip conflicting items, preserve current data"
                      selected={conflictResolution === 'keep-existing'}
                      onClick={() => setConflictResolution('keep-existing')}
                    />
                    <ResolutionOption
                      label="Overwrite"
                      description="Replace existing data with imported version"
                      selected={conflictResolution === 'overwrite'}
                      onClick={() => setConflictResolution('overwrite')}
                    />
                    <ResolutionOption
                      label="Create New"
                      description="Import as separate entities with timestamps"
                      selected={conflictResolution === 'create-new'}
                      onClick={() => setConflictResolution('create-new')}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm mb-3">Warnings</h4>
                <div className="space-y-2">
                  {validationResult.warnings.map((warning, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-base-raised)]"
                    >
                      <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[var(--color-text-muted)]">{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm mb-3">Errors</h4>
                <div className="space-y-2">
                  {validationResult.errors.map((error, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30"
                    >
                      <XCircle size={16} className="text-[var(--color-accent-red)] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[var(--color-text-muted)]">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={!validationResult.isValid}
              >
                {validationResult.conflicts.length > 0
                  ? `Import with ${conflictResolution.replace('-', ' ')}`
                  : 'Import Data'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStatus('idle');
                  setSelectedFile(null);
                  setValidationResult(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>

          {/* Safety Notice */}
          <Card>
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="mb-2">
                  <strong>Import Safety:</strong> All imports create a backup of your current data 
                  before making changes. You can undo this import within 30 days.
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Reflections from excluded content domains (trauma, medical, financial) are automatically 
                  skipped to honor your learning boundaries.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Importing */}
      {status === 'importing' && (
        <Card>
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue)]/20 flex items-center justify-center mb-4 mx-auto animate-pulse">
              <Database size={32} className="text-[var(--color-accent-blue)]" />
            </div>
            <h3 className="mb-2">Importing data...</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Creating backup and merging {validationResult?.itemCounts.reflections} reflections
            </p>
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-[var(--color-base-raised)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-accent-blue)] animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Success */}
      {status === 'success' && validationResult && (
        <Card>
          <div className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-green)]/20 flex items-center justify-center mb-4 mx-auto">
              <CheckCircle2 size={32} className="text-[var(--color-accent-green)]" />
            </div>
            <h3 className="mb-2">Import Complete!</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Successfully imported {validationResult.itemCounts.reflections} reflections and{' '}
              {validationResult.itemCounts.identities} identities
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => window.location.hash = 'history'}
              >
                View Reflections
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setStatus('idle');
                  setSelectedFile(null);
                  setValidationResult(null);
                }}
              >
                Import More
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Import Info */}
      {status === 'idle' && (
        <Card className="mt-6">
          <h3 className="mb-4">Supported Import Sources</h3>
          <div className="space-y-3">
            <ImportSource
              title="Mirror Export Files"
              description="JSON, Markdown, or CSV files exported from any Mirror instance"
              supported={true}
            />
            <ImportSource
              title="Backup Archives"
              description="Complete backup packages with all data and configurations"
              supported={true}
            />
            <ImportSource
              title="Partial Exports"
              description="Import only reflections, identities, or specific data categories"
              supported={true}
            />
            <ImportSource
              title="Legacy Formats"
              description="Older export versions are automatically upgraded during import"
              supported={true}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

function ItemCount({ label, count }: { label: string; count: number }) {
  return (
    <div className="text-center p-3 rounded-lg bg-[var(--color-base-raised)]">
      <div className="text-xl mb-1">{count.toLocaleString()}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

function ResolutionOption({
  label,
  description,
  selected,
  onClick,
  recommended,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-colors text-left relative ${
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
      <div className="text-sm mb-1">{label}</div>
      <div className="text-xs text-[var(--color-text-muted)]">{description}</div>
    </button>
  );
}

function ImportSource({
  title,
  description,
  supported,
}: {
  title: string;
  description: string;
  supported: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-base-raised)]">
      {supported ? (
        <CheckCircle2 size={16} className="text-[var(--color-accent-green)] mt-0.5 flex-shrink-0" />
      ) : (
        <XCircle size={16} className="text-[var(--color-text-muted)] mt-0.5 flex-shrink-0" />
      )}
      <div>
        <div className="text-sm text-[var(--color-text-primary)] mb-0.5">{title}</div>
        <div className="text-xs text-[var(--color-text-muted)]">{description}</div>
      </div>
    </div>
  );
}

