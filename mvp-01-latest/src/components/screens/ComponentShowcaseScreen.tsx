/**
 * Component Showcase - Complete visual catalog of every component and state
 * Summon with ⌘K → "showcase" (Builder layer only)
 */

import { useState } from 'react';
import { EnhancedButton, ButtonGroup, IconButton } from '../EnhancedButton';
import { Card } from '../Card';
import { Input, Textarea } from '../Input';
import { ArrowRight, Heart, Loader2, Save, X } from 'lucide-react';
import { motion } from 'motion/react';

export function ComponentShowcaseScreen() {
  const [selectedSection, setSelectedSection] = useState<
    'buttons' | 'cards' | 'inputs' | 'states' | 'animations'
  >('buttons');

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Component Showcase</h1>
        <p className="text-[var(--color-text-secondary)]">
          Every component, every state, every interaction
        </p>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 mb-8 border-b border-[var(--color-border-subtle)] pb-4">
        {(['buttons', 'cards', 'inputs', 'states', 'animations'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setSelectedSection(section)}
            className={`
              px-4 py-2 rounded-lg capitalize transition-all
              ${
                selectedSection === section
                  ? 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
              }
            `}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedSection === 'buttons' && <ButtonShowcase />}
      {selectedSection === 'cards' && <CardShowcase />}
      {selectedSection === 'inputs' && <InputShowcase />}
      {selectedSection === 'states' && <StateShowcase />}
      {selectedSection === 'animations' && <AnimationShowcase />}
    </div>
  );
}

// Button Showcase
function ButtonShowcase() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-12">
      {/* Primary Buttons */}
      <Section title="Primary Buttons" description="Main call-to-action buttons">
        <div className="grid grid-cols-3 gap-6">
          <Demo label="Default">
            <EnhancedButton>Click Me</EnhancedButton>
          </Demo>
          
          <Demo label="With Icon (Left)">
            <EnhancedButton icon={<ArrowRight size={18} />} iconPosition="left">
              Continue
            </EnhancedButton>
          </Demo>
          
          <Demo label="With Icon (Right)">
            <EnhancedButton icon={<ArrowRight size={18} />} iconPosition="right">
              Next
            </EnhancedButton>
          </Demo>
          
          <Demo label="Loading">
            <EnhancedButton loading>Processing...</EnhancedButton>
          </Demo>
          
          <Demo label="Disabled">
            <EnhancedButton disabled>Disabled</EnhancedButton>
          </Demo>
          
          <Demo label="Full Width">
            <EnhancedButton fullWidth>Full Width Button</EnhancedButton>
          </Demo>
        </div>
      </Section>

      {/* Size Variants */}
      <Section title="Size Variants" description="Small, medium, and large buttons">
        <div className="flex items-center gap-4">
          <EnhancedButton size="sm">Small</EnhancedButton>
          <EnhancedButton size="md">Medium</EnhancedButton>
          <EnhancedButton size="lg">Large</EnhancedButton>
        </div>
      </Section>

      {/* Variant Styles */}
      <Section title="Button Variants" description="Different visual styles">
        <div className="grid grid-cols-2 gap-6">
          <Demo label="Primary (Gold)">
            <EnhancedButton variant="primary">Primary</EnhancedButton>
          </Demo>
          
          <Demo label="Secondary">
            <EnhancedButton variant="secondary">Secondary</EnhancedButton>
          </Demo>
          
          <Demo label="Ghost">
            <EnhancedButton variant="ghost">Ghost</EnhancedButton>
          </Demo>
          
          <Demo label="Destructive">
            <EnhancedButton variant="destructive">Delete</EnhancedButton>
          </Demo>
          
          <Demo label="Glow (Custom Color)">
            <EnhancedButton variant="glow" glowColor="rgba(147, 112, 219, 0.8)">
              Glow Effect
            </EnhancedButton>
          </Demo>
        </div>
      </Section>

      {/* Icon Buttons */}
      <Section title="Icon Buttons" description="Square icon-only buttons">
        <div className="flex gap-4">
          <IconButton
            icon={<Heart size={18} />}
            label="Like"
            variant="ghost"
            className="bg-white/5 hover:bg-white/10 text-[var(--color-text-muted)]"
          />
          <IconButton
            icon={<Save size={18} />}
            label="Save"
            variant="ghost"
            className="bg-white/5 hover:bg-white/10 text-[var(--color-accent-gold)]"
          />
          <IconButton
            icon={<X size={18} />}
            label="Close"
            variant="ghost"
            className="bg-white/5 hover:bg-red-500/20 text-[var(--color-text-muted)] hover:text-red-400"
          />
        </div>
      </Section>

      {/* Button Groups */}
      <Section title="Button Groups" description="Related button collections">
        <div className="space-y-4">
          <Demo label="Horizontal Group">
            <ButtonGroup orientation="horizontal">
              <EnhancedButton variant="secondary">Cancel</EnhancedButton>
              <EnhancedButton>Save</EnhancedButton>
            </ButtonGroup>
          </Demo>
          
          <Demo label="Vertical Group">
            <ButtonGroup orientation="vertical">
              <EnhancedButton variant="secondary" fullWidth>
                Option 1
              </EnhancedButton>
              <EnhancedButton variant="secondary" fullWidth>
                Option 2
              </EnhancedButton>
              <EnhancedButton fullWidth>Confirm</EnhancedButton>
            </ButtonGroup>
          </Demo>
        </div>
      </Section>
    </div>
  );
}

