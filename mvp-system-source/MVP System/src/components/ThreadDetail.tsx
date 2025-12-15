import { useState } from 'react';
import { ArrowLeft, Edit2, Archive, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';
import { NodeCard } from './NodeCard';
import { TensionMarker } from './TensionMarker';
import { ContradictionMarker } from './ContradictionMarker';
import { motion } from 'motion/react';

interface Node {
  id: string;
  text: string;
  timestamp: string;
  hasTension?: boolean;
  tensionLabel?: string;
}

interface Tension {
  label: string;
  count: number;
  intensity: 'low' | 'medium' | 'high';
  description: string;
}

interface Contradiction {
  nodeAId: string;
  nodeBId: string;
  description: string;
}

interface ThreadDetailProps {
  threadId: string;
  threadName: string;
  nodes: Node[];
  tensions?: Tension[];
  contradictions?: Contradiction[];
  onBack: () => void;
  onRename?: (newName: string) => void;
  onArchive?: () => void;
  onAddReflection?: () => void;
}

export function ThreadDetail({
  threadId,
  threadName,
  nodes,
  tensions = [],
  contradictions = [],
  onBack,
  onRename,
  onArchive,
  onAddReflection,
}: ThreadDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(threadName);
  const [collapsedTimeRanges, setCollapsedTimeRanges] = useState<Set<string>>(new Set());
  const [showTensions, setShowTensions] = useState(true);

  const handleRename = () => {
    if (editedName.trim() && editedName !== threadName) {
      onRename?.(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditedName(threadName);
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-12">
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to threads
        </button>

        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full text-2xl bg-transparent border-b-2 border-[var(--color-accent-gold)] outline-none pb-2"
              />
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-2xl">{threadName}</h1>
                {onRename && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:text-[var(--color-accent-gold)] transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>
            )}
            <p className="text-base text-[var(--color-text-muted)] mt-3">
              {nodes.length} reflection{nodes.length !== 1 ? 's' : ''} in this thread
            </p>
          </div>

          <div className="flex gap-3">
            {onAddReflection && (
              <Button variant="secondary" size="sm" onClick={onAddReflection}>
                Add reflection
              </Button>
            )}
            {onArchive && (
              <Button variant="ghost" size="sm" onClick={onArchive}>
                <Archive size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tensions Section */}
      {tensions.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setShowTensions(!showTensions)}
            className="flex items-center gap-2 mb-4 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)] transition-colors"
          >
            {showTensions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>Recurring patterns ({tensions.length})</span>
          </button>

          {showTensions && (
            <div className="space-y-3">
              {tensions.map((tension, index) => (
                <TensionMarker
                  key={index}
                  label={tension.label}
                  count={tension.count}
                  intensity={tension.intensity}
                  description={tension.description}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nodes Timeline */}
      <div className="space-y-4 pl-8 border-l-2 border-[var(--color-border-subtle)]">
        {nodes.map((node, index) => {
          // Find if this node is part of a contradiction
          const contradiction = contradictions.find(
            c => c.nodeAId === node.id || c.nodeBId === node.id
          );

          const contradictionPair = contradiction
            ? nodes.find(n => 
                n.id === (contradiction.nodeAId === node.id ? contradiction.nodeBId : contradiction.nodeAId)
              )
            : null;

          return (
            <div key={node.id}>
              <NodeCard
                id={node.id}
                text={node.text}
                timestamp={node.timestamp}
                hasTension={node.hasTension}
                tensionLabel={node.tensionLabel}
              />

              {/* Show contradiction marker after the second node */}
              {contradiction && contradictionPair && contradiction.nodeBId === node.id && (
                <ContradictionMarker
                  nodeAId={contradiction.nodeAId}
                  nodeBId={contradiction.nodeBId}
                  nodeAText={nodes.find(n => n.id === contradiction.nodeAId)?.text || ''}
                  nodeBText={node.text}
                  description={contradiction.description}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--color-text-muted)] mb-4">...</p>
          {onAddReflection && (
            <Button variant="secondary" onClick={onAddReflection}>
              Add first reflection
            </Button>
          )}
        </div>
      )}
    </div>
  );
}