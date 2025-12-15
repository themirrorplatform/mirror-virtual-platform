/**
 * Multimodal Controls - Voice and Video Recording
 * Browser-based recording with MediaRecorder API
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Video, Square, Pause, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type InputMode = 'text' | 'voice' | 'video';
export type RecordingState = 'idle' | 'recording' | 'paused' | 'processing';

interface MultimodalControlsProps {
  onRecordingComplete: (blob: Blob, mode: InputMode, duration: number) => void;
  disabled?: boolean;
}

export function MultimodalControls({ onRecordingComplete, disabled }: MultimodalControlsProps) {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const requestPermission = async (mode: InputMode) => {
    try {
      const constraints = mode === 'voice' 
        ? { audio: true } 
        : { audio: true, video: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);
      return stream;
    } catch (err) {
      console.error('Permission denied:', err);
      setHasPermission(false);
      alert(`${mode === 'voice' ? 'Microphone' : 'Camera'} permission denied. Please enable in browser settings.`);
      return null;
    }
  };

  const startRecording = async (mode: InputMode) => {
    const stream = await requestPermission(mode);
    if (!stream) return;

    chunksRef.current = [];
    setInputMode(mode);
    setRecordingState('recording');
    setDuration(0);

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { 
        type: mode === 'voice' ? 'audio/webm' : 'video/webm' 
      });
      setRecordingState('processing');
      
      // Simulate processing
      setTimeout(() => {
        onRecordingComplete(blob, mode, duration);
        setRecordingState('idle');
        setDuration(0);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }, 1000);
    };

    mediaRecorder.start(100);

    // Start duration timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingState('idle');
    setDuration(0);
    chunksRef.current = [];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordingState !== 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="p-6 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${inputMode === 'voice' ? 'bg-blue-500/20' : 'bg-purple-500/20'}`}>
              {inputMode === 'voice' ? <Mic size={20} className="text-blue-500" /> : <Video size={20} className="text-purple-500" />}
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {recordingState === 'recording' && 'Recording...'}
                {recordingState === 'paused' && 'Paused'}
                {recordingState === 'processing' && 'Processing...'}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {inputMode === 'voice' ? 'Voice' : 'Video'} • {formatDuration(duration)}
              </div>
            </div>
          </div>

          {recordingState === 'recording' && (
            <div className="flex items-center gap-2">
              <button
                onClick={pauseRecording}
                className="p-2 hover:bg-[var(--color-base-raised)] rounded-lg transition-colors"
                aria-label="Pause"
              >
                <Pause size={20} className="text-[var(--color-text-secondary)]" />
              </button>
              <button
                onClick={stopRecording}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                aria-label="Stop"
              >
                <Square size={20} className="text-white" fill="white" />
              </button>
              <button
                onClick={cancelRecording}
                className="p-2 hover:bg-[var(--color-base-raised)] rounded-lg transition-colors"
                aria-label="Cancel"
              >
                <Trash2 size={20} className="text-[var(--color-text-muted)]" />
              </button>
            </div>
          )}

          {recordingState === 'paused' && (
            <div className="flex items-center gap-2">
              <button
                onClick={resumeRecording}
                className="p-2 bg-[var(--color-accent-gold)] hover:opacity-90 rounded-lg transition-colors"
                aria-label="Resume"
              >
                <Play size={20} className="text-white" />
              </button>
              <button
                onClick={stopRecording}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                aria-label="Stop"
              >
                <Square size={20} className="text-white" fill="white" />
              </button>
            </div>
          )}
        </div>

        {/* Recording indicator animation */}
        {recordingState === 'recording' && (
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <motion.div
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Recording in progress
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => startRecording('voice')}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg hover:border-blue-500/50 hover:bg-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Record voice"
      >
        <Mic size={16} className="text-blue-500" />
        <span className="text-sm text-[var(--color-text-secondary)]">Voice</span>
      </button>

      <button
        onClick={() => startRecording('video')}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg hover:border-purple-500/50 hover:bg-purple-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Record video"
      >
        <Video size={16} className="text-purple-500" />
        <span className="text-sm text-[var(--color-text-secondary)]">Video</span>
      </button>
    </div>
  );
}
