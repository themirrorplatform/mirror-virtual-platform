import { useState, useEffect } from 'react';
import { ThreadList } from '../ThreadList';
import { ThreadDetail } from '../ThreadDetail';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { storage, Thread as StoredThread, Reflection } from '../../utils/storage';

interface Thread {
  id: string;
  name: string;
  nodeCount: number;
  lastUpdated: string;
  hasTensions?: boolean;
  hasContradictions?: boolean;
}

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

export function ThreadsScreen() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newThreadName, setNewThreadName] = useState('');

  // Load threads from storage
  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = () => {
    const storedThreads = storage.getThreads();
    const mappedThreads: Thread[] = storedThreads.map(t => ({
      id: t.id,
      name: t.name,
      nodeCount: t.reflectionIds.length,
      lastUpdated: formatTimestamp(t.lastUpdated),
      hasTensions: t.tensions.length > 0,
      hasContradictions: t.contradictions.length > 0,
    }));
    setThreads(mappedThreads);
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNodesForThread = (threadId: string): Node[] => {
    const reflections = storage.getReflectionsByThread(threadId);
    return reflections.map(r => ({
      id: r.id,
      text: r.text,
      timestamp: new Date(r.timestamp).toLocaleString(),
      // TODO: Add tension detection
    }));
  };

  const getTensionsForThread = (threadId: string): Tension[] => {
    const thread = storage.getThreads().find(t => t.id === threadId);
    if (!thread) return [];

    return thread.tensions.map(t => ({
      label: t.label,
      count: t.reflectionIds.length,
      intensity: t.intensity,
      description: t.description,
    }));
  };

  const getContradictionsForThread = (threadId: string): Contradiction[] => {
    const thread = storage.getThreads().find(t => t.id === threadId);
    if (!thread) return [];

    return thread.contradictions.map(c => ({
      nodeAId: c.reflectionIdA,
      nodeBId: c.reflectionIdB,
      description: c.description,
    }));
  };

  const handleCreateThread = () => {
    if (!newThreadName.trim()) return;

    const newThread: StoredThread = {
      id: `thread_${Date.now()}`,
      name: newThreadName.trim(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      reflectionIds: [],
      tensions: [],
      contradictions: [],
    };

    storage.saveThread(newThread);
    loadThreads(); // Reload from storage
    setNewThreadName('');
    setShowCreateDialog(false);
    setSelectedThreadId(newThread.id);
  };

  const handleRenameThread = (threadId: string, newName: string) => {
    setThreads(threads.map(t => 
      t.id === threadId ? { ...t, name: newName } : t
    ));
  };

  const handleArchiveThread = (threadId: string) => {
    // TODO: Add archive flag instead of deleting
    setThreads(threads.filter(t => t.id !== threadId));
    setSelectedThreadId(null);
  };

  const handleAddReflection = () => {
    alert('Add reflection flow - connects to Mirror realm with "Link to Thread"');
  };

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  if (selectedThreadId && selectedThread) {
    return (
      <ThreadDetail
        threadId={selectedThread.id}
        threadName={selectedThread.name}
        nodes={getNodesForThread(selectedThread.id)}
        tensions={getTensionsForThread(selectedThread.id)}
        contradictions={getContradictionsForThread(selectedThread.id)}
        onBack={() => setSelectedThreadId(null)}
        onRename={(newName) => handleRenameThread(selectedThread.id, newName)}
        onArchive={() => handleArchiveThread(selectedThread.id)}
        onAddReflection={handleAddReflection}
      />
    );
  }

  return (
    <>
      <ThreadList
        threads={threads}
        onSelectThread={setSelectedThreadId}
        onCreateThread={() => setShowCreateDialog(true)}
      />

      {/* Create Thread Dialog */}
      {showCreateDialog && (
        <Dialog
          isOpen={showCreateDialog}
          onClose={() => {
            setShowCreateDialog(false);
            setNewThreadName('');
          }}
          title="Name a thread"
        >
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Threads collect reflections around themes that recur in your life. Name this one something that captures what it's about.
            </p>
            <Input
              value={newThreadName}
              onChange={setNewThreadName}
              placeholder="e.g., Financial Uncertainty, Identity Questions..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateThread();
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewThreadName('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateThread}
                disabled={!newThreadName.trim()}
              >
                Create thread
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}


