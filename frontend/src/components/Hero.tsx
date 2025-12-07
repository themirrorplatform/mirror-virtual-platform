import { ChevronLeft, ChevronRight } from 'lucide-react';
import imgTempleReflection from "figma:asset/c98b00ecf50d3e11fcabdea89fdec89b82201a80.png";
import imgTheMirror from "figma:asset/423df436ef7f34d0eab0991e8cec015203a2a8a2.png";

export function Hero() {
  return (
    <div className="relative h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={imgTempleReflection} 
          alt="Temple reflection" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-70" />
      </div>

      {/* Navigation Arrows */}
      <button className="absolute left-[16px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all">
        <ChevronLeft size={24} className="text-white" />
      </button>
      <button className="absolute right-[16px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all">
        <ChevronRight size={24} className="text-white" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 flex items-center gap-[8px]">
        <div className="w-[32px] h-[8px] bg-[#d6af36] rounded-full" />
        <div className="w-[8px] h-[8px] bg-white bg-opacity-50 rounded-full" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <img 
          src={imgTheMirror} 
          alt="The Mirror" 
          className="w-[128px] h-[128px] mb-[32px] opacity-60"
        />
        <h1 className="font-['Inter:Semi_Bold',sans-serif] text-[32px] leading-[38.4px] text-white text-center tracking-[-0.32px] mb-[16px]">
          Welcome to The Mirror Discussions
        </h1>
        <p className="font-['Inter:Regular',sans-serif] text-[20px] leading-[28px] text-[#bdbdbd] text-center mb-[32px]">
          A space for reflection, dialogue, and evolution.
        </p>
        <button className="px-[32px] py-[16px] bg-gradient-to-b from-[#d6af36] to-[#ffd700] rounded-[16px] shadow-[0px_6px_20px_0px_rgba(214,175,54,0.3)] hover:shadow-[0px_8px_24px_0px_rgba(214,175,54,0.4)] transition-all">
          <span className="font-['Inter:Regular',sans-serif] text-[14px] leading-[21px] text-black">
            Join the Talk on The Mirror
          </span>
        </button>
      </div>
    </div>
  );
}
