/**
 * Reflection Linking UI
 * 
 * Constitutional Principles:
 * - User creates non-linear connections
 * - Emergent structure, not imposed
 * - Graph view available but optional
 * - User controls all links
 */

import { useState, useEffect } from 'react';
import { Link2, Trash2, GitBranch, ArrowRight } from 'lucide-react';
import { reflectionLinks, ReflectionLink } from '../services/reflectionLinks';
import { useAppState } from '../hooks/useAppState';
import { Button } from './Button';
import { Card } from './Card';
import { Modal } from './Modal';

interface ReflectionLinkingUIProps {
  reflectionId: string;
  onClose?: () => void;
}

export function ReflectionLinkingUI({ reflectionId, onClose }: ReflectionLinkingUIProps) {
  const { reflections } = useAppState();
  const [links, setLinks] = useState<{ outgoing: ReflectionLink[]; incoming: ReflectionLink[] }>({
    outgoing: [],
    incoming: [],
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ReflectionLink['type']>('connects_to');
  const [selectedReflectionId, setSelectedReflectionId] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLinks();
  }, [reflectionId]);

  const loadLinks = () => {
    const reflectionLinks = reflectionLinks.getLinksForReflection(reflectionId);
    setLinks(reflectionLinks);
  };

  const handleCreateLink = () => {
    if (!selectedReflectionId) {
      alert('Please select a reflection to link to');
      return;
    }

    if (selectedReflectionId === reflectionId) {
      alert('Cannot link a reflection to itself');
      return;
    }

    reflectionLinks.createLink(reflectionId, selectedReflectionId, selectedType, {
      customLabel: selectedType === 'custom' ? customLabel : undefined,
    });

    setShowCreateModal(false);
    resetForm();
    loadLinks();
  };

  const resetForm = () => {
    setSelectedType('connects_to');
    setSelectedReflectionId('');
    setCustomLabel('');
    setSearchQuery('');
  };

  const handleDeleteLink = (linkId: string) => {
    if (confirm('Delete this link?')) {
      reflectionLinks.deleteLink(linkId);
      loadLinks();
    }
  };

  const getReflectionPreview = (id: string) => {
    const reflection = reflections.find(r => r.id === id);
    if (!reflection) return 'Unknown reflection';
    return reflection.content.substring(0, 100) + (reflection.content.length > 100 ? '...' : '');
  };

  const getReflectionDate = (id: string) => {
    const reflection = reflections.find(r => r.id === id);
    return reflection ? reflection.createdAt.toLocaleDateString() : '';
  };

  const getLinkTypeLabel = (type: ReflectionLink['type']): string => {
    switch (type) {
      case 'connects_to': return 'connects to';
      case 'contradicts': return 'contradicts';
      case 'builds_on': return 'builds on';
      case 'questions': return 'questions';
      case 'custom': return 'relates to';
    }
  };

  const getLinkTypeColor = (type: ReflectionLink['type']): string => {
    switch (type) {
      case 'connects_to': return 'var(--color-accent-blue)';
      case 'contradicts': return 'var(--color-accent-red)';
      case 'builds_on': return 'var(--color-accent-green)';
      case 'questions': return 'var(--color-accent-amber)';
      case 'custom': return 'var(--color-accent-gold)';
    }
  };

  const filteredReflections = reflections.filter(r => {
    if (r.id === reflectionId) return false;
    if (!searchQuery) return true;
    return r.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = reflectionLinks.getStats();
  const connected = reflectionLinks.getConnectedReflections(reflectionId);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3>Reflection Links</h3>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Link2 size={16} />
            Create Link
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Links</p>
            <p className="text-2xl">{stats.totalLinks}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">This Reflection</p>
            <p className="text-2xl">{links.outgoing.length + links.incoming.length}</p>
          </div>
          <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Connected To</p>
            <p className="text-2xl">{connected.length}</p>
          </div>
        </div>
      </Card>

      {/* Outgoing Links */}
      {links.outgoing.length > 0 && (
        <Card>
          <h4 className="mb-3">Links From This Reflection ({links.outgoing.length})</h4>
          <div className="space-y-2">
            {links.outgoing.map(link => (
              <div
                key={link.id}
                className="p-3 bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getLinkTypeColor(link.type)}20`,
                          color: getLinkTypeColor(link.type),
                        }}
                      >
                        {link.customLabel || getLinkTypeLabel(link.type)}
                      </span>
                      <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
                    </div>
                    <p className="text-sm mb-1">{getReflectionPreview(link.toReflectionId)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {getReflectionDate(link.toReflectionId)}
                    </p>
                    {link.note && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-2 italic">
                        "{link.note}"
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Incoming Links */}
      {links.incoming.length > 0 && (
        <Card>
          <h4 className="mb-3">Links To This Reflection ({links.incoming.length})</h4>
          <div className="space-y-2">
            {links.incoming.map(link => (
              <div
                key={link.id}
                className="p-3 bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight size={14} className="text-[var(--color-text-muted)] rotate-180" />
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${getLinkTypeColor(link.type)}20`,
                          color: getLinkTypeColor(link.type),
                        }}
                      >
                        {link.customLabel || getLinkTypeLabel(link.type)}
                      </span>
                    </div>
                    <p className="text-sm mb-1">{getReflectionPreview(link.fromReflectionId)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {getReflectionDate(link.fromReflectionId)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Links */}
      {links.outgoing.length === 0 && links.incoming.length === 0 && (
        <Card variant="emphasis">
          <div className="flex items-start gap-3">
            <GitBranch size={20} className="text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="mb-1">No links yet</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Create links to connect this reflection with others in non-linear ways.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Create Link Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Link"
      >
        <div className="space-y-4">
          {/* Link Type */}
          <div>
            <label className="block text-sm mb-2">Link Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ReflectionLink['type'])}
              className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] rounded-lg"
            >
              <option value="connects_to">Connects to</option>
              <option value="builds_on">Builds on</option>
              <option value="contradicts">Contradicts</option>
              <option value="questions">Questions</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Custom Label */}
          {selectedType === 'custom' && (
            <div>
              <label className="block text-sm mb-2">Custom Label</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g., 'inspired by', 'explores'"
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] rounded-lg"
              />
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm mb-2">Find Reflection</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections..."
              className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] rounded-lg mb-2"
            />
          </div>

          {/* Reflection List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredReflections.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                No reflections found
              </p>
            ) : (
              filteredReflections.slice(0, 20).map(reflection => (
                <button
                  key={reflection.id}
                  onClick={() => setSelectedReflectionId(reflection.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedReflectionId === reflection.id
                      ? 'bg-[var(--color-accent-gold)]/20 border border-[var(--color-accent-gold)]'
                      : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <p className="text-sm mb-1">{getReflectionPreview(reflection.id)}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {reflection.createdAt.toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={handleCreateLink}
              disabled={!selectedReflectionId}
            >
              Create Link
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
