import { useState } from 'react';
import { Send } from 'lucide-react';

interface HighContrastReflectProps {
  onReflectionSubmit: (reflection: any) => void;
}

export function HighContrastReflect({ onReflectionSubmit }: HighContrastReflectProps) {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mirrorResponse, setMirrorResponse] = useState('');

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    
    // Simulate processing
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
      setUserInput('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header - Maximum Contrast */}
        <div className="mb-12 pb-6 border-b-4 border-white">
          <h1 className="text-5xl mb-4" style={{ fontWeight: 900 }}>
            What{'\u2019'}s most present?
          </h1>
          <p className="text-2xl text-gray-200">
            High Contrast Mode • Maximum Visibility
          </p>
        </div>

        {/* Input Area - Stark Black & White */}
        <div className="mb-12">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Start with what's here..."
            className="w-full h-64 p-6 bg-black text-white text-2xl border-4 border-white rounded-none focus:outline-none focus:border-yellow-400 placeholder-gray-400 resize-none"
            style={{ lineHeight: '1.8' }}
          />
          
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim() || isProcessing}
            className="mt-6 w-full py-6 bg-white text-black text-xl border-4 border-white hover:bg-yellow-400 hover:border-yellow-400 disabled:bg-gray-600 disabled:text-gray-400 disabled:border-gray-600 transition-colors flex items-center justify-center gap-3"
            style={{ fontWeight: 900 }}
          >
            {isProcessing ? (
              <span>PROCESSING...</span>
            ) : (
              <>
                <span>REFLECT</span>
                <Send size={24} />
              </>
            )}
          </button>
        </div>

        {/* Mirror Response - Maximum Contrast */}
        {mirrorResponse && (
          <div className="p-8 bg-white text-black border-4 border-white">
            <div className="mb-4">
              <span className="text-sm uppercase tracking-widest" style={{ fontWeight: 900 }}>
                THE MIRROR REFLECTS:
              </span>
            </div>
            <p className="text-2xl leading-relaxed">
              {mirrorResponse}
            </p>
          </div>
        )}

        {/* Instructions - Clear & Direct */}
        {!mirrorResponse && (
          <div className="p-6 border-4 border-gray-600 text-gray-300">
            <h3 className="text-xl mb-3" style={{ fontWeight: 900 }}>
              HIGH CONTRAST INTERFACE
            </h3>
            <ul className="space-y-2 text-lg">
              <li>• Pure black background</li>
              <li>• White borders (4px)</li>
              <li>• No subtle grays</li>
              <li>• Maximum font weights</li>
              <li>• No animations</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
