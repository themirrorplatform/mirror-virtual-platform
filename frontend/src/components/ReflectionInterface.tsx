"""
React Frontend Component: Reflection Interface
Complete implementation with voice, text, and mirrorback display
"""

// Enhanced ReflectionComposer with voice support
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Mic, MicOff, Loader2, Send, AlertTriangle } from 'lucide-react';

interface ReflectionComposerProps {
  onReflectionSubmit: (content: string, modality: 'text' | 'voice') => Promise<void>;
  isProcessing: boolean;
}

export const ReflectionComposer: React.FC<ReflectionComposerProps> = ({
  onReflectionSubmit,
  isProcessing
}) => {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError('Microphone access denied');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceSubmit = async () => {
    if (!audioBlob) return;

    try {
      // Convert blob to base64 for API
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        await onReflectionSubmit(base64Audio, 'voice');
        setAudioBlob(null);
      };
    } catch (err) {
      setError('Failed to submit voice reflection');
    }
  };

  const handleTextSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      await onReflectionSubmit(content, 'text');
      setContent('');
    } catch (err) {
      setError('Failed to submit reflection');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Reflect</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setContent(e.target.value)}
            rows={4}
            disabled={isProcessing || isRecording}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {content.length} characters
            </span>
            <Button
              onClick={handleTextSubmit}
              disabled={!content.trim() || isProcessing}
              size="sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Voice Input */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'outline'}
              disabled={isProcessing}
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Record Voice
                </>
              )}
            </Button>

            {audioBlob && !isRecording && (
              <Button
                onClick={handleVoiceSubmit}
                disabled={isProcessing}
              >
                Submit Voice Reflection
              </Button>
            )}

            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm">Recording...</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Mirrorback Display Component
interface MirrorbackProps {
  mirrorback: string;
  violations: string[];
  timestamp: string;
  confidence?: number;
}

export const MirrorbackCard: React.FC<MirrorbackProps> = ({
  mirrorback,
  violations,
  timestamp,
  confidence
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Mirror's Response</CardTitle>
          <span className="text-sm text-gray-500">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-800 leading-relaxed">{mirrorback}</p>

        {confidence !== undefined && (
          <div className="text-sm text-gray-500">
            Confidence: {(confidence * 100).toFixed(1)}%
          </div>
        )}

        {violations.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Constitutional Violations Detected:</div>
              <ul className="list-disc list-inside">
                {violations.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Main Reflection Feed
interface Reflection {
  id: string;
  content: string;
  mirrorback: string;
  violations: string[];
  timestamp: string;
  modality: 'text' | 'voice';
  confidence?: number;
}

export const ReflectionFeed: React.FC = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReflectionSubmit = async (content: string, modality: 'text' | 'voice') => {
    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('mirror_auth_token');
      
      const response = await fetch('http://localhost:8000/v1/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          modality,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'web'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Reflection submission failed');
      }

      const data = await response.json();

      const newReflection: Reflection = {
        id: data.event_id,
        content,
        mirrorback: data.mirrorback,
        violations: data.violations,
        timestamp: new Date().toISOString(),
        modality,
        confidence: data.metadata?.confidence
      };

      setReflections(prev => [newReflection, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Reflection error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadReflections = async () => {
    try {
      const token = localStorage.getItem('mirror_auth_token');
      
      const response = await fetch('http://localhost:8000/v1/reflections?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load reflections');
      }

      const data = await response.json();
      // Would need to also fetch mirrorbacks - simplified here
      // setReflections(data.reflections);
    } catch (err) {
      console.error('Load reflections error:', err);
    }
  };

  useEffect(() => {
    loadReflections();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ReflectionComposer
        onReflectionSubmit={handleReflectionSubmit}
        isProcessing={isProcessing}
      />

      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {reflections.map(reflection => (
          <div key={reflection.id} className="space-y-4">
            {/* User's reflection */}
            <Card className="w-full max-w-2xl mx-auto bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline">
                    {reflection.modality === 'voice' ? (
                      <>
                        <Mic className="mr-1 h-3 w-3" />
                        Voice
                      </>
                    ) : (
                      'Text'
                    )}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(reflection.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-800">{reflection.content}</p>
              </CardContent>
            </Card>

            {/* Mirror's response */}
            <MirrorbackCard
              mirrorback={reflection.mirrorback}
              violations={reflection.violations}
              timestamp={reflection.timestamp}
              confidence={reflection.confidence}
            />
          </div>
        ))}
      </div>

      {reflections.length === 0 && !isProcessing && (
        <div className="text-center text-gray-500 py-12">
          <p>No reflections yet. Start by sharing what's on your mind.</p>
        </div>
      )}
    </div>
  );
};

export default ReflectionFeed;

