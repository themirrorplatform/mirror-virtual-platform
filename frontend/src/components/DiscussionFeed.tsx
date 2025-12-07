import { MessageCircle, Sparkles, Share2, Bookmark } from 'lucide-react';
import imgElenaMartinez from "figma:asset/2a5e851c701f5326983fa0ad84946a9473db54de.png";
import imgMarcusChen from "figma:asset/99edb5cf4fa57eb999d3fd0adb1e2c5e1a0e0314.png";
import imgSophiaWilliams from "figma:asset/b5b2c186d3ac09bb883fd93bfe492a23f29cd22a.png";

export function DiscussionFeed() {
  return (
    <div className="space-y-[32px]">
      <QuoteCard />
      
      <div>
        <h2 className="font-['Inter:Semi_Bold',sans-serif] text-[24px] leading-[31.2px] text-white tracking-[-0.24px] mb-[24px]">
          Recent Reflections
        </h2>
        
        <div className="space-y-[24px]">
          <DiscussionPost
            avatar={imgElenaMartinez}
            name="Elena Martinez"
            role="Witness"
            time="2 hours ago"
            title="On the Nature of Consciousness"
            content="I've been contemplating how consciousness might be less like a light switch and more like a dimmer. Perhaps awareness exists on a spectrum, where even the smallest organisms possess some form of experience, however dim. This challenges our anthropocentric view of consciousness."
            quote="To truly understand consciousness, we must be conscious of our own limitations in understanding."
            tags={['consciousness', 'philosophy', 'awareness']}
            likes={24}
            insights={156}
            hasAIInsight={true}
          />

          <DiscussionPost
            avatar={imgMarcusChen}
            name="Marcus Chen"
            role="Seeker"
            time="5 hours ago"
            title="The Paradox of Self-Care"
            content="We're told to 'love ourselves' but isn't that just another form of self-centeredness? Maybe true self-care isn't about treating yourself well, but about forgetting yourself entirely in service of something greater."
            quote="The self that needs care might be the same self we need to transcend."
            tags={['paradox', 'self', 'mindfulness']}
            likes={42}
            insights={203}
            hasAIInsight={false}
          />

          <DiscussionPost
            avatar={imgSophiaWilliams}
            name="Sophia Williams"
            role="Guide"
            time="8 hours ago"
            title="Silence as Communication"
            content="In our rush to be heard, we've forgotten the eloquence of silence. Sometimes the most profound communication happens in the spaces between words. What are we missing by always filling the void?"
            quote="Listen to the silence; it speaks volumes that words cannot capture."
            tags={['silence', 'communication', 'listening']}
            likes={67}
            insights={189}
            hasAIInsight={true}
          />
        </div>
      </div>
    </div>
  );
}

