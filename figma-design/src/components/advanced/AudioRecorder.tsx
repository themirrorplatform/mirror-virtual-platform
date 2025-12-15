/**
 * Audio Recorder - Voice reflection recording
 * 
 * Features:
 * - Simple audio recording
 * - Playback controls
 * - Waveform visualization
 * - Privacy-first (local processing)
 * - No automatic transcription without consent
 * - Optional export
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2,
  Download,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

interface AudioRecorderProps {
  onSave?: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // seconds
  showWaveform?: boolean;
}

export function AudioRecorder({ 
  onSave, 
  maxDuration = 600, // 10 minutes default
  showWaveform = true 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup analyzer for waveform
      if (showWaveform) {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        updateWaveform();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          if (next >= maxDuration) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const playAudio = () => {
    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const downloadRecording = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${new Date().toISOString()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (audioBlob) {
      onSave?.(audioBlob, duration);
    }
  };

  const updateWaveform = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    const normalized = Array.from(dataArray).map(value => (value - 128) / 128);
    setWaveformData(normalized.slice(0, 50)); // Take 50 samples

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isRecording 
                ? 'bg-[var(--color-border-error)]/10'
                : 'bg-[var(--color-accent-blue)]/10'
            }`}>
              <Mic size={20} className={
                isRecording 
                  ? 'text-[var(--color-border-error)]'
                  : 'text-[var(--color-accent-blue)]'
              } />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isRecording 
                  ? isPaused ? 'Paused' : 'Recording...'
                  : audioBlob ? 'Recording ready' : 'Voice Reflection'
                }
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {formatDuration(isRecording ? duration : audioBlob ? duration : 0)}
                {isRecording && ` / ${formatDuration(maxDuration)}`}
              </p>
            </div>
          </div>

          {isRecording && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-[var(--color-border-error)]"
            />
          )}
        </div>

        {/* Waveform */}
        {showWaveform && isRecording && (
          <div className="h-16 flex items-center gap-1">
            {waveformData.map((value, index) => (
              <motion.div
                key={index}
                className="flex-1 bg-[var(--color-accent-blue)] rounded-full"
                style={{
                  height: `${Math.abs(value) * 100}%`,
                  minHeight: '2px',
                }}
                animate={{
                  height: `${Math.abs(value) * 100}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </div>
        )}

        {/* Playback */}
        {audioUrl && !isRecording && (
          <div className="space-y-3">
            <audio
              ref={audioElementRef}
              src={audioUrl}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />

            {/* Progress Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value);
                  setCurrentTime(time);
                  if (audioElementRef.current) {
                    audioElementRef.current.currentTime = time;
                  }
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--color-border-error)]/10 text-[var(--color-border-error)]">
            <AlertCircle size={16} className="mt-0.5" />
            <p className="text-sm flex-1">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isRecording && !audioBlob && (
            <Button onClick={startRecording} className="flex-1">
              <Mic size={16} />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <>
              <Button 
                variant="ghost" 
                onClick={pauseRecording}
                className="flex-1"
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                variant="error" 
                onClick={stopRecording}
                className="flex-1"
              >
                <Square size={16} />
                Stop
              </Button>
            </>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button 
                variant="ghost" 
                onClick={playAudio}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={deleteRecording}
              >
                <Trash2 size={16} />
              </Button>
              <Button 
                variant="ghost" 
                onClick={downloadRecording}
              >
                <Download size={16} />
              </Button>
              {onSave && (
                <Button onClick={handleSave}>
                  Save
                </Button>
              )}
            </>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="text-xs text-[var(--color-text-muted)] space-y-1">
          <p>• Recording happens entirely on your device</p>
          <p>• Audio is not sent anywhere without your explicit action</p>
          <p>• You control all recordings and can delete them at any time</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Audio Player - Simple playback component
 */
interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  onDelete?: () => void;
}

export function AudioPlayer({ audioUrl, title, onDelete }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card variant="emphasis">
      <div className="space-y-3">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />

        {title && (
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-[var(--color-accent-blue)]" />
            <span className="text-sm font-medium">{title}</span>
          </div>
        )}

        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              setCurrentTime(time);
              if (audioRef.current) {
                audioRef.current.currentTime = time;
              }
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={togglePlay} className="flex-1">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          {onDelete && (
            <Button variant="ghost" onClick={onDelete}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * useAudioRecorder Hook - Manage recording state
 */
export function useAudioRecorder() {
  const [recordings, setRecordings] = useState<Array<{
    id: string;
    blob: Blob;
    duration: number;
    timestamp: Date;
  }>>([]);

  const addRecording = (blob: Blob, duration: number) => {
    const recording = {
      id: `recording-${Date.now()}`,
      blob,
      duration,
      timestamp: new Date(),
    };
    setRecordings(prev => [recording, ...prev]);
    return recording.id;
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  const clearAll = () => {
    setRecordings([]);
  };

  return {
    recordings,
    addRecording,
    deleteRecording,
    clearAll,
  };
}

export type { AudioRecorderProps, AudioPlayerProps };
