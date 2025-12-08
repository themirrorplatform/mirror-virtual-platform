import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThreadView } from '@/components/ThreadView';
import Layout from '@/components/Layout';
import { threads, Reflection } from '@/lib/api';

interface TimelineEntry {
  id: string;
  date: string;
  reflection: {
    content: string;
    timestamp: string;
  };
  mirrorback: {
    content: string;
    signal: 'growth' | 'loop' | 'regression' | 'breakthrough' | 'stagnation';
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

export default function ThreadPage() {
  const router = useRouter();
  const { threadId } = router.query;
  
  const [threadTone, setThreadTone] = useState<string>('direct');
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [evolutionSummary, setEvolutionSummary] = useState<EvolutionSummary>({
    growthCount: 0,
    loopCount: 0,
    breakthroughCount: 0,
  });
  const [relatedTensions, setRelatedTensions] = useState<RelatedTension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId || typeof threadId !== 'string') return;

    const fetchThreadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch thread details
        const threadResponse = await threads.get(threadId);
        const thread = threadResponse.data;
        setThreadTone(thread.tone || 'direct');

        // Fetch thread reflections
        const reflectionsResponse = await threads.getReflections(threadId);
        const reflectionList = reflectionsResponse.data;

        // Transform reflections to timeline entries (mock mirrorbacks for now)
        const timelineEntries: TimelineEntry[] = reflectionList.map((ref: Reflection) => ({
          id: ref.id.toString(),
          date: new Date(ref.created_at).toLocaleDateString(),
          reflection: {
            content: ref.body,
            timestamp: new Date(ref.created_at).toLocaleTimeString(),
          },
          mirrorback: {
            content: 'Analyzing your reflection...',
            signal: 'growth' as const,
            emotionalIntensity: 0.5,
          },
        }));

        setEntries(timelineEntries);
        
        // Calculate evolution summary
        setEvolutionSummary({
          growthCount: Math.floor(reflectionList.length * 0.4),
          loopCount: Math.floor(reflectionList.length * 0.2),
          breakthroughCount: Math.floor(reflectionList.length * 0.15),
        });

        // Mock related tensions
        setRelatedTensions([
          { id: 't1', label: 'Authenticity vs Performance', strength: 0.75 },
          { id: 't2', label: 'Independence vs Connection', strength: 0.62 },
        ]);

      } catch (err: any) {
        console.error('Failed to fetch thread data:', err);
        setError(err.response?.data?.detail || 'Failed to load thread');
        
        // Fallback to mock data
        createMockThreadData();
      } finally {
        setLoading(false);
      }
    };

    fetchThreadData();
  }, [threadId]);

  const createMockThreadData = () => {
    setThreadTone('direct');

    const mockEntries: TimelineEntry[] = [
      {
        id: '1',
        date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
        reflection: {
          content: "I've been thinking about how I present myself differently in different contexts. Sometimes I feel like I'm being authentic, other times like I'm performing.",
          timestamp: new Date(Date.now() - 86400000 * 3).toLocaleTimeString(),
        },
        mirrorback: {
          content: "This tension between authenticity and performance is a core theme in your reflections. You're recognizing a pattern.",
          signal: 'loop',
          emotionalIntensity: 0.6,
        },
      },
      {
        id: '2',
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        reflection: {
          content: "The tension between wanting to be seen and wanting to hide feels stronger lately. I crave connection but fear judgment.",
          timestamp: new Date(Date.now() - 86400000 * 2).toLocaleTimeString(),
        },
        mirrorback: {
          content: "Your reflections show increasing awareness of these opposing desires. That's growth.",
          signal: 'growth',
          emotionalIntensity: 0.55,
        },
      },
      {
        id: '3',
        date: new Date(Date.now() - 86400000).toLocaleDateString(),
        reflection: {
          content: "Maybe the performance IS the authenticity? Like, we're all constructing ourselves moment to moment anyway.",
          timestamp: new Date(Date.now() - 86400000).toLocaleTimeString(),
        },
        mirrorback: {
          content: "You're shifting from viewing these as opposites to seeing them as complementary. This is breakthrough thinking.",
          signal: 'breakthrough',
          emotionalIntensity: 0.8,
        },
      },
    ];

    setEntries(mockEntries);
    setEvolutionSummary({
      growthCount: 2,
      loopCount: 1,
      breakthroughCount: 1,
    });
    setRelatedTensions([
      { id: 't1', label: 'Authenticity vs Performance', strength: 0.75 },
      { id: 't2', label: 'Independence vs Connection', strength: 0.62 },
    ]);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
          <div className="text-[#CBA35D] text-lg">Loading thread...</div>
        </div>
      </Layout>
    );
  }

  if (error && entries.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-4">{error}</div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#CBA35D] text-[#0E0E0E] rounded hover:bg-[#B39350] transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ThreadView
        tone={threadTone}
        threadId={threadId as string}
        entries={entries}
        evolutionSummary={evolutionSummary}
        relatedTensions={relatedTensions}
      />
    </Layout>
  );
}
