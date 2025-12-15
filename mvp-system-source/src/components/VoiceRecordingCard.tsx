import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Play, Pause, Trash2, Download, FileAudio } from 'lucide-react';

interface VoiceRecordingCardProps {
  duration: number;
  timestamp: string;
  transcript?: string;
  onDelete?: () => void;
  onUseTranscript?: (transcript: string) => void;
}

export function VoiceRecordingCard({
  duration,
  timestamp,
  transcript,
  onDelete,
  onUseTranscript,
}: VoiceRecordingCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-4">
        {/* Audio Icon */}
        <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/20">
          <FileAudio size={24} className="text-[var(--color-accent-blue)]" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="text-sm mb-1">Voice Recording</h5>
              <p className="text-xs text-[var(--color-text-muted)]">
                {timestamp} • {formatDuration(duration)}
              </p>
            </div>
            <button
              onClick={onDelete}
              className="p-2 rounded hover:bg-[var(--color-base-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-[var(--color-accent-blue)]/20 hover:bg-[var(--color-accent-blue)]/30 text-[var(--color-accent-blue)] transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            {/* Waveform visualization placeholder */}
            <div className="flex-1 h-8 flex items-center gap-0.5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[var(--color-accent-blue)]/30 rounded-full"
                  style={{
                    height: `${Math.random() * 100}%`,
                    minHeight: '4px',
                  }}
                />
              ))}
            </div>

            <button className="p-2 rounded hover:bg-[var(--color-base-raised)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
              <Download size={16} />
            </button>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="border-t border-[var(--color-border-subtle)] pt-3">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-sm text-[var(--color-accent-blue)] hover:underline mb-2"
              >
                {showTranscript ? 'Hide' : 'Show'} Transcript
              </button>
              
              {showTranscript && (
                <>
                  <div className="p-3 rounded-lg bg-[var(--color-base-raised)] text-sm text-[var(--color-text-secondary)] mb-3">
                    {transcript}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onUseTranscript?.(transcript)}
                  >
                    Use as Reflection Text
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
