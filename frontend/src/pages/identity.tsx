import { useState, useEffect } from 'react';
import { IdentityGraph } from '@/components/IdentityGraph';
import api, { auth } from '@/lib/api';

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'core' | 'belief' | 'tension' | 'paradox';
    x: number;
    y: number;
    strength: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'normal' | 'loop' | 'contradiction' | 'paradox';
    strength: number;
  }>;
  tensions: Array<{
    id: string;
    label: string;
    strength: number;
  }>;
  loops: Array<{
    id: string;
    pattern: string;
    occurrences: number;
  }>;
}

export default function IdentityPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIdentityGraph();
  }, []);

  const loadIdentityGraph = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user ID from token
      const token = auth.getToken();
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Decode token to get user ID (simple JWT decode)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = payload.sub || payload.user_id;
      setUserId(currentUserId);

      // Fetch identity graph data
      const response = await api.get(`/identity/${currentUserId}/graph`);
      const data = response.data;

      // If backend returns empty data, create mock data
      if (!data.nodes || data.nodes.length === 0) {
        setGraphData(createMockGraphData());
      } else {
        setGraphData(data);
      }
    } catch (err: any) {
      console.error('Failed to load identity graph:', err);
      
      // If API fails, show mock data for demo purposes
      if (err.response?.status === 503 || err.response?.status === 404) {
        setGraphData(createMockGraphData());
      } else {
        setError(err.response?.data?.detail || 'Failed to load identity graph');
      }
    } finally {
      setLoading(false);
    }
  };

  const createMockGraphData = (): GraphData => {
    return {
      nodes: [
        { id: 'core', label: 'Self', type: 'core', x: 400, y: 300, strength: 1.0 },
        { id: 'belief1', label: 'Growth Mindset', type: 'belief', x: 250, y: 200, strength: 0.85 },
        { id: 'belief2', label: 'Authenticity', type: 'belief', x: 550, y: 200, strength: 0.9 },
        { id: 'tension1', label: 'Perfectionism vs Progress', type: 'tension', x: 250, y: 400, strength: 0.75 },
        { id: 'tension2', label: 'Independence vs Connection', type: 'tension', x: 550, y: 400, strength: 0.62 },
        { id: 'paradox1', label: 'Control & Surrender', type: 'paradox', x: 400, y: 500, strength: 0.7 },
      ],
      edges: [
        { from: 'core', to: 'belief1', type: 'normal', strength: 0.85 },
        { from: 'core', to: 'belief2', type: 'normal', strength: 0.9 },
        { from: 'core', to: 'tension1', type: 'contradiction', strength: 0.75 },
        { from: 'core', to: 'tension2', type: 'contradiction', strength: 0.62 },
        { from: 'tension1', to: 'paradox1', type: 'loop', strength: 0.6 },
        { from: 'tension2', to: 'paradox1', type: 'loop', strength: 0.55 },
      ],
      tensions: [
        { id: 't1', label: 'Perfectionism vs Progress', strength: 0.75 },
        { id: 't2', label: 'Independence vs Connection', strength: 0.62 },
        { id: 't3', label: 'Logic vs Emotion', strength: 0.48 },
      ],
      loops: [
        { id: 'l1', pattern: 'Overthinking → Paralysis → Self-criticism', occurrences: 5 },
        { id: 'l2', pattern: 'Planning → Anxiety → Avoidance', occurrences: 3 },
      ],
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-[#CBA35D] text-lg">Loading identity map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">Error</div>
          <div className="text-[#BDBDBD]">{error}</div>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="text-[#BDBDBD]">No identity data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl text-[#CBA35D] mb-2">Your Identity Map</h1>
        <p className="text-[#BDBDBD] mb-8">
          Explore the patterns, tensions, and connections that shape your identity
        </p>
        <IdentityGraph {...graphData} />
      </div>
    </div>
  );
}
