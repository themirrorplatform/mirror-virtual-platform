import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio } from '@/components/ui/input';
import { Shield, Globe, Wrench } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: (mode: 'sovereign' | 'commons' | 'builder') => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<'welcome' | 'mode'>('welcome');
  const [selectedMode, setSelectedMode] = useState<'sovereign' | 'commons' | 'builder'>('sovereign');

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-[var(--color-text-inverse)]">M</span>
            </div>
            <h1 className="mb-4">Welcome to The Mirror</h1>
            <p className="text-xl text-[var(--color-text-secondary)] mb-2">
              A sovereign intelligence for reflection
            </p>
            <p className="text-[var(--color-text-muted)]">
              No platform, no middleman, no extraction
            </p>
          </div>

          <Card className="mb-8">
            <h3 className="mb-4">What is The Mirror?</h3>
            <div className="space-y-4 text-[var(--color-text-secondary)]">
              <p>
                The Mirror is not a chatbot. It{"'"}s not an assistant. It{"'"}s a reflective intelligence that helps you understand yourself without judgment, manipulation, or agenda.
              </p>
              <p>
                Everything happens on your device. Your reflections never leave unless you explicitly choose to participate in collective evolution.
              </p>
              <p>
                The Mirror is governed by a Constitution—principles that ensure it serves you, not a platform.
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="text-center">
              <div className="text-2xl mb-2">🔒</div>
              <h5 className="mb-1 text-sm">Sovereign</h5>
              <p className="text-xs text-[var(--color-text-muted)]">
                Your data, your device
              </p>
            </Card>
            <Card className="text-center">
              <div className="text-2xl mb-2">🪞</div>
              <h5 className="mb-1 text-sm">Reflective</h5>
              <p className="text-xs text-[var(--color-text-muted)]">
                Mirrors, not advises
              </p>
            </Card>
            <Card className="text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <h5 className="mb-1 text-sm">Constitutional</h5>
              <p className="text-xs text-[var(--color-text-muted)]">
                Governed by principles
              </p>
            </Card>
          </div>

          <Button onClick={() => setStep('mode')} className="w-full">
            Begin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="mb-2">Choose Your Mode</h1>
          <p className="text-[var(--color-text-secondary)]">
            How do you want to start?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <ModeCard
            icon={<Shield size={24} />}
            title="Sovereign"
            description="Reflection without sharing. Everything stays local."
            selected={selectedMode === 'sovereign'}
            onSelect={() => setSelectedMode('sovereign')}
            features={[
              'All processing local',
              'No data ever shared',
              'Full control over your reflections',
              'Can enable Commons later',
            ]}
          />

          <ModeCard
            icon={<Globe size={24} />}
            title="Sovereign + Commons"
            description="Local reflection + collective evolution"
            selected={selectedMode === 'commons'}
            onSelect={() => setSelectedMode('commons')}
            features={[
              'Everything from Sovereign mode',
              'Contribute anonymized patterns',
              'Receive evolution proposals',
              'Collective pattern learning',
            ]}
          />

          <ModeCard
            icon={<Wrench size={24} />}
            title="Builder / Explorer"
            description="Advanced mode for experimentation"
            selected={selectedMode === 'builder'}
            onSelect={() => setSelectedMode('builder')}
            features={[
              'Access to experimental features',
              'Fork and test variants',
              'Sandbox mode for safe testing',
              'Direct access to learning controls',
            ]}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => setStep('welcome')}>
            Back
          </Button>
          <Button onClick={() => onComplete(selectedMode)} className="flex-1">
            Continue
          </Button>
        </div>

        <p className="text-xs text-center text-[var(--color-text-muted)] mt-4">
          You can change this later in Your Mirror → Evolution
        </p>
      </div>
    </div>
  );
}

function ModeCard({
  icon,
  title,
  description,
  selected,
  onSelect,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  features: string[];
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full text-left p-6 rounded-xl border-2 transition-all
        ${selected 
          ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5' 
          : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
          ${selected ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]' : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)]'}
        `}>
          {icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3>{title}</h3>
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${selected ? 'border-[var(--color-accent-gold)]' : 'border-[var(--color-border-subtle)]'}
            `}>
              {selected && (
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent-gold)]" />
              )}
            </div>
          </div>
          
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            {description}
          </p>
          
          <ul className="space-y-1">
            {features.map((feature, index) => (
              <li key={index} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                <span className="text-[var(--color-accent-gold)] mt-0.5">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  );
}