// Card Showcase
function CardShowcase() {
  return (
    <div className="space-y-12">
      <Section title="Standard Cards" description="Basic card containers">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <h3 className="mb-2">Card Title</h3>
            <p className="text-[var(--color-text-secondary)]">
              This is a standard card with default styling and padding.
            </p>
          </Card>
          
          <Card className="border-2 border-[var(--color-accent-gold)]">
            <h3 className="mb-2">Emphasized Card</h3>
            <p className="text-[var(--color-text-secondary)]">
              Card with custom gold border for emphasis.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Interactive Cards" description="Clickable/hoverable cards">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 rounded-2xl bg-white/3 border border-white/10 cursor-pointer transition-all hover:border-white/20"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)] flex items-center justify-center mb-4 text-xl">
                {i}
              </div>
              <h4 className="mb-2">Interactive Card {i}</h4>
              <p className="text-sm text-[var(--color-text-muted)]">
                Hover me to see the lift effect
              </p>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// Input Showcase
function InputShowcase() {
  const [textValue, setTextValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <div className="space-y-12">
      <Section title="Text Inputs" description="Single-line text fields">
        <div className="space-y-6 max-w-md">
          <Demo label="Default">
            <Input
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter text..."
            />
          </Demo>
          
          <Demo label="With Label">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Email Address
              </label>
              <Input type="email" placeholder="you@example.com" />
            </div>
          </Demo>
          
          <Demo label="Disabled">
            <Input disabled placeholder="Disabled input" />
          </Demo>
        </div>
      </Section>

      <Section title="Textarea" description="Multi-line text input">
        <div className="max-w-2xl">
          <Textarea
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            placeholder="..."
            rows={6}
          />
        </div>
      </Section>

      <Section title="Search Input" description="With icon and clear button">
        <div className="max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-gold)] focus:outline-none transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              🔍
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// State Showcase
function StateShowcase() {
  return (
    <div className="space-y-12">
      <Section title="Loading States" description="Spinners and loaders">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <Loader2 size={24} className="animate-spin text-[var(--color-accent-gold)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-muted)]">Small (24px)</p>
          </div>
          
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-[var(--color-accent-gold)] mx-auto mb-2" />
            <p className="text-sm text-[var(--color-text-muted)]">Large (40px)</p>
          </div>
        </div>
      </Section>

      <Section title="Empty States" description="Constitutional empty patterns">
        <div className="grid grid-cols-2 gap-6">
          <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center">
            <p className="text-[var(--color-text-muted)]">...</p>
          </div>
          
          <div className="p-12 border border-dashed border-white/10 rounded-2xl text-center">
            <p className="text-[var(--color-text-muted)]">Nothing appears here yet.</p>
          </div>
        </div>
      </Section>

      <Section title="Error States" description="Error indicators">
        <div className="space-y-4 max-w-md">
          <div>
            <Input className="border-red-500" defaultValue="invalid@" />
            <p className="text-sm text-red-400 mt-2">Invalid email address</p>
          </div>
          
          <Card className="border-red-500/50 bg-red-500/5">
            <p className="text-red-400">Something went wrong. Please try again.</p>
          </Card>
        </div>
      </Section>
    </div>
  );
}

// Animation Showcase
function AnimationShowcase() {
  return (
    <div className="space-y-12">
      <Section title="Fade Animations" description="Opacity transitions">
        <div className="grid grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 bg-white/5 rounded-xl text-center"
          >
            <p>Fade In</p>
          </motion.div>
          
          <motion.div
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="p-6 bg-white/5 rounded-xl text-center"
          >
            <p>Pulse</p>
          </motion.div>
        </div>
      </Section>

      <Section title="Scale Animations" description="Size transitions">
        <div className="grid grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="p-6 bg-white/5 rounded-xl text-center cursor-pointer"
          >
            <p>Hover Scale Up</p>
          </motion.div>
          
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="p-6 bg-white/5 rounded-xl text-center cursor-pointer"
          >
            <p>Tap Scale Down</p>
          </motion.div>
          
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="p-6 bg-white/5 rounded-xl text-center"
          >
            <p>Breathing</p>
          </motion.div>
        </div>
      </Section>

      <Section title="Slide Animations" description="Position transitions">
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="p-6 bg-white/5 rounded-xl"
          >
            <p>Slide from Left</p>
          </motion.div>
          
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-6 bg-white/5 rounded-xl"
          >
            <p>Slide from Top</p>
          </motion.div>
        </div>
      </Section>

      <Section title="Glow Animations" description="Constitutional ambient glows">
        <div className="grid grid-cols-3 gap-6">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(203, 163, 93, 0.3)',
                '0 0 40px rgba(203, 163, 93, 0.6)',
                '0 0 20px rgba(203, 163, 93, 0.3)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="p-6 bg-black border border-[var(--color-accent-gold)] rounded-xl text-center"
          >
            <p>Pulsing Glow</p>
          </motion.div>
        </div>
      </Section>
    </div>
  );
}

// Helper Components
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="mb-1">{title}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Demo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
        {label}
      </p>
      {children}
    </div>
  );
}
