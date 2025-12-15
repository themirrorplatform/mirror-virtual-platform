import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle, Zap, Brain, Shield } from 'lucide-react';

interface ProcessingStep {
  id: string;
  name: string;
  status: 'success' | 'warning' | 'error' | 'processing';
  duration: number;
  details: any;
}

interface ConstitutionalCheck {
  rule: string;
  passed: boolean;
  reasoning: string;
  action?: string;
}

interface ReflectionInternals {
  id: string;
  timestamp: string;
  userInput: string;
  finalResponse: string;
  processingSteps: ProcessingStep[];
  constitutionalChecks: ConstitutionalCheck[];
  modelParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
    model: string;
  };
  latency: {
    total: number;
    modelInference: number;
    safetyChecks: number;
    responseGeneration: number;
  };
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  critiques: Array<{
    issue: string;
    severity: 'low' | 'medium' | 'high';
    originalText: string;
    correction: string;
  }>;
}

const mockReflection: ReflectionInternals = {
  id: 'refl_abc123',
  timestamp: '2025-12-09T14:32:18Z',
  userInput: 'I keep putting off this conversation with my manager. I know I should do it but I just... don{"\u2019"}t.',
  finalResponse: 'You notice resistance to having the conversation. What does "should" feel like in your body right now?',
  processingSteps: [
    {
      id: 'step_1',
      name: 'Input Validation',
      status: 'success',
      duration: 12,
      details: { validated: true, encoding: 'utf-8', sanitized: false },
    },
    {
      id: 'step_2',
      name: 'Safety Classification',
      status: 'success',
      duration: 45,
      details: { 
        crisisDetected: false, 
        selfHarmRisk: 0.02,
        violenceRisk: 0.01,
        privacyLeakage: 0.0,
      },
    },
    {
      id: 'step_3',
      name: 'Constitutional Pre-Check',
      status: 'warning',
      duration: 34,
      details: { 
        potentialViolations: ['Detected "should" language - user may be seeking motivation'],
        requiresRedirection: true,
      },
    },
    {
      id: 'step_4',
      name: 'Model Inference',
      status: 'success',
      duration: 1240,
      details: { 
        model: 'mirror-base-v2.1',
        iterations: 1,
        temperatureUsed: 0.7,
      },
    },
    {
      id: 'step_5',
      name: 'Critic Evaluation',
      status: 'warning',
      duration: 156,
      details: { 
        issuesFound: 2,
        regenerationTriggered: true,
        reason: 'Response contained directive language',
      },
    },
    {
      id: 'step_6',
      name: 'Response Regeneration',
      status: 'success',
      duration: 1180,
      details: { 
        attempt: 2,
        passed: true,
      },
    },
    {
      id: 'step_7',
      name: 'Final Constitutional Check',
      status: 'success',
      duration: 28,
      details: { 
        allRulesPassed: true,
        readyForDelivery: true,
      },
    },
  ],
  constitutionalChecks: [
    {
      rule: 'No Prediction',
      passed: true,
      reasoning: 'Response does not predict outcomes or make claims about the future',
    },
    {
      rule: 'No Diagnosis',
      passed: true,
      reasoning: 'Response does not label mental states or diagnose conditions',
    },
    {
      rule: 'No Persuasion',
      passed: true,
      reasoning: 'Response reflects rather than motivates or advises action',
    },
    {
      rule: 'No Reassurance',
      passed: true,
      reasoning: 'Response does not promise positive outcomes or minimize difficulty',
    },
    {
      rule: 'Grounded in Present',
      passed: true,
      reasoning: 'Response focuses on immediate sensory/emotional experience',
    },
  ],
  modelParams: {
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 150,
    model: 'mirror-base-v2.1',
  },
  latency: {
    total: 2695,
    modelInference: 2420,
    safetyChecks: 107,
    responseGeneration: 168,
  },
  tokenUsage: {
    input: 234,
    output: 47,
    total: 281,
  },
  critiques: [
    {
      issue: 'Directive language detected',
      severity: 'high',
      originalText: 'Have you thought about just scheduling the meeting?',
      correction: 'Removed - violates no-persuasion rule',
    },
    {
      issue: 'Prediction/outcome language',
      severity: 'medium',
      originalText: 'Once you do it, you{"\u2019"}ll probably feel relieved.',
      correction: 'Removed - violates no-prediction rule',
    },
  ],
};

