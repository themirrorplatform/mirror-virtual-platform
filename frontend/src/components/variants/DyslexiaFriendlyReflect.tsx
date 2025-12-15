import { useState } from 'react';
import { Send } from 'lucide-react';

interface DyslexiaFriendlyReflectProps {
  onReflectionSubmit: (reflection: any) => void;
}

export function DyslexiaFriendlyReflect({ onReflectionSubmit }: DyslexiaFriendlyReflectProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mirrorResponse, setMirrorResponse] = useState('');

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    
    setTimeout(() => {
      const response = 'You notice resistance.\n\nWhat does "should" feel like\nin your body right now?';
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

  // Dyslexia-friendly styles
  const textStyle = {
    letterSpacing: '0.12em',
    lineHeight: '2',
    wordSpacing: '0.16em',
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header - Dyslexia Optimized */}
        <div className="mb-10">
          <h1 
            className="text-4xl mb-4 text-[#1a1a1a]"
            style={{
              ...textStyle,
              fontWeight: 600,
            }}
          >
            What{'\u2019'}s most present?
          </h1>
          <p 
            className="text-lg text-[#4a4a4a]"
            style={textStyle}
          >
            Dyslexia-Friendly Mode
          </p>
        </div>

        {/* Guidance - Short Lines */}
        <div className="mb-8 p-6 bg-[#f0ede4] rounded-2xl border-2 border-[#d4c5a0]">
          <p 
            className="text-base text-[#2a2a2a]"
            style={textStyle}
          >
            This mode uses:
          </p>
          <ul 
            className="mt-3 space-y-2 text-base text-[#2a2a2a]"
            style={textStyle}
          >
            <li>• Increased letter spacing</li>
            <li>• Generous line height</li>
            <li>• Shorter line lengths</li>
            <li>• Warm, low-glare background</li>
            <li>• Clear visual hierarchy</li>
          </ul>
        </div>

        {/* Input Area - Optimized Typography */}
        <div className="mb-10">
          <textarea
            value={userInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setUserInput(e.target.value)}
            placeholder="Start with what's here..."
            className="w-full h-64 p-6 bg-white text-[#1a1a1a] text-xl border-3 border-[#c4b5a0] rounded-2xl focus:outline-none focus:border-[#d4a574] placeholder-[#8a8a8a] resize-none"
            style={textStyle}
          />
          
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim() || isProcessing}
            className="mt-6 w-full py-5 bg-[#d4a574] text-white text-xl rounded-2xl hover:bg-[#c49564] disabled:bg-[#d4d4d4] disabled:text-[#8a8a8a] transition-colors flex items-center justify-center gap-3"
            style={{
              ...textStyle,
              fontWeight: 600,
            }}
          >
            {isProcessing ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>Reflect</span>
                <Send size={20} />
              </>
            )}
          </button>
        </div>

        {/* Mirror Response - Short Lines */}
        {mirrorResponse && (
          <div className="p-8 bg-white rounded-2xl border-3 border-[#d4a574]">
            <div className="mb-5">
              <span 
                className="text-sm uppercase text-[#8a8a8a]"
                style={{
                  letterSpacing: '0.15em',
                  fontWeight: 600,
                }}
              >
                The Mirror Reflects:
              </span>
            </div>
            <p 
              className="text-2xl text-[#1a1a1a] whitespace-pre-line"
              style={textStyle}
            >
              {mirrorResponse}
            </p>
          </div>
        )}

        {/* Accessibility Note */}
        <div className="mt-10 p-4 bg-[#e8f4f8] rounded-xl border-2 border-[#b4d4e0]">
          <p 
            className="text-sm text-[#2a4a5a]"
            style={{
              letterSpacing: '0.08em',
              lineHeight: '1.8',
            }}
          >
            Font optimized for dyslexia.
            <br />
            Line length limited to 60-70 characters.
            <br />
            No justified text or narrow columns.
          </p>
        </div>
      </div>
    </div>
  );
}

