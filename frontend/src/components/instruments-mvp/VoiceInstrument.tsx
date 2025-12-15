import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Play, Pause, Edit2, Check, X, Info, Download, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Layer } from './LayerHUD';

interface VoiceInstrumentProps {
  layer: Layer;
  onConvertToReflection: (transcript: string, audioBlob?: Blob, metadata?: VoiceMetadata) => void;
  onClose: () => void;
}

interface VoiceMetadata {
  duration: number;
  format: string;
  sampleRate?: number;
  storeAudio: boolean;
  storeTranscript: boolean;
  timestamp: string;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped' | 'processing' | 'error';

export function VoiceInstrument({
  layer,
  onConvertToReflection,
  onClose
}: VoiceInstrumentProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [pausedAt, setPausedAt] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [storeAudio, setStoreAudio] = useState(layer === 'sovereign');
  const [storeTranscript, setStoreTranscript] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [confidence, setConfidence] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && recordingState === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Audio level visualization
  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setVolumeLevel(average / 255);
    
    if (recordingState === 'recording') {
      animationFrameRef.current = requestAnimationFrame(visualizeAudio);
    }
  };

  // Countdown before recording
  const startCountdown = async () => {
    setRecordingState('countdown');
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      // Set up audio visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      visualizeAudio();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        setRecordingState('processing');
        
        // Simulate transcription with confidence
        setTimeout(() => {
          const mockTranscript = 'This is where the transcription would appear after processing the audio through the speech-to-text service. The system would analyze the audio and convert it to text, showing confidence levels for different segments.';
          setTranscript(mockTranscript);
          setConfidence(0.92);
          setRecordingState('stopped');
        }, 1500);
      };

