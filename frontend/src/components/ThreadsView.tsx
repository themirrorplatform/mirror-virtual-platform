import { Calendar, MessageCircle, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export function ThreadsView() {
  const [selectedThread, setSelectedThread] = useState('awareness');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#14141a] to-[#0b0b0d]">
      {/* Secondary Navigation */}
      <div className="border-b border-[rgba(48,48,58,0.2)]">
        <div className="max-w-[1534px] mx-auto px-[24px] py-[16px]">
          <div className="flex items-center gap-[8px]">
            <button className="h-[40px] px-[20px] bg-transparent border-none rounded-[16px] text-[#c4c4cf] hover:bg-[rgba(203,163,93,0.1)] transition-colors">
              <div className="flex items-center gap-[8px]">
                <MessageCircle size={18} />
                <span className="font-['Inter:Medium',sans-serif] text-[14px]">Reflect</span>
              </div>
            </button>
            <button className="h-[40px] px-[20px] bg-[rgba(203,163,93,0.1)] border border-[rgba(203,163,93,0.3)] rounded-[16px] text-[#cba35d]">
              <div className="flex items-center gap-[8px]">
                <TrendingUp size={18} />
                <span className="font-['Inter:Medium',sans-serif] text-[14px]">Threads</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1534px] mx-auto px-[24px] py-[40px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[48px]">
          {/* Main Thread View */}
          <div>
            {/* Thread Header */}
            <div className="mb-[32px]">
              <h1 className="font-['EB_Garamond:Regular',sans-serif] text-[60px] leading-[72px] text-neutral-200 mb-[8px]">
                The Awareness Paradox
              </h1>
              <div className="flex items-center gap-[16px] text-[rgba(196,196,207,0.6)]">
                <div className="flex items-center gap-[6px]">
                  <Calendar size={14} />
                  <span className="font-['Inter:Regular',sans-serif] text-[14px]">Started 2 weeks ago</span>
                </div>
                <div className="flex items-center gap-[6px]">
                  <MessageCircle size={14} />
                  <span className="font-['Inter:Regular',sans-serif] text-[14px]">8 reflections</span>
                </div>
              </div>
            </div>

            {/* Thread Tags */}
            <div className="flex flex-wrap gap-[8px] mb-[32px]">
              <span className="px-[12px] py-[6px] bg-[rgba(203,163,93,0.1)] border border-[rgba(203,163,93,0.3)] rounded-[8px] text-[#cba35d] font-['Inter:Regular',sans-serif] text-[12px]">
                Pattern Recognition
              </span>
              <span className="px-[12px] py-[6px] bg-[rgba(203,163,93,0.1)] border border-[rgba(203,163,93,0.3)] rounded-[8px] text-[#cba35d] font-['Inter:Regular',sans-serif] text-[12px]">
                Change
              </span>
              <span className="px-[12px] py-[6px] bg-[rgba(203,163,93,0.1)] border border-[rgba(203,163,93,0.3)] rounded-[8px] text-[#cba35d] font-['Inter:Regular',sans-serif] text-[12px]">
                Self-Observation
              </span>
            </div>

            {/* Thread Timeline */}
            <div className="space-y-[24px]">
              <ThreadEntry
                time="2 hours ago"
                type="reflection"
                content="I keep circling back to the same patterns. It's like I know what needs to change, but I can't seem to actually do it."
              />

              <MirrorbackCard
                time="2 hours ago"
                content="Because awareness isn't the lever you think it is. You're treating it like a switch—see the pattern, flip it, done. But patterns exist in the body, in habit, in the thousand micro-decisions that happen before conscious thought even arrives."
                emotionalResonance={85}
              />

              <ThreadEntry
                time="yesterday"
                type="reflection"
                content="Maybe I need to stop analyzing and just... act differently. But every time I try, it feels fake."
              />

              <MirrorbackCard
                time="yesterday"
                content="Of course it feels fake. You're performing change instead of allowing it. There's a difference between forcing yourself into a new behavior and actually shifting the internal logic that drives the old one."
                emotionalResonance={92}
                isHighlight={true}
              />

              <ThreadEntry
                time="3 days ago"
                type="reflection"
                content="I've been thinking about how awareness might actually be the problem. The more I watch myself, the more stuck I feel."
              />

              <MirrorbackCard
                time="3 days ago"
                content="Awareness creates distance. You're watching yourself like you're watching a character in a movie—observing, analyzing, but not actually being. The pattern persists because you've made yourself the observer instead of the participant."
                emotionalResonance={78}
              />
            </div>
          </div>

          {/* Thread Context Sidebar */}
          <ThreadContext />
        </div>
      </div>
    </div>
  );
}

interface ThreadEntryProps {
  time: string;
  type: 'reflection';
  content: string;
}

function ThreadEntry({ time, type, content }: ThreadEntryProps) {
  return (
    <div className="relative pl-[32px]">
      {/* Timeline indicator */}
      <div className="absolute left-0 top-[4px] w-[16px] h-[16px] bg-[rgba(203,163,93,0.2)] border-2 border-[#cba35d] rounded-full" />
      <div className="absolute left-[7px] top-[20px] bottom-[-24px] w-[2px] bg-[rgba(203,163,93,0.1)]" />

      <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[24px]">
        <div className="flex items-center justify-between mb-[16px]">
          <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.7)] tracking-[1.2px] uppercase">
            Your Reflection
          </span>
          <div className="flex items-center gap-[6px] text-[rgba(196,196,207,0.6)]">
            <Clock size={12} />
            <span className="font-['Inter:Regular',sans-serif] text-[12px]">{time}</span>
          </div>
        </div>
        <p className="font-['Inter:Regular',sans-serif] text-[17px] leading-[27.625px] text-neutral-200 tracking-[0.17px]">
          {content}
        </p>
      </div>
    </div>
  );
}

