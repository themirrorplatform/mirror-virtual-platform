import { useState, useEffect } from 'react';

interface FocusModeReflectProps {
  onReflectionSubmit: (reflection: any) => void;
}

export function FocusModeReflect({ onReflectionSubmit }: FocusModeReflectProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mirrorResponse, setMirrorResponse] = useState('');
  const [breathePhase, setBreathePhase] = useState<'in' | 'hold' | 'out'>('in');

  // Gentle breathing animation
  useEffect(() => {
    if (!isProcessing) return;
    
    const breathCycle = setInterval(() => {
      setBreathePhase(current => {
        if (current === 'in') return 'hold';
        if (current === 'hold') return 'out';
        return 'in';
      });
    }, 2000);

    return () => clearInterval(breathCycle);
  }, [isProcessing]);

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        {/* Breathing Space */}
        <div className="h-20" />

        {/* Minimal Prompt */}
        {!mirrorResponse && (
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl text-[#f5f0e8] mb-6">
              What{'\u2019'}s most present?
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4a574] to-transparent mx-auto" />
          </div>
        )}

        {/* Spacious Input */}
        {!mirrorResponse && (
          <div className="relative">
            <textarea
              value={userInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
              placeholder=""
              className="w-full h-96 p-10 bg-[#1a1a1a]/50 backdrop-blur-sm text-[#f5f0e8] text-2xl border border-[#3a3a3a] rounded-3xl focus:outline-none focus:border-[#d4a574]/50 placeholder-[#5a5a5a] resize-none"
              style={{ 
                lineHeight: '1.8',
                transition: 'all 0.3s ease',
              }}
              autoFocus
            />
            
            {userInput.trim() && !isProcessing && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleSubmit}
                  className="px-16 py-5 bg-gradient-to-r from-[#d4a574] to-[#c49564] text-[#0a0a0a] text-xl rounded-full hover:from-[#e4b584] hover:to-[#d4a574] transition-all duration-300"
                  style={{ fontWeight: 500 }}
                >
                  Reflect
                </button>
              </div>
            )}
          </div>
        )}

        {/* Spacious Response */}
        {mirrorResponse && (
          <div className="space-y-16">
            <div className="p-12 bg-gradient-to-br from-[#2a2520]/30 to-[#1a1a1a]/30 backdrop-blur-sm rounded-3xl border border-[#d4a574]/30">
              <p className="text-3xl leading-relaxed text-[#f5f0e8]">
                {mirrorResponse}
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setMirrorResponse('');
                  setUserInput('');
                }}
                className="px-16 py-5 bg-gradient-to-r from-[#d4a574] to-[#c49564] text-[#0a0a0a] text-xl rounded-full hover:from-[#e4b584] hover:to-[#d4a574] transition-all duration-300"
                style={{ fontWeight: 500 }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Breathing Space */}
        <div className="h-32" />

        {/* Minimal Footer */}
        <div className="text-center">
          <p className="text-xs text-[#5a5a5a]">
            Focus Mode • Press Esc to exit
          </p>
        </div>
      </div>
    </div>
  );
}
