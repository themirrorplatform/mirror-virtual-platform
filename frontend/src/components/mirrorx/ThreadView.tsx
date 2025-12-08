import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { ThreadListItem } from './ThreadListItem';
import { ReflectionCard } from './ReflectionCard';
import { MirrorbackCard } from './MirrorbackCard';
import { InputComposer } from './InputComposer';
import { GhostButton } from './GhostButton';

interface Thread {
  id: string;
  username: string;
  preview: string;
  timestamp: string;
  replyCount: number;
}

interface ThreadViewProps {
  className?: string;
}

export function ThreadView({ className = '' }: ThreadViewProps) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threads] = useState<Thread[]>([
    {
      id: '1',
      username: 'Sarah',
      preview: 'I keep finding myself drawn to projects that challenge me...',
      timestamp: '2h ago',
      replyCount: 12,
    },
    {
      id: '2',
      username: 'Marcus',
      preview: 'I realized today that I don\'t actually want to be understood...',
      timestamp: '5h ago',
      replyCount: 8,
    },
    {
      id: '3',
      username: 'Elena',
      preview: 'My therapist said I use humor as a defense mechanism...',
      timestamp: '1d ago',
      replyCount: 15,
    },
  ]);

  if (selectedThread) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Thread header */}
        <motion.div
          className="p-6 border-b border-[#30303A]/30 flex items-center gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GhostButton
            icon={ArrowLeft}
            onClick={() => setSelectedThread(null)}
          />
          <div>
            <h2 className="text-xl font-bold text-[#E5E5E5]">Thread</h2>
            <p className="text-sm text-[#C4C4CF]/60">12 reflections</p>
          </div>
        </motion.div>

        {/* Thread content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <ReflectionCard
            username="Sarah"
            text="I keep finding myself drawn to projects that challenge me, but I notice I always abandon them right before completion. What does that say about me?"
            timestamp="2 hours ago"
            evolutionType="stagnation"
            lens="Self-Sabotage"
          />
          <MirrorbackCard
            text="What if completion isn't the threat—what if it's the vulnerability of being seen through finished work?"
            tone="soft"
            className="ml-8"
          />
          <ReflectionCard
            username="Alex"
            text="I do this too. For me, it's about perfectionism. If I never finish, it can never be judged as imperfect."
            timestamp="1 hour ago"
          />
          <ReflectionCard
            username="Jordan"
            text="But isn't that just another form of control? You're still letting fear make the decision."
            timestamp="45 minutes ago"
            tone="direct"
          />
        </div>

        {/* Reply composer */}
        <div className="p-6 border-t border-[#30303A]/30">
          <InputComposer
            onSubmit={(text) => console.log('Reply:', text)}
            placeholder="Add to this thread..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <motion.div
        className="p-6 border-b border-[#30303A]/30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-[#E5E5E5] mb-2">Threads</h2>
        <p className="text-sm text-[#C4C4CF]/60">
          Ongoing conversations worth revisiting
        </p>
      </motion.div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {threads.map((thread, index) => (
          <motion.div
            key={thread.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <ThreadListItem
              username={thread.username}
              preview={thread.preview}
              timestamp={thread.timestamp}
              replyCount={thread.replyCount}
              onClick={() => setSelectedThread(thread.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
