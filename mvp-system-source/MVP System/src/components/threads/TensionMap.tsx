/**
 * Tension Map - Visualize areas of cognitive/emotional tension
 * 
 * Features:
 * - Visual map of tension areas
 * - Intensity indicators
 * - Tension types (cognitive dissonance, emotional conflict, etc.)
 * - Related reflections
 * - Resolution tracking
 * - "Why this matters" context
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle,
  Zap,
  TrendingUp,
  Link2,
  Check,
  Info,
  ChevronRight
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface TensionPoint {
  id: string;
  title: string;
  description: string;
  type: 'cognitive' | 'emotional' | 'behavioral' | 'value' | 'identity';
  intensity: number; // 0-1
  firstDetected: Date;
  lastUpdated: Date;
  relatedReflectionIds: string[];
  status: 'active' | 'resolving' | 'resolved';
  contradictions?: string[];
}

interface TensionMapProps {
  tensions: TensionPoint[];
  onViewTension: (tensionId: string) => void;
  onViewReflection?: (reflectionId: string) => void;
  onUpdateStatus?: (tensionId: string, status: TensionPoint['status']) => void;
}

const TYPE_CONFIG = {
  cognitive: {
    label: 'Cognitive Dissonance',
    description: 'Holding contradictory beliefs or thoughts',
    color: '#3B82F6',
    icon: Zap,
  },
  emotional: {
    label: 'Emotional Conflict',
    description: 'Competing or contradictory feelings',
    color: '#EC4899',
    icon: AlertTriangle,
  },
  behavioral: {
    label: 'Behavioral Inconsistency',
    description: 'Actions conflicting with stated values',
    color: '#F59E0B',
    icon: TrendingUp,
  },
  value: {
    label: 'Value Tension',
    description: 'Competing core values or principles',
    color: '#8B5CF6',
    icon: AlertTriangle,
  },
  identity: {
    label: 'Identity Conflict',
    description: 'Tensions in self-concept or identity',
    color: '#10B981',
    icon: Zap,
  },
};

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#EF4444' },
  resolving: { label: 'Resolving', color: '#F59E0B' },
  resolved: { label: 'Resolved', color: '#10B981' },
};

export function TensionMap({
  tensions,
  onViewTension,
  onViewReflection,
  onUpdateStatus,
}: TensionMapProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [expandedTension, setExpandedTension] = useState<string | null>(null);

  const filteredTensions = tensions
    .filter(t => {
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => b.intensity - a.intensity);

  const stats = {
    total: tensions.length,
    active: tensions.filter(t => t.status === 'active').length,
    resolving: tensions.filter(t => t.status === 'resolving').length,
    resolved: tensions.filter(t => t.status === 'resolved').length,
    highIntensity: tensions.filter(t => t.intensity > 0.7 && t.status === 'active').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-[var(--color-border-warning)]" />
              <div>
                <h3 className="mb-1">Tension Map</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {filteredTensions.length} tension{filteredTensions.length !== 1 ? 's' : ''} detected
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            <StatBox label="Total" value={stats.total} color="#64748B" />
            <StatBox label="Active" value={stats.active} color="#EF4444" />
            <StatBox label="Resolving" value={stats.resolving} color="#F59E0B" />
            <StatBox label="Resolved" value={stats.resolved} color="#10B981" />
            <StatBox label="High Intensity" value={stats.highIntensity} color="#EC4899" />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Type Filter */}
            <div>
              <span className="text-xs text-[var(--color-text-muted)] mb-2 block">
                Tension Type:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedType === 'all'
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  All Types
                </button>
                {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                      selectedType === key
                        ? 'text-white'
                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                    }`}
                    style={{
                      backgroundColor: selectedType === key ? config.color : undefined,
                    }}
                  >
                    {config.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm px-3 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="resolving">Resolving</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* High Intensity Alert */}
      {stats.highIntensity > 0 && selectedStatus === 'active' && (
        <Card className="border-2 border-[var(--color-border-warning)]">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-[var(--color-border-warning)] mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">
                {stats.highIntensity} High-Intensity Tension{stats.highIntensity !== 1 ? 's' : ''}
              </p>
              <p className="text-[var(--color-text-secondary)]">
                These areas show significant cognitive or emotional strain. Consider exploring 
                them through reflection.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tension Points */}
      {filteredTensions.length > 0 ? (
        <div className="space-y-3">
          {filteredTensions.map(tension => (
            <TensionCard
              key={tension.id}
              tension={tension}
              isExpanded={expandedTension === tension.id}
              onToggleExpand={() =>
                setExpandedTension(expandedTension === tension.id ? null : tension.id)
              }
              onViewTension={onViewTension}
              onViewReflection={onViewReflection}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      ) : (
        <Card variant="emphasis">
          <div className="text-center py-12">
            <Check size={48} className="mx-auto mb-4 text-[var(--color-accent-green)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              {selectedStatus === 'all'
                ? 'No tensions detected'
                : `No ${selectedStatus} tensions`}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              This is natural — tension is part of growth and complexity
            </p>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-[var(--color-accent-blue)] mt-0.5" />
          <div className="text-xs text-[var(--color-text-secondary)]">
            <p className="mb-2">
              <strong>Tension is not a problem to fix.</strong> Internal contradictions, 
              competing values, and emotional conflicts are normal parts of being human.
            </p>
            <p className="text-[var(--color-text-muted)]">
              The Tension Map exists to help you see where complexity lives in your thinking, 
              not to eliminate it. Resolution happens naturally through awareness, not force.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Sub-components

interface StatBoxProps {
  label: string;
  value: number;
  color: string;
}

function StatBox({ label, value, color }: StatBoxProps) {
  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-hover)]">
      <div className="text-xs text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-2xl font-medium" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

interface TensionCardProps {
  tension: TensionPoint;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewTension: (tensionId: string) => void;
  onViewReflection?: (reflectionId: string) => void;
  onUpdateStatus?: (tensionId: string, status: TensionPoint['status']) => void;
}

function TensionCard({
  tension,
  isExpanded,
  onToggleExpand,
  onViewTension,
  onViewReflection,
  onUpdateStatus,
}: TensionCardProps) {
  const typeConfig = TYPE_CONFIG[tension.type];
  const statusConfig = STATUS_CONFIG[tension.status];
  const Icon = typeConfig.icon;

  const daysSince = Math.floor(
    (Date.now() - tension.firstDetected.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        tension.intensity > 0.7 ? 'border-l-4' : ''
      }`}
      style={{
        borderLeftColor: tension.intensity > 0.7 ? typeConfig.color : undefined,
      }}
      onClick={onToggleExpand}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${typeConfig.color}20`,
                color: typeConfig.color,
              }}
            >
              <Icon size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{tension.title}</h4>
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${statusConfig.color}20`,
                    color: statusConfig.color,
                  }}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {tension.description}
              </p>
            </div>
          </div>

          <ChevronRight
            size={20}
            className={`text-[var(--color-text-muted)] transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>

        {/* Intensity Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-muted)]">Intensity</span>
            <span className="text-[var(--color-text-secondary)]">
              {Math.round(tension.intensity * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tension.intensity * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                backgroundColor: typeConfig.color,
              }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
          <Badge variant="secondary" size="sm">
            {typeConfig.label}
          </Badge>
          <span>{daysSince}d since detected</span>
          <span>{tension.relatedReflectionIds.length} related reflections</span>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 pt-3 border-t border-[var(--color-border-subtle)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Type Description */}
              <Card variant="emphasis">
                <div className="text-sm">
                  <h5 className="font-medium mb-1">{typeConfig.label}</h5>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {typeConfig.description}
                  </p>
                </div>
              </Card>

              {/* Contradictions */}
              {tension.contradictions && tension.contradictions.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Contradictions Detected:
                  </h5>
                  <div className="space-y-2">
                    {tension.contradictions.map((contradiction, index) => (
                      <Card key={index} variant="emphasis">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {contradiction}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Reflections */}
              {onViewReflection && tension.relatedReflectionIds.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Related Reflections:
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {tension.relatedReflectionIds.slice(0, 5).map((id) => (
                      <button
                        key={id}
                        onClick={() => onViewReflection(id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-surface-hover)] text-xs text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/10"
                      >
                        <Link2 size={10} />
                        <span>View</span>
                      </button>
                    ))}
                    {tension.relatedReflectionIds.length > 5 && (
                      <Badge variant="secondary" size="sm">
                        +{tension.relatedReflectionIds.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Status Update */}
              {onUpdateStatus && (
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    Update Status:
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => onUpdateStatus(tension.id, key as TensionPoint['status'])}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          tension.status === key
                            ? 'text-white'
                            : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                        }`}
                        style={{
                          backgroundColor: tension.status === key ? config.color : undefined,
                        }}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewTension(tension.id)}
                >
                  Explore This Tension
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export type { TensionPoint };
