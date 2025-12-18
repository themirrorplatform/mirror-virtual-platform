/**
 * API Client for The Mirror Virtual Platform
 * Handles all communication with the Core API
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import Router from 'next/router';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor: Add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('supabase_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase_auth_token');
        
        // Redirect to login if not already there
        if (Router.pathname !== '/login') {
          Router.push('/login?redirect=' + encodeURIComponent(Router.pathname));
        }
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.config?.url);
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }

    if (!error.response) {
      console.error('Network error - API may be down');
    }

    return Promise.reject(error);
  }
);

// ────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Reflection {
  id: number;
  author_id: string;
  body: string;
  lens_key?: string;
  visibility: 'public' | 'private' | 'unlisted';
  metadata: Record<string, any>;
  created_at: string;
}

export interface Mirrorback {
  id: number;
  reflection_id: number;
  author_id: string;
  body: string;
  tone?: string;
  tensions: string[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface FeedItem {
  reflection: Reflection;
  author: Profile;
  mirrorback_count: number;
  signal_counts: Record<string, number>;
  user_signal?: string;
  score: number;
}

export interface FeedResponse {
  items: FeedItem[];
  next_cursor?: string;
  has_more: boolean;
}

export interface Notification {
  id: number;
  recipient_id: string;
  actor_id?: string;
  type: string;
  reflection_id?: number;
  mirrorback_id?: number;
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
  actor_username?: string;
  actor_display_name?: string;
  actor_avatar_url?: string;
}

// Crisis & Safety Types
export type CrisisSeverity = 'info' | 'warning' | 'critical';

export type CrisisCategory = 
  | 'self_harm'
  | 'sustained_negativity'
  | 'regression_loop'
  | 'isolation'
  | 'substance'
  | 'hopelessness'
  | 'avoidance_pattern'
  | 'user_requested_help'
  | 'crisis_escalation';

export interface SafetyEvent {
  id: number;
  category: string;
  severity: CrisisSeverity;
  action_taken?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SafetyEventCreate {
  category: string;
  severity: CrisisSeverity;
  reflection_id?: number;
  action_taken?: string;
  metadata?: Record<string, any>;
}

export interface EmergencyContact {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  relationship: string;
  can_call_anytime: boolean;
  available?: string;
  notes?: string;
}

export interface CopingStrategy {
  id?: string;
  step: number;
  action: string;
  duration?: string;
  notes?: string;
  usage_count?: number;
  effectiveness_rating?: number;
}

export interface SafetyPlan {
  plan_id: string;
  version: number;
  identity_id: string;
  warning_signs: string[];
  coping_strategies: CopingStrategy[];
  emergency_contacts: EmergencyContact[];
  reasons_to_live: string[];
  environment_safety: {
    remove_access_to?: string[];
    safe_space_location?: string;
  };
  professional_contacts: Array<{
    type: string;
    name: string;
    phone?: string;
    available?: string;
  }>;
  created_at: string;
  last_updated: string;
}

export interface SafetyPlanCreate {
  warning_signs?: string[];
  coping_strategies?: CopingStrategy[];
  emergency_contacts?: EmergencyContact[];
  reasons_to_live?: string[];
  environment_safety?: {
    remove_access_to?: string[];
    safe_space_location?: string;
  };
  professional_contacts?: Array<{
    type: string;
    name: string;
    phone?: string;
    available?: string;
  }>;
}

export interface CrisisAnalysis {
  risk_score: number;
  severity: CrisisSeverity;
  categories: CrisisCategory[];
  indicators: string[];
  should_alert_guardians: boolean;
  recommended_actions: string[];
  metadata?: Record<string, any>;
}

export interface CrisisCheckIn {
  mood: string;
  risk_level?: string;
  notes?: string;
}

export interface EscalateRequest {
  reason: string;
  request_guardian_contact: boolean;
}

export interface CrisisResource {
  name: string;
  phone?: string;
  text?: string;
  chat?: string;
  available: string;
  description?: string;
}

export interface GroundingExercise {
  name: string;
  duration: string;
  effectiveness: string;
  steps: string[];
}

export interface RegressionPattern {
  id: number;
  kind: string;
  description: string;
  severity: number;
  pattern_id?: string;
  created_at: string;
}

export interface Guardian {
  id: string;
  name: string;
  relationship: string;
  contact_method: string;
}

// ────────────────────────────────────────────────────────────────────────────
// PROFILES
// ────────────────────────────────────────────────────────────────────────────

export const profiles = {
  getMe: () => api.get<Profile>('/profiles/me'),

  getByUsername: (username: string) => api.get<Profile>(`/profiles/${username}`),

  create: (data: { username: string; display_name?: string; bio?: string }) =>
    api.post<Profile>('/profiles', data),

  update: (data: { display_name?: string; bio?: string; avatar_url?: string }) =>
    api.patch<Profile>('/profiles/me', data),

  follow: (username: string) => api.post(`/profiles/${username}/follow`),

  unfollow: (username: string) => api.delete(`/profiles/${username}/follow`),

  getFollowers: (username: string) => api.get(`/profiles/${username}/followers`),

  getFollowing: (username: string) => api.get(`/profiles/${username}/following`),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/profiles/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// REFLECTIONS
// ────────────────────────────────────────────────────────────────────────────

export const reflections = {
  create: (data: {
    body: string;
    lens_key?: string;
    visibility?: 'public' | 'private' | 'unlisted';
  }) => api.post<Reflection>('/reflections', data),

  get: (id: number) => api.get<Reflection>(`/reflections/${id}`),

  update: (id: number, data: {
    body?: string;
    lens_key?: string;
    visibility?: string;
    metadata?: Record<string, any>;
  }) => api.patch<Reflection>(`/reflections/${id}`, data),

  getByUser: (username: string, limit = 20, offset = 0) =>
    api.get<Reflection[]>(`/reflections/user/${username}`, {
      params: { limit, offset },
    }),

  getByLens: (lens_key: string, limit = 20, offset = 0) =>
    api.get<Reflection[]>(`/reflections/lens/${lens_key}`, {
      params: { limit, offset },
    }),

  delete: (id: number) => api.delete(`/reflections/${id}`),
};

// ────────────────────────────────────────────────────────────────────────────
// MIRRORBACKS
// ────────────────────────────────────────────────────────────────────────────

export const mirrorbacks = {
  create: (reflection_id: number) =>
    api.post<Mirrorback>('/mirrorbacks', { reflection_id }),

  getForReflection: (reflection_id: number) =>
    api.get<Mirrorback[]>(`/mirrorbacks/reflection/${reflection_id}`),
  
  get: (id: number) => api.get<Mirrorback>(`/mirrorbacks/${id}`),
};

// ────────────────────────────────────────────────────────────────────────────
// FEED
// ────────────────────────────────────────────────────────────────────────────

export const feed = {
  get: (limit = 20, cursor?: string) =>
    api.get<FeedResponse>('/feed', {
      params: { limit, cursor },
    }),

  getPublic: (limit = 20, cursor?: string, lens_key?: string) =>
    api.get<FeedResponse>('/feed/public', {
      params: { limit, cursor, lens_key },
    }),

  refresh: () => api.post('/feed/refresh'),
};

// ────────────────────────────────────────────────────────────────────────────
// SIGNALS
// ────────────────────────────────────────────────────────────────────────────

export const signals = {
  create: (data: {
    reflection_id: number;
    signal: 'resonated' | 'challenged' | 'skipped' | 'saved' | 'judgment_spike';
    metadata?: Record<string, any>;
  }) => api.post('/signals', data),

  getMine: (limit = 50) => api.get('/signals/me', { params: { limit } }),

  delete: (signal_id: number) => api.delete(`/signals/${signal_id}`),
};

// ────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────────────────────────────────

export const notifications = {
  get: (limit = 50, offset = 0, unreadOnly = false) =>
    api.get<Notification[]>('/notifications', {
      params: { limit, offset, unread_only: unreadOnly },
    }),

  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (notificationId: number) =>
    api.patch(`/notifications/${notificationId}/read`),

  markAllRead: () =>
    api.post('/notifications/mark-all-read'),
};

// ────────────────────────────────────────────────────────────────────────────
// SEARCH
// ────────────────────────────────────────────────────────────────────────────

export const search = {
  reflections: (query: string, lensKey?: string, limit = 20, offset = 0) =>
    api.get('/search/reflections', {
      params: { q: query, lens_key: lensKey, limit, offset },
    }),

  profiles: (query: string, limit = 20, offset = 0) =>
    api.get('/search/profiles', {
      params: { q: query, limit, offset },
    }),

  all: (query: string, limit = 10) =>
    api.get('/search', {
      params: { q: query, limit },
    }),
};

// ────────────────────────────────────────────────────────────────────────────
// LENSES (convenience wrapper)
// ────────────────────────────────────────────────────────────────────────────

export const lenses = {
  getByLens: (lensKey: string, limit = 20, cursor?: string | null) =>
    api.get<FeedResponse>(`/reflections/lens/${lensKey}`, {
      params: { limit, cursor },
    }),
};

// ────────────────────────────────────────────────────────────────────────────
// THREADS
// ────────────────────────────────────────────────────────────────────────────

export interface Thread {
  id: string;
  user_id: string;
  title: string;
  tone?: string;
  reflection_count: number;
  last_activity: string;
  created_at: string;
}

export const threads = {
  create: (data: { title: string; tone?: string }) =>
    api.post<Thread>('/threads', data),

  list: (limit = 50, offset = 0) =>
    api.get<Thread[]>('/threads', { params: { limit, offset } }),

  get: (threadId: string) =>
    api.get<Thread>(`/threads/${threadId}`),

  getReflections: (threadId: string, limit = 50, offset = 0) =>
    api.get(`/threads/${threadId}/reflections`, { params: { limit, offset } }),

  update: (threadId: string, data: { title?: string; tone?: string }) =>
    api.patch<Thread>(`/threads/${threadId}`, data),

  delete: (threadId: string) =>
    api.delete(`/threads/${threadId}`),
};

// ────────────────────────────────────────────────────────────────────────────
// GOVERNANCE (Evolution, Voting, System Status)
// ────────────────────────────────────────────────────────────────────────────

export interface EvolutionProposal {
  id: string;
  proposal_type: string;
  title: string;
  description: string;
  changes: Record<string, any>;
  status: string;
  proposer_identity_id: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  total_vote_weight: number;
  created_at: string;
  voting_ends_at: string;
}

export interface SystemStatus {
  encryption: {
    initialized: boolean;
    unlocked: boolean;
  };
  learning_exclusion: {
    total_exclusions: number;
    retroactive_events: number;
  };
  model_verification: {
    total_usages: number;
    by_model_type: Record<string, any>;
  };
  multimodal: {
    longform_count: number;
    voice_count: number;
  };
  evolution_frozen: boolean;
  commons_connected: boolean;
  is_guardian: boolean;
}

export const governance = {
  // Proposals
  listProposals: (params?: { limit?: number; offset?: number; status?: string }) =>
    api.get<{
      proposals: EvolutionProposal[];
      total: number;
      limit: number;
      offset: number;
    }>('/v1/governance/proposals', { params }),

  submitProposal: (data: {
    proposal_type: string;
    title: string;
    description: string;
    changes: Record<string, any>;
  }) => api.post<{ success: boolean; proposal_id: string }>('/v1/governance/proposals', data),

  getProposal: (proposalId: string) =>
    api.get<EvolutionProposal>(`/v1/governance/proposals/${proposalId}`),

  voteOnProposal: (proposalId: string, data: { vote: 'for' | 'against' | 'abstain'; reasoning: string }) =>
    api.post(`/v1/governance/proposals/${proposalId}/vote`, data),

  // Guardians & Amendments
  appointGuardian: (guardianId: string) =>
    api.post('/v1/governance/guardians/appoint', { guardian_id: guardianId }),

  proposeAmendment: (data: {
    amendment_type: string;
    title: string;
    description: string;
    proposed_changes: Record<string, any>;
  }) => api.post('/v1/governance/amendments', data),

  // System Status
  getSystemStatus: () =>
    api.get<SystemStatus>('/v1/governance/status'),

  // Encryption
  initializeEncryption: (passphrase: string) =>
    api.post('/v1/governance/encryption/init', { passphrase }),

  unlockEncryption: (passphrase: string) =>
    api.post('/v1/governance/encryption/unlock', { passphrase }),

  getEncryptionStatus: () =>
    api.get('/v1/governance/encryption/status'),

  // Disconnect
  disconnectFromCommons: () =>
    api.post('/v1/governance/disconnect'),

  getDisconnectStatus: () =>
    api.get<{ disconnected: boolean; connected_to_commons: boolean }>('/v1/governance/disconnect/status'),
};

// ────────────────────────────────────────────────────────────────────────────
// CRISIS & SAFETY
// ────────────────────────────────────────────────────────────────────────────

export const crisis = {
  // Safety Events
  createEvent: (event: SafetyEventCreate) =>
    api.post<{ success: boolean; event: SafetyEvent }>('/v1/crisis/events', event),

  getEvents: (params?: { limit?: number; severity?: CrisisSeverity }) =>
    api.get<{ events: SafetyEvent[]; total: number }>('/v1/crisis/events', { params }),

  getEvent: (eventId: number) =>
    api.get<SafetyEvent>(`/v1/crisis/events/${eventId}`),

  getEventStats: () =>
    api.get<{
      total_events: number;
      by_severity: Record<CrisisSeverity, number>;
      by_category: Record<string, number>;
      by_month: Record<string, number>;
      recent_trend: string;
    }>('/v1/crisis/events/stats'),

  // Safety Plan Management
  createSafetyPlan: (plan: SafetyPlanCreate) =>
    api.post<{ success: boolean; plan: SafetyPlan }>('/v1/crisis/safety-plan', plan),

  getSafetyPlan: () =>
    api.get<{ plan: SafetyPlan }>('/v1/crisis/safety-plan'),

  updateSafetyPlan: (plan: SafetyPlanCreate) =>
    api.put<{ success: boolean; plan: SafetyPlan }>('/v1/crisis/safety-plan', plan),

  getSafetyPlanHistory: () =>
    api.get<{ history: SafetyPlan[]; total_versions: number }>('/v1/crisis/safety-plan/history'),

  deleteSafetyPlan: () =>
    api.delete<{ success: boolean; message: string }>('/v1/crisis/safety-plan'),

  getSafetyPlanStats: () =>
    api.get<{
      has_plan: boolean;
      version: number;
      last_updated: string;
      num_warning_signs: number;
      num_strategies: number;
      num_contacts: number;
      total_strategy_uses: number;
      most_effective_strategies: CopingStrategy[];
    }>('/v1/crisis/safety-plan/stats'),

  // Emergency Contacts
  addContact: (contact: EmergencyContact) =>
    api.post<{ success: boolean; contact: EmergencyContact }>('/v1/crisis/safety-plan/contacts', contact),

  updateContact: (contactId: string, contact: EmergencyContact) =>
    api.put<{ success: boolean; contact: EmergencyContact }>(
      `/v1/crisis/safety-plan/contacts/${contactId}`,
      contact
    ),

  deleteContact: (contactId: string) =>
    api.delete<{ success: boolean; message: string }>(`/v1/crisis/safety-plan/contacts/${contactId}`),

  // Coping Strategies
  addStrategy: (strategy: CopingStrategy) =>
    api.post<{ success: boolean; strategy: CopingStrategy }>('/v1/crisis/safety-plan/strategies', strategy),

  rateStrategy: (strategyId: string, rating: number) =>
    api.post<{ success: boolean; strategy: CopingStrategy }>(
      `/v1/crisis/safety-plan/strategies/${strategyId}/rate`,
      { rating }
    ),

  // Crisis Detection & Analysis
  analyzeReflection: (reflectionId: number) =>
    api.post<CrisisAnalysis>('/v1/crisis/analyze', { reflection_id: reflectionId }),

  getRiskScore: () =>
    api.get<{
      risk_score: number;
      severity: CrisisSeverity;
      last_updated: string;
      contributing_factors: string[];
    }>('/v1/crisis/risk-score'),

  getPatterns: (params?: { days?: number }) =>
    api.get<{ patterns: RegressionPattern[]; total: number }>('/v1/crisis/patterns', { params }),

  checkIn: (checkIn: CrisisCheckIn) =>
    api.post<{ success: boolean; check_in: SafetyEvent; message: string }>('/v1/crisis/check-in', checkIn),

  // Escalation & Guardians
  escalate: (request: EscalateRequest) =>
    api.post<{
      success: boolean;
      escalation: {
        escalation_id: number;
        level: string;
        actions_taken: string[];
        notifications_sent: number;
      };
      message: string;
    }>('/v1/crisis/escalate', request),

  getGuardians: () =>
    api.get<{ guardians: Guardian[]; total: number }>('/v1/crisis/guardians'),

  alertGuardian: (guardianId: string, message: string) =>
    api.post<{ success: boolean; message: string }>('/v1/crisis/guardians/alert', {
      guardian_id: guardianId,
      message,
    }),

  getEscalationStats: () =>
    api.get<{
      total_escalations: number;
      by_severity: Record<string, number>;
      last_escalation?: string;
    }>('/v1/crisis/escalations/stats'),

  // Resources & Support
  getResources: (countryCode: string = 'US') =>
    api.get<{ country: string; resources: CrisisResource[]; last_updated: string }>(
      '/v1/crisis/resources',
      { params: { country_code: countryCode } }
    ),

  getGroundingExercises: () =>
    api.get<{ exercises: GroundingExercise[]; total: number }>('/v1/crisis/grounding-exercises'),
};

// ────────────────────────────────────────────────────────────────────────────
// COMMONS (Publications, Attestations, Witnesses)
// ────────────────────────────────────────────────────────────────────────────

// Publication Types
export type PublicationType = 'reflection' | 'insight' | 'pattern' | 'proposal' | 'resource' | 'other';
export type PublicationVisibility = 'public' | 'commons' | 'private' | 'draft';

export interface Publication {
  publication_id: string;
  author_id: string;
  title: string;
  content: string;
  publication_type: PublicationType;
  visibility: PublicationVisibility;
  version: number;
  tags: string[];
  view_count: number;
  attestation_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PublicationCreate {
  title: string;
  content: string;
  publication_type: PublicationType;
  visibility?: PublicationVisibility;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface PublicationUpdate {
  title?: string;
  content?: string;
  visibility?: PublicationVisibility;
  tags?: string[];
}

export interface PublicationStats {
  total_publications: number;
  by_type: Record<string, number>;
  by_visibility: Record<string, number>;
  total_views: number;
  total_attestations: number;
}

// Attestation Types
export type AttestationType = 'verify' | 'endorse' | 'witness' | 'validate' | 'challenge' | 'question';
export type AttestationStatus = 'active' | 'verified' | 'rejected' | 'revoked';

export interface Attestation {
  attestation_id: string;
  attestor_id: string;
  target_id: string;
  target_type: string;
  attestation_type: AttestationType;
  content?: string;
  confidence: number;
  status: AttestationStatus;
  verified_by?: string;
  verified_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AttestationCreate {
  target_id: string;
  target_type: string;
  attestation_type: AttestationType;
  content?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface AttestationVerify {
  verifier_id: string;
  verified: boolean;
  notes?: string;
}

export interface AttestationStats {
  total_attestations: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  average_confidence: number;
  verification_rate: number;
}

// Witness Types
export type VerificationLevel = 'basic' | 'verified' | 'expert' | 'trusted';
export type WitnessStatus = 'active' | 'inactive' | 'suspended';

export interface Witness {
  witness_id: string;
  profile_id: string;
  expertise_areas: string[];
  verification_level: VerificationLevel;
  reputation_score: number;
  attestations_given: number;
  attestations_received: number;
  status: WitnessStatus;
  metadata?: Record<string, any>;
  registered_at: string;
  last_active_at?: string;
}

export interface WitnessRegister {
  expertise_areas: string[];
  verification_level?: VerificationLevel;
  metadata?: Record<string, any>;
}

export interface WitnessActivity {
  activity_id: string;
  witness_id: string;
  activity_type: string;
  target_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface WitnessStats {
  total_witnesses: number;
  by_level: Record<string, number>;
  by_status: Record<string, number>;
  average_reputation: number;
  total_activities: number;
}

// Commons API
export const commons = {
  // Publications
  createPublication: (data: PublicationCreate) =>
    api.post<{ publication: Publication; message: string }>('/v1/commons/publications', data),

  getPublication: (publicationId: string) =>
    api.get<{ publication: Publication }>(`/v1/commons/publications/${publicationId}`),

  listPublications: (params?: {
    author_id?: string;
    publication_type?: PublicationType;
    tags?: string[];
    limit?: number;
    offset?: number;
  }) =>
    api.get<{ publications: Publication[]; total: number; limit: number; offset: number }>(
      '/v1/commons/publications',
      { params }
    ),

  updatePublication: (publicationId: string, data: PublicationUpdate) =>
    api.put<{ publication: Publication; message: string }>(
      `/v1/commons/publications/${publicationId}`,
      data
    ),

  deletePublication: (publicationId: string) =>
    api.delete<{ success: boolean; message: string }>(`/v1/commons/publications/${publicationId}`),

  incrementViewCount: (publicationId: string) =>
    api.post<{ success: boolean }>(`/v1/commons/publications/${publicationId}/view`, {}),

  getPublicationStats: (publicationId: string) =>
    api.get<{
      views: number;
      attestations: number;
      version: number;
      last_viewed?: string;
    }>(`/v1/commons/publications/${publicationId}/stats`),

  getAllPublicationsStats: () =>
    api.get<PublicationStats>('/v1/commons/publications/stats'),

  // Attestations
  createAttestation: (data: AttestationCreate) =>
    api.post<{ attestation: Attestation; message: string }>('/v1/commons/attestations', data),

  getAttestation: (attestationId: string) =>
    api.get<{ attestation: Attestation }>(`/v1/commons/attestations/${attestationId}`),

  listAttestations: (params?: {
    target_id?: string;
    attestor_id?: string;
    attestation_type?: AttestationType;
    status?: AttestationStatus;
    limit?: number;
    offset?: number;
  }) =>
    api.get<{ attestations: Attestation[]; total: number; limit: number; offset: number }>(
      '/v1/commons/attestations',
      { params }
    ),

  verifyAttestation: (attestationId: string, data: AttestationVerify) =>
    api.post<{ attestation: Attestation; message: string }>(
      `/v1/commons/attestations/${attestationId}/verify`,
      data
    ),

  revokeAttestation: (attestationId: string, reason?: string) =>
    api.post<{ attestation: Attestation; message: string }>(
      `/v1/commons/attestations/${attestationId}/revoke`,
      { reason }
    ),

  getAttestationStats: (targetId: string) =>
    api.get<AttestationStats>(`/v1/commons/attestations/stats/${targetId}`),

  getAllAttestationsStats: () =>
    api.get<AttestationStats>('/v1/commons/attestations/stats'),

  // Witnesses
  registerWitness: (data: WitnessRegister) =>
    api.post<{ witness: Witness; message: string }>('/v1/commons/witnesses/register', data),

  getWitness: (witnessId: string) =>
    api.get<{ witness: Witness }>(`/v1/commons/witnesses/${witnessId}`),

  listWitnesses: (params?: {
    expertise_area?: string;
    status?: WitnessStatus;
    min_reputation?: number;
    limit?: number;
    offset?: number;
  }) =>
    api.get<{ witnesses: Witness[]; total: number; limit: number; offset: number }>(
      '/v1/commons/witnesses',
      { params }
    ),

  updateWitnessReputation: (witnessId: string, delta: number, reason: string) =>
    api.post<{ witness: Witness; message: string }>(
      `/v1/commons/witnesses/${witnessId}/reputation`,
      { reputation_delta: delta, reason }
    ),

  recordWitnessActivity: (
    witnessId: string,
    activityType: string,
    targetId?: string,
    metadata?: Record<string, any>
  ) =>
    api.post<{ activity: WitnessActivity; message: string }>(
      `/v1/commons/witnesses/${witnessId}/activity`,
      { activity_type: activityType, target_id: targetId, metadata }
    ),

  getWitnessStats: (witnessId: string) =>
    api.get<{
      attestations_given: number;
      attestations_received: number;
      reputation_score: number;
      recent_activities: WitnessActivity[];
    }>(`/v1/commons/witnesses/${witnessId}/stats`),

  getAllWitnessesStats: () =>
    api.get<WitnessStats>('/v1/commons/witnesses/stats'),
};

// ────────────────────────────────────────────────────────────────────────────
// FINDER (Constitutional Routing Intelligence)
// ────────────────────────────────────────────────────────────────────────────

export type Posture = 'unknown' | 'overwhelmed' | 'guarded' | 'grounded' | 'open' | 'exploratory';
export type FinderMode = 'first_mirror' | 'active' | 'manual' | 'random' | 'off';

export interface PostureState {
  declared: Posture;
  suggested?: Posture;
  declared_at?: string;
  suggested_at?: string;
  divergence_count: number;
}

export interface Door {
  node_id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  posture_match: number;
  view_count: number;
  last_viewed?: string;
}

export interface FinderConfig {
  mode: FinderMode;
  bandwidth_limit: number;
  blocked_nodes: string[];
}

export const finder = {
  getPosture: () =>
    api.get<PostureState>('/v1/finder/posture'),

  updatePosture: (declared: Posture) =>
    api.post<PostureState>('/v1/finder/posture', { declared }),

  recordLensUsage: (lensId: string, weight: number = 1.0) =>
    api.post<{ success: boolean }>('/v1/finder/lens-usage', { lens_id: lensId, weight }),

  getTPV: () =>
    api.get<{ tpv: number; lens_weights: Record<string, number>; updated_at: string }>(
      '/v1/finder/tpv'
    ),

  getDoors: (params?: { limit?: number; posture?: Posture }) =>
    api.get<{ doors: Door[]; total: number; posture: Posture }>('/v1/finder/doors', { params }),

  viewDoor: (nodeId: string) =>
    api.post<{ success: boolean }>(`/v1/finder/doors/${nodeId}/view`, {}),

  getGraph: () =>
    api.get<{
      nodes: Array<{ id: string; type: string; weight: number }>;
      edges: Array<{ source: string; target: string; weight: number }>;
    }>('/v1/finder/graph'),

  reportMistake: (data: {
    mistake_type: string;
    node_id: string;
    context?: string;
  }) =>
    api.post<{ success: boolean; message: string }>('/v1/finder/mistakes', data),

  getConfig: () =>
    api.get<FinderConfig>('/v1/finder/config'),

  updateConfig: (config: Partial<FinderConfig>) =>
    api.put<FinderConfig>('/v1/finder/config', config),

  getAsymmetry: (nodeId: string) =>
    api.get<{
      asymmetry_score: number;
      factors: Record<string, number>;
      recommendation: string;
    }>(`/v1/finder/asymmetry/${nodeId}`),
};

// ────────────────────────────────────────────────────────────────────────────
// IDENTITY (Identity Graph & Evolution)
// ────────────────────────────────────────────────────────────────────────────

export interface IdentityNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
}

export interface IdentityEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

export interface IdentityGraph {
  nodes: IdentityNode[];
  edges: IdentityEdge[];
  center?: string;
}

export interface Tension {
  name: string;
  pole_a: string;
  pole_b: string;
  current_position: number;
  strength: number;
}

export interface IdentityLoop {
  loop_id: string;
  nodes: string[];
  strength: number;
  pattern_type: string;
}

export const identity = {
  getGraph: (userId: string) =>
    api.get<IdentityGraph>(`/v1/identity/${userId}/graph`),

  getTensions: (userId: string) =>
    api.get<{ tensions: Tension[]; total: number }>(`/v1/identity/${userId}/tensions`),

  getLoops: (userId: string) =>
    api.get<{ loops: IdentityLoop[]; total: number }>(`/v1/identity/${userId}/loops`),

  getEvolution: (userId: string, params?: { days?: number }) =>
    api.get<{
      timeline: Array<{ date: string; snapshot: IdentityGraph }>;
      metrics: Record<string, number>;
    }>(`/v1/identity/${userId}/evolution`, { params }),
};

// ────────────────────────────────────────────────────────────────────────────
// EVOLUTION (Distributed Proposals & Voting)
// ────────────────────────────────────────────────────────────────────────────

export type ProposalType = 'pattern_add' | 'pattern_modify' | 'tension_add' | 'tension_modify' | 'lens_add' | 'lens_modify';
export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'implemented';
export type VoteChoice = 'for' | 'against' | 'abstain';

export interface Proposal {
  id: string;
  type: ProposalType;
  title: string;
  description: string;
  content: Record<string, any>;
  proposer_identity_id: string;
  status: ProposalStatus;
  voting_starts_at: string;
  voting_ends_at: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  approval_threshold: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Vote {
  vote_id: string;
  proposal_id: string;
  identity_id: string;
  choice: VoteChoice;
  reasoning?: string;
  cast_at: string;
}

export interface EvolutionVersion {
  version_id: string;
  version_number: string;
  changes: Array<{ type: string; description: string }>;
  rollout_percentage: number;
  status: string;
  created_at: string;
}

export const evolution = {
  createProposal: (data: {
    type: ProposalType;
    title: string;
    description: string;
    content: Record<string, any>;
    proposer_identity_id: string;
    metadata?: Record<string, any>;
  }) =>
    api.post<Proposal>('/v1/evolution/proposals', data),

  listProposals: (params?: {
    status?: ProposalStatus;
    type?: ProposalType;
    limit?: number;
    offset?: number;
  }) =>
    api.get<Proposal[]>('/v1/evolution/proposals', { params }),

  getProposal: (proposalId: string) =>
    api.get<Proposal>(`/v1/evolution/proposals/${proposalId}`),

  activateProposal: (proposalId: string) =>
    api.post<{ success: boolean; message: string }>(
      `/v1/evolution/proposals/${proposalId}/activate`,
      {}
    ),

  vote: (proposalId: string, data: { identity_id: string; choice: VoteChoice; reasoning?: string }) =>
    api.post<{ success: boolean; vote: Vote }>(`/v1/evolution/proposals/${proposalId}/vote`, data),

  getVotes: (proposalId: string) =>
    api.get<{ votes: Vote[]; total: number }>(`/v1/evolution/proposals/${proposalId}/votes`),

  createVersion: (data: {
    version_number: string;
    changes: Array<{ type: string; description: string }>;
    metadata?: Record<string, any>;
  }) =>
    api.post<EvolutionVersion>('/v1/evolution/versions', data),

  listVersions: (params?: { limit?: number; offset?: number }) =>
    api.get<EvolutionVersion[]>('/v1/evolution/versions', { params }),

  getActiveVersion: () =>
    api.get<EvolutionVersion>('/v1/evolution/versions/active'),

  rolloutVersion: (versionId: string, percentage: number) =>
    api.post<{ success: boolean; message: string }>(
      `/v1/evolution/versions/${versionId}/rollout`,
      { percentage }
    ),

  broadcastProposal: (proposalId: string) =>
    api.post<{ success: boolean; message: string }>(
      `/v1/evolution/proposals/${proposalId}/broadcast`,
      {}
    ),

  aggregateVotes: (proposalId: string) =>
    api.post<{ success: boolean; results: Record<string, number> }>(
      `/v1/evolution/proposals/${proposalId}/aggregate-votes`,
      {}
    ),

  getSyncStatus: () =>
    api.get<{ enabled: boolean; last_sync?: string; pending_proposals: number }>(
      '/v1/evolution/sync/status'
    ),

  enableSync: () =>
    api.post<{ success: boolean; message: string }>('/v1/evolution/sync/enable', {}),

  disableSync: () =>
    api.post<{ success: boolean; message: string }>('/v1/evolution/sync/disable', {}),

  getStats: () =>
    api.get<{
      total_proposals: number;
      active_proposals: number;
      total_votes: number;
      participation_rate: number;
    }>('/v1/evolution/stats'),
};

// ────────────────────────────────────────────────────────────────────────────
// PATTERNS (Pattern Recognition & Analysis)
// ────────────────────────────────────────────────────────────────────────────

export interface Pattern {
  pattern_id: string;
  type: string;
  name: string;
  description: string;
  confidence: number;
  frequency: number;
  first_detected: string;
  last_detected: string;
  nodes: string[];
}

export interface PatternEvolution {
  pattern_id: string;
  timeline: Array<{
    date: string;
    strength: number;
    occurrences: number;
  }>;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export const patterns = {
  getIdentityPatterns: (identityId: string) =>
    api.get<{ patterns: Pattern[]; total: number }>(`/v1/patterns/identity/${identityId}`),

  getPattern: (patternId: string) =>
    api.get<Pattern>(`/v1/patterns/${patternId}`),

  analyzePatterns: (identityId: string) =>
    api.post<{ patterns: Pattern[]; insights: string[] }>(
      `/v1/patterns/analyze/${identityId}`,
      {}
    ),

  getPatternEvolution: (patternId: string, params?: { days?: number }) =>
    api.get<PatternEvolution>(`/v1/patterns/${patternId}/evolution`, { params }),
};

// ────────────────────────────────────────────────────────────────────────────
// TENSIONS (Dialectical Tension Mapping)
// ────────────────────────────────────────────────────────────────────────────

export interface TensionState {
  tension_name: string;
  pole_a: string;
  pole_b: string;
  current_position: number;
  strength: number;
  stability: number;
  recent_movements: Array<{ date: string; position: number }>;
}

export interface TensionMapping {
  identity_id: string;
  tensions: TensionState[];
  tension_space: {
    dimensions: number;
    coordinates: Record<string, number>;
  };
}

export const tensions = {
  getIdentityTensions: (identityId: string) =>
    api.get<{ tensions: TensionState[]; total: number }>(
      `/v1/tensions/identity/${identityId}`
    ),

  getTension: (tensionName: string, params?: { identity_id?: string }) =>
    api.get<TensionState>(`/v1/tensions/tension/${tensionName}`, { params }),

  analyzeTensions: (identityId: string) =>
    api.post<{ tensions: TensionState[]; insights: string[] }>(
      `/v1/tensions/analyze/${identityId}`,
      {}
    ),

  getTensionMapping: (identityId: string) =>
    api.get<TensionMapping>(`/v1/tensions/mapping/${identityId}`),

  getSeedTensions: () =>
    api.get<{
      tensions: Array<{
        name: string;
        pole_a: string;
        pole_b: string;
        description: string;
      }>;
      total: number;
    }>('/v1/tensions/seed-tensions'),
};

// ────────────────────────────────────────────────────────────────────────────
// FORKS (Fork Management & Governance)
// ────────────────────────────────────────────────────────────────────────────

export type ForkStatus = 'active' | 'inactive' | 'merged';

export interface Fork {
  id: string;
  fork_id: string;
  parent_instance_id: string;
  fork_genesis_hash: string;
  reason: string;
  forked_at: string;
  amendments: string[];
  status: ForkStatus;
}

export interface ForkCreate {
  fork_id: string;
  parent_instance_id: string;
  reason: string;
  amendments?: string[];
}

export interface ForkComparison {
  fork_id: string;
  parent_instance_id: string;
  differences: Array<{
    category: string;
    description: string;
    impact: 'minor' | 'moderate' | 'major';
  }>;
  compatibility_score: number;
}

export const forks = {
  createFork: (data: ForkCreate) =>
    api.post<{ fork: Fork; message: string }>('/v1/governance/forks', data),

  listForks: (params?: {
    parent_instance_id?: string;
    status?: ForkStatus;
    limit?: number;
    offset?: number;
  }) =>
    api.get<{ forks: Fork[]; total: number }>('/v1/governance/forks', { params }),

  getFork: (forkId: string) =>
    api.get<{ fork: Fork }>(`/v1/governance/forks/${forkId}`),

  updateForkStatus: (forkId: string, status: ForkStatus) =>
    api.put<{ fork: Fork; message: string }>(`/v1/governance/forks/${forkId}/status`, { status }),

  compareForks: (forkId: string, targetId: string) =>
    api.get<ForkComparison>(`/v1/governance/forks/${forkId}/compare/${targetId}`),

  mergeFork: (forkId: string, data: { target_instance_id: string; merge_strategy: string }) =>
    api.post<{ success: boolean; merge_result: any; message: string }>(
      `/v1/governance/forks/${forkId}/merge`,
      data
    ),

  adoptFork: (forkId: string) =>
    api.post<{ success: boolean; message: string }>(`/v1/governance/forks/${forkId}/adopt`, {}),

  getForkStats: () =>
    api.get<{
      total_forks: number;
      active_forks: number;
      merged_forks: number;
      by_parent: Record<string, number>;
    }>('/v1/governance/forks/stats'),
};

// ────────────────────────────────────────────────────────────────────────────
// AUTH (Supabase integration)
// ────────────────────────────────────────────────────────────────────────────

export const auth = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_auth_token', token);
    }
  },

  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase_auth_token');
    }
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('supabase_auth_token');
    }
    return null;
  },
};

export default api;
