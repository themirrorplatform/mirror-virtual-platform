import { motion, AnimatePresence } from 'framer-motion';
import { Video, Square, Play, Pause, Scissors, AlertTriangle, Check, X, Camera, StopCircle, SkipBack, SkipForward, Volume2, VolumeX, Edit2, Sliders } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Layer } from './LayerHUD';

interface VideoInstrumentProps {
  layer: Layer;
  onConvertToReflection: (transcript: string, visualNotes?: string, videoBlob?: Blob, metadata?: VideoMetadata) => void;
  onClose: () => void;
}

interface VideoMetadata {
  duration: number;
  resolution: string;
  format: string;
  storeVideo: boolean;
  storeTranscript: boolean;
  redactionApplied: boolean;
  timestamp: string;
}

type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped' | 'processing' | 'error';
type CameraFacing = 'user' | 'environment';

export function VideoInstrument({
  layer,
  onConvertToReflection,
  onClose
}: VideoInstrumentProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [transcript, setTranscript] = useState('');
  const [visualNotes, setVisualNotes] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [storeVideo, setStoreVideo] = useState(layer !== 'sovereign');
  const [storeTranscript, setStoreTranscript] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<CameraFacing>('user');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showRedactionTools, setShowRedactionTools] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && recordingState === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: resolution === '1080p' ? 1920 : 1280 },
          height: { ideal: resolution === '1080p' ? 1080 : 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        setRecordingState('processing');
        
        // Simulate transcription
        setTimeout(() => {
          const mockTranscript = 'Video transcript would appear here after processing through speech-to-text service.';
          const mockVisualNotes = 'Visual analysis: Scene appears to be indoors. Lighting is moderate. No identifying information detected.';
          setTranscript(mockTranscript);
          setVisualNotes(mockVisualNotes);
          setRecordingState('stopped');
        }, 2000);
      };

      mediaRecorder.start(100);
      setRecordingState('recording');
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (error) {
      setPermissionError('Camera/microphone permission denied or not available. Please check your browser settings.');
      setRecordingState('error');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
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
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (playbackRef.current) {
      if (isPlaying) {
        playbackRef.current.pause();
        setIsPlaying(false);
      } else {
        playbackRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (playbackRef.current) {
      playbackRef.current.currentTime = Math.max(
        0,
        Math.min(playbackRef.current.duration, playbackRef.current.currentTime + seconds)
      );
    }
  };

  const toggleMute = () => {
    if (playbackRef.current) {
      playbackRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConvert = () => {
    const metadata: VideoMetadata = {
      duration,
      resolution: resolution === '1080p' ? '1920x1080' : '1280x720',
      format: 'video/webm',
      storeVideo,
      storeTranscript,
      redactionApplied: showRedactionTools,
      timestamp: new Date().toISOString()
    };
    
    onConvertToReflection(
      transcript,
      visualNotes,
      storeVideo ? videoBlob || undefined : undefined,
      metadata
    );
  };

  const layerStorageInfo = {
    sovereign: 'Video cannot be uploaded in Sovereign layer. Local storage only.',
    commons: 'Transcript may contribute to patterns. Video stays local unless explicitly shared.',
    builder: 'Video for constitutional testing purposes only.'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-3xl overflow-hidden flex flex-col shadow-ambient-xl"
        role="dialog"
        aria-label="Video recording"
      >
        {/* Header */}
        <div className="p-10 pb-8 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-5">
              <div className="p-3.5 rounded-2xl bg-[var(--color-surface-emphasis)]">
                <Video size={24} className="text-[var(--color-accent-gold)]" />
              </div>
              <div>
                <h2 className="text-xl text-[var(--color-text-primary)] mb-2">Video Recording</h2>
                <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
                  {layerStorageInfo[layer]}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-xl hover:bg-[var(--color-surface-emphasis)] transition-colors ml-6"
              aria-label="Close"
            >
              <X size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Boundaries Warning */}
          <div className="mt-6 p-5 rounded-xl bg-[var(--color-warning)]/10 border-2 border-[var(--color-warning)]/30">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-[var(--color-warning)] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Video analysis: No medical diagnosis, no identity inference, no emotion detection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Permission Error */}
          <AnimatePresence>
            {permissionError && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-6"
              >
                <div className="p-4 rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
                  <div className="flex items-start gap-2">
                    <X size={16} className="text-[var(--color-error)] mt-0.5" />
                    <div>
                      <div className="text-sm text-[var(--color-error)] mb-1">Permission Denied</div>
                      <p className="text-xs text-[var(--color-text-secondary)]">{permissionError}</p>
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
                className="mb-6 flex items-center justify-center py-12"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl font-bold text-[var(--color-accent-gold)]"
                >
                  {countdown}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Idle State - Settings & Start */}
          {recordingState === 'idle' && !permissionError && (
            <div className="space-y-4">
              {/* Camera/Resolution Settings */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-2">Camera</div>
                  <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-subtle)]">
                    <button
                      onClick={() => setCameraFacing('user')}
                      className={`flex-1 px-3 py-2 text-xs transition-colors ${
                        cameraFacing === 'user'
                          ? 'bg-[var(--color-accent-gold)] text-black'
                          : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      Front
                    </button>
                    <button
                      onClick={() => setCameraFacing('environment')}
                      className={`flex-1 px-3 py-2 text-xs transition-colors ${
                        cameraFacing === 'environment'
                          ? 'bg-[var(--color-accent-gold)] text-black'
                          : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
                  <div className="text-xs text-[var(--color-text-muted)] mb-2">Quality</div>
                  <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-subtle)]">
                    <button
                      onClick={() => setResolution('720p')}
                      className={`flex-1 px-3 py-2 text-xs transition-colors ${
                        resolution === '720p'
                          ? 'bg-[var(--color-accent-gold)] text-black'
                          : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      720p
                    </button>
                    <button
                      onClick={() => setResolution('1080p')}
                      className={`flex-1 px-3 py-2 text-xs transition-colors ${
                        resolution === '1080p'
                          ? 'bg-[var(--color-accent-gold)] text-black'
                          : 'bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      1080p
                    </button>
                  </div>
                </div>
              </div>

              {/* Start Recording Button */}
              <button
                onClick={startCountdown}
                className="w-full p-8 rounded-2xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] border-2 border-dashed border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-all flex flex-col items-center gap-3 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Camera size={32} className="text-[var(--color-accent-gold)] group-hover:drop-shadow-[0_0_8px_var(--color-accent-gold)]" />
                </motion.div>
                <span className="text-sm text-[var(--color-text-primary)]">Tap to start recording</span>
                <span className="text-xs text-[var(--color-text-muted)]">3 second countdown will begin</span>
              </button>
            </div>
          )}

          {/* Recording/Paused State */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Recording Indicator Overlay */}
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 backdrop-blur-sm">
                  {recordingState === 'recording' ? (
                    <motion.div
                      className="w-3 h-3 rounded-full bg-[var(--color-error)]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
                  )}
                  <span className="text-sm text-white font-mono font-bold">
                    {formatDuration(duration)}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {recordingState === 'recording' ? (
                  <button
                    onClick={pauseRecording}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-black text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Pause size={16} />
                    <span>Pause</span>
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    <span>Resume</span>
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <StopCircle size={16} />
                  <span>Stop</span>
                </button>
              </div>

              <div className="text-xs text-center text-[var(--color-text-muted)]">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-surface-emphasis)] font-mono">Space</kbd> to {recordingState === 'recording' ? 'pause' : 'resume'}
              </div>
            </div>
          )}

          {/* Processing State */}
          <AnimatePresence>
            {recordingState === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 rounded-2xl bg-[var(--color-surface-emphasis)] flex flex-col items-center gap-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Video size={24} className="text-[var(--color-accent-gold)]" />
                </motion.div>
                <span className="text-sm text-[var(--color-text-primary)]">Processing video...</span>
                <div className="w-full h-1 bg-[var(--color-surface-card)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--color-accent-gold)]"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stopped State - Playback & Transcript */}
          {recordingState === 'stopped' && videoBlob && (
            <div className="space-y-4">
              {/* Playback */}
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <video
                  ref={playbackRef}
                  src={URL.createObjectURL(videoBlob)}
                  className="w-full aspect-video object-contain"
                  onTimeUpdate={(e) => {
                    const video = e.currentTarget;
                    setPlaybackPosition((video.currentTime / video.duration) * 100);
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                    setPlaybackPosition(0);
                  }}
                />
                
                {/* Playback Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={togglePlayback}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {isPlaying ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
                    </button>
                    <button
                      onClick={() => skipTime(-5)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <SkipBack size={14} className="text-white" />
                    </button>
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        style={{ width: `${playbackPosition}%` }}
                      />
                    </div>
                    <button
                      onClick={() => skipTime(5)}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      <SkipForward size={14} className="text-white" />
                    </button>
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                    >
                      {isMuted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Redaction Tools */}
              <button
                onClick={() => setShowRedactionTools(!showRedactionTools)}
                className="w-full p-4 rounded-2xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Scissors size={16} className="text-[var(--color-text-muted)]" />
                  <span className="text-sm text-[var(--color-text-primary)]">Redaction Tools</span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {showRedactionTools ? 'Hide' : 'Show'}
                </span>
              </button>

              <AnimatePresence>
                {showRedactionTools && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)] space-y-3"
                  >
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Trim, blur regions, or mute audio sections (placeholder UI)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button className="px-3 py-2 rounded-lg bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors">
                        Trim
                      </button>
                      <button className="px-3 py-2 rounded-lg bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors">
                        Blur
                      </button>
                      <button className="px-3 py-2 rounded-lg bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-overlay)] text-xs text-[var(--color-text-secondary)] transition-colors">
                        Mute
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Transcript */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-text-primary)]">Transcript</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-success)]/20 text-[var(--color-success)]">
                    Uncertain
                  </span>
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  {transcript}
                </div>
              </div>

              {/* Visual Notes */}
              <div className="p-4 rounded-2xl bg-[var(--color-surface-emphasis)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--color-text-primary)]">Visual Notes</span>
                  <button
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                    className="text-xs text-[var(--color-accent-gold)] hover:underline flex items-center gap-1"
                  >
                    <Edit2 size={12} />
                    <span>{isEditingNotes ? 'Done' : 'Edit'}</span>
                  </button>
                </div>
                {isEditingNotes ? (
                  <textarea
                    value={visualNotes}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setVisualNotes(e.target.value)}
                    className="w-full min-h-[80px] p-3 rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] resize-none focus:outline-none focus:border-[var(--color-accent-gold)]"
                  />
                ) : (
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {visualNotes}
                  </div>
                )}
              </div>

              {/* Storage Options */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeVideo}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreVideo(e.target.checked)}
                      disabled={layer === 'sovereign'}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-[var(--color-text-primary)] mb-1">Store video</div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {layer === 'sovereign' ? 'Upload blocked in Sovereign layer' : 'May be stored based on layer settings'}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeTranscript}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreTranscript(e.target.checked)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-[var(--color-text-primary)] mb-1">Store transcript & notes</div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Text version for reflection
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-surface-emphasis)] hover:bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] text-sm transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleConvert}
                  disabled={!storeVideo && !storeTranscript}
                  className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/90 text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>Add to Reflection</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

