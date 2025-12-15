import { useState } from 'react';

interface CognitiveMinimalReflectProps {
  onReflectionSubmit: (reflection: any) => void;
}

export function CognitiveMinimalReflect({ onReflectionSubmit }: CognitiveMinimalReflectProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mirrorResponse, setMirrorResponse] = useState('');
  const [showPrompt, setShowPrompt] = useState(true);

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    setShowPrompt(false);
    
    setTimeout(() => {
      const response = 'You notice resistance. What does "should" feel like in your body right now?';
      setMirrorResponse(response);
      
      onReflectionSubmit({
        id: Date.now().toString(),
        userText: userInput,
        mirrorback: response,
        timestamp: new Date().toISOString(),
      });

      setIsProcessing(false);
    }, 1500);
  };

  const handleContinue = () => {
    setMirrorResponse('');
    setUserInput('');
    setShowPrompt(true);
  };

  return (
    <div className="min-h-screen bg-[var(--color-base-default)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Single Focus: Prompt */}
        {showPrompt && !mirrorResponse && (
          <div className="text-center mb-12 space-y-12">
            <h1 className="text-4xl md:text-5xl">
              What{'\u2019'}s most present?
            </h1>
          </div>
        )}

        {/* Single Focus: Input */}
        {showPrompt && !mirrorResponse && (
          <div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
              placeholder="Start with what's here..."
              className="w-full h-80 p-8 bg-[var(--color-base-raised)] border-2 border-[var(--color-border-subtle)] rounded-2xl text-xl focus:outline-none focus:border-[var(--color-accent-gold)] placeholder-[var(--color-text-muted)] resize-none"
              style={{ lineHeight: '1.8' }}
              autoFocus
            />
            
            {userInput.trim() && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="px-12 py-4 bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] text-lg rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isProcessing ? 'Reflecting...' : 'Continue'}
                </button>
                <p className="text-sm text-[var(--color-text-muted)] mt-4">
                  or press ⌘+Enter
                </p>
              </div>
            )}
          </div>
        )}

        {/* Single Focus: Mirror Response */}
        {mirrorResponse && (
          <div className="space-y-12">
            <div className="p-10 bg-[var(--color-base-raised)] rounded-2xl border-2 border-[var(--color-accent-gold)]">
              <p className="text-2xl leading-relaxed text-[var(--color-text-primary)]">
                {mirrorResponse}
              </p>
            </div>

            <div className="text-center space-y-4">
              <button
                onClick={handleContinue}
                className="px-12 py-4 bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] text-lg rounded-xl hover:opacity-90 transition-opacity"
              >
                Continue Reflecting
              </button>
              <p className="text-sm text-[var(--color-text-muted)]">
                No distractions. Just reflection.
              </p>
            </div>
          </div>
        )}

        {/* Minimal Exit Hint */}
        <div className="mt-16 text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            Press Esc to exit Cognitive Minimal mode
          </p>
        </div>
      </div>
    </div>
  );
}
