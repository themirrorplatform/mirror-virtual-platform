import { useState, useEffect } from 'react';
import { Textarea } from '../Input';
import { Button } from '../Button';
import { ReflectionCard } from '../Card';
import { Banner } from '../Banner';
import { FeedbackModal, FeedbackData } from '../FeedbackModal';
import { EngineStatusBar } from '../EngineStatusBar';
import { BoundaryWarningChip, detectBoundaryViolation, type BoundaryType } from '../BoundaryWarningChip';
import { RefusalModal } from '../RefusalModal';
import { MultimodalControls, type InputMode, type RecordingState } from '../MultimodalControls';
import { VoiceRecordingCard } from '../VoiceRecordingCard';
import { VideoRecordingCard } from '../VideoRecordingCard';
import { DocumentUploadCard } from '../DocumentUploadCard';
import { MirrorbackPanel } from '../MirrorbackPanel';
import { InlineActionBar } from '../InlineActionBar';
import { ThreadLinkModal } from '../ThreadLinkModal';
import { Upload } from 'lucide-react';

interface Reflection {
  id: string;
  userText: string;
  mirrorback: string;
  timestamp: string;
  rating?: number;
}

interface ReflectScreenProps {
  onReflectionSubmit: (reflection: Reflection) => void;
}

export function ReflectScreen({ onReflectionSubmit }: ReflectScreenProps) {
  const [input, setInput] = useState('');
  const [currentReflection, setCurrentReflection] = useState<Reflection | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [showAdjustedBanner, setShowAdjustedBanner] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [boundaryWarning, setBoundaryWarning] = useState<BoundaryType | null>(null);
  const [showRefusalModal, setShowRefusalModal] = useState(false);
  const [refusalType, setRefusalType] = useState<BoundaryType | null>(null);
  const [showActionBar, setShowActionBar] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showThreadLinkModal, setShowThreadLinkModal] = useState(false);
  
  // Mock thread data (in production, this would come from app state)
  const [mockThreads] = useState([
    { id: '1', name: 'Financial Uncertainty', nodeCount: 12 },
    { id: '2', name: 'Relationship with Work', nodeCount: 8 },
    { id: '3', name: 'What Home Means', nodeCount: 5 },
  ]);
  
  // Multimodal state
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordings, setRecordings] = useState<{
    voice: Array<{ id: string; duration: number; timestamp: string; transcript: string }>;
    video: Array<{ id: string; duration: number; timestamp: string; transcript: string }>;
    documents: Array<{ id: string; fileName: string; fileSize: number; timestamp: string; extractedText: string }>;
  }>({
    voice: [],
    video: [],
    documents: [],
  });

  const handleStartRecording = () => {
    setRecordingState('recording');
    setRecordingDuration(0);
    console.log(`Started ${inputMode} recording`);
  };

  const handleStopRecording = () => {
    setRecordingState('processing');
    
    // Simulate processing
    setTimeout(() => {
      const now = new Date().toLocaleString();
      const transcript = "This is a simulated transcript of your recorded reflection. In production, this would be generated from actual voice/video processing.";
      
      if (inputMode === 'voice') {
        setRecordings(prev => ({
          ...prev,
          voice: [...prev.voice, {
            id: Date.now().toString(),
            duration: recordingDuration,
            timestamp: now,
            transcript,
          }],
        }));
      } else if (inputMode === 'video') {
        setRecordings(prev => ({
          ...prev,
          video: [...prev.video, {
            id: Date.now().toString(),
            duration: recordingDuration,
            timestamp: now,
            transcript,
          }],
        }));
      }
      
      setRecordingState('idle');
      setRecordingDuration(0);
    }, 1500);
  };

  const handlePauseRecording = () => {
    setRecordingState('paused');
  };

  const handleResumeRecording = () => {
    setRecordingState('recording');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const now = new Date().toLocaleString();
    const extractedText = `This is simulated extracted text from "${file.name}". In production, this would be the actual content extracted from the uploaded document.`;
    
    setRecordings(prev => ({
      ...prev,
      documents: [...prev.documents, {
        id: Date.now().toString(),
        fileName: file.name,
        fileSize: file.size,
        timestamp: now,
        extractedText,
      }],
    }));
  };

  // Simulate recording timer
  useEffect(() => {
    if (recordingState === 'recording') {
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [recordingState]);

  const handleReflect = async () => {
    if (!input.trim()) return;

    // Check for boundary violations BEFORE reflecting
    const violation = detectBoundaryViolation(input);
    if (violation) {
      setRefusalType(violation);
      setShowRefusalModal(true);
      return; // Don't process - show refusal instead
    }

    setIsReflecting(true);
    setShowAdjustedBanner(false);
    setBoundaryWarning(null);

    // Simulate Mirror processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a thoughtful Mirrorback
    const mirrorback = generateMirrorback(input);
    
    const reflection: Reflection = {
      id: Date.now().toString(),
      userText: input,
      mirrorback,
      timestamp: new Date().toLocaleString(),
    };

    setCurrentReflection(reflection);
    setIsReflecting(false);
    
    // Randomly show critic adjustment (10% chance)
    if (Math.random() < 0.1) {
      setShowAdjustedBanner(true);
    }
  };

  // Detect pause in typing to show action bar
  useEffect(() => {
    if (input.trim().length > 0 && !currentReflection) {
      // Clear existing timeout
      if (typingTimeout) clearTimeout(typingTimeout);
      
      // Set new timeout to show action bar after 2 seconds of no typing
      const timeout = setTimeout(() => {
        setShowActionBar(true);
      }, 2000);
      
      setTypingTimeout(timeout);
      
      return () => clearTimeout(timeout);
    } else {
      setShowActionBar(false);
    }
  }, [input]);

  const handleSave = () => {
    if (!input.trim()) return;
    
    const reflection: Reflection = {
      id: Date.now().toString(),
      userText: input,
      mirrorback: '',
      timestamp: new Date().toLocaleString(),
    };
    
    onReflectionSubmit(reflection);
    setInput('');
    setShowActionBar(false);
  };

  const handleArchive = () => {
    if (!input.trim()) return;
    
    const reflection: Reflection = {
      id: Date.now().toString(),
      userText: input,
      mirrorback: '',
      timestamp: new Date().toLocaleString(),
    };
    
    onReflectionSubmit(reflection);
    setInput('');
    setShowActionBar(false);
    // TODO: Add to archive with archived flag
  };

  const handleLinkToThread = () => {
    setShowThreadLinkModal(true);
  };

  const handleHideMirrorback = () => {
    if (currentReflection) {
      const updated = { ...currentReflection, mirrorback: '' };
      setCurrentReflection(updated);
    }
  };

  const handleArchiveCurrent = () => {
    if (currentReflection) {
      onReflectionSubmit(currentReflection);
      handleNewReflection();
    }
  };

  // Check for boundary warnings as user types
  useEffect(() => {
    if (input.length > 10) {
      const warning = detectBoundaryViolation(input);
      setBoundaryWarning(warning);
    } else {
      setBoundaryWarning(null);
    }
  }, [input]);

  const handleRate = (rating: number) => {
    if (!currentReflection) return;
    
    const updated = { ...currentReflection, rating };
    setCurrentReflection(updated);
    onReflectionSubmit(updated);
  };

  const handleFeedback = () => {
    setFeedbackModalOpen(true);
  };

  const handleFeedbackSubmit = (feedback: FeedbackData) => {
    console.log('Feedback received:', feedback);
    
    if (feedback.action === 'delete' && currentReflection) {
      setCurrentReflection(null);
      setInput('');
    } else if (feedback.action === 'pause') {
      alert('Mirror paused until tomorrow');
    }
    
    setFeedbackModalOpen(false);
  };

  const handleNewReflection = () => {
    setInput('');
    setCurrentReflection(null);
    setShowAdjustedBanner(false);
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-8 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        {/* Critic adjustment banner (if needed) */}
        {showAdjustedBanner && (
          <Banner variant="info" onDismiss={() => setShowAdjustedBanner(false)}>
            <div className="flex flex-col gap-1">
              <span className="text-sm">Reflection adjusted by critic</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                The Mirror detected directive language and regenerated a more reflective response.
              </span>
            </div>
          </Banner>
        )}

        {!currentReflection ? (
          <>
            {/* Main writing area - centered, minimal */}
            <div className="relative">
              <Textarea
                value={input}
                onChange={(val) => {
                  setInput(val);
                  setShowActionBar(false);
                }}
                placeholder="..."
                rows={12}
                className="text-base leading-relaxed"
              />
              
              {/* Inline Action Bar - appears on pause */}
              {showActionBar && (
                <div className="mt-4 flex justify-center">
                  <InlineActionBar
                    isVisible={showActionBar}
                    onReflect={handleReflect}
                    onSave={handleSave}
                    onArchive={handleArchive}
                    onLinkToThread={handleLinkToThread}
                    isReflecting={isReflecting}
                  />
                </div>
              )}
            </div>
            
            {/* Boundary Warning Chip */}
            {boundaryWarning && (
              <BoundaryWarningChip
                type={boundaryWarning}
                onDismiss={() => setBoundaryWarning(null)}
              />
            )}
            
            {/* Subtle engine status */}
            <div className="text-center text-xs text-[var(--color-text-muted)]">
              MirrorCore v1.0.3 • Local
            </div>
          </>
        ) : (
          <>
            {/* User's reflection */}
            <div className="text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap">
              {currentReflection.userText}
            </div>
            
            {/* Separator */}
            <div className="h-px bg-[var(--color-border-subtle)]" />
            
            {/* Mirrorback Panel */}
            {currentReflection.mirrorback && (
              <MirrorbackPanel
                text={currentReflection.mirrorback}
                timestamp={currentReflection.timestamp}
                onRate={handleRate}
                onFeedback={handleFeedback}
                onHide={handleHideMirrorback}
                onArchive={handleArchiveCurrent}
                rating={currentReflection.rating}
              />
            )}

            <Button 
              variant="ghost" 
              onClick={handleNewReflection}
              className="self-start text-sm"
            >
              New Reflection
            </Button>
          </>
        )}
      </div>

      {/* Modals */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Refusal Modal */}
      {showRefusalModal && refusalType && (
        <RefusalModal
          isOpen={showRefusalModal}
          onClose={() => {
            setShowRefusalModal(false);
            setRefusalType(null);
          }}
          type="constitutional"
          principle={
            refusalType === 'prediction' ? 'The Mirror will not predict your future.' :
            refusalType === 'diagnosis' ? 'The Mirror will not diagnose you.' :
            refusalType === 'persuasion' ? 'The Mirror will not persuade or motivate you.' :
            'The Mirror will not make decisions for you.'
          }
          reason={
            refusalType === 'prediction' ? 'You asked The Mirror to predict future events or feelings. The Mirror does not make predictions about your life.' :
            refusalType === 'diagnosis' ? 'You asked for a medical or psychological diagnosis. The Mirror is not a medical professional and cannot diagnose conditions.' :
            refusalType === 'persuasion' ? 'You asked The Mirror to motivate or convince you. The Mirror does not optimize behavior or use persuasive language.' :
            'You asked The Mirror to make a decision for you. The Mirror is constitutionally prohibited from directive language.'
          }
          allowedActions={
            refusalType === 'prediction' ? [
              'Reflect on what feels uncertain right now',
              'Notice which outcomes you fear most',
              'Explore what control means to you',
            ] :
            refusalType === 'diagnosis' ? [
              'Reflect on what you\'re experiencing',
              'Notice patterns in how you feel',
              'Consider talking to a mental health professional',
            ] :
            refusalType === 'persuasion' ? [
              'Reflect on what makes this feel hard',
              'Notice the tension between wanting and doing',
              'Explore what this means to different parts of you',
            ] : [
              'Reflect on what you notice about the options',
              'Explore the tension between different choices',
              'Notice which parts of you are speaking',
            ]
          }
        />
      )}

      {/* Thread Link Modal */}
      {showThreadLinkModal && (
        <ThreadLinkModal
          isOpen={showThreadLinkModal}
          onClose={() => setShowThreadLinkModal(false)}
          threads={mockThreads}
          onLinkToThread={(threadId) => {
            console.log(`Linking to thread ${threadId}:`, input);
            // TODO: In production, save reflection with thread linkage
            handleSave();
            setShowThreadLinkModal(false);
          }}
          onCreateThread={(threadName) => {
            console.log(`Created new thread "${threadName}" and linked:`, input);
            // TODO: In production, create thread and link reflection
            handleSave();
            setShowThreadLinkModal(false);
          }}
        />
      )}
    </div>
  );
}

function generateMirrorback(input: string): string {
  // Simple pattern matching for demo purposes
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('anxious') || lowerInput.includes('anxiety') || lowerInput.includes('worried')) {
    return "You're noticing anxiety. Not analyzing it, not solving it—just letting it be seen.\n\nWhat does the worry feel like it's protecting you from?";
  }
  
  if (lowerInput.includes('money') || lowerInput.includes('financial')) {
    return "Money is carrying something beyond the numbers.\n\nWhat feeling lives underneath the financial concern?";
  }
  
  if (lowerInput.includes('tired') || lowerInput.includes('exhausted')) {
    return "The tiredness you're describing sounds like more than physical fatigue.\n\nWhat might rest look like if it wasn't just about sleep?";
  }
  
  if (lowerInput.includes('relationship') || lowerInput.includes('partner')) {
    return "You're holding something about connection that wants to be understood.\n\nWhat's the gap between what you're feeling and what you've been able to say?";
  }
  
  // Default reflective response
  return `You're bringing this to the Mirror—which means some part of you knows it matters.\n\nWhat would it mean to stay with this feeling a little longer, without needing to change it?`;
}