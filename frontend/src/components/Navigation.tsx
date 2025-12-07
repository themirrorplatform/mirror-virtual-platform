import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sparkles } from 'lucide-react';
import imgTheMirror from "figma:asset/423df436ef7f34d0eab0991e8cec015203a2a8a2.png";

interface NavigationProps {
  onToggleAI?: () => void;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export function Navigation({ onToggleAI, currentView, onViewChange }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-black/95 backdrop-blur-md border-b border-[#232323] shadow-lg' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-[1534px] mx-auto px-[16px]">
        <div className="flex items-center justify-between h-[80px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-[12px] group">
            <img 
              src={imgTheMirror} 
              alt="The Mirror" 
              className="w-[48px] h-[48px] rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <div>
              <h2 className="font-work-sans text-white text-[18px] leading-tight font-bold">
                The Mirror
              </h2>
              <p className="font-inter text-[#d6af36] text-[11px] leading-tight">
                Reflection Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-[40px]">
            <Link 
              href="/"
              className="font-work-sans text-[15px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium"
            >
              The Mirror
            </Link>
            <Link 
              href="/about"
              className="font-work-sans text-[15px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium"
            >
              About The Mirror
            </Link>
            <Link 
              href="/provides"
              className="font-work-sans text-[15px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium"
            >
              The Mirror Provides
            </Link>
            <Link 
              href="/future"
              className="font-work-sans text-[15px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium"
            >
              Future of The Mirror
            </Link>
            <Link 
              href="/gallery"
              className="font-work-sans text-[15px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium"
            >
              Gallery
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-[16px]">
            {onToggleAI && (
              <button
                onClick={onToggleAI}
                className="hidden md:flex items-center gap-[8px] px-[20px] py-[10px] bg-gradient-to-r from-[#d6af36] to-[#ffd700] rounded-full text-black hover:shadow-[0px_6px_20px_0px_rgba(214,175,54,0.4)] transition-all font-inter font-medium text-[14px]"
              >
                <Sparkles size={16} />
                <span>MirrorX AI</span>
              </button>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-[#bdbdbd] hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-[#232323] py-6">
            <div className="flex flex-col gap-4">
              <Link 
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-work-sans text-[16px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium px-4 py-2"
              >
                The Mirror
              </Link>
              <Link 
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-work-sans text-[16px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium px-4 py-2"
              >
                About The Mirror
              </Link>
              <Link 
                href="/provides"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-work-sans text-[16px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium px-4 py-2"
              >
                The Mirror Provides
              </Link>
              <Link 
                href="/future"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-work-sans text-[16px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium px-4 py-2"
              >
                Future of The Mirror
              </Link>
              <Link 
                href="/gallery"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-work-sans text-[16px] text-[#bdbdbd] hover:text-[#d6af36] transition-colors font-medium px-4 py-2"
              >
                Gallery
              </Link>
              {onToggleAI && (
                <button
                  onClick={() => {
                    onToggleAI();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-[8px] mx-4 px-[20px] py-[12px] bg-gradient-to-r from-[#d6af36] to-[#ffd700] rounded-full text-black font-inter font-medium text-[14px] mt-4"
                >
                  <Sparkles size={16} />
                  <span>MirrorX AI</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}