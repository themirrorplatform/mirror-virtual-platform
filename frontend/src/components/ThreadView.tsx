import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { ReflectionCard } from "./ReflectionCard";
import { MirrorbackCard } from "./MirrorbackCard";

interface TimelineEntry {
  id: string;
  date: string;
  reflection: {
    content: string;
    timestamp: string;
  };
  mirrorback: {
    content: string;
    signal: "growth" | "loop" | "regression" | "breakthrough" | "stagnation";
    emotionalIntensity: number;
  };
}

interface EvolutionSummary {
  growthCount: number;
  loopCount: number;
  breakthroughCount: number;
}

interface RelatedTension {
  id: string;
  label: string;
  strength: number;
}

interface ThreadViewProps {
  tone: string;
  threadId: string;
  entries: TimelineEntry[];
  evolutionSummary: EvolutionSummary;
  relatedTensions: RelatedTension[];
}

export function ThreadView({
  tone,
  threadId,
  entries,
  evolutionSummary,
  relatedTensions,
}: ThreadViewProps) {
  const [isContextOpen, setIsContextOpen] = useState(false);

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimelineEntry[]>);

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#FAFAFA]">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Main timeline */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Evolution summary */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-gradient-to-br from-[#1A1A1A]/90 to-[#0E0E0E]/90 backdrop-blur-sm border border-[#30303A] rounded-[1.5rem]"
            >
              <h3 className="text-[#CBA35D] font-semibold mb-4">Evolution Summary</h3>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-emerald-400 text-2xl font-bold">
                    {evolutionSummary.growthCount}
                  </span>
                  <span className="text-[#BDBDBD] text-sm ml-2">Growth</span>
                </div>
                <div>
                  <span className="text-[#CBA35D] text-2xl font-bold">
                    {evolutionSummary.loopCount}
                  </span>
                  <span className="text-[#BDBDBD] text-sm ml-2">Loops</span>
                </div>
                <div>
                  <span className="text-purple-400 text-2xl font-bold">
                    {evolutionSummary.breakthroughCount}
                  </span>
                  <span className="text-[#BDBDBD] text-sm ml-2">Breakthroughs</span>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="relative pl-8">
              {/* Vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#CBA35D] via-[#d4af37] to-transparent" />

              {Object.entries(groupedEntries).map(([date, dateEntries], dateIdx) => (
                <div key={date} className="mb-12">
                  {/* Date node */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: dateIdx * 0.1 }}
                    className="absolute left-0 -translate-x-1/2 flex items-center justify-center"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-[#CBA35D] bg-[#0E0E0E] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#CBA35D]" />
                    </div>
                  </motion.div>

                  {/* Date label */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: dateIdx * 0.1 + 0.1 }}
                    className="flex items-center gap-2 mb-6"
                  >
                    <Calendar className="w-4 h-4 text-[#CBA35D]" />
                    <span className="text-[#BDBDBD] text-sm font-medium">{date}</span>
                  </motion.div>

                  {/* Entries for this date */}
                  <div className="space-y-6">
                    {dateEntries.map((entry, entryIdx) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: dateIdx * 0.1 + entryIdx * 0.05 + 0.2 }}
                        className="space-y-4"
                      >
                        <ReflectionCard
                          item={{
                            reflection: {
                              id: entryIdx,
                              author_id: '',
                              body: entry.reflection.content,
                              visibility: 'public',
                              metadata: {},
                              created_at: entry.reflection.timestamp
                            },
                            author: { id: '', username: 'You', display_name: 'You', avatar_url: undefined, created_at: '', updated_at: '' },
                            mirrorback_count: 1,
                            signal_counts: {},
                            score: 0
                          }}
                        />
                        <MirrorbackCard
                          content={entry.mirrorback.content}
                          evolutionSignal={entry.mirrorback.signal}
                          emotionalIntensity={entry.mirrorback.emotionalIntensity}
                          tone={tone}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar: Related tensions */}
        <div className="w-80 border-l border-[#30303A] p-6 overflow-y-auto">
          <h3 className="text-[#FAFAFA] font-semibold mb-4">Related Tensions</h3>
          <div className="space-y-4">
            {relatedTensions.map((tension) => (
              <div
                key={tension.id}
                className="p-4 bg-[#1A1A1A] border border-[#30303A] rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#FAFAFA] text-sm">{tension.label}</span>
                  <span className="text-[#CBA35D] text-xs">
                    {Math.round(tension.strength * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#0E0E0E] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#EF4444] to-[#CBA35D]"
                    initial={{ width: 0 }}
                    animate={{ width: `${tension.strength * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-[#30303A] p-4">
          <h2 className="text-xl font-semibold text-[#CBA35D]">Thread</h2>
        </div>

        {/* Evolution summary */}
        <div className="p-4 bg-[#1A1A1A] border-b border-[#30303A]">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="text-emerald-400 text-lg font-bold">
                {evolutionSummary.growthCount}
              </div>
              <div className="text-[#BDBDBD] text-xs">Growth</div>
            </div>
            <div className="text-center">
              <div className="text-[#CBA35D] text-lg font-bold">
                {evolutionSummary.loopCount}
              </div>
              <div className="text-[#BDBDBD] text-xs">Loops</div>
            </div>
            <div className="text-center">
              <div className="text-purple-400 text-lg font-bold">
                {evolutionSummary.breakthroughCount}
              </div>
              <div className="text-[#BDBDBD] text-xs">Breakthroughs</div>
            </div>
          </div>
        </div>

        {/* Context toggle */}
        <button
          onClick={() => setIsContextOpen(!isContextOpen)}
          className="flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border-b border-[#30303A]"
        >
          <span className="text-[#FAFAFA] font-medium">Related Tensions</span>
          {isContextOpen ? (
            <ChevronUp className="w-5 h-5 text-[#CBA35D]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#CBA35D]" />
          )}
        </button>

        {/* Collapsible context panel */}
        <AnimatePresence>
          {isContextOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-[#30303A] p-4 space-y-3 bg-[#0E0E0E]"
            >
              {relatedTensions.map((tension) => (
                <div key={tension.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#FAFAFA] text-sm">{tension.label}</span>
                    <span className="text-[#CBA35D] text-xs">
                      {Math.round(tension.strength * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#EF4444] to-[#CBA35D]"
                      style={{ width: `${tension.strength * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative pl-6">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#CBA35D] via-[#d4af37] to-transparent" />

            {Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <div key={date} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="absolute left-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-[#CBA35D] bg-[#0E0E0E]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#CBA35D]" />
                    </div>
                  </div>
                  <span className="text-[#BDBDBD] text-xs">{date}</span>
                </div>

                <div className="space-y-4">
                  {dateEntries.map((entry) => (
                    <div key={entry.id} className="space-y-3">
                      <ReflectionCard
                        item={{
                          reflection: {
                            id: parseInt(entry.id.split('-')[1]) || 0,
                            author_id: '',
                            body: entry.reflection.content,
                            visibility: 'public',
                            metadata: {},
                            created_at: entry.reflection.timestamp
                          },
                          author: { id: '', username: 'You', display_name: 'You', avatar_url: undefined, created_at: '', updated_at: '' },
                          mirrorback_count: 1,
                          signal_counts: {},
                          score: 0
                        }}
                      />
                      <MirrorbackCard
                        content={entry.mirrorback.content}
                        evolutionSignal={entry.mirrorback.signal}
                        emotionalIntensity={entry.mirrorback.emotionalIntensity}
                        tone={tone}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