export function ReflectionInternalsScreen() {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<'timeline' | 'constitutional' | 'critique' | 'performance'>('timeline');

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-[var(--color-accent-green)]" />;
      case 'warning':
        return <AlertCircle size={16} className="text-[var(--color-accent-orange)]" />;
      case 'error':
        return <XCircle size={16} className="text-[var(--color-accent-red)]" />;
      case 'processing':
        return <Zap size={16} className="text-[var(--color-accent-blue)] animate-pulse" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Code size={32} className="text-[var(--color-accent-blue)]" />
          <h1>Reflection Internals</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Developer view: What happens under the hood when The Mirror responds
        </p>
      </div>

      {/* User Input & Final Response */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h4 className="mb-3 text-[var(--color-text-muted)] uppercase text-xs tracking-wide">
            User Input
          </h4>
          <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
            {mockReflection.userInput}
          </p>
        </Card>

        <Card className="bg-[var(--color-accent-gold)]/5 border-[var(--color-accent-gold)]/30">
          <h4 className="mb-3 text-[var(--color-accent-gold)] uppercase text-xs tracking-wide">
            Final Response
          </h4>
          <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
            {mockReflection.finalResponse}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--color-border-subtle)]">
        <TabButton
          active={selectedTab === 'timeline'}
          onClick={() => setSelectedTab('timeline')}
        >
          Processing Timeline
        </TabButton>
        <TabButton
          active={selectedTab === 'constitutional'}
          onClick={() => setSelectedTab('constitutional')}
        >
          Constitutional Checks
        </TabButton>
        <TabButton
          active={selectedTab === 'critique'}
          onClick={() => setSelectedTab('critique')}
        >
          Critic Interventions
        </TabButton>
        <TabButton
          active={selectedTab === 'performance'}
          onClick={() => setSelectedTab('performance')}
        >
          Performance Metrics
        </TabButton>
      </div>

      {/* Tab Content */}
      {selectedTab === 'timeline' && (
        <div className="space-y-3">
          {mockReflection.processingSteps.map((step, index) => (
            <Card key={step.id} className="hover:border-[var(--color-accent-gold)] transition-colors">
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {expandedSteps.has(step.id) ? (
                    <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
                  ) : (
                    <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                  )}
                  {getStatusIcon(step.status)}
                  <div className="text-left">
                    <h5 className="text-sm">
                      {index + 1}. {step.name}
                    </h5>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {step.duration}ms
                    </p>
                  </div>
                </div>
              </button>

              {expandedSteps.has(step.id) && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                  <pre className="text-xs bg-[var(--color-base-raised)] p-4 rounded-lg overflow-x-auto text-[var(--color-text-secondary)]">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'constitutional' && (
        <div className="space-y-4">
          <Card className="bg-[var(--color-accent-green)]/5 border-[var(--color-accent-green)]/30 mb-6">
            <div className="flex items-start gap-3">
              <Shield size={24} className="text-[var(--color-accent-green)] flex-shrink-0 mt-1" />
              <div>
                <h4 className="mb-2">All Constitutional Rules Passed</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  This response adheres to all constitutional boundaries and can be delivered.
                </p>
              </div>
            </div>
          </Card>

          {mockReflection.constitutionalChecks.map((check, index) => (
            <Card key={index}>
              <div className="flex items-start gap-3 mb-3">
                {check.passed ? (
                  <CheckCircle size={20} className="text-[var(--color-accent-green)] flex-shrink-0 mt-1" />
                ) : (
                  <XCircle size={20} className="text-[var(--color-accent-red)] flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <h5 className="mb-2">{check.rule}</h5>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                    {check.reasoning}
                  </p>
                  {check.action && (
                    <div className="p-3 rounded-lg bg-[var(--color-accent-orange)]/10 border border-[var(--color-accent-orange)]/30">
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-accent-orange)]">Action: </span>
                        {check.action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'critique' && (
        <div className="space-y-4">
          <Card className="bg-[var(--color-accent-orange)]/5 border-[var(--color-accent-orange)]/30 mb-6">
            <div className="flex items-start gap-3">
              <Brain size={24} className="text-[var(--color-accent-orange)] flex-shrink-0 mt-1" />
              <div>
                <h4 className="mb-2">Critic Detected {mockReflection.critiques.length} Issues</h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  The initial response violated constitutional rules and was regenerated.
                </p>
              </div>
            </div>
          </Card>

          {mockReflection.critiques.map((critique, index) => (
            <Card key={index}>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className={
                  critique.severity === 'high' ? 'text-[var(--color-accent-red)]' :
                  critique.severity === 'medium' ? 'text-[var(--color-accent-orange)]' :
                  'text-[var(--color-accent-blue)]'
                } />
                <h5 className="text-sm">{critique.issue}</h5>
                <span className={`ml-auto px-2 py-1 rounded text-xs ${
                  critique.severity === 'high' ? 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]' :
                  critique.severity === 'medium' ? 'bg-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]' :
                  'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                }`}>
                  {critique.severity}
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30">
                  <p className="text-xs text-[var(--color-accent-red)] uppercase tracking-wide mb-1">
                    Original (Rejected)
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] line-through">
                    {critique.originalText}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30">
                  <p className="text-xs text-[var(--color-accent-green)] uppercase tracking-wide mb-1">
                    Correction
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {critique.correction}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'performance' && (
        <div className="space-y-6">
          {/* Latency Breakdown */}
          <Card>
            <h4 className="mb-4">Latency Breakdown</h4>
            <div className="space-y-4">
              <LatencyBar
                label="Model Inference"
                value={mockReflection.latency.modelInference}
                total={mockReflection.latency.total}
                color="blue"
              />
              <LatencyBar
                label="Response Generation"
                value={mockReflection.latency.responseGeneration}
                total={mockReflection.latency.total}
                color="purple"
              />
              <LatencyBar
                label="Safety Checks"
                value={mockReflection.latency.safetyChecks}
                total={mockReflection.latency.total}
                color="green"
              />
              <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Latency</span>
                  <span className="text-sm text-[var(--color-accent-gold)]">
                    {mockReflection.latency.total}ms
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Token Usage */}
          <Card>
            <h4 className="mb-4">Token Usage</h4>
            <div className="grid grid-cols-3 gap-4">
              <MetricCard
                label="Input"
                value={mockReflection.tokenUsage.input}
                color="blue"
              />
              <MetricCard
                label="Output"
                value={mockReflection.tokenUsage.output}
                color="purple"
              />
              <MetricCard
                label="Total"
                value={mockReflection.tokenUsage.total}
                color="gold"
              />
            </div>
          </Card>

          {/* Model Parameters */}
          <Card>
            <h4 className="mb-4">Model Parameters</h4>
            <div className="space-y-3">
              <ParamRow label="Model" value={mockReflection.modelParams.model} />
              <ParamRow label="Temperature" value={mockReflection.modelParams.temperature.toString()} />
              <ParamRow label="Top P" value={mockReflection.modelParams.topP.toString()} />
              <ParamRow label="Max Tokens" value={mockReflection.modelParams.maxTokens.toString()} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function TabButton({ 
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
      className={`px-4 py-2 text-sm transition-colors border-b-2 ${
        active
          ? 'text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]'
          : 'text-[var(--color-text-muted)] border-transparent hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

function LatencyBar({ 
  label, 
  value, 
  total, 
  color 
}: { 
  label: string; 
  value: number; 
  total: number; 
  color: 'blue' | 'purple' | 'green' | 'gold';
}) {
  const percentage = (value / total) * 100;
  const colorClass = {
    blue: 'bg-[var(--color-accent-blue)]',
    purple: 'bg-[var(--color-accent-purple)]',
    green: 'bg-[var(--color-accent-green)]',
    gold: 'bg-[var(--color-accent-gold)]',
  }[color];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-sm text-[var(--color-text-muted)]">{value}ms ({percentage.toFixed(1)}%)</span>
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

function MetricCard({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: 'blue' | 'purple' | 'gold';
}) {
  const colorClass = {
    blue: 'text-[var(--color-accent-blue)]',
    purple: 'text-[var(--color-accent-purple)]',
    gold: 'text-[var(--color-accent-gold)]',
  }[color];

  return (
    <div className="p-4 rounded-lg bg-[var(--color-base-raised)] text-center">
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-sm font-mono text-[var(--color-text-accent)]">{value}</span>
    </div>
  );
}

