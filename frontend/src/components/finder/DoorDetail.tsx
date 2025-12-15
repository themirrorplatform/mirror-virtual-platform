/**
 * Door Detail - Full door information modal
 * 
 * Features:
 * - Complete door metadata
 * - Asymmetry report integration
 * - Creator profile link
 * - Related doors
 * - Entry confirmation
 * - Hide/block actions
 */

import { motion } from 'framer-motion';
import { 
  X, 
  User, 
  Home, 
  FileText, 
  Repeat,
  Eye,
  MessageCircle,
  Swords,
  Grid,
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle,
  Ban,
  Flag,
  Info,
  TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CardType, InteractionStyle, AsymmetryLevel } from './DoorCard';

interface DoorDetailData {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  cardType: CardType;
  interactionStyle: InteractionStyle;
  lensTags: string[];
  attestationCount: number;
  asymmetryLevel: AsymmetryLevel;
  asymmetryDetails: {
    exitFriction: 'low' | 'medium' | 'high';
    dataDemandRatio: number; // 0-1
    opacity: boolean;
    identityCoercion: boolean;
    unilateralControl: boolean;
    lockInTerms: boolean;
    evidenceTier: 'declared' | 'attested' | 'observed';
  };
  reflectiveCondition: string;
  creator?: string;
  createdAt: Date;
  relatedDoors?: Array<{ id: string; title: string; }>;
}

interface DoorDetailProps {
  door: DoorDetailData;
  onEnter: (doorId: string) => void;
  onHide: (doorId: string) => void;
  onBlock?: (doorId: string) => void;
  onReport?: (doorId: string) => void;
  onClose: () => void;
  onViewCreator?: (creatorId: string) => void;
  onViewRelated?: (doorId: string) => void;
}

const CARD_TYPE_CONFIG = {
  person: { icon: <User size={24} />, label: 'Person', color: '#3B82F6' },
  room: { icon: <Home size={24} />, label: 'Room', color: '#10B981' },
  artifact: { icon: <FileText size={24} />, label: 'Artifact', color: '#F59E0B' },
  practice: { icon: <Repeat size={24} />, label: 'Practice', color: '#8B5CF6' },
};

const INTERACTION_CONFIG = {
  witness: { icon: <Eye size={20} />, label: 'Witness', description: 'Observe without response' },
  dialogue: { icon: <MessageCircle size={20} />, label: 'Dialogue', description: 'Mutual exploration' },
  debate: { icon: <Swords size={20} />, label: 'Debate', description: 'Structured disagreement' },
  structured: { icon: <Grid size={20} />, label: 'Structured', description: 'Guided process' },
};

const ASYMMETRY_CONFIG = {
  low: { color: '#10B981', icon: <CheckCircle size={20} />, label: 'Low Risk' },
  medium: { color: '#F59E0B', icon: <AlertTriangle size={20} />, label: 'Medium Risk' },
  high: { color: '#EF4444', icon: <Shield size={20} />, label: 'High Risk' },
};

