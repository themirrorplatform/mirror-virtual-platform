import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Type,
  Zap,
  Volume2,
  Palette,
  Brain,
  Check,
  Info,
} from 'lucide-react';

export type AccessibilitySettings = {
  // Visual
  contrastMode: 'standard' | 'high' | 'monochrome';
  fontFamily: 'inter' | 'opendyslexic' | 'system';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  
  // Motion
  reducedMotion: boolean;
  zeroAnimation: boolean;
  
  // Cognitive
  simpleLanguage: boolean;
  minimalConcepts: boolean;
  showDefinitions: boolean;
  
  // Interaction
  keyboardNavigation: boolean;
  voiceControl: boolean;
  touchTargetSize: 'standard' | 'large' | 'xlarge';
};

const defaultSettings: AccessibilitySettings = {
  contrastMode: 'standard',
  fontFamily: 'inter',
  fontSize: 'medium',
  reducedMotion: false,
  zeroAnimation: false,
  simpleLanguage: false,
  minimalConcepts: false,
  showDefinitions: true,
  keyboardNavigation: true,
  voiceControl: false,
  touchTargetSize: 'standard',
};

export function AccessibilitySettingsScreen() {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const applySettings = () => {
    // Apply to document root
    const root = document.documentElement;
    
    // Font family
    if (settings.fontFamily === 'opendyslexic') {
      root.style.fontFamily = 'OpenDyslexic, sans-serif';
    } else if (settings.fontFamily === 'system') {
      root.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    } else {
      root.style.fontFamily = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    }
    
    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px',
    };
    root.style.fontSize = fontSizeMap[settings.fontSize];
    
    // Contrast mode
    if (settings.contrastMode === 'high') {
      root.setAttribute('data-contrast', 'high');
    } else if (settings.contrastMode === 'monochrome') {
      root.setAttribute('data-contrast', 'monochrome');
    } else {
      root.removeAttribute('data-contrast');
    }
    
    // Motion
    if (settings.reducedMotion || settings.zeroAnimation) {
      root.setAttribute('data-motion', 'reduced');
    } else {
      root.removeAttribute('data-motion');
    }

    setHasChanges(false);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Accessibility</h1>
        <p className="text-[var(--color-text-secondary)]">
          Configure The Mirror to match your cognitive, sensory, and interaction needs
        </p>
      </div>

      <div className="space-y-6">
        {/* Visual Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Eye size={24} className="text-[var(--color-accent-gold)]" />
            <div>
              <h3 className="mb-1">Visual</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Contrast, color, and display settings
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Contrast Mode */}
            <SettingGroup
              label="Contrast Mode"
              description="Adjust visual contrast for better readability"
              helpText="High contrast increases text/background separation. Monochrome removes all colors."
            >
              <RadioGroup
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'high', label: 'High Contrast' },
                  { value: 'monochrome', label: 'True Monochrome' },
                ]}
                selected={settings.contrastMode}
                onChange={value => updateSetting('contrastMode', value as AccessibilitySettings['contrastMode'])}
              />
            </SettingGroup>

            {/* Font Family */}
            <SettingGroup
              label="Font Family"
              description="Choose a font that works best for you"
              helpText="OpenDyslexic is designed specifically for dyslexic readers with weighted bottoms and unique character shapes."
            >
              <RadioGroup
                options={[
                  { value: 'inter', label: 'Inter (Default)' },
                  { value: 'opendyslexic', label: 'OpenDyslexic' },
                  { value: 'system', label: 'System Default' },
                ]}
                selected={settings.fontFamily}
                onChange={value => updateSetting('fontFamily', value as AccessibilitySettings['fontFamily'])}
              />
            </SettingGroup>

            {/* Font Size */}
            <SettingGroup
              label="Font Size"
              description="Adjust text size across the entire interface"
            >
              <RadioGroup
                options={[
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium (Default)' },
                  { value: 'large', label: 'Large' },
                  { value: 'xlarge', label: 'Extra Large' },
                ]}
                selected={settings.fontSize}
                onChange={value => updateSetting('fontSize', value as AccessibilitySettings['fontSize'])}
              />
            </SettingGroup>
          </div>
        </Card>

        {/* Motion Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Zap size={24} className="text-[var(--color-accent-blue)]" />
            <div>
              <h3 className="mb-1">Motion & Animation</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Control movement and transitions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              label="Reduced Motion"
              description="Minimize animations and transitions"
              enabled={settings.reducedMotion}
              onChange={value => updateSetting('reducedMotion', value)}
              helpText="Reduces intensity of animations while keeping subtle feedback"
            />

            <ToggleSetting
              label="Zero Animation"
              description="Disable all animations completely"
              enabled={settings.zeroAnimation}
              onChange={value => updateSetting('zeroAnimation', value)}
              helpText="Removes all motion. Changes appear instantly."
            />
          </div>
        </Card>

        {/* Cognitive Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Brain size={24} className="text-[var(--color-accent-purple)]" />
            <div>
              <h3 className="mb-1">Cognitive Load</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Reduce complexity and information density
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              label="Simple Language Mode"
              description="Use shorter sentences and common words"
              enabled={settings.simpleLanguage}
              onChange={value => updateSetting('simpleLanguage', value)}
              helpText="Mirror will avoid jargon and use simpler phrasing in all responses"
            />

            <ToggleSetting
              label="Minimal Concepts Mode"
              description="Show fewer concepts at once"
              enabled={settings.minimalConcepts}
              onChange={value => updateSetting('minimalConcepts', value)}
              helpText="Limits the number of identity nodes, tensions, and patterns shown simultaneously"
            />

            <ToggleSetting
              label="Show Term Definitions"
              description="Display hover explanations for technical terms"
              enabled={settings.showDefinitions}
              onChange={value => updateSetting('showDefinitions', value)}
              helpText="Terms like 'Commons', 'Mirrorback', 'Constitutional' will have hover tooltips"
            />
          </div>
        </Card>

        {/* Interaction Settings */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <Type size={24} className="text-[var(--color-accent-green)]" />
            <div>
              <h3 className="mb-1">Interaction & Control</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Input methods and touch targets
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ToggleSetting
              label="Keyboard Navigation"
              description="Navigate with Tab, Enter, and arrow keys"
              enabled={settings.keyboardNavigation}
              onChange={value => updateSetting('keyboardNavigation', value)}
              helpText="All interactive elements are keyboard-accessible"
            />

            <ToggleSetting
              label="Voice Control"
              description="Enable voice commands (experimental)"
              enabled={settings.voiceControl}
              onChange={value => updateSetting('voiceControl', value)}
              helpText="Use speech to navigate and control The Mirror"
            />

            <SettingGroup
              label="Touch Target Size"
              description="Increase size of buttons and interactive elements"
            >
              <RadioGroup
                options={[
                  { value: 'standard', label: 'Standard (44px)' },
                  { value: 'large', label: 'Large (56px)' },
                  { value: 'xlarge', label: 'Extra Large (72px)' },
                ]}
                selected={settings.touchTargetSize}
                onChange={value => updateSetting('touchTargetSize', value as AccessibilitySettings['touchTargetSize'])}
              />
            </SettingGroup>
          </div>
        </Card>

        {/* Emotional Safety Note */}
        <Card>
          <div className="flex items-start gap-3">
            <Info size={20} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="mb-2">Crisis Detection & Safety</h4>
              <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                During crisis detection, learning is automatically disabled and interface complexity is minimized 
                regardless of these settings. You maintain control through simplified, offline-only writing.
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                This is a hard-coded safety boundary that cannot be changed.
              </p>
            </div>
          </div>
        </Card>

        {/* Apply/Reset */}
        <div className="flex gap-3">
          <Button 
            variant="primary" 
            onClick={applySettings}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Apply Changes' : 'No Changes'}
          </Button>
          <Button variant="ghost" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingGroup({
  label,
  description,
  helpText,
  children,
}: {
  label: string;
  description: string;
  helpText?: string;
  children: React.ReactNode;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="pb-6 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm">{label}</h4>
          {helpText && (
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            >
              <Info size={14} />
            </button>
          )}
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
        {showHelp && helpText && (
          <div className="mt-2 p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
            <p className="text-xs text-[var(--color-text-muted)]">{helpText}</p>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function RadioGroup({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            selected === option.value
              ? 'bg-[var(--color-surface-emphasis)] border-[var(--color-accent-gold)]'
              : 'bg-[var(--color-base-raised)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected === option.value
                ? 'border-[var(--color-accent-gold)]'
                : 'border-[var(--color-border-subtle)]'
            }`}
          >
            {selected === option.value && (
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)]" />
            )}
          </div>
          <span className="text-sm text-[var(--color-text-primary)]">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
  helpText,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  helpText?: string;
}) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="pb-4 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm">{label}</h5>
            {helpText && (
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              >
                <Info size={14} />
              </button>
            )}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
          {showHelp && helpText && (
            <div className="mt-2 p-3 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
              <p className="text-xs text-[var(--color-text-muted)]">{helpText}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => onChange(!enabled)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            enabled ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-border-subtle)]'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
}


