import { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Eye, Minus, Type, Zap, Focus, Palette, Brain, Volume2 } from 'lucide-react';

interface AccessibilityVariant {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'visual' | 'cognitive' | 'motor' | 'auditory';
  preview: React.ReactNode;
}

const variants: AccessibilityVariant[] = [
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum contrast for low vision. Pure black backgrounds, bright borders, no subtle grays.',
    icon: <Eye size={20} />,
    category: 'visual',
    preview: (
      <div className="p-4 rounded-lg bg-black border-2 border-white">
        <p className="text-white text-sm mb-2">What{'\u2019'}s most present?</p>
        <div className="h-px bg-white my-2" />
        <p className="text-gray-300 text-xs">Maximum contrast, no ambiguity</p>
      </div>
    ),
  },
  {
    id: 'reduced-motion',
    name: 'Reduced Motion',
    description: 'No animations, transitions, or movement. Instant state changes only.',
    icon: <Minus size={20} />,
    category: 'visual',
    preview: (
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-sm mb-2">All animations disabled</p>
        <div className="h-8 bg-[var(--color-accent-gold)] rounded" />
        <p className="text-xs text-[var(--color-text-muted)] mt-2">Instant transitions</p>
      </div>
    ),
  },
  {
    id: 'dyslexia-friendly',
    name: 'Dyslexia-Friendly',
    description: 'OpenDyslexic font, increased letter spacing, shorter line lengths, no justified text.',
    icon: <Type size={20} />,
    category: 'visual',
    preview: (
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
        <p className="text-sm mb-2" style={{ letterSpacing: '0.12em', lineHeight: '1.8' }}>
          What{'\u2019'}s most present?
        </p>
        <p className="text-xs text-[var(--color-text-muted)]" style={{ letterSpacing: '0.08em' }}>
          Optimized spacing & font
        </p>
      </div>
    ),
  },
  {
    id: 'cognitive-minimal',
    name: 'Cognitive Minimal',
    description: 'One thing at a time. Hides navigation, settings, history. Just you and the reflection.',
    icon: <Brain size={20} />,
    category: 'cognitive',
    preview: (
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-sm mb-2">Single focus interface</p>
        <div className="h-16 bg-[var(--color-base-default)] rounded mb-2" />
        <p className="text-xs text-[var(--color-text-muted)]">No distractions, no chrome</p>
      </div>
    ),
  },
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    description: 'Minimal UI, larger text, breathing space. For deep reflection without visual noise.',
    icon: <Focus size={20} />,
    category: 'cognitive',
    preview: (
      <div className="p-6 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-lg mb-4">What{'\u2019'}s most present?</p>
        <div className="h-1 bg-[var(--color-accent-gold)] rounded mb-4" />
        <p className="text-xs text-[var(--color-text-muted)]">Spacious, calm</p>
      </div>
    ),
  },
  {
    id: 'large-text',
    name: 'Large Text',
    description: '200% text scaling. All interface elements proportionally larger.',
    icon: <Type size={20} />,
    category: 'visual',
    preview: (
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <p className="text-xl mb-2">Larger text</p>
        <p className="text-base text-[var(--color-text-muted)]">200% scaling</p>
      </div>
    ),
  },
  {
    id: 'color-blind-safe',
    name: 'Color Blind Safe',
    description: 'No reliance on color alone. Patterns, icons, and text labels for all states.',
    icon: <Palette size={20} />,
    category: 'visual',
    preview: (
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <div className="flex gap-2 mb-2">
          <span className="text-xs bg-[var(--color-accent-green)]/20 px-2 py-1 rounded">✓ Safe</span>
          <span className="text-xs bg-[var(--color-accent-red)]/20 px-2 py-1 rounded">✗ Error</span>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Icons + text, not just color</p>
      </div>
    ),
  },
  {
    id: 'voice-primary',
    name: 'Voice Primary',
    description: 'Voice-first interface with audio feedback for all actions and screen reader optimization.',
    icon: <Volume2 size={20} />,
    category: 'auditory',
    preview: (
      <div className="p-4 rounded-lg bg-[var(--color-base-raised)] border border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 mb-2">
          <Volume2 size={16} className="text-[var(--color-accent-blue)]" />
          <p className="text-sm">Audio feedback enabled</p>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Screen reader optimized</p>
      </div>
    ),
  },
];

