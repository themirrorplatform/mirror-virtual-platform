import { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import {
  Code,
  Play,
  Save,
  GitBranch,
  AlertTriangle,
  Shield,
  Zap,
  Eye,
  CheckCircle2,
  XCircle,
  Settings,
} from 'lucide-react';

type BehaviorModule = 
  | 'mirrorback-tone'
  | 'crisis-detection'
  | 'identity-inference'
  | 'pattern-recognition'
  | 'tension-detection'
  | 'probing-depth';

interface ModuleConfig {
  id: BehaviorModule;
  name: string;
  description: string;
  category: 'reflection' | 'safety' | 'inference';
  parameters: Parameter[];
  constraints: string[];
}

interface Parameter {
  name: string;
  type: 'number' | 'boolean' | 'select' | 'text';
  value: any;
  defaultValue: any;
  options?: string[];
  min?: number;
  max?: number;
  description: string;
}

interface TestResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
  timestamp: string;
}

export function BuilderModeScreen() {
  const [selectedModule, setSelectedModule] = useState<BehaviorModule>('mirrorback-tone');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [showConstitutionalWarning, setShowConstitutionalWarning] = useState(false);

  const modules: ModuleConfig[] = [
    {
      id: 'mirrorback-tone',
      name: 'Mirrorback Tone',
      description: 'Controls the linguistic style and emotional register of Mirror responses',
      category: 'reflection',
      parameters: [
        {
          name: 'formality',
          type: 'select',
          value: 'neutral',
          defaultValue: 'neutral',
          options: ['formal', 'neutral', 'casual'],
          description: 'Level of formality in language',
        },
        {
          name: 'pronoun-usage',
          type: 'select',
          value: 'second-person',
          defaultValue: 'second-person',
          options: ['first-person', 'second-person', 'third-person'],
          description: 'Which pronouns Mirror uses to refer to you',
        },
        {
          name: 'question-frequency',
          type: 'number',
          value: 0.3,
          defaultValue: 0.3,
          min: 0,
          max: 1,
          description: 'How often Mirror asks probing questions (0 = never, 1 = always)',
        },
        {
          name: 'reflection-vs-observation',
          type: 'number',
          value: 0.7,
          defaultValue: 0.7,
          min: 0,
          max: 1,
          description: 'Balance between reflecting back vs. observing patterns (0 = pure observation, 1 = pure reflection)',
        },
      ],
      constraints: [
        'Cannot introduce directive language',
        'Cannot add persuasive framing',
        'Must maintain non-authoritative stance',
      ],
    },
    {
      id: 'crisis-detection',
      name: 'Crisis Detection',
      description: 'Sensitivity and behavior of crisis mode activation',
      category: 'safety',
      parameters: [
        {
          name: 'detection-threshold',
          type: 'number',
          value: 0.7,
          defaultValue: 0.7,
          min: 0.3,
          max: 0.9,
          description: 'Confidence threshold for crisis detection (higher = less sensitive)',
        },
        {
          name: 'auto-disable-learning',
          type: 'boolean',
          value: true,
          defaultValue: true,
          description: 'Automatically disable learning when crisis detected',
        },
        {
          name: 'show-resources',
          type: 'boolean',
          value: true,
          defaultValue: true,
          description: 'Display crisis support resources',
        },
        {
          name: 'lockdown-mode',
          type: 'select',
          value: 'soft',
          defaultValue: 'soft',
          options: ['off', 'soft', 'hard'],
          description: 'Level of interface restriction during crisis (off = none, soft = learning disabled, hard = AI fully disabled)',
        },
      ],
      constraints: [
        'Cannot diagnose (only detect)',
        'Cannot be fully disabled (safety-critical)',
        'Must preserve user agency',
      ],
    },
    {
      id: 'identity-inference',
      name: 'Identity Inference',
      description: 'How aggressively Mirror infers new identity nodes',
      category: 'inference',
      parameters: [
        {
          name: 'inference-rate',
          type: 'number',
          value: 0.5,
          defaultValue: 0.5,
          min: 0,
          max: 1,
          description: 'How readily Mirror creates new identity nodes (0 = conservative, 1 = aggressive)',
        },
        {
          name: 'require-explicit-confirmation',
          type: 'boolean',
          value: false,
          defaultValue: false,
          description: 'Ask before adding any inferred identity',
        },
        {
          name: 'show-inference-confidence',
          type: 'boolean',
          value: true,
          defaultValue: true,
          description: 'Display confidence scores for inferred identities',
        },
        {
          name: 'max-identities-per-reflection',
          type: 'number',
          value: 3,
          defaultValue: 3,
          min: 1,
          max: 10,
          description: 'Maximum new identities that can be inferred from one reflection',
        },
      ],
      constraints: [
        'User can always delete inferred identities',
        'Must show origin (user-named vs inferred)',
        'Cannot create identities from excluded content',
      ],
    },
    {
      id: 'pattern-recognition',
      name: 'Pattern Recognition',
      description: 'Sensitivity to recurring patterns in reflections',
      category: 'inference',
      parameters: [
        {
          name: 'pattern-threshold',
          type: 'number',
          value: 3,
          defaultValue: 3,
          min: 2,
          max: 10,
          description: 'Minimum occurrences before recognizing a pattern',
        },
        {
          name: 'temporal-weighting',
          type: 'number',
          value: 0.5,
          defaultValue: 0.5,
          min: 0,
          max: 1,
          description: 'Weight recent patterns more heavily (0 = all equal, 1 = only recent)',
        },
        {
          name: 'surface-subtle-patterns',
          type: 'boolean',
          value: true,
          defaultValue: true,
          description: 'Highlight patterns even when not explicitly stated',
        },
      ],
      constraints: [
        'Cannot predict future based on patterns',
        'Cannot label patterns as good/bad',
        'Must distinguish pattern from meaning',
      ],
    },
    {
      id: 'tension-detection',
      name: 'Tension Detection',
      description: 'How Mirror identifies and surfaces contradictions',
      category: 'inference',
      parameters: [
        {
          name: 'tension-sensitivity',
          type: 'number',
          value: 0.6,
          defaultValue: 0.6,
          min: 0,
          max: 1,
          description: 'How readily Mirror detects tensions (0 = only obvious, 1 = very subtle)',
        },
        {
          name: 'surface-immediately',
          type: 'boolean',
          value: false,
          defaultValue: false,
          description: 'Show tensions immediately vs. letting them accumulate',
        },
        {
          name: 'resolution-pressure',
          type: 'number',
          value: 0,
          defaultValue: 0,
          min: 0,
          max: 0.3,
          description: 'How much Mirror suggests resolving tensions (kept low to avoid persuasion)',
        },
      ],
      constraints: [
        'Cannot suggest which side of tension is correct',
        'Cannot pressure toward resolution',
        'Must honor that some tensions should be held',
      ],
    },
    {
      id: 'probing-depth',
      name: 'Probing Depth',
      description: 'How deeply Mirror explores topics in reflection',
      category: 'reflection',
      parameters: [
        {
          name: 'question-depth',
          type: 'select',
          value: 'medium',
          defaultValue: 'medium',
          options: ['surface', 'medium', 'deep'],
          description: 'How deeply Mirror probes into topics',
        },
        {
          name: 'follow-threads',
          type: 'boolean',
          value: true,
          defaultValue: true,
          description: 'Track and reference previous conversation threads',
        },
        {
          name: 'max-probes-per-response',
          type: 'number',
          value: 2,
          defaultValue: 2,
          min: 0,
          max: 5,
          description: 'Maximum probing questions per Mirrorback',
        },
      ],
      constraints: [
        'Questions must be genuinely curious, not leading',
        'Cannot probe into excluded content domains',
        'Must respect user signals to stop probing',
      ],
    },
  ];

  const currentModule = modules.find(m => m.id === selectedModule);

  const updateParameter = (paramName: string, newValue: any) => {
    setHasUnsavedChanges(true);
    // In real implementation, would update the parameter value
  };

  const runConstitutionalTest = () => {
    // Simulate constitutional integrity test
    const hasViolations = Math.random() < 0.2; // 20% chance of violations for demo
    
    setTestResults({
      passed: !hasViolations,
      violations: hasViolations 
        ? ['Detected potential directive language in response generation']
        : [],
      warnings: [
        'Low question frequency may reduce reflection depth',
        'Consider user testing before deploying to production',
      ],
      timestamp: new Date().toISOString(),
    });
  };

  const saveConfiguration = () => {
    setHasUnsavedChanges(false);
    // In real implementation, would save to local storage and create fork point
  };

  const createForkFromConfig = () => {
    // Navigate to fork creation with current config
    window.location.hash = 'forks/create';
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-[var(--color-accent-blue)]/20">
              <Code size={32} className="text-[var(--color-accent-blue)]" />
            </div>
            <div>
              <h1 className="mb-1">Builder Mode</h1>
              <p className="text-[var(--color-text-secondary)]">
                Modify Mirror behavior with constitutional constraints
              </p>
            </div>
          </div>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-[var(--color-accent-gold)]">
              <AlertTriangle size={16} />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
        </div>

        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[var(--color-text-secondary)] mb-3">
                Builder Mode lets you modify how The Mirror behaves. All changes are tested against 
                constitutional constraints before you can save them. Configurations that violate core 
                principles (persuasion, prediction, engagement optimization) will be blocked.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Changes apply only to your local Mirror. You can create forks to share modifications with others.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Module Selector */}
        <div className="col-span-4">
          <Card>
            <h3 className="mb-4">Behavior Modules</h3>
            <div className="space-y-2">
              {modules.map(module => (
                <button
                  key={module.id}
                  onClick={() => setSelectedModule(module.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedModule === module.id
                      ? 'bg-[var(--color-surface-emphasis)] border border-[var(--color-accent-gold)]'
                      : 'bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${
                      module.category === 'reflection' ? 'text-[var(--color-accent-blue)]'
                      : module.category === 'safety' ? 'text-[var(--color-accent-red)]'
                      : 'text-[var(--color-accent-purple)]'
                    }`}>
                      {module.category === 'reflection' ? <Eye size={16} />
                        : module.category === 'safety' ? <Shield size={16} />
                        : <Zap size={16} />}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm mb-1">{module.name}</h5>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Configuration Panel */}
        <div className="col-span-8 space-y-6">
          {currentModule && (
            <>
              {/* Module Details */}
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="mb-2">{currentModule.name}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {currentModule.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    currentModule.category === 'reflection' 
                      ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                      : currentModule.category === 'safety'
                      ? 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]'
                      : 'bg-[var(--color-accent-purple)]/20 text-[var(--color-accent-purple)]'
                  }`}>
                    {currentModule.category}
                  </span>
                </div>

                {/* Parameters */}
                <div className="space-y-4">
                  {currentModule.parameters.map((param, i) => (
                    <ParameterControl
                      key={i}
                      parameter={param}
                      onChange={(value) => updateParameter(param.name, value)}
                    />
                  ))}
                </div>

                {/* Constitutional Constraints */}
                <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                  <h4 className="text-sm mb-3 text-[var(--color-text-secondary)]">
                    Constitutional Constraints
                  </h4>
                  <div className="space-y-2">
                    {currentModule.constraints.map((constraint, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]"
                      >
                        <Shield size={14} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
                        <span>{constraint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card>
                <h4 className="mb-4">Test & Deploy</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={runConstitutionalTest}
                    >
                      <Play size={16} className="mr-2" />
                      Run Constitutional Test
                    </Button>
                    <Button
                      variant="primary"
                      onClick={saveConfiguration}
                      disabled={!hasUnsavedChanges}
                    >
                      <Save size={16} className="mr-2" />
                      Save Configuration
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={createForkFromConfig}
                    >
                      <GitBranch size={16} className="mr-2" />
                      Create Fork
                    </Button>
                  </div>

                  {/* Test Results */}
                  {testResults && (
                    <div className={`p-4 rounded-lg border ${
                      testResults.passed
                        ? 'bg-[var(--color-accent-green)]/10 border-[var(--color-accent-green)]/30'
                        : 'bg-[var(--color-accent-red)]/10 border-[var(--color-accent-red)]/30'
                    }`}>
                      <div className="flex items-start gap-3 mb-3">
                        {testResults.passed ? (
                          <CheckCircle2 size={20} className="text-[var(--color-accent-green)] flex-shrink-0" />
                        ) : (
                          <XCircle size={20} className="text-[var(--color-accent-red)] flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <h5 className="text-sm mb-1">
                            {testResults.passed ? 'Configuration Passed' : 'Constitutional Violations Detected'}
                          </h5>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Tested {new Date(testResults.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {testResults.violations.length > 0 && (
                        <div className="mb-3">
                          <h6 className="text-xs text-[var(--color-text-secondary)] mb-2">Violations:</h6>
                          <ul className="space-y-1">
                            {testResults.violations.map((v, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-muted)] pl-4">
                                • {v}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {testResults.warnings.length > 0 && (
                        <div>
                          <h6 className="text-xs text-[var(--color-text-secondary)] mb-2">Warnings:</h6>
                          <ul className="space-y-1">
                            {testResults.warnings.map((w, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-muted)] pl-4">
                                • {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {!testResults.passed && (
                        <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)]">
                          <p className="text-xs text-[var(--color-text-muted)]">
                            This configuration cannot be saved until violations are resolved.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Safety Note */}
              <Card variant="subtle">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    <p className="mb-2">
                      <strong>Testing in Sandbox:</strong> All configuration changes can be tested in 
                      a sandbox environment before applying to your main Mirror. Create a fork to safely 
                      experiment with behavior modifications.
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Safety-critical systems (crisis detection, consent controls) have restricted 
                      modification ranges to prevent harm.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ParameterControl({
  parameter,
  onChange,
}: {
  parameter: Parameter;
  onChange: (value: any) => void;
}) {
  const renderControl = () => {
    switch (parameter.type) {
      case 'boolean':
        return (
          <button
            onClick={() => onChange(!parameter.value)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              parameter.value ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-border-subtle)]'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                parameter.value ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        );

      case 'number':
        return (
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={parameter.min}
              max={parameter.max}
              step={parameter.max && parameter.max <= 1 ? 0.1 : 1}
              value={parameter.value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-[var(--color-text-secondary)] w-12 text-right">
              {parameter.value}
            </span>
          </div>
        );

      case 'select':
        return (
          <select
            value={parameter.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
          >
            {parameter.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'text':
        return (
          <input
            type="text"
            value={parameter.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
          />
        );
    }
  };

  const isModified = parameter.value !== parameter.defaultValue;

  return (
    <div className="pb-4 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm">{parameter.name}</h5>
            {isModified && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                Modified
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            {parameter.description}
          </p>
        </div>
      </div>
      {renderControl()}
    </div>
  );
}
