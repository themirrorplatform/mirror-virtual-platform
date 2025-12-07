import { Home, Users, BookOpen, Settings, Sparkles } from 'lucide-react';
import imgTheMirror from "figma:asset/423df436ef7f34d0eab0991e8cec015203a2a8a2.png";

interface NavigationProps {
  onToggleAI: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Navigation({ onToggleAI, currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-[#232323] backdrop-blur-sm bg-opacity-95">
      <div className="max-w-[1534px] mx-auto px-[16px]">
        <div className="flex items-center justify-between h-[64px]">
          {/* Logo */}
          <div className="flex items-center gap-[12px]">
            <img 
              src={imgTheMirror} 
              alt="The Mirror" 
              className="w-[40px] h-[40px] rounded-full opacity-80"
            />
            <div>
              <h2 className="font-['Inter:Semi_Bold',sans-serif] text-white text-[16px] leading-tight">
                The Mirror
              </h2>
              <p className="font-['Inter:Regular',sans-serif] text-[#d6af36] text-[10px] leading-tight">
                Powered by MirrorX AI
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-[32px]">
            <button 
              onClick={() => onViewChange('home')}
              className={`flex items-center gap-[8px] transition-colors ${
                currentView === 'home' ? 'text-white' : 'text-[#bdbdbd] hover:text-[#d6af36]'
              }`}
            >
              <Home size={20} />
              <span className="font-['Inter:Regular',sans-serif] text-[14px]">Home</span>
            </button>
            <button 
              onClick={() => onViewChange('threads')}
              className={`flex items-center gap-[8px] transition-colors ${
                currentView === 'threads' ? 'text-white' : 'text-[#bdbdbd] hover:text-[#d6af36]'
              }`}
            >
              <Users size={20} />
              <span className="font-['Inter:Regular',sans-serif] text-[14px]">Reflections</span>
            </button>
            <button 
              onClick={() => onViewChange('circles')}
              className={`flex items-center gap-[8px] transition-colors ${
                currentView === 'circles' ? 'text-white' : 'text-[#bdbdbd] hover:text-[#d6af36]'
              }`}
            >
              <BookOpen size={20} />
              <span className="font-['Inter:Regular',sans-serif] text-[14px]">Circles</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-[16px]">
            <button
              onClick={onToggleAI}
              className="flex items-center gap-[8px] px-[16px] py-[8px] bg-gradient-to-r from-[#d6af36] to-[#ffd700] rounded-[8px] text-black hover:shadow-[0px_6px_20px_0px_rgba(214,175,54,0.3)] transition-all"
            >
              <Sparkles size={16} />
              <span className="font-['Inter:Medium',sans-serif] text-[14px]">MirrorX AI</span>
            </button>
            <button 
              onClick={() => onViewChange('settings')}
              className="text-[#bdbdbd] hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}