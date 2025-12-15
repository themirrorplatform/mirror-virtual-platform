import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Play, Pause, Trash2, Download, Video, Eye, EyeOff } from 'lucide-react';

interface VideoRecordingCardProps {
  duration: number;
  timestamp: string;
  transcript?: string;
  thumbnailUrl?: string;
  onDelete?: () => void;
  onUseTranscript?: (transcript: string) => void;
}

export function VideoRecordingCard({
  duration,
  timestamp,
  transcript,
  thumbnailUrl,
  onDelete,
  onUseTranscript,
}: VideoRecordingCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [videoProcessed, setVideoProcessed] = useState(true);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-4">
        {/* Video Preview */}
        <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-[var(--color-base-raised)] flex-shrink-0">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video size={32} className="text-[var(--color-text-muted)]" />
            </div>
          )}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors"
          >
            {isPlaying ? (
              <Pause size={32} className="text-white" />
            ) : (
              <Play size={32} className="text-white" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="text-sm mb-1">Video Recording</h5>
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

          {/* Safety Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30 mb-3">
            {videoProcessed ? <Eye size={16} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" /> : <EyeOff size={16} className="text-[var(--color-accent-gold)] mt-0.5 flex-shrink-0" />}
            <div className="text-xs text-[var(--color-text-secondary)]">
              {videoProcessed ? (
                <>Video processed locally. Visual data never sent to any model—only transcribed audio.</>
              ) : (
                <>Processing video locally... Visual data will not be sent to any model.</>
              )}
            </div>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="border-t border-[var(--color-border-subtle)] pt-3">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-sm text-[var(--color-accent-purple)] hover:underline mb-2"
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

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button variant="ghost" size="sm">
              <Download size={14} className="mr-1" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
