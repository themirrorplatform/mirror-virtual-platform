/**
 * DoorCard Component
 * Displays a recommended reflective condition (door)
 */

import React from 'react';
import { DoorCard as DoorCardType } from '@/lib/api/finder';
import { User, Home, FileText, Activity, MessageSquare, Users, Swords, List } from 'lucide-react';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// ICON MAPPINGS
// ────────────────────────────────────────────────────────────────────────────

const CARD_TYPE_ICONS: Record<string, React.ElementType> = {
  person: User,
  room: Home,
  artifact: FileText,
  practice: Activity,
};

const INTERACTION_STYLE_ICONS: Record<string, React.ElementType> = {
  witness: MessageSquare,
  dialogue: Users,
  debate: Swords,
  structured: List,
};

const CARD_TYPE_COLORS: Record<string, string> = {
  person: 'bg-blue-100 text-blue-700',
  room: 'bg-green-100 text-green-700',
  artifact: 'bg-purple-100 text-purple-700',
  practice: 'bg-orange-100 text-orange-700',
};

const INTERACTION_STYLE_LABELS: Record<string, string> = {
  witness: 'Witness',
  dialogue: 'Dialogue',
  debate: 'Debate',
  structured: 'Structured',
};

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface DoorCardProps {
  door: DoorCardType;
  onOpen?: (nodeId: string) => void;
  onBlock?: (nodeId: string) => void;
  onViewAsymmetry?: (nodeId: string) => void;
}

export function DoorCard({ door, onOpen, onBlock, onViewAsymmetry }: DoorCardProps) {
  const CardTypeIcon = CARD_TYPE_ICONS[door.card_type];
  const InteractionIcon = INTERACTION_STYLE_ICONS[door.interaction_style];
  const cardTypeColor = CARD_TYPE_COLORS[door.card_type];

  const handleOpen = () => {
    onOpen?.(door.node_id);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBlock?.(door.node_id);
  };

  const handleViewAsymmetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewAsymmetry?.(door.node_id);
  };

  return (
    <div className="group relative bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-900 hover:shadow-lg transition-all">
      {/* Card Type Badge */}
      <div className="absolute top-3 right-3">
        <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cardTypeColor)}>
          <CardTypeIcon className="w-3.5 h-3.5" />
          <span className="capitalize">{door.card_type}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-3 pr-24">
        {door.title || 'Untitled Door'}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
        {door.description || 'A reflective space awaits...'}
      </p>

      {/* Interaction Style */}
      <div className="flex items-center gap-2 mb-4">
        <InteractionIcon className="w-4 h-4 text-gray-500" />
        <span className="text-xs font-medium text-gray-700">
          {INTERACTION_STYLE_LABELS[door.interaction_style]}
        </span>
      </div>

      {/* Lens Tags */}
      {door.lens_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {door.lens_tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {door.lens_tags.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{door.lens_tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Attestation Count */}
      <div className="flex items-center gap-1.5 mb-4 text-xs text-gray-500">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{door.attestation_count} attestations</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleOpen}
          className="flex-1 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          Open Door
        </button>
        
        <button
          onClick={handleViewAsymmetry}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          title="View asymmetry report"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        <button
          onClick={handleBlock}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          title="Block this door"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 border-2 border-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
