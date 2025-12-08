import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { InputComposer } from './InputComposer';
import { ReflectionCard } from './ReflectionCard';
import { MirrorbackCard } from './MirrorbackCard';

interface Reflection {
  id: string;
  username: string;
  text: string;
  timestamp: string;
  evolutionType?: 'growth' | 'stagnation' | 'breakthrough' | 'regression';
  tone?: 'soft' | 'direct' | 'playful' | 'austere' | 'silent' | 'provocative';
  lens?: string;
  mirrorback?: {
    text: string;
    tone: 'soft' | 'direct' | 'playful' | 'austere' | 'silent' | 'provocative';
  };
}

interface ReflectScreenProps {
  className?: string;
}

export function ReflectScreen({ className = '' }: ReflectScreenProps) {
  const [reflections, setReflections] = useState<Reflection[]>([
    {
      id: '1',
      username: 'Sarah',
      text: 'I keep finding myself drawn to projects that challenge me, but I notice I always abandon them right before completion. What does that say about me?',
      timestamp: '2 hours ago',
      evolutionType: 'stagnation',
      tone: 'soft',
      lens: 'Self-Sabotage',
      mirrorback: {
        text: 'What if completion isn\'t the threat—what if it\'s the vulnerability of being seen through finished work?',
        tone: 'soft',
      },
    },
    {
      id: '2',
      username: 'Marcus',
      text: 'I realized today that I don\'t actually want to be understood. I want to be witnessed without explanation.',
      timestamp: '5 hours ago',
      evolutionType: 'breakthrough',
      tone: 'direct',
      lens: 'Authenticity',
    },
    {
      id: '3',
      username: 'Elena',
      text: 'My therapist said I use humor as a defense mechanism, but honestly, isn\'t that just efficient emotional processing?',
      timestamp: '1 day ago',
      evolutionType: 'growth',
      tone: 'playful',
      lens: 'Coping Mechanisms',
      mirrorback: {
        text: 'Efficiency and avoidance can wear the same mask. Which one laughs harder?',
        tone: 'playful',
      },
    },
  ]);

  const handleSubmitReflection = (text: string) => {
    const newReflection: Reflection = {
      id: Date.now().toString(),
      username: 'You',
      text,
      timestamp: 'Just now',
      tone: 'soft',
    };
    setReflections([newReflection, ...reflections]);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <motion.div
        className="p-6 border-b border-[#30303A]/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-[#E5E5E5] mb-2">Reflect</h2>
        <p className="text-sm text-[#C4C4CF]/60">
          Your feed prioritizes depth over engagement
        </p>
      </motion.div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Input composer */}
        <InputComposer onSubmit={handleSubmitReflection} />

        {/* Reflections feed */}
        {reflections.map((reflection, index) => (
          <motion.div
            key={reflection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <ReflectionCard
              username={reflection.username}
              text={reflection.text}
              timestamp={reflection.timestamp}
              evolutionType={reflection.evolutionType}
              tone={reflection.tone}
              lens={reflection.lens}
            />
            {reflection.mirrorback && (
              <MirrorbackCard
                text={reflection.mirrorback.text}
                tone={reflection.mirrorback.tone}
                className="mt-4 ml-8"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
