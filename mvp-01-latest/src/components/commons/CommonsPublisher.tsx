/**
 * Commons Publisher - Publish reflections to public network
 * 
 * Features:
 * - Select reflection to publish
 * - Add metadata (lens tags, interaction style)
 * - Card type selector (person, room, artifact, practice)
 * - Privacy confirmation
 * - Preview public card
 * - Publish confirmation
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Share2,
  X,
  Eye,
  Send,
  AlertCircle,
  Check,
  User,
  Home,
  FileText,
  Repeat,
  MessageCircle,
  Swords,
  Grid
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';
import type { CardType, InteractionStyle } from '../finder/DoorCard';

interface Reflection {
  id: string;
  content: string;
  createdAt: Date;
  existingLensTags?: string[];
}

interface PublishConfig {
  cardType: CardType;
  interactionStyle: InteractionStyle;
  title: string;
  description: string;
  lensTags: string[];
  reflectiveCondition: string;
}

interface CommonsPublisherProps {
  reflection: Reflection;
  availableLensTags?: string[];
  onPublish: (reflectionId: string, config: PublishConfig) => void;
  onClose: () => void;
}

const CARD_TYPE_OPTIONS = [
  {
    id: 'person' as CardType,
    label: 'Person',
    description: 'An identity or perspective to witness',
    icon: <User size={20} />,
    color: '#3B82F6',
  },
  {
    id: 'room' as CardType,
    label: 'Room',
    description: 'A space for dialogue or exploration',
    icon: <Home size={20} />,
    color: '#10B981',
  },
  {
    id: 'artifact' as CardType,
    label: 'Artifact',
    description: 'A piece of writing or creation',
    icon: <FileText size={20} />,
    color: '#F59E0B',
  },
  {
    id: 'practice' as CardType,
    label: 'Practice',
    description: 'A method or approach to try',
    icon: <Repeat size={20} />,
    color: '#8B5CF6',
  },
];

const INTERACTION_STYLE_OPTIONS = [
  {
    id: 'witness' as InteractionStyle,
    label: 'Witness',
    description: 'Observe without response',
    icon: <Eye size={20} />,
  },
  {
    id: 'dialogue' as InteractionStyle,
    label: 'Dialogue',
    description: 'Mutual exploration',
    icon: <MessageCircle size={20} />,
  },
  {
    id: 'debate' as InteractionStyle,
    label: 'Debate',
    description: 'Structured disagreement',
    icon: <Swords size={20} />,
  },
  {
    id: 'structured' as InteractionStyle,
    label: 'Structured',
    description: 'Guided process',
    icon: <Grid size={20} />,
  },
];

export function CommonsPublisher({
  reflection,
  availableLensTags = [],
  onPublish,
  onClose,
}: CommonsPublisherProps) {
  const [step, setStep] = useState<'config' | 'preview' | 'confirm'>('config');
  const [config, setConfig] = useState<PublishConfig>({
    cardType: 'artifact',
    interactionStyle: 'witness',
    title: '',
    description: '',
    lensTags: reflection.existingLensTags || [],
    reflectiveCondition: '',
  });

  const canProceed = 
    config.title.length >= 10 &&
    config.description.length >= 20 &&
    config.reflectiveCondition.length >= 10 &&
    config.lensTags.length > 0;

  const handlePublish = () => {
    onPublish(reflection.id, config);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Share2 size={24} className="text-[var(--color-accent-blue)] mt-1" />
                <div>
                  <h3 className="mb-1">Publish to Commons</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Share this reflection with the Mirror network
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              {['Config', 'Preview', 'Confirm'].map((label, index) => (
                <div key={label} className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      ['config', 'preview', 'confirm'][index] === step
                        ? 'bg-[var(--color-accent-blue)] text-white'
                        : index < ['config', 'preview', 'confirm'].indexOf(step)
                        ? 'bg-[var(--color-accent-green)] text-white'
                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm hidden md:block">{label}</span>
                  {index < 2 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        index < ['config', 'preview', 'confirm'].indexOf(step)
                          ? 'bg-[var(--color-accent-green)]'
                          : 'bg-[var(--color-border-subtle)]'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Config Step */}
            {step === 'config' && (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Card Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Card Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {CARD_TYPE_OPTIONS.map((type) => (
                      <CardTypeButton
                        key={type.id}
                        type={type}
                        selected={config.cardType === type.id}
                        onSelect={() => setConfig({ ...config, cardType: type.id })}
                      />
                    ))}
                  </div>
                </div>

                {/* Interaction Style */}
                <div>
                  <label className="block text-sm font-medium mb-2">Interaction Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INTERACTION_STYLE_OPTIONS.map((style) => (
                      <InteractionStyleButton
                        key={style.id}
                        style={style}
                        selected={config.interactionStyle === style.id}
                        onSelect={() => setConfig({ ...config, interactionStyle: style.id })}
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    placeholder="A clear title for this door"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
                    maxLength={100}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {config.title.length}/100 • Minimum 10 characters
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    placeholder="What will others encounter here?"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] resize-none"
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {config.description.length}/300 • Minimum 20 characters
                  </p>
                </div>

                {/* Reflective Condition */}
                <div>
                  <label className="block text-sm font-medium mb-2">Reflective Condition</label>
                  <input
                    type="text"
                    value={config.reflectiveCondition}
                    onChange={(e) => setConfig({ ...config, reflectiveCondition: e.target.value })}
                    placeholder="What state of mind would benefit from this?"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    e.g., "When feeling stuck on a decision"
                  </p>
                </div>

                {/* Lens Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Lens Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {availableLensTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = config.lensTags.includes(tag)
                            ? config.lensTags.filter(t => t !== tag)
                            : [...config.lensTags, tag];
                          setConfig({ ...config, lensTags: newTags });
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          config.lensTags.includes(tag)
                            ? 'bg-[var(--color-accent-blue)] text-white'
                            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {config.lensTags.length === 0 && (
                    <p className="text-xs text-[var(--color-border-error)] mt-1">
                      Select at least one lens tag
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Card variant="emphasis">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ 
                          backgroundColor: CARD_TYPE_OPTIONS.find(t => t.id === config.cardType)?.color + '20',
                          color: CARD_TYPE_OPTIONS.find(t => t.id === config.cardType)?.color
                        }}
                      >
                        {CARD_TYPE_OPTIONS.find(t => t.id === config.cardType)?.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{config.title}</h4>
                          <Badge variant="secondary">
                            {config.cardType}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {config.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
                      <p className="text-xs text-[var(--color-text-muted)] mb-1">
                        Reflective Condition
                      </p>
                      <p className="text-sm italic">"{config.reflectiveCondition}"</p>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">Lens Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {config.lensTags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] mb-2">
                        Interaction Style
                      </p>
                      <Badge variant="primary">
                        {config.interactionStyle}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <Card className="border-2 border-[var(--color-accent-blue)]">
                  <div className="flex items-start gap-3">
                    <Eye size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      This is how your door will appear to others in the Commons. 
                      Your reflection content remains private until someone enters the door.
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Confirm Step */}
            {step === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <Card className="border-2 border-[var(--color-border-warning)]">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-[var(--color-border-warning)] mt-0.5" />
                    <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                      <p className="font-medium">Before you publish:</p>
                      <ul className="space-y-2 ml-4">
                        <li>• Your reflection will be discoverable in the Commons</li>
                        <li>• Others can enter this door based on their posture/lenses</li>
                        <li>• You can unpublish at any time</li>
                        <li>• Your identity remains sovereign—you control visibility</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card variant="emphasis">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-[var(--color-accent-green)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Ready to publish to the Mirror Commons
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <Button
                variant="ghost"
                onClick={() => {
                  if (step === 'config') onClose();
                  else if (step === 'preview') setStep('config');
                  else if (step === 'confirm') setStep('preview');
                }}
              >
                {step === 'config' ? 'Cancel' : 'Back'}
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  if (step === 'config') setStep('preview');
                  else if (step === 'preview') setStep('confirm');
                  else handlePublish();
                }}
                disabled={step === 'config' && !canProceed}
                className="flex items-center gap-2"
              >
                {step === 'confirm' ? (
                  <>
                    <Send size={16} />
                    Publish
                  </>
                ) : (
                  <>Next</>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// Sub-components

function CardTypeButton({ type, selected, onSelect }: any) {
  return (
    <button
      onClick={onSelect}
      className={`p-3 rounded-lg border-2 transition-all ${
        selected ? '' : 'hover:border-[var(--color-accent-blue)]'
      }`}
      style={{
        borderColor: selected ? type.color : 'var(--color-border-subtle)',
        backgroundColor: selected ? `${type.color}10` : 'transparent',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div style={{ color: type.color }}>{type.icon}</div>
        <span className="text-sm font-medium">{type.label}</span>
      </div>
    </button>
  );
}

function InteractionStyleButton({ style, selected, onSelect }: any) {
  return (
    <button
      onClick={onSelect}
      className={`p-3 rounded-lg border-2 transition-all text-left ${
        selected ? 'border-[var(--color-accent-blue)]' : 'border-[var(--color-border-subtle)]'
      }`}
      style={{
        backgroundColor: selected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {style.icon}
        <span className="text-sm font-medium">{style.label}</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">{style.description}</p>
    </button>
  );
}

export type { PublishConfig, Reflection };
