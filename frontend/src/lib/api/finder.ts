/**
 * Mirror Finder API Client
 * Handles all Finder-related API calls
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type Posture = 'unknown' | 'overwhelmed' | 'guarded' | 'grounded' | 'open' | 'exploratory';

export type CardType = 'person' | 'room' | 'artifact' | 'practice';
export type InteractionStyle = 'witness' | 'dialogue' | 'debate' | 'structured';
export type MistakeType = 'consent_violation' | 'timing_mismatch' | 'corruption_risk' | 'bandwidth_overload' | 'discomfort';
export type FinderMode = 'first_mirror' | 'active' | 'manual' | 'random' | 'off';
export type ExitFriction = 'low' | 'medium' | 'high';
export type EvidenceTier = 'declared' | 'attested' | 'observed';

export interface PostureState {
  declared: Posture;
  suggested: Posture | null;
  declared_at: string | null;
  suggested_at: string | null;
  divergence_count: number;
}

export interface TensionProxyVector {
  vector: Record<string, number>;
  is_manual_override: boolean;
  last_computed: string | null;
  ambiguity_score: number;
}

export interface DoorCard {
  node_id: string;
  card_type: CardType;
  interaction_style: InteractionStyle;
  lens_tags: string[];
  title: string | null;
  description: string | null;
  creator_id: string | null;
  attestation_count: number;
}

export interface DoorsResponse {
  doors: DoorCard[];
  mode: FinderMode;
  bandwidth_limit: number;
}

export interface AsymmetryReport {
  exit_friction: ExitFriction;
  data_demand_ratio: number;
  opacity: boolean;
  identity_coercion: boolean;
  unilateral_control: boolean;
  lock_in_terms: boolean;
  evidence_tier: EvidenceTier;
  reported_at: string;
}

export interface IdentityNode {
  id: string;
  node_type: 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
  label: string;
  content: string;
  lens_tags: string[];
  created_at: string;
  last_activated: string;
  activation_count: number;
}

export interface IdentityEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  edge_type: 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';
  frequency: number;
  intensity: number;
  recency: number;
  confidence: number;
}

export interface Tension {
  id: string;
  node_a_id: string;
  node_b_id: string;
  name: string;
  energy: number;
  duration_days: number;
  lens_tags: string[];
}

export interface IdentityGraph {
  nodes: IdentityNode[];
  edges: IdentityEdge[];
  tensions: Tension[];
}

export interface FinderConfig {
  mode: FinderMode;
  bandwidth_limit: number;
  blocked_nodes: string[];
  timing_preferences: Record<string, any>;
}

// ────────────────────────────────────────────────────────────────────────────
// API CLIENT
// ────────────────────────────────────────────────────────────────────────────

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token'); // Adjust based on your auth
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

export const finderApi = {
  // ─── Posture ───────────────────────────────────────────────────────────
  
  async getPosture(): Promise<PostureState> {
    return fetchAPI<PostureState>('/api/v1/finder/posture');
  },

  async updatePosture(posture: Posture): Promise<{ success: boolean; declared: Posture }> {
    return fetchAPI('/api/v1/finder/posture', {
      method: 'POST',
      body: JSON.stringify({ declared: posture }),
    });
  },

  // ─── Lens & TPV ────────────────────────────────────────────────────────
  
  async recordLensUsage(lensId: string, weight: number = 1.0): Promise<{ success: boolean }> {
    return fetchAPI('/api/v1/finder/lens-usage', {
      method: 'POST',
      body: JSON.stringify({ lens_id: lensId, weight }),
    });
  },

  async getTensionProxyVector(): Promise<TensionProxyVector> {
    return fetchAPI<TensionProxyVector>('/api/v1/finder/tpv');
  },

  // ─── Doors ─────────────────────────────────────────────────────────────
  
  async getDoors(limit?: number): Promise<DoorsResponse> {
    const params = limit ? `?limit=${limit}` : '';
    return fetchAPI<DoorsResponse>(`/api/v1/finder/doors${params}`);
  },

  async recordDoorView(nodeId: string): Promise<{ success: boolean }> {
    return fetchAPI(`/api/v1/finder/doors/${nodeId}/view`, {
      method: 'POST',
    });
  },

  // ─── Identity Graph ────────────────────────────────────────────────────
  
  async getIdentityGraph(): Promise<IdentityGraph> {
    return fetchAPI<IdentityGraph>('/api/v1/finder/graph');
  },

  // ─── Mistakes ──────────────────────────────────────────────────────────
  
  async reportMistake(
    nodeId: string,
    mistakeType: MistakeType,
    context?: string
  ): Promise<{ success: boolean; message: string }> {
    return fetchAPI('/api/v1/finder/mistakes', {
      method: 'POST',
      body: JSON.stringify({
        node_id: nodeId,
        mistake_type: mistakeType,
        context,
      }),
    });
  },

  // ─── Configuration ─────────────────────────────────────────────────────
  
  async getConfig(): Promise<FinderConfig> {
    return fetchAPI<FinderConfig>('/api/v1/finder/config');
  },

  async updateConfig(config: Partial<FinderConfig>): Promise<{ success: boolean; mode: FinderMode }> {
    return fetchAPI('/api/v1/finder/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  // ─── Asymmetry ─────────────────────────────────────────────────────────
  
  async getAsymmetryReport(nodeId: string): Promise<AsymmetryReport> {
    return fetchAPI<AsymmetryReport>(`/api/v1/finder/asymmetry/${nodeId}`);
  },
};