      mediaRecorder.start(100); // Capture in 100ms chunks
      setRecordingState('recording');
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (error) {
      setPermissionError('Microphone permission denied or not available. Please check your browser settings.');
      setRecordingState('error');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setPausedAt(duration);
      setRecordingState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      
      visualizeAudio();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const playAudio = () => {
    if (audioBlob && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConvert = () => {
    const metadata: VoiceMetadata = {
      duration,
      format: 'audio/webm',
      storeAudio,
      storeTranscript,
      timestamp: new Date().toISOString()
    };
    
    onConvertToReflection(
      transcript,
      storeAudio ? audioBlob || undefined : undefined,
      metadata
    );
  };

  const layerStorageInfo = {
    sovereign: 'Audio and transcript stay on this device only',
    commons: 'Transcript may contribute to anonymized patterns. Audio never shared.',
    builder: 'Audio for constitutional testing purposes only'
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && recordingState === 'recording') {
        e.preventDefault();
        pauseRecording();
      } else if (e.key === ' ' && recordingState === 'paused') {
        e.preventDefault();
        resumeRecording();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingState, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="w-full max-w-3xl mx-auto"
    >
      <div className="rounded-3xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] shadow-ambient-xl overflow-hidden">
        {/* Header with Layer context */}
        <div className="flex items-start justify-between p-12 pb-10 border-b border-[var(--color-border-subtle)]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-5 mb-5">
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-emphasis)]">
                <Mic size={24} className="text-[var(--color-accent-gold)]" />
              </div>
              <h2 className="text-xl">Voice Reflection</h2>
            </div>
            <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
              {layerStorageInfo[layer]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3.5 rounded-xl hover:bg-[var(--color-surface-emphasis)] transition-colors shadow-ambient-sm ml-8 flex-shrink-0"
            aria-label="Close"
          >
            <X size={22} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Content area with consistent padding */}
        <div className="p-12">
          {/* Permission Error */}
          <AnimatePresence>
            {permissionError && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-10 overflow-hidden"
              >
                <div className="p-7 rounded-2xl bg-[var(--color-error)]/10 border-2 border-[var(--color-error)]/30">
                  <div className="flex items-start gap-4">
                    <X size={20} className="text-[var(--color-error)] mt-1" />
                    <div className="flex-1">
                      <div className="text-base text-[var(--color-error)] mb-3 font-medium">Permission Denied</div>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{permissionError}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Countdown */}
          <AnimatePresence>
            {recordingState === 'countdown' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="mb-10 flex items-center justify-center py-20"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-7xl font-bold text-[var(--color-accent-gold)]"
                >
                  {countdown}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Controls - Idle */}
          {recordingState === 'idle' && !permissionError && (
            <div className="mb-10">
              <button
                onClick={startCountdown}
                className="w-full p-12 rounded-2xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-all flex flex-col items-center gap-5 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mic size={40} className="text-[var(--color-accent-gold)] group-hover:drop-shadow-[0_0_8px_var(--color-accent-gold)]" />
                </motion.div>
                <span className="text-base text-[var(--color-text-primary)] font-medium">Tap to start recording</span>
                <span className="text-sm text-[var(--color-text-muted)]">3 second countdown will begin</span>
              </button>
            </div>
          )}

          {/* Recording Active */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div className="mb-10">
              <div className={`p-9 rounded-2xl border-2 ${ 
                recordingState === 'paused' 
                  ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
                  : 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30'
              }`}>
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-4">
                    {recordingState === 'recording' ? (
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full bg-[var(--color-error)]"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-warning)]" />
                    )}
                    <span className="text-base text-[var(--color-text-primary)] font-medium">
                      {recordingState === 'recording' ? 'Recording...' : 'Paused'}
                    </span>
                  </div>
                  <span className="text-xl text-[var(--color-text-primary)] font-mono font-bold">
                    {formatDuration(duration)}
                  </span>
                </div>

                {/* Waveform visualization */}
                <div className="h-28 bg-[var(--color-surface-card)] rounded-xl mb-7 flex items-center justify-center px-6 overflow-hidden">
                  <div className="flex items-center gap-1.5 w-full justify-center">
                    {[...Array(40)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-[var(--color-accent-gold)]"
                        animate={{
                          height: recordingState === 'recording' 
                            ? [8, (volumeLevel * 60 + 8) * (Math.random() * 0.5 + 0.5), 8]
                            : 8
                        }}
                        transition={{
                          duration: 0.3,
                          repeat: recordingState === 'recording' ? Infinity : 0,
                          delay: i * 0.02
                        }}
                        style={{
                          opacity: recordingState === 'paused' ? 0.3 : 1
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {recordingState === 'recording' ? (
                    <button
                      onClick={pauseRecording}
                      className="flex-1 px-6 py-5 rounded-xl bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-black text-base font-medium transition-colors flex items-center justify-center gap-3"
                      aria-label="Pause recording"
                    >
                      <Pause size={20} />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={resumeRecording}
                      className="flex-1 px-6 py-5 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-base font-medium transition-colors flex items-center justify-center gap-3"
                      aria-label="Resume recording"
                    >
                      <Play size={20} />
                      <span>Resume</span>
                    </button>
                  )}
                  <button
                    onClick={stopRecording}
                    className="flex-1 px-6 py-5 rounded-xl bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white text-base font-medium transition-colors flex items-center justify-center gap-3"
                    aria-label="Stop recording"
                  >
                    <Square size={20} />
                    <span>Stop</span>
                  </button>
                </div>

                <div className="mt-5 text-sm text-center text-[var(--color-text-muted)]">
                  Press <kbd className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-card)] font-mono">Space</kbd> to {recordingState === 'recording' ? 'pause' : 'resume'}
                </div>
              </div>
            </div>
          )}

          {/* Processing */}
          <AnimatePresence>
            {recordingState === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-10 p-10 rounded-2xl bg-[var(--color-surface-emphasis)] flex flex-col items-center gap-5"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Mic size={32} className="text-[var(--color-accent-gold)]" />
                </motion.div>
                <span className="text-base text-[var(--color-text-primary)]">Processing audio...</span>
                <div className="w-full h-2 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--color-accent-gold)]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording Stopped - Show Transcript */}
          {recordingState === 'stopped' && (
            <>
              {/* Playback */}
              <div className="mb-10">
                <div className="p-7 rounded-2xl bg-[var(--color-surface-emphasis)]">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Recording</span>
                    <span className="text-base text-[var(--color-text-primary)] font-mono font-medium">
                      {formatDuration(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-5">
                    <button
                      onClick={playAudio}
                      className="p-5 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black transition-colors"
                      aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    <div className="flex-1 h-2 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--color-accent-gold)]"
                        style={{ width: `${playbackPosition}%` }}
                      />
                    </div>

                    <audio
                      ref={audioRef}
                      src={audioBlob ? URL.createObjectURL(audioBlob) : undefined}
                      onTimeUpdate={(e) => {
                        const audio = e.currentTarget;
                        setPlaybackPosition((audio.currentTime / audio.duration) * 100);
                      }}
                      onEnded={() => {
                        setIsPlaying(false);
                        setPlaybackPosition(0);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm text-[var(--color-text-primary)]">Transcript</span>
                    {confidence > 0 && (
                      <span className="px-2.5 py-1 rounded text-xs bg-[var(--color-success)]/20 text-[var(--color-success)]">
                        {Math.round(confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditingTranscript(!isEditingTranscript)}
                    className="text-xs text-[var(--color-accent-gold)] hover:underline flex items-center gap-1.5"
                  >
                    <Edit2 size={14} />
                    <span>{isEditingTranscript ? 'Done' : 'Edit'}</span>
                  </button>
                </div>
                {isEditingTranscript ? (
                  <textarea
                    value={transcript}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTranscript(e.target.value)}
                    className="w-full min-h-[140px] p-4 rounded-xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] resize-none focus:outline-none focus:border-[var(--color-accent-gold)]"
                    placeholder="Edit transcript..."
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-secondary)] min-h-[140px] leading-relaxed">
                    {transcript || 'Transcription in progress...'}
                  </div>
                )}
              </div>

              {/* Storage Options */}
              <div className="mb-10 space-y-4">
                <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)]">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeAudio}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreAudio(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        <Volume2 size={16} className="text-[var(--color-text-muted)]" />
                        <span className="text-sm text-[var(--color-text-primary)]">Store audio recording</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        {layer === 'sovereign' 
                          ? 'Stored locally on this device' 
                          : 'May be stored remotely depending on layer settings'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)]">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeTranscript}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreTranscript(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        <FileText size={16} className="text-[var(--color-text-muted)]" />
                        <span className="text-sm text-[var(--color-text-primary)]">Store transcript</span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                        Text version for searching and reflection
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-5 py-4 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleConvert}
                  disabled={!storeAudio && !storeTranscript}
                  className="flex-1 px-5 py-4 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  <Check size={18} />
                  <span>Add to Reflection</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

