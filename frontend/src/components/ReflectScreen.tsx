import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { InputComposer } from "./InputComposer";
import { ReflectionCard } from "./ReflectionCard";
import { MirrorbackCard } from "./MirrorbackCard";
import { reflections, mirrorbacks } from "@/lib/api";

interface ReflectionMirrorbackPair {
  id: string;
  reflection: {
    id: number;
    content: string;
    timestamp: string;
  };
  mirrorback: {
    content: string;
    signal: "growth" | "loop" | "regression" | "breakthrough" | "stagnation";
    emotionalIntensity: number;
  };
}

interface ReflectScreenProps {
  tone: string;
  threadId: string;
  isOffline?: boolean;
}

export function ReflectScreen({ tone, threadId, isOffline = false }: ReflectScreenProps) {
  const [pairs, setPairs] = useState<ReflectionMirrorbackPair[]>([]);
  const [isStreamOpen, setIsStreamOpen] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (reflectionContent: string, offline?: boolean) => {
    if (!reflectionContent.trim()) return;

    try {
      setIsGenerating(true);

      // Create reflection
      const reflectionResponse = await reflections.create({
        body: reflectionContent,
        visibility: offline ? 'private' : 'public',
      });
      const reflection = reflectionResponse.data;

      // Generate mirrorback
      const mirrorbackResponse = await mirrorbacks.create(reflection.id);
      const mirrorback = mirrorbackResponse.data;

      // Extract signal from mirrorback metadata or use default
      const signal = (mirrorback.metadata?.signal as any) || "growth";
      const emotionalIntensity = (mirrorback.metadata?.emotional_intensity as number) || 0.5;

      const newPair: ReflectionMirrorbackPair = {
        id: `pair-${reflection.id}`,
        reflection: {
          id: reflection.id,
          content: reflection.body,
          timestamp: new Date(reflection.created_at).toLocaleTimeString(),
        },
        mirrorback: {
          content: mirrorback.body,
          signal,
          emotionalIntensity,
        },
      };

      setPairs((prev) => [...prev, newPair]);
    } catch (error) {
      console.error('Failed to create reflection/mirrorback:', error);
      // Fallback to mock if API fails
      generateMockMirrorback(reflectionContent);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockMirrorback = (reflectionContent: string) => {
    const signals: Array<"growth" | "loop" | "regression" | "breakthrough" | "stagnation"> = [
      "growth",
      "loop",
      "regression",
      "breakthrough",
      "stagnation",
    ];
    const randomSignal = signals[Math.floor(Math.random() * signals.length)];

    const toneResponses = {
      soft: "I hear the depth in your reflection. This pattern connects to your earlier explorations of identity...",
      direct: "This reflection reveals a core tension between authenticity and performance. Let's examine it.",
      playful: "Ooh, this is spicy! You're dancing around something important here. What if we...?",
      austere: "The pattern is clear. Your self-concept is fragmenting under external pressure.",
      silent: "...",
      provocative: "You keep saying you're fine, but your words are screaming the opposite. Why the mask?",
    };

    const newPair: ReflectionMirrorbackPair = {
      id: `pair-${Date.now()}`,
      reflection: {
        id: Date.now(),
        content: reflectionContent,
        timestamp: new Date().toLocaleTimeString(),
      },
      mirrorback: {
        content: toneResponses[tone as keyof typeof toneResponses] || toneResponses.soft,
        signal: randomSignal,
        emotionalIntensity: Math.random(),
      },
    };

    setPairs((prev) => [...prev, newPair]);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#FAFAFA]">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Left: Composer */}
        <div className="w-[480px] flex-shrink-0 border-r border-[#30303A] p-6 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#CBA35D] mb-2">Reflect</h2>
            <p className="text-[#BDBDBD] text-sm">
              Share what's on your mind. The mirror listens.
            </p>
          </div>
          <div className="flex-1">
            <InputComposer
              onSubmit={handleSubmit}
              isOffline={isOffline}
              tone={tone}
            />
          </div>
        </div>

        {/* Right: Stream */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {pairs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="text-[#505050] text-lg mb-2">Your reflection stream is empty</div>
                <div className="text-[#30303A] text-sm">
                  Start by writing a reflection on the left
                </div>
              </motion.div>
            ) : (
              pairs.map((pair, idx) => (
                <motion.div
                  key={pair.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="space-y-4"
                >
                  <ReflectionCard
                    item={{
                      reflection: {
                        id: idx,
                        author_id: '',
                        body: pair.reflection.content,
                        visibility: 'public',
                        metadata: {},
                        created_at: pair.reflection.timestamp
                      },
                      author: { id: '', username: 'You', display_name: 'You', avatar_url: undefined, created_at: '', updated_at: '' },
                      mirrorback_count: 1,
                      signal_counts: {},
                      score: 0
                    }}
                  />
                  <MirrorbackCard
                    content={pair.mirrorback.content}
                    signal={pair.mirrorback.signal}
                    emotionalIntensity={pair.mirrorback.emotionalIntensity}
                    tone={tone}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col h-screen">
        {/* Header */}
        <div className="border-b border-[#30303A] p-4">
          <h2 className="text-xl font-semibold text-[#CBA35D]">Reflect</h2>
        </div>

        {/* Composer */}
        <div className="p-4 border-b border-[#30303A]">
          <InputComposer
            onSubmit={handleSubmit}
            isOffline={isOffline}
            tone={tone}
          />
        </div>

        {/* Stream Toggle */}
        <button
          onClick={() => setIsStreamOpen(!isStreamOpen)}
          className="flex items-center justify-between px-4 py-3 bg-[#1A1A1A] border-b border-[#30303A]"
        >
          <span className="text-[#FAFAFA] font-medium">
            Stream ({pairs.length} reflections)
          </span>
          {isStreamOpen ? (
            <ChevronUp className="w-5 h-5 text-[#CBA35D]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#CBA35D]" />
          )}
        </button>

        {/* Collapsible Stream */}
        <AnimatePresence>
          {isStreamOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {pairs.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-[#505050] text-sm">No reflections yet</div>
                </div>
              ) : (
                pairs.map((pair) => (
                  <div key={pair.id} className="space-y-3">
                    <ReflectionCard
                      item={{
                        reflection: {
                          id: parseInt(pair.id.split('-')[1]) || 0,
                          author_id: '',
                          body: pair.reflection.content,
                          visibility: 'public',
                          metadata: {},
                          created_at: pair.reflection.timestamp
                        },
                        author: { id: '', username: 'You', display_name: 'You', avatar_url: undefined, created_at: '', updated_at: '' },
                        mirrorback_count: 1,
                        signal_counts: {},
                        score: 0
                      }}
                    />
                    <MirrorbackCard
                      content={pair.mirrorback.content}
                      signal={pair.mirrorback.signal}
                      emotionalIntensity={pair.mirrorback.emotionalIntensity}
                      tone={tone}
                    />
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
