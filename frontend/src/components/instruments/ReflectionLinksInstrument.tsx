/**
 * Reflection Links Instrument
 * Create and manage relationships between reflections
 * Constitutional: user-defined connections, not algorithmic recommendations
 */

import { motion } from 'framer-motion';
import { Link2, Plus, Trash2, X, Search } from 'lucide-react';
import { useState } from 'react';

interface ReflectionLink {
  id: string;
  fromReflectionId: string;
  toReflectionId: string;
  fromTitle: string;
  toTitle: string;
  type: 'related' | 'builds-on' | 'contradicts' | 'resolves' | 'custom';
  label?: string;
  createdAt: Date;
}

interface ReflectionLinksInstrumentProps {
  currentReflectionId?: string;
  links: ReflectionLink[];
  availableReflections: { id: string; title: string; date: Date }[];
  onCreateLink: (fromId: string, toId: string, type: ReflectionLink['type'], label?: string) => void;
  onDeleteLink: (linkId: string) => void;
  onNavigate: (reflectionId: string) => void;
  onClose: () => void;
}

export function ReflectionLinksInstrument({
  currentReflectionId,
  links,
  availableReflections,
  onCreateLink,
  onDeleteLink,
  onNavigate,
  onClose,
}: ReflectionLinksInstrumentProps) {
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLink, setNewLink] = useState({
    toId: '',
    type: 'related' as ReflectionLink['type'],
    label: '',
  });

  const linkTypes = [
    { value: 'related', label: 'Related to', color: 'blue' },
    { value: 'builds-on', label: 'Builds on', color: 'green' },
    { value: 'contradicts', label: 'Contradicts', color: 'red' },
    { value: 'resolves', label: 'Resolves', color: 'purple' },
    { value: 'custom', label: 'Custom', color: 'orange' },
  ];

  const currentLinks = links.filter(
    l => l.fromReflectionId === currentReflectionId || l.toReflectionId === currentReflectionId
  );

  const filteredReflections = availableReflections.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    r.id !== currentReflectionId
  );

  const handleCreate = () => {
    if (currentReflectionId && newLink.toId) {
      onCreateLink(
        currentReflectionId,
        newLink.toId,
        newLink.type,
        newLink.type === 'custom' ? newLink.label : undefined
      );
      setCreating(false);
      setNewLink({ toId: '', type: 'related', label: '' });
      setSearchTerm('');
    }
  };

  const getLinkColor = (type: string) => {
    return linkTypes.find(t => t.value === type)?.color || 'gray';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Link2 size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1 text-[var(--color-text-primary)]">Reflection Links</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Connect related reflections manually</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 rounded-xl bg-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Constitutional:</strong> You create these connections. No algorithmic recommendations. You decide what's related.
            </p>
          </div>

          {!currentReflectionId ? (
            <div className="py-12 text-center">
              <Link2 size={48} className="mx-auto mb-4 text-[var(--color-text-muted)] opacity-30" />
              <p className="text-[var(--color-text-muted)]">Open a reflection to create links</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
                  Links ({currentLinks.length})
                </h3>
                {currentLinks.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl">
                    <p className="text-[var(--color-text-muted)]">No links yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentLinks.map((link) => {
                      const isOutgoing = link.fromReflectionId === currentReflectionId;
                      const targetTitle = isOutgoing ? link.toTitle : link.fromTitle;
                      const targetId = isOutgoing ? link.toReflectionId : link.fromReflectionId;
                      const color = getLinkColor(link.type);
                      const typeLabel = linkTypes.find(t => t.value === link.type)?.label;

                      return (
                        <div
                          key={link.id}
                          className={`p-4 rounded-xl border-2 border-${color}-400/30 bg-${color}-500/5`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium bg-${color}-500/20 text-${color}-400`}>
                                  {link.type === 'custom' && link.label ? link.label : typeLabel}
                                </span>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                  {isOutgoing ? '→' : '←'}
                                </span>
                              </div>
                              <button
                                onClick={() => onNavigate(targetId)}
                                className="text-left hover:underline text-[var(--color-text-primary)]"
                              >
                                {targetTitle}
                              </button>
                              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                                Created {link.createdAt.toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              onClick={() => onDeleteLink(link.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {creating && (
                <div className="p-6 rounded-xl border-2 border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/5">
                  <h3 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Create Link</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Link Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {linkTypes.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setNewLink({ ...newLink, type: type.value as ReflectionLink['type'] })}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              newLink.type === type.value
                                ? `border-${type.color}-400 bg-${type.color}-500/10`
                                : 'border-[var(--color-border-subtle)]'
                            }`}
                          >
                            <div className="text-sm font-medium text-[var(--color-text-primary)]">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {newLink.type === 'custom' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Custom Label</label>
                        <input
                          type="text"
                          value={newLink.label}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewLink({ ...newLink, label: e.target.value })}
                          placeholder="e.g., Inspired by, Questions"
                          className="w-full px-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[var(--color-text-primary)]">Link to Reflection</label>
                      <div className="relative mb-2">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchTerm(e.target.value)}
                          placeholder="Search reflections..."
                          className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredReflections.slice(0, 10).map((reflection) => (
                          <button
                            key={reflection.id}
                            onClick={() => setNewLink({ ...newLink, toId: reflection.id })}
                            className={`w-full p-3 rounded-lg text-left transition-all ${
                              newLink.toId === reflection.id
                                ? 'bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]'
                                : 'border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)]/50'
                            }`}
                          >
                            <div className="text-sm text-[var(--color-text-primary)]">{reflection.title}</div>
                            <div className="text-xs text-[var(--color-text-muted)]">{reflection.date.toLocaleDateString()}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setCreating(false);
                          setNewLink({ toId: '', type: 'related', label: '' });
                          setSearchTerm('');
                        }}
                        className="flex-1 px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreate}
                        disabled={!newLink.toId || (newLink.type === 'custom' && !newLink.label)}
                        className="flex-1 px-4 py-2 rounded-xl bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] disabled:opacity-50"
                      >
                        Create Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!creating && (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  <span>Add Link</span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="w-full px-4 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


