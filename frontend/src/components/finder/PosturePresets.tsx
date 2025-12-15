/**
 * Posture Presets - Quick-select common postures
 * 
 * Features:
 * - Preset posture cards
 * - Custom posture option
 * - Recent postures list
 * - Posture description and example scenarios
 * - One-click activation
 * - Save custom postures
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Compass,
  BookOpen,
  Lightbulb,
  Heart,
  TrendingUp,
  HelpCircle,
  Zap,
  Shuffle,
  Plus,
  Clock,
  Star,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PosturePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  exampleScenarios: string[];
  isCustom?: boolean;
  lastUsed?: Date;
}

interface PosturePresetsProps {
  presets: PosturePreset[];
  selectedPostureId?: string;
  recentPostures?: PosturePreset[];
  onSelectPosture: (postureId: string) => void;
  onCreateCustom?: () => void;
  onSaveAsPreset?: (postureName: string) => void;
}

const DEFAULT_PRESETS: PosturePreset[] = [
  {
    id: 'exploring',
    name: 'Exploring',
    description: 'Open to discovery, curious about what appears',
    icon: <Compass size={24} />,
    color: '#3B82F6',
    exampleScenarios: [
      'When you want to encounter new ideas',
      'When you\'re open to being surprised',
      'When you don\'t know what you\'re looking for',
    ],
  },
  {
    id: 'reflecting',
    name: 'Reflecting',
    description: 'Looking back, making sense of experiences',
    icon: <BookOpen size={24} />,
    color: '#8B5CF6',
    exampleScenarios: [
      'After a significant event',
      'When processing emotions',
      'When connecting past and present',
    ],
  },
  {
    id: 'seeking_clarity',
    name: 'Seeking Clarity',
    description: 'Working through confusion or complexity',
    icon: <Lightbulb size={24} />,
    color: '#F59E0B',
    exampleScenarios: [
      'When facing a decision',
      'When multiple perspectives clash',
      'When you feel stuck',
    ],
  },
  {
    id: 'feeling',
    name: 'Feeling',
    description: 'Attentive to emotional states and resonance',
    icon: <Heart size={24} />,
    color: '#EC4899',
    exampleScenarios: [
      'When emotions are strong',
      'When you need to honor what you feel',
      'When logic isn\'t enough',
    ],
  },
  {
    id: 'growing',
    name: 'Growing',
    description: 'Focused on development and transformation',
    icon: <TrendingUp size={24} />,
    color: '#10B981',
    exampleScenarios: [
      'When working on a specific pattern',
      'When tracking progress',
      'When building new habits',
    ],
  },
  {
    id: 'questioning',
    name: 'Questioning',
    description: 'Interrogating assumptions and beliefs',
    icon: <HelpCircle size={24} />,
    color: '#EF4444',
    exampleScenarios: [
      'When something doesn\'t sit right',
      'When examining core beliefs',
      'When testing your own thinking',
    ],
  },
];

export function PosturePresets({
  presets = DEFAULT_PRESETS,
  selectedPostureId,
  recentPostures = [],
  onSelectPosture,
  onCreateCustom,
  onSaveAsPreset,
}: PosturePresetsProps) {
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [expandedPreset, setExpandedPreset] = useState<string | null>(null);

  const displayedPresets = showAllPresets ? presets : presets.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-1">Choose Your Posture</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              How are you approaching the Mirror right now?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectPosture('random')}
              className="flex items-center gap-2"
            >
              <Shuffle size={16} />
              Surprise Me
            </Button>
            {onCreateCustom && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCreateCustom}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Custom
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Recent Postures */}
      {recentPostures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[var(--color-text-muted)]" />
            <h4 className="text-sm font-medium">Recent</h4>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentPostures.map((posture) => (
              <RecentPostureChip
                key={posture.id}
                posture={posture}
                isSelected={selectedPostureId === posture.id}
                onSelect={() => onSelectPosture(posture.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedPresets.map((preset) => (
          <PosturePresetCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPostureId === preset.id}
            isExpanded={expandedPreset === preset.id}
            onSelect={() => onSelectPosture(preset.id)}
            onToggleExpand={() =>
              setExpandedPreset(expandedPreset === preset.id ? null : preset.id)
            }
          />
        ))}
      </div>

      {/* Show More/Less */}
      {presets.length > 6 && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setShowAllPresets(!showAllPresets)}
          >
            {showAllPresets ? 'Show Less' : `Show ${presets.length - 6} More`}
          </Button>
        </div>
      )}

      {/* Info Card */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Zap size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>Your posture shapes what you encounter.</strong> It's not about filtering 
              "good" vs "bad" — it's about alignment with your current state.
            </p>
            <p className="text-[var(--color-text-muted)]">
              The same door can appear different through different postures. You can change 
              your posture at any time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface PosturePresetCardProps {
  preset: PosturePreset;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

function PosturePresetCard({
  preset,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: PosturePresetCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer transition-all ${
          isSelected ? 'border-2 shadow-lg' : ''
        }`}
        style={{
          borderColor: isSelected ? preset.color : undefined,
        }}
        onClick={onSelect}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: `${preset.color}20`,
                  color: preset.color,
                }}
              >
                {preset.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{preset.name}</h4>
                  {preset.isCustom && (
                    <Badge variant="secondary" size="sm">Custom</Badge>
                  )}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {preset.description}
                </p>
              </div>
            </div>

            {isSelected && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: preset.color }}
              >
                <Check size={14} className="text-white" />
              </div>
            )}
          </div>

          {/* Last Used */}
          {preset.lastUsed && (
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Clock size={12} />
              <span>Last used {formatDate(preset.lastUsed)}</span>
            </div>
          )}

          {/* Examples Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="text-xs text-[var(--color-accent-blue)] hover:underline"
          >
            {isExpanded ? 'Hide' : 'Show'} example scenarios
          </button>

          {/* Example Scenarios */}
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-3 border-t border-[var(--color-border-subtle)] space-y-2"
            >
              {preset.exampleScenarios.map((scenario, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div
                    className="w-1 h-1 rounded-full mt-2"
                    style={{ backgroundColor: preset.color }}
                  />
                  <p className="text-sm text-[var(--color-text-secondary)] flex-1">
                    {scenario}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface RecentPostureChipProps {
  posture: PosturePreset;
  isSelected: boolean;
  onSelect: () => void;
}

function RecentPostureChip({ posture, isSelected, onSelect }: RecentPostureChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
        isSelected
          ? 'text-white shadow-md'
          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
      }`}
      style={{
        backgroundColor: isSelected ? posture.color : undefined,
      }}
    >
      <div className={isSelected ? 'text-white' : ''} style={{ color: !isSelected ? posture.color : undefined }}>
        {posture.icon}
      </div>
      <span className="text-sm font-medium">{posture.name}</span>
      {isSelected && <Check size={14} />}
    </motion.button>
  );
}

// Utility Functions

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export type { PosturePreset };
export { DEFAULT_PRESETS };