export function DoorDetail({
  door,
  onEnter,
  onHide,
  onBlock,
  onReport,
  onClose,
  onViewCreator,
  onViewRelated,
}: DoorDetailProps) {
  const cardTypeConfig = CARD_TYPE_CONFIG[door.cardType];
  const interactionConfig = INTERACTION_CONFIG[door.interactionStyle];
  const asymmetryConfig = ASYMMETRY_CONFIG[door.asymmetryLevel];

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
              <div className="flex items-start gap-4 flex-1">
                <div 
                  className="p-3 rounded-xl"
                  style={{ 
                    color: cardTypeConfig.color,
                    backgroundColor: `${cardTypeConfig.color}20` 
                  }}
                >
                  {cardTypeConfig.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2>{door.title}</h2>
                    <Badge variant="secondary">
                      {cardTypeConfig.label}
                    </Badge>
                  </div>
                  <p className="text-[var(--color-text-secondary)]">
                    {door.description}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>

            {/* Full Description */}
            {door.fullDescription && (
              <Card>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {door.fullDescription}
                </p>
              </Card>
            )}

            {/* Reflective Condition */}
            <div className="p-4 rounded-lg bg-[var(--color-surface-hover)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wide">
                Reflective Condition
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] italic">
                "{door.reflectiveCondition}"
              </p>
            </div>

            {/* Interaction Style */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-surface-hover)]">
              {interactionConfig.icon}
              <div>
                <h4 className="text-sm font-medium mb-1">
                  {interactionConfig.label} Interaction
                </h4>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {interactionConfig.description}
                </p>
              </div>
            </div>

            {/* Lens Tags */}
            {door.lensTags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Active Lenses</h4>
                <div className="flex flex-wrap gap-2">
                  {door.lensTags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Asymmetry Report */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-[var(--color-text-muted)]" />
                <h4 className="text-sm font-medium">Asymmetry Report</h4>
                <Badge 
                  variant={
                    door.asymmetryLevel === 'low' ? 'success' : 
                    door.asymmetryLevel === 'medium' ? 'warning' : 'error'
                  }
                >
                  {asymmetryConfig.label}
                </Badge>
              </div>

              <Card className="border-2" style={{ borderColor: asymmetryConfig.color }}>
                <div className="space-y-3">
                  {/* Exit Friction */}
                  <AsymmetryMetric
                    label="Exit Friction"
                    value={door.asymmetryDetails.exitFriction}
                    description="How easy it is to leave this door"
                    positive={door.asymmetryDetails.exitFriction === 'low'}
                  />

                  {/* Data Demand Ratio */}
                  <AsymmetryMetric
                    label="Data Demand Ratio"
                    value={`${Math.round(door.asymmetryDetails.dataDemandRatio * 100)}%`}
                    description="How much data you give vs. receive"
                    positive={door.asymmetryDetails.dataDemandRatio < 0.5}
                  />

                  {/* Boolean Flags */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                    <FlagIndicator
                      label="Transparency"
                      value={door.asymmetryDetails.opacity}
                      positiveLabel="Transparent"
                      negativeLabel="Opaque"
                    />
                    <FlagIndicator
                      label="Identity"
                      value={!door.asymmetryDetails.identityCoercion}
                      positiveLabel="Optional"
                      negativeLabel="Coerced"
                    />
                    <FlagIndicator
                      label="Control"
                      value={!door.asymmetryDetails.unilateralControl}
                      positiveLabel="Mutual"
                      negativeLabel="Unilateral"
                    />
                    <FlagIndicator
                      label="Lock-in"
                      value={!door.asymmetryDetails.lockInTerms}
                      positiveLabel="None"
                      negativeLabel="Present"
                    />
                  </div>

                  {/* Evidence Tier */}
                  <div className="pt-2 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Evidence Tier
                      </span>
                      <Badge variant="secondary" size="sm">
                        {door.asymmetryDetails.evidenceTier}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
              <div className="flex items-center gap-1">
                <CheckCircle size={16} />
                <span>{door.attestationCount} attestations</span>
              </div>
              {door.creator && (
                <button
                  onClick={() => onViewCreator?.(door.creator!)}
                  className="flex items-center gap-1 hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <User size={16} />
                  <span>{door.creator}</span>
                </button>
              )}
              <div className="flex items-center gap-1">
                <TrendingUp size={16} />
                <span>{formatDate(door.createdAt)}</span>
              </div>
            </div>

            {/* Related Doors */}
            {door.relatedDoors && door.relatedDoors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Related Doors</h4>
                <div className="space-y-2">
                  {door.relatedDoors.map((related) => (
                    <button
                      key={related.id}
                      onClick={() => onViewRelated?.(related.id)}
                      className="w-full p-3 rounded-lg bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-card)] transition-colors text-left flex items-center justify-between"
                    >
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {related.title}
                      </span>
                      <ExternalLink size={14} className="text-[var(--color-text-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHide(door.id)}
                  className="flex items-center gap-1"
                >
                  <Eye size={14} />
                  Hide
                </Button>
                {onBlock && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBlock(door.id)}
                    className="flex items-center gap-1"
                  >
                    <Ban size={14} />
                    Block
                  </Button>
                )}
                {onReport && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReport(door.id)}
                    className="flex items-center gap-1"
                  >
                    <Flag size={14} />
                    Report
                  </Button>
                )}
              </div>

              <Button
                variant="primary"
                onClick={() => onEnter(door.id)}
                className="flex items-center gap-2"
              >
                Enter Door
                <ExternalLink size={16} />
              </Button>
            </div>

            {/* Info Box */}
            <Card>
              <div className="flex items-start gap-3">
                <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  The Finder routed this door based on your posture and active lenses. 
                  Asymmetry data is community-verified. You can always exit.
                </p>
              </div>
            </Card>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

interface AsymmetryMetricProps {
  label: string;
  value: string;
  description: string;
  positive: boolean;
}

function AsymmetryMetric({ label, value, description, positive }: AsymmetryMetricProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
      </div>
      <Badge variant={positive ? 'success' : 'warning'}>
        {value}
      </Badge>
    </div>
  );
}

interface FlagIndicatorProps {
  label: string;
  value: boolean;
  positiveLabel: string;
  negativeLabel: string;
}

function FlagIndicator({ label, value, positiveLabel, negativeLabel }: FlagIndicatorProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--color-text-muted)]">{label}:</span>
      <span style={{ color: value ? '#10B981' : '#EF4444' }}>
        {value ? positiveLabel : negativeLabel}
      </span>
    </div>
  );
}

function formatDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString();
}

export type { DoorDetailData };