function QuoteCard() {
  return (
    <div className="bg-gradient-to-b from-[#0e0e0e] to-[#000000] border border-[#232323] rounded-[14px] p-[33px] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[128px] h-[128px] opacity-10">
        <svg viewBox="0 0 128 128" fill="none">
          <path d="M32 96V64L16 32h32l-16 32h16v32H32zM80 96V64L64 32h32l-16 32h16v32H80z" stroke="#D6AF36" strokeWidth="10.667" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      <div className="relative">
        <div className="w-[32px] h-[32px] mb-[16px]">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M8 24V16L4 8h8L8 16h4v8H8zM20 24V16l-4-8h8l-4 8h4v8h-4z" stroke="#D6AF36" strokeWidth="2.667" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <p className="font-['Times_New_Roman:Italic',sans-serif] italic text-[18px] leading-[29.25px] text-white mb-[16px]">
          "Every post is a mirror; every response, a reflection."
        </p>
        
        <p className="font-['Inter:Regular',sans-serif] text-[12px] leading-[17.143px] text-[#d6af36]">
          — The Mirror Principles
        </p>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-[#d6af36] to-transparent opacity-30" />
    </div>
  );
}

interface DiscussionPostProps {
  avatar: string;
  name: string;
  role: string;
  time: string;
  title: string;
  content: string;
  quote: string;
  tags: string[];
  likes: number;
  insights: number;
  hasAIInsight?: boolean;
}

function DiscussionPost({
  avatar,
  name,
  role,
  time,
  title,
  content,
  quote,
  tags,
  likes,
  insights,
  hasAIInsight = false,
}: DiscussionPostProps) {
  return (
    <div className="bg-[#0e0e0e] border border-[#232323] rounded-[14px] p-[25px] hover:border-[#3f3f46] transition-colors">
      {/* Header */}
      <div className="flex items-center gap-[12px] mb-[16px]">
        <img 
          src={avatar} 
          alt={name} 
          className="w-[40px] h-[40px] rounded-full border border-[#3f3f46] object-cover"
        />
        <div className="flex-1">
          <h4 className="font-['Inter:Medium',sans-serif] text-[12px] leading-[17.143px] text-neutral-50 tracking-[-0.12px]">
            {name}
          </h4>
          <p className="font-['Inter:Regular',sans-serif] text-[11px] leading-[14.667px] text-zinc-400">
            {role}
          </p>
        </div>
        <span className="font-['Inter:Regular',sans-serif] text-[11px] leading-[14.667px] text-zinc-400">
          {time}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-['Inter:Medium',sans-serif] text-[18px] leading-[25.2px] text-neutral-50 tracking-[-0.18px] mb-[12px]">
        {title}
      </h3>

      {/* Content */}
      <p className="font-['Inter:Regular',sans-serif] text-[12px] leading-[19.5px] text-zinc-400 mb-[16px]">
        {content}
      </p>

      {/* Quote */}
      <div className="bg-[rgba(0,0,0,0.3)] border-l-2 border-yellow-500 rounded-r-[14px] px-[18px] py-[16px] mb-[16px]">
        <p className="font-['Times_New_Roman:Italic',sans-serif] italic text-[12px] leading-[17.143px] text-neutral-50">
          {quote}
        </p>
      </div>

      {/* AI Insight Badge */}
      {hasAIInsight && (
        <div className="mb-[16px] flex items-center gap-[8px] px-[12px] py-[8px] bg-gradient-to-r from-[rgba(214,175,54,0.1)] to-transparent border border-[rgba(214,175,54,0.2)] rounded-[8px]">
          <Sparkles size={14} className="text-[#d6af36]" />
          <p className="font-['Inter:Regular',sans-serif] text-[11px] leading-[14.667px] text-[#d6af36]">
            MirrorX detected deep philosophical insight in this reflection
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-[8px] mb-[16px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-zinc-900 border border-zinc-700 rounded-full px-[12px] py-[4px] font-['Inter:Regular',sans-serif] text-[11px] leading-[14.667px] text-zinc-400"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-[12px]">
        <button className="flex items-center gap-[8px] px-[13px] py-[7px] bg-zinc-900 border border-zinc-700 rounded-full hover:border-[#d6af36] transition-colors">
          <MessageCircle size={14} className="text-zinc-400" />
          <span className="font-['Inter:Regular',sans-serif] text-[11px] text-zinc-400">{likes}</span>
        </button>
        <button className="flex-1 flex items-center gap-[8px] px-[13px] py-[7px] bg-zinc-900 border border-zinc-700 rounded-full hover:border-[#d6af36] transition-colors">
          <Sparkles size={14} className="text-zinc-400" />
          <span className="font-['Inter:Regular',sans-serif] text-[11px] text-zinc-400">{insights}</span>
        </button>
        <button className="p-[7px] bg-zinc-900 border border-zinc-700 rounded-full hover:border-[#d6af36] transition-colors">
          <Share2 size={14} className="text-zinc-400" />
        </button>
        <button className="p-[7px] bg-zinc-900 border border-zinc-700 rounded-full hover:border-[#d6af36] transition-colors">
          <Bookmark size={14} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
