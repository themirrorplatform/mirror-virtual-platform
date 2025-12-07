/**
 * API Client for The Mirror Virtual Platform
 * Handles all communication with the Core API
 */
import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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
  next_cursor?: number;
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
};

// ────────────────────────────────────────────────────────────────────────────
// FEED
// ────────────────────────────────────────────────────────────────────────────

export const feed = {
  get: (limit = 20, cursor?: number) =>
    api.get<FeedResponse>('/feed', {
      params: { limit, cursor },
    }),

  getPublic: (limit = 20, cursor?: number, lens_key?: string) =>
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
// AUTH (placeholder - implement with Supabase)
// ────────────────────────────────────────────────────────────────────────────

export const auth = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },
};

export default api;
