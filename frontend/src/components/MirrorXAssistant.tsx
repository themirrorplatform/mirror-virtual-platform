import { X, Send, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface MirrorXAssistantProps {
  onClose: () => void;
}

export function MirrorXAssistant({ onClose }: MirrorXAssistantProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m MirrorX, your AI companion for deeper reflection. I can help you explore ideas, suggest related discussions, and provide insights on your reflections. How can I assist your journey today?',
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: input },
      {
        role: 'assistant',
        content: 'Based on your interests in consciousness and philosophy, I notice a pattern in your reflections. You might find value in exploring the connection between subjective experience and objective reality. Consider engaging with Elena Martinez\'s recent post on consciousness—her perspective aligns with your inquiry style.',
      },
    ];

    setMessages(newMessages);
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <div className="w-[600px] h-[700px] bg-[#0e0e0e] border border-[#232323] rounded-[24px] shadow-[0px_0px_40px_0px_rgba(214,175,54,0.2)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-[24px] border-b border-[#232323]">
          <div className="flex items-center gap-[12px]">
            <div className="w-[40px] h-[40px] bg-gradient-to-br from-[#d6af36] to-[#ffd700] rounded-full flex items-center justify-center">
              <Sparkles size={20} className="text-black" />
            </div>
            <div>
              <h3 className="font-['Inter:Semi_Bold',sans-serif] text-[18px] leading-[25.2px] text-white tracking-[-0.18px]">
                MirrorX AI Assistant
              </h3>
              <p className="font-['Inter:Regular',sans-serif] text-[11px] leading-[14.667px] text-[#d6af36]">
                Your personal reflection companion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-[32px] h-[32px] bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center hover:border-[#d6af36] transition-colors"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-[24px] space-y-[16px]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-[16px] rounded-[14px] ${
                  message.role === 'user'
                    ? 'bg-[#d6af36] text-black'
                    : 'bg-[#1a1a1a] border border-[#232323] text-white'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-[8px] mb-[8px]">
                    <Sparkles size={14} className="text-[#d6af36]" />
                    <span className="font-['Inter:Medium',sans-serif] text-[11px] text-[#d6af36]">
                      MirrorX
                    </span>
                  </div>
                )}
                <p className="font-['Inter:Regular',sans-serif] text-[14px] leading-[20px]">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        <div className="px-[24px] pb-[16px]">
          <div className="flex flex-wrap gap-[8px] mb-[12px]">
            <button className="px-[12px] py-[6px] bg-[rgba(214,175,54,0.1)] border border-[rgba(214,175,54,0.2)] rounded-[8px] hover:bg-[rgba(214,175,54,0.2)] transition-colors">
              <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[#d6af36]">
                Find related discussions
              </span>
            </button>
            <button className="px-[12px] py-[6px] bg-[rgba(214,175,54,0.1)] border border-[rgba(214,175,54,0.2)] rounded-[8px] hover:bg-[rgba(214,175,54,0.2)] transition-colors">
              <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[#d6af36]">
                Analyze my reflections
              </span>
            </button>
            <button className="px-[12px] py-[6px] bg-[rgba(214,175,54,0.1)] border border-[rgba(214,175,54,0.2)] rounded-[8px] hover:bg-[rgba(214,175,54,0.2)] transition-colors">
              <span className="font-['Inter:Regular',sans-serif] text-[11px] text-[#d6af36]">
                Suggest connections
              </span>
            </button>
          </div>
        </div>

        {/* Input */}
        <div className="p-[24px] border-t border-[#232323]">
          <div className="flex items-center gap-[12px]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask MirrorX anything..."
              className="flex-1 bg-[#1a1a1a] border border-[#232323] rounded-[12px] px-[16px] py-[12px] text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d6af36] transition-colors font-['Inter:Regular',sans-serif]"
            />
            <button
              onClick={handleSend}
              className="w-[44px] h-[44px] bg-gradient-to-r from-[#d6af36] to-[#ffd700] rounded-[12px] flex items-center justify-center hover:shadow-[0px_6px_20px_0px_rgba(214,175,54,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!input.trim()}
            >
              <Send size={18} className="text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
