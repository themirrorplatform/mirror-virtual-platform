/**
 * Constitutional Health Panel
 * 
 * Constitutional Principles:
 * - System displays its own adherence
 * - Violations visible to user
 * - Sovereignty score transparent
 * - Audit is educational, not punitive
 */

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import { constitutionalAudit, AuditReport } from '../../services/constitutionalAudit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function ConstitutionalHealthPanel() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    runAudit();
  }, []);

  const runAudit = async () => {
    setIsLoading(true);
    try {
      const newReport = await constitutionalAudit.audit();
      setReport(newReport);
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!report) return;

    const markdown = await constitutionalAudit.generateReport();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `constitutional-audit-${Date.now()}.md`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  if (!report) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin">
          <Shield size={32} className="text-[var(--color-accent-gold)]" />
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'var(--color-accent-green)';
    if (score >= 70) return 'var(--color-accent-gold)';
    return 'var(--color-accent-red)';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3>Constitutional Health</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={runAudit}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(${getScoreColor(report.score)} ${report.score}%, var(--color-border-subtle) ${report.score}%)`,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-[var(--color-bg-primary)] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-medium">{report.score}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">/ 100</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-lg font-medium mb-1" style={{ color: getScoreColor(report.score) }}>
              {getScoreLabel(report.score)}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {report.healthy 
                ? 'System maintains constitutional alignment' 
                : 'Some principles need attention'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Data Sovereignty */}
      <Card>
        <h4 className="mb-3">Data Sovereignty</h4>
        <div className="space-y-2">
          <StatusRow 
            label="Data Portability" 
            value={report.sovereignty.dataPortability}
            description="Can export all data"
          />
          <StatusRow 
            label="Local-First" 
            value={report.sovereignty.localFirst}
            description="Data stored locally"
          />
          <StatusRow 
            label="User Control" 
            value={report.sovereignty.userControl}
            description="User can delete all data"
          />
          <StatusRow 
            label="No Tracking" 
            value={report.sovereignty.noTracking}
            description="No analytics or tracking"
          />
          <StatusRow 
            label="Explicit Consent" 
            value={report.sovereignty.explicitConsent}
            description="User consents to all actions"
          />
        </div>
      </Card>

      {/* Privacy */}
      <Card>
        <h4 className="mb-3">Privacy</h4>
        <div className="space-y-2">
          <StatusRow 
            label="Encryption Available" 
            value={report.privacy.encryptionAvailable}
            description="Browser supports encryption"
          />
          <StatusRow 
            label="Encryption Enabled" 
            value={report.privacy.encryptionEnabled}
            description="Reflections are encrypted"
            optional
          />
          <StatusRow 
            label="No External Calls" 
            value={report.privacy.noExternalCalls}
            description="No data sent externally"
          />
          <StatusRow 
            label="Offline Capable" 
            value={report.privacy.offlineCapable}
            description="Works without internet"
          />
        </div>
      </Card>

      {/* UX Principles */}
      <Card>
        <h4 className="mb-3">UX Principles</h4>
        <div className="space-y-2">
          <StatusRow 
            label="No Metrics" 
            value={report.ux.noMetrics}
            description="No word counts or stats"
          />
          <StatusRow 
            label="No Gamification" 
            value={report.ux.noGamification}
            description="No streaks or badges"
          />
          <StatusRow 
            label="No Pressure" 
            value={report.ux.noPressure}
            description="No urgency or deadlines"
          />
          <StatusRow 
            label="Silence First" 
            value={report.ux.silenceFirst}
            description="Minimal, quiet interface"
          />
        </div>
      </Card>

      {/* Violations */}
      {report.violations.length > 0 && (
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-[var(--color-accent-amber)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="mb-1">Violations Detected ({report.violations.length})</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                The following constitutional principles were violated:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {report.violations.map((violation, index) => (
              <div 
                key={index}
                className="p-3 bg-[var(--color-bg-secondary)] rounded-lg"
              >
                <div className="flex items-start gap-2 mb-1">
                  <span className={`text-xs uppercase font-medium ${
                    violation.severity === 'critical' 
                      ? 'text-[var(--color-accent-red)]' 
                      : 'text-[var(--color-accent-amber)]'
                  }`}>
                    {violation.severity}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {violation.type}
                  </span>
                </div>
                <p className="text-sm mb-1">{violation.description}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Location: {violation.location}
                </p>
                {violation.suggestion && (
                  <p className="text-xs text-[var(--color-accent-blue)] mt-2">
                    → {violation.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Violations */}
      {report.violations.length === 0 && (
        <Card>
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-[var(--color-accent-green)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="mb-1">No Violations Detected</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                System maintains full constitutional compliance
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Export */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportReport}
        >
          <Download size={16} />
          Export Report
        </Button>
      </div>

      {/* Last Audit */}
      <p className="text-xs text-[var(--color-text-muted)] text-center">
        Last audited: {report.lastAudit.toLocaleString()}
      </p>
    </div>
  );
}

/**
 * Status Row Component
 */
function StatusRow({ 
  label, 
  value, 
  description,
  optional = false,
}: { 
  label: string; 
  value: boolean; 
  description: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-[var(--color-surface-hover)]">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm">{label}</p>
          {optional && (
            <span className="text-xs text-[var(--color-text-muted)]">(optional)</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <div>
        {value ? (
          <CheckCircle size={18} className="text-[var(--color-accent-green)]" />
        ) : (
          <AlertTriangle size={18} className="text-[var(--color-text-muted)]" />
        )}
      </div>
    </div>
  );
}


