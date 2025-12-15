import { useState } from 'react';
import { Mic, Video, FileText, Circle, Square, Pause, Play } from 'lucide-react';
import { Button } from './Button';

export type InputMode = 'text' | 'voice' | 'video' | 'document';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

interface MultimodalControlsProps {
  activeMode: InputMode;
  onModeChange: (mode: InputMode) => void;
  recordingState: RecordingState;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  recordingDuration?: number;
}

export function MultimodalControls({
  activeMode,
  onModeChange,
  recordingState,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  recordingDuration = 0,
}: MultimodalControlsProps) {
  const isRecording = recordingState === 'recording' || recordingState === 'paused';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mode Selector */}
      <div className="flex items-center gap-1 p-1 bg-[var(--color-base-raised)] rounded-lg border border-[var(--color-border-subtle)]">
        <button
          onClick={() => onModeChange('text')}
          className={`p-2 rounded transition-colors ${
            activeMode === 'text'
              ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
          title="Text input"
        >
          <FileText size={18} />
        </button>
        <button
          onClick={() => onModeChange('voice')}
          className={`p-2 rounded transition-colors ${
            activeMode === 'voice'
              ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
          title="Voice input"
        >
          <Mic size={18} />
        </button>
        <button
          onClick={() => onModeChange('video')}
          className={`p-2 rounded transition-colors ${
            activeMode === 'video'
              ? 'bg-[var(--color-accent-purple)]/20 text-[var(--color-accent-purple)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
          title="Video input"
        >
          <Video size={18} />
        </button>
        <button
          onClick={() => onModeChange('document')}
          className={`p-2 rounded transition-colors ${
            activeMode === 'document'
              ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
          title="Document upload"
        >
          <FileText size={18} />
        </button>
      </div>

      {/* Recording Controls */}
      {(activeMode === 'voice' || activeMode === 'video') && (
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onStartRecording}
              className="flex items-center gap-2"
            >
              <Circle size={16} className="fill-current" />
              Start Recording
            </Button>
          ) : (
            <>
              {recordingState === 'recording' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onPauseRecording}
                  className="flex items-center gap-2"
                >
                  <Pause size={16} />
                  Pause
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onResumeRecording}
                  className="flex items-center gap-2"
                >
                  <Play size={16} />
                  Resume
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={onStopRecording}
                className="flex items-center gap-2"
              >
                <Square size={16} className="fill-current" />
                Stop
              </Button>
              <span className="text-sm text-[var(--color-text-muted)] font-mono">
                {formatDuration(recordingDuration)}
              </span>
            </>
          )}
        </div>
      )}

      {recordingState === 'processing' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-[var(--color-accent-blue)]/10 rounded-lg">
          <div className="w-2 h-2 bg-[var(--color-accent-blue)] rounded-full animate-pulse" />
          <span className="text-sm text-[var(--color-accent-blue)]">Processing...</span>
        </div>
      )}
    </div>
  );
}