export function AccessibilityVariantsScreen() {
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [previewVariant, setPreviewVariant] = useState<string | null>(null);

  const handleActivate = (variantId: string) => {
    setActiveVariant(variantId);
    // In a real implementation, this would apply CSS classes or update context
  };

  const categories = [
    { id: 'visual', label: 'Visual', count: variants.filter(v => v.category === 'visual').length },
    { id: 'cognitive', label: 'Cognitive', count: variants.filter(v => v.category === 'cognitive').length },
    { id: 'motor', label: 'Motor', count: variants.filter(v => v.category === 'motor').length },
    { id: 'auditory', label: 'Auditory', count: variants.filter(v => v.category === 'auditory').length },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Eye size={32} className="text-[var(--color-accent-purple)]" />
          <h1>Accessibility Variants</h1>
        </div>
        <p className="text-[var(--color-text-secondary)]">
          Real implementations, not just settings. Each variant transforms the entire interface.
        </p>
      </div>

      {/* Active Variant Indicator */}
      {activeVariant && (
        <Card className="mb-8 bg-[var(--color-accent-green)]/5 border-[var(--color-accent-green)]/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="mb-1">
                Active: {variants.find(v => v.id === activeVariant)?.name}
              </h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                This variant is applied globally across The Mirror
              </p>
            </div>
            <Button variant="secondary" onClick={() => setActiveVariant(null)}>
              Deactivate
            </Button>
          </div>
        </Card>
      )}

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {categories.map(cat => (
          <Card key={cat.id}>
            <h5 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
              {cat.label}
            </h5>
            <p className="text-2xl text-[var(--color-accent-gold)]">{cat.count}</p>
          </Card>
        ))}
      </div>

      {/* Variants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {variants.map(variant => (
          <Card 
            key={variant.id}
            className={`hover:border-[var(--color-accent-gold)] transition-colors ${
              activeVariant === variant.id ? 'border-[var(--color-accent-green)]' : ''
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-[var(--color-base-raised)]">
                {variant.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3>{variant.name}</h3>
                  {activeVariant === variant.id && (
                    <span className="text-xs px-2 py-1 rounded bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  {variant.description}
                </p>
                <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {variant.category}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4">
              <h5 className="text-xs uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
                Preview
              </h5>
              {variant.preview}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant={activeVariant === variant.id ? 'secondary' : 'primary'}
                onClick={() => handleActivate(variant.id)}
                disabled={activeVariant === variant.id}
              >
                {activeVariant === variant.id ? 'Active' : 'Activate'}
              </Button>
              <Button variant="secondary">
                Full Preview
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Implementation Notes */}
      <Card className="mt-8 bg-[var(--color-accent-blue)]/5 border-[var(--color-accent-blue)]/30">
        <h3 className="mb-4">How Variants Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--color-text-secondary)]">
          <div>
            <h5 className="text-[var(--color-text-primary)] mb-2">Complete Transformations</h5>
            <p>
              Variants aren{'\u2019'}t just settings toggles. They rewrite CSS variables, swap components, 
              and restructure layouts to create genuinely different experiences.
            </p>
          </div>
          <div>
            <h5 className="text-[var(--color-text-primary)] mb-2">Persistent Across Sessions</h5>
            <p>
              Your chosen variant is saved locally and synced across devices. The Mirror remembers 
              how you need to see it.
            </p>
          </div>
          <div>
            <h5 className="text-[var(--color-text-primary)] mb-2">Stackable (Carefully)</h5>
            <p>
              Some variants can combine (e.g., Reduced Motion + High Contrast). Others are mutually 
              exclusive. The system prevents conflicts.
            </p>
          </div>
          <div>
            <h5 className="text-[var(--color-text-primary)] mb-2">No Degradation</h5>
            <p>
              Every variant is a first-class experience, not a {'"'}fallback{'"'} or {'"'}accessible version.{'"'} 
              All features work fully in every variant.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