interface MirrorbackCardProps {
  time: string;
  content: string;
  emotionalResonance: number;
  isHighlight?: boolean;
}

function MirrorbackCard({ time, content, emotionalResonance, isHighlight = false }: MirrorbackCardProps) {
  return (
    <div className="relative pl-[32px]">
      {/* Timeline indicator */}
      <div className="absolute left-0 top-[4px] w-[16px] h-[16px] bg-[#cba35d] rounded-full flex items-center justify-center">
        <Sparkles size={10} className="text-black" />
      </div>
      <div className="absolute left-[7px] top-[20px] bottom-[-24px] w-[2px] bg-[rgba(203,163,93,0.1)]" />

      <div className={`bg-[rgba(24,24,32,0.6)] border rounded-[24px] p-[24px] shadow-[0px_24px_60px_0px_rgba(0,0,0,0.65)] ${
        isHighlight ? 'border-[rgba(203,163,93,0.4)]' : 'border-[rgba(203,163,93,0.15)]'
      }`}>
        <div className="flex items-center justify-between mb-[16px]">
          <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(203,163,93,0.7)] tracking-[1.2px] uppercase">
            Mirrorback
          </span>
          <div className="flex items-center gap-[12px]">
            {isHighlight && (
              <div className="flex items-center gap-[6px] text-[#f5a623]">
                <Sparkles size={14} />
                <span className="font-['Inter:Regular',sans-serif] text-[11px]">Key Insight</span>
              </div>
            )}
            <div className="flex items-center gap-[6px] text-[rgba(196,196,207,0.6)]">
              <Clock size={12} />
              <span className="font-['Inter:Regular',sans-serif] text-[12px]">{time}</span>
            </div>
          </div>
        </div>
        <p className="font-['Inter:Regular',sans-serif] text-[17px] leading-[27.625px] text-neutral-200 tracking-[0.17px] mb-[16px]">
          {content}
        </p>
        
        {/* Emotional Resonance Bar */}
        <div className="pt-[17px] border-t border-[rgba(48,48,58,0.2)]">
          <div className="flex items-center justify-between mb-[8px]">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.7)]">
              Emotional resonance
            </span>
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-neutral-200">
              {emotionalResonance}%
            </span>
          </div>
          <div className="bg-[#0b0b0d] h-[4px] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#cba35d] to-[#d6af36] rounded-full"
              style={{ width: `${emotionalResonance}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadContext() {
  return (
    <div className="space-y-[24px] sticky top-[88px]">
      <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[24px]">
        <h3 className="font-['EB_Garamond:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(203,163,93,0.7)] tracking-[0.7px] uppercase mb-[20px]">
          Thread Context
        </h3>

        <div className="space-y-[16px]">
          <div>
            <h4 className="font-['EB_Garamond:Regular',sans-serif] text-[14px] leading-[20px] text-neutral-200 mb-[12px]">
              Evolution Trajectory
            </h4>
            <div className="space-y-[8px]">
              <MetricBar label="Growth moments" value={3} color="#4ed4a7" />
              <MetricBar label="Loops detected" value={2} color="#f5a623" />
              <MetricBar label="Breakthroughs" value={1} color="#cba35d" />
            </div>
          </div>

          <div className="pt-[16px] border-t border-[rgba(48,48,58,0.2)]">
            <h4 className="font-['EB_Garamond:Regular',sans-serif] text-[14px] leading-[20px] text-neutral-200 mb-[12px]">
              This thread touches:
            </h4>
            <div className="space-y-[8px]">
              <ThemeTag label="Self-reliance" />
              <ThemeTag label="Vulnerability" />
              <ThemeTag label="Pattern recognition" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[rgba(24,24,32,0.4)] border border-[rgba(48,48,58,0.3)] rounded-[16px] p-[24px]">
        <h3 className="font-['EB_Garamond:Regular',sans-serif] text-[12px] leading-[16px] text-[#3a8bff] tracking-[0.6px] uppercase mb-[12px]">
          Summary
        </h3>
        <p className="font-['Inter:Regular',sans-serif] text-[14px] leading-[22.75px] text-[rgba(196,196,207,0.8)] tracking-[0.14px]">
          This thread explores the tension between awareness and action, circling around patterns of self-observation without change.
        </p>
      </div>
    </div>
  );
}

interface MetricBarProps {
  label: string;
  value: number;
  color: string;
}

function MetricBar({ label, value, color }: MetricBarProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.7)]">
        {label}
      </span>
      <div className="flex items-center gap-[8px]">
        <span className="font-['Inter:Regular',sans-serif] text-[12px] text-neutral-200">
          {value}
        </span>
        <div className="w-[24px] h-[8px] rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function ThemeTag({ label }: { label: string }) {
  return (
    <div className="px-[12px] py-[6px] bg-[rgba(203,163,93,0.05)] border border-[rgba(203,163,93,0.15)] rounded-[8px]">
      <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[rgba(196,196,207,0.8)]">
        {label}
      </span>
    </div>
  );
}
