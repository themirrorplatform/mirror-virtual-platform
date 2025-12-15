/**
 * Reflection Input - Multimodal thought capture
 * Supports text, voice, video, and document input
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, Video, Upload, Send, Square, Circle } from 'lucide-react';
import { storage, Reflection } from '../../utils/storage';

type InputMode = 'text' | 'voice' | 'video' | 'document';

interface ReflectionInputProps {
  onReflectionCreated?: (reflection: Reflection) => void;
  onRequestMirrorback?: (text: string) => void;
}

export function ReflectionInput({ onReflectionCreated, onRequestMirrorback }: ReflectionInputProps) {
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && mode === 'text') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text, mode]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  const handleSave = () => {
    if (!text.trim()) return;

    const reflection: Reflection = {
      id: Date.now().toString(),
      content: text,
      timestamp: new Date().toISOString(),
      mode: mode,
    };

    storage.saveReflection(reflection);
    
    if (onReflectionCreated) {
      onReflectionCreated(reflection);
    }

    // Request mirrorback if text mode
    if (mode === 'text' && onRequestMirrorback) {
      onRequestMirrorback(text);
    }

    setText('');
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Process audio and convert to text
      setText(prev => prev + '\n[Voice recording captured]');
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Start actual audio recording
    }
  };

  const handleVideoRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setText(prev => prev + '\n[Video recording captured]');
    } else {
      setIsRecording(true);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Process document
      setText(prev => prev + `\n[Document: ${file.name}]`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="flex items-center gap-2 p-1 bg-[var(--color-base-raised)] rounded-xl">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            mode === 'text'
              ? 'bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <MessageSquare size={18} />
          <span className="text-sm">Text</span>
        </button>

        <button
          onClick={() => setMode('voice')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            mode === 'voice'
              ? 'bg-[var(--color-accent-violet)]/20 text-[var(--color-accent-violet)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Mic size={18} />
          <span className="text-sm">Voice</span>
        </button>

        <button
          onClick={() => setMode('video')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            mode === 'video'
              ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Video size={18} />
          <span className="text-sm">Video</span>
        </button>

        <button
          onClick={() => setMode('document')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
            mode === 'document'
              ? 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Upload size={18} />
          <span className="text-sm">Document</span>
        </button>
      </div>

      {/* Input area */}
      <AnimatePresence mode="wait">
        {mode === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="..."
              className="w-full min-h-[300px] px-6 py-4 bg-[var(--color-base-raised)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/30 resize-none transition-all"
              style={{
                fontFamily: 'var(--font-serif)',
                lineHeight: 1.8,
              }}
            />

            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className="w-full px-6 py-4 bg-[var(--color-accent-gold)]/20 hover:bg-[var(--color-accent-gold)]/30 text-[var(--color-accent-gold)] rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={18} />
              <span>Reflect</span>
            </button>
          </motion.div>
        )}

        {mode === 'voice' && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center justify-center py-12">
              <button
                onClick={handleVoiceRecord}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500/20 text-red-500 animate-pulse'
                    : 'bg-[var(--color-accent-violet)]/20 text-[var(--color-accent-violet)] hover:bg-[var(--color-accent-violet)]/30'
                }`}
              >
                {isRecording ? <Square size={32} /> : <Circle size={32} />}
              </button>

              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-[var(--color-text-secondary)] text-lg"
                >
                  {formatTime(recordingTime)}
                </motion.div>
              )}

              <p className="mt-6 text-[var(--color-text-muted)] text-sm">
                {isRecording ? 'Recording...' : 'Click to begin voice capture'}
              </p>
            </div>

            {text && (
              <div className="p-6 bg-[var(--color-base-raised)] rounded-xl">
                <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {text}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {mode === 'video' && (
          <motion.div
            key="video"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="aspect-video bg-[var(--color-base-raised)] rounded-xl flex items-center justify-center">
              <div className="text-center space-y-4">
                <button
                  onClick={handleVideoRecord}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-red-500/20 text-red-500 animate-pulse'
                      : 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)]/30'
                  }`}
                >
                  {isRecording ? <Square size={28} /> : <Circle size={28} />}
                </button>

                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[var(--color-text-secondary)]"
                  >
                    {formatTime(recordingTime)}
                  </motion.div>
                )}

                <p className="text-[var(--color-text-muted)] text-sm">
                  {isRecording ? 'Recording video...' : 'Click to begin video capture'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'document' && (
          <motion.div
            key="document"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <label className="block">
              <div className="w-full h-64 border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/5 transition-all">
                <div className="text-center space-y-3">
                  <Upload size={32} className="mx-auto text-[var(--color-text-muted)]" />
                  <div>
                    <p className="text-[var(--color-text-primary)]">
                      Upload a document
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                      PDF, TXT, MD, or other formats
                    </p>
                  </div>
                </div>
              </div>
              <input
                type="file"
                onChange={handleDocumentUpload}
                className="hidden"
                accept=".pdf,.txt,.md,.doc,.docx"
              />
            </label>

            {text && (
              <div className="p-6 bg-[var(--color-base-raised)] rounded-xl">
                <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {text}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
