import { useState } from 'react';
import { MirrorField } from '@/components/MirrorField';
import { reflections, mirrorbacks } from '@/lib/api';
import { useMirrorStateContext } from '@/contexts/MirrorStateContext';
import { MultimodalControls } from '@/components/MultimodalControls';
import { RecordingCard, Recording } from '@/components/RecordingCard';
import { AnimatePresence } from 'framer-motion';

export default function Reflect() {
  const { state, actions } = useMirrorStateContext();
  const [error, setError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const handleSubmit = async (content: string) => {
    try {
      // Step 1: Create reflection
      const reflectionResponse = await reflections.create({
        body: content,
        visibility: 'private',
      });
      const reflection = reflectionResponse.data;
      
      // Step 2: Auto-generate mirrorback (AI response)
      try {
        await mirrorbacks.create(reflection.id);
      } catch (mirrorbackErr: any) {
        console.error('Mirrorback generation failed:', mirrorbackErr);
      }

      // Constitutional: Generate receipt
      actions.addReceipt({
        id: `reflection-${Date.now()}`,
        type: 'reflection_created',
        data: { reflectionId: reflection.id },
        timestamp: Date.now(),
      });

      setError(null);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'Failed to create reflection');
    }
  };

  const handleRecordingComplete = (recording: Recording) => {
    setRecordings(prev => [...prev, recording]);
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings(prev => prev.filter(r => r.id !== id));
  };

  return (
    <>
      <div className="relative min-h-screen">
        <MirrorField 
          onSubmit={handleSubmit} 
          layer={state.layer}
          crisisMode={state.crisisMode}
        />
        
        {/* Floating multimodal controls */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
          <MultimodalControls 
            onRecordingComplete={handleRecordingComplete}
          />
        </div>

        {/* Recordings panel (bottom-right) */}
        {recordings.length > 0 && (
          <div className="fixed bottom-8 right-8 w-80 max-h-96 overflow-y-auto space-y-3 z-10">
            <AnimatePresence>
              {recordings.map(recording => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  onDelete={handleDeleteRecording}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {error && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg z-20">
            {error}
          </div>
        )}
      </div>
    </>
  );
}
