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
