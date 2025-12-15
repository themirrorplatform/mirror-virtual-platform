/**
 * Recording Card - Display completed recordings
 */

import { Mic, Video, Trash2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Recording {
  id: string;
  type: 'voice' | 'video';
  duration: number;
  timestamp: string;
  blob: Blob;
  transcript?: string;
}

interface RecordingCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
}

export function RecordingCard({ recording, onDelete }: RecordingCardProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileSize = (blob: Blob) => {
    const kb = blob.size / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${recording.type === 'voice' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
          {recording.type === 'voice' ? (
            <Mic size={16} className="text-blue-500" />
          ) : (
            <Video size={16} className="text-purple-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {recording.type === 'voice' ? 'Voice Recording' : 'Video Recording'}
            </span>
            <button
              onClick={() => onDelete(recording.id)}
              className="p-1 hover:bg-[var(--color-base-raised)] rounded transition-colors"
              aria-label="Delete recording"
            >
              <Trash2 size={14} className="text-[var(--color-text-muted)]" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mb-2">
            <span>{formatDuration(recording.duration)}</span>
            <span>•</span>
            <span>{getFileSize(recording.blob)}</span>
            <span>•</span>
            <span>{recording.timestamp}</span>
          </div>

          {recording.transcript && (
            <div className="mt-3 p-3 bg-[var(--color-base-raised)] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={12} className="text-[var(--color-text-muted)]" />
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Transcript (simulated)
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {recording.transcript}
              </p>
            </div>
          )}

          {recording.type === 'voice' && (
            <audio 
              controls 
              src={URL.createObjectURL(recording.blob)}
              className="mt-3 w-full h-8"
              style={{ maxWidth: '100%' }}
            />
          )}

          {recording.type === 'video' && (
            <video 
              controls 
              src={URL.createObjectURL(recording.blob)}
              className="mt-3 w-full rounded-lg"
              style={{ maxHeight: '200px' }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
