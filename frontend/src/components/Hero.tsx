import { ChevronLeft, ChevronRight } from 'lucide-react';
import VideoBackground from './VideoBackground';

export function Hero() {
  return (
    <VideoBackground
      src="/videos/hero-video.mp4"
      poster=""
      className="relative h-[600px] overflow-hidden"
    >
      {/* Navigation Arrows */}
      <button className="absolute left-[16px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all z-20">
        <ChevronLeft size={24} className="text-white" />
      </button>
      <button className="absolute right-[16px] top-1/2 -translate-y-1/2 w-[40px] h-[40px] bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all z-20">
        <ChevronRight size={24} className="text-white" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 flex items-center gap-[8px] z-20">
        <div className="w-[32px] h-[8px] bg-[#d6af36] rounded-full" />
        <div className="w-[8px] h-[8px] bg-white bg-opacity-50 rounded-full" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <img 
          src="" 
          alt="The Mirror" 
          className="w-[128px] h-[128px] mb-[32px] opacity-60"
        />
        <h1 className="font-work-sans text-[32px] leading-[38.4px] text-white text-center tracking-[-0.32px] mb-[16px] font-bold">
          Welcome to The Mirror Discussions
        </h1>
        <p className="font-inter text-[20px] leading-[28px] text-[#bdbdbd] text-center mb-[32px]">
          A space for reflection, dialogue, and evolution.
        </p>
        <button className="px-[32px] py-[16px] bg-gradient-to-b from-[#d6af36] to-[#ffd700] rounded-[16px] shadow-[0px_6px_20px_0px_rgba(214,175,54,0.3)] hover:shadow-[0px_8px_24px_0px_rgba(214,175,54,0.4)] transition-all">
          <span className="font-inter text-[14px] leading-[21px] text-black font-medium">
            Join the Talk on The Mirror
          </span>
        </button>
      </div>
    </VideoBackground>
  );
}

