/**
 * Threads Screen (Backend Integrated)
 * 
 * Thread management connected to IndexedDB
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { useAppState, useThreads, useCurrentThread } from '../../hooks/useAppState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '../EmptyState';

export function ThreadsScreenIntegrated() {
  const {
    createThread,
    updateThread,
    deleteThread,
    setCurrentThread,
    currentThread: currentThreadId,
  } = useAppState();

  const threads = useThreads();
  const currentThreadData = useCurrentThread();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim()) return;

    try {
      const thread = await createThread(newThreadTitle.trim());
      setNewThreadTitle('');
      setIsCreating(false);
      setCurrentThread(thread.id);
    } catch (error) {
      console.error('Failed to create thread:', error);
    }
  };

  return (
    <div className="h-full flex">
      {/* Thread List */}
      <div className="w-80 border-r border-[var(--color-border-subtle)] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Threads</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Search */}
          <Input
            type="search"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
          />
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {/* Create New Thread Form */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]"
              >
                <Input
                  type="text"
                  placeholder="Thread title..."
                  value={newThreadTitle}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewThreadTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateThread();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={handleCreateThread}>
                    Create
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsCreating(false);
                      setNewThreadTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thread Items */}
          {filteredThreads.length === 0 ? (
            <div className="p-8">
              <EmptyState
                message={searchQuery ? 'No threads match your search' : 'No threads yet'}
              />
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => setCurrentThread(thread.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    currentThreadId === thread.id
                      ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'
                      : 'hover:bg-[var(--color-surface-hover)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{thread.title}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {thread.reflectionIds.length} reflection
                      {thread.reflectionIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Thread Detail */}
      <div className="flex-1 overflow-y-auto">
        {currentThreadData ? (
          <ThreadDetail
            thread={currentThreadData.thread}
            reflections={currentThreadData.reflections}
            onUpdateThread={(updates) => updateThread(currentThreadData.thread.id, updates)}
            onDeleteThread={() => {
              if (confirm('Delete this thread? Reflections will remain in archive.')) {
                deleteThread(currentThreadData.thread.id);
                setCurrentThread(null);
              }
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState message="Select a thread to view" />
          </div>
        )}
      </div>
    </div>
  );
}

// Thread Detail Component
interface ThreadDetailProps {
  thread: any;
  reflections: any[];
  onUpdateThread: (updates: any) => void;
  onDeleteThread: () => void;
}

function ThreadDetail({ thread, reflections, onUpdateThread, onDeleteThread }: ThreadDetailProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(thread.title);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== thread.title) {
      onUpdateThread({ title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const sortedReflections = [...reflections].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Thread Header */}
        <div className="space-y-4">
          {isEditingTitle ? (
            <Input
              type="text"
              value={editedTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setEditedTitle(thread.title);
                }
              }}
              onBlur={handleSaveTitle}
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="text-2xl font-medium cursor-pointer hover:text-[var(--color-accent-blue)] transition-colors"
            >
              {thread.title}
            </h1>
          )}

          <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
            <span>
              {reflections.length} reflection{reflections.length !== 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={onDeleteThread}>
              Delete Thread
            </Button>
          </div>
        </div>

        {/* Reflections */}
        {sortedReflections.length === 0 ? (
          <EmptyState message="No reflections in this thread yet" />
        ) : (
          <div className="space-y-6">
            {sortedReflections.map((reflection, index) => (
              <motion.div
                key={reflection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <span>{new Date(reflection.createdAt).toLocaleDateString()}</span>
                      {reflection.identityAxis && (
                        <span className="px-2 py-1 rounded bg-[var(--color-surface-hover)]">
                          {reflection.identityAxis}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {reflection.content}
                    </p>
                    {reflection.tags && reflection.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {reflection.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full bg-[var(--color-accent-blue)]/10 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



