/**
 * Door Card - Core Finder recommendation display
 * 
 * Shows a single door (recommendation) with:
 * - Card type (person, room, artifact, practice)
 * - Interaction style (witness, dialogue, debate, structured)
 * - Lens tags
 * - Attestation count
 * - Asymmetry indicators
 */

import { motion } from 'motion/react';
import { 
  User, 
  Home, 
  FileText, 
  Repeat,
  Eye,
  MessageCircle,
  Swords,
  Grid,
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from './Badge';

export type CardType = 'person' | 'room' | 'artifact' | 'practice';
export type InteractionStyle = 'witness' | 'dialogue' | 'debate' | 'structured';
export type AsymmetryLevel = 'low' | 'medium' | 'high';

interface DoorData {
  id: string;
  title: string;
  description: string;
  cardType: CardType;
  interactionStyle: InteractionStyle;
  lensTags: string[];
  attestationCount: number;
  asymmetryLevel: AsymmetryLevel;
  reflectiveCondition: string;
  creator?: string;
}

interface DoorCardProps {
  door: DoorData;
  onOpen: (doorId: string) => void;
  onHide?: (doorId: string) => void;
  onViewAsymmetry?: (doorId: string) => void;
  compact?: boolean;
}

const CARD_TYPE_CONFIG = {
  person: {
    icon: <User size={20} />,
    label: 'Person',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
  },
  room: {
    icon: <Home size={20} />,
    label: 'Room',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  artifact: {
    icon: <FileText size={20} />,
    label: 'Artifact',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
  },
  practice: {
    icon: <Repeat size={20} />,
    label: 'Practice',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
};

const INTERACTION_CONFIG = {
  witness: {
    icon: <Eye size={16} />,
    label: 'Witness',
    description: 'Observe without response',
  },
  dialogue: {
    icon: <MessageCircle size={16} />,
    label: 'Dialogue',
    description: 'Mutual exploration',
  },
  debate: {
    icon: <Swords size={16} />,
    label: 'Debate',
    description: 'Structured disagreement',
  },
  structured: {
    icon: <Grid size={16} />,
    label: 'Structured',
    description: 'Guided process',
  },
};

const ASYMMETRY_CONFIG = {
  low: {
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: <CheckCircle size={16} />,
    label: 'Low Risk',
  },
  medium: {
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: <AlertTriangle size={16} />,
    label: 'Medium Risk',
  },
  high: {
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: <Shield size={16} />,
    label: 'High Risk',
  },
};

export function DoorCard({ 
  door, 
  onOpen, 
  onHide, 
  onViewAsymmetry,
  compact = false 
}: DoorCardProps) {
  const cardTypeConfig = CARD_TYPE_CONFIG[door.cardType];
  const interactionConfig = INTERACTION_CONFIG[door.interactionStyle];
  const asymmetryConfig = ASYMMETRY_CONFIG[door.asymmetryLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        {/* Asymmetry Risk Banner */}
        {door.asymmetryLevel === 'high' && (
          <div 
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: asymmetryConfig.color }}
          />
        )}

        {/* Hide Button */}
        {onHide && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onHide(door.id);
            }}
            className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Hide this door"
          >
            <X size={16} className="text-[var(--color-text-muted)]" />
          </button>
        )}

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ 
                color: cardTypeConfig.color,
                backgroundColor: cardTypeConfig.bgColor 
              }}
            >
              {cardTypeConfig.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{door.title}</h4>
                <Badge variant="secondary" size="sm">
                  {cardTypeConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {door.description}
              </p>
            </div>
          </div>

          {/* Reflective Condition */}
          {!compact && (
            <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
                Reflective Condition
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] italic">
                "{door.reflectiveCondition}"
              </p>
            </div>
          )}

          {/* Interaction Style */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
              {interactionConfig.icon}
              <span className="text-sm">{interactionConfig.label}</span>
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">•</span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {interactionConfig.description}
            </span>
          </div>

          {/* Lens Tags */}
          {door.lensTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {door.lensTags.slice(0, compact ? 2 : 5).map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              {compact && door.lensTags.length > 2 && (
                <Badge variant="secondary" size="sm">
                  +{door.lensTags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]">
            {/* Attestations */}
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-center gap-1">
                <CheckCircle size={14} />
                <span>{door.attestationCount} attestations</span>
              </div>
              
              {/* Asymmetry Indicator */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewAsymmetry?.(door.id);
                }}
                className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
                style={{ color: asymmetryConfig.color }}
              >
                {asymmetryConfig.icon}
                <span className="text-xs">{asymmetryConfig.label}</span>
              </button>
            </div>

            {/* Open Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpen(door.id)}
              className="flex items-center gap-2"
            >
              Open Door
              <ExternalLink size={14} />
            </Button>
          </div>

          {/* Creator */}
          {door.creator && (
            <div className="text-xs text-[var(--color-text-muted)]">
              Created by <span className="text-[var(--color-text-secondary)]">{door.creator}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
