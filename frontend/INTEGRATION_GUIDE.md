# Mirror Virtual Platform - Integration Guide

## Table of Contents

1. [Project Setup](#project-setup)
2. [Supabase Configuration](#supabase-configuration)
3. [Authentication Flow](#authentication-flow)
4. [Data Fetching Patterns](#data-fetching-patterns)
5. [Real-time Updates](#real-time-updates)
6. [Offline Support](#offline-support)
7. [State Management](#state-management)
8. [API Integration](#api-integration)

---

## Project Setup

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Python 3.10+ (for backend services)
- PostgreSQL 14+ (provided by Supabase)

### Installation

```bash
# Frontend
cd frontend
npm install

# Backend (Core API)
cd ../core-api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Backend (MirrorX Engine)
cd ../mirrorx-engine
pip install -r requirements.txt
```

### Environment Configuration

Create `.env.local` in frontend directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MIRRORX_URL=http://localhost:8001

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

Create `.env` in core-api directory:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:54321/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# AI Services
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Environment
ENVIRONMENT=development
LOG_LEVEL=DEBUG
```

---

## Supabase Configuration

### Initialize Supabase Client

Create `frontend/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Singleton pattern for SSR
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = supabase;
  return supabaseInstance;
};
```

### Database Types

Generate TypeScript types from Supabase schema:

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

### Run Migrations

```bash
cd supabase

# Apply all migrations
supabase db push

# Or manually via SQL
psql $DATABASE_URL -f migrations/001_mirror_core.sql
psql $DATABASE_URL -f migrations/002_reflection_intelligence.sql
psql $DATABASE_URL -f migrations/003_mirrorx_complete.sql
```

---

## Authentication Flow

### Sign Up

```typescript
// frontend/src/lib/auth.ts
import { supabase } from './supabase';

export async function signUp(email: string, password: string, username: string) {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: username
      }
    }
  });

  if (authError) throw authError;

  // 2. Create user profile (triggered by database trigger)
  // See supabase/migrations/001_mirror_core.sql for handle_new_user() function

  return authData;
}
```

### Sign In

```typescript
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  return data;
}
```

### Auth Context

```typescript
// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUp: async (email, password, username) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Protected Routes

```typescript
// frontend/src/components/ProtectedRoute.tsx
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

---

## Data Fetching Patterns

### React Query Setup

```typescript
// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true
    }
  }
});
```

### Query Hooks

```typescript
// frontend/src/hooks/useReflections.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ReflectionData } from '@/components/ReflectionCard';

export function useReflections(filters?: {
  visibility?: 'public' | 'circle' | 'private';
  tone?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['reflections', filters],
    queryFn: async () => {
      let query = supabase
        .from('reflections')
        .select(`
          *,
          user:users!reflections_user_id_fkey(
            username,
            avatar_url
          ),
          mirrorback:mirrorbacks(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.visibility) {
        query = query.eq('visibility', filters.visibility);
      }

      if (filters?.tone) {
        query = query.eq('tone', filters.tone);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ReflectionData[];
    }
  });
}

export function useCreateReflection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reflection: {
      content: string;
      tone: string;
      visibility: string;
    }) => {
      const { data, error } = await supabase
        .from('reflections')
        .insert([reflection])
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
    }
  });
}
```

### Pagination

```typescript
// frontend/src/hooks/useInfiniteReflections.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export function useInfiniteReflections() {
  return useInfiniteQuery({
    queryKey: ['reflections', 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from('reflections')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        reflections: data,
        nextCursor: data.length === PAGE_SIZE ? pageParam + 1 : undefined
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
}

// Usage in component
function FeedList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteReflections();

  const reflections = data?.pages.flatMap(page => page.reflections) ?? [];

  return (
    <>
      {reflections.map(reflection => (
        <ReflectionCard key={reflection.id} reflection={reflection} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </>
  );
}
```

---

## Real-time Updates

### Supabase Realtime Setup

```typescript
// frontend/src/hooks/useRealtimeReflections.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeReflections() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to new reflections
    const channel: RealtimeChannel = supabase
      .channel('reflections-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reflections'
        },
        (payload) => {
          console.log('New reflection:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['reflections'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reflections'
        },
        (payload) => {
          console.log('Updated reflection:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['reflections', payload.new.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

### Realtime Voting Updates

```typescript
// frontend/src/hooks/useRealtimeVoting.ts
export function useRealtimeVoting(proposalId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`votes-${proposalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `proposal_id=eq.${proposalId}`
        },
        () => {
          // Refetch vote counts
          queryClient.invalidateQueries({ queryKey: ['votes', proposalId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [proposalId, queryClient]);
}
```

### Presence (Online Users)

```typescript
// frontend/src/hooks/usePresence.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PresenceState {
  [key: string]: {
    user_id: string;
    username: string;
    online_at: string;
  }[];
}

export function usePresence(room: string = 'global') {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceState>({});

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`presence-${room}`, {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: user.user_metadata.username,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user, room]);

  const userCount = Object.keys(onlineUsers).length;

  return { onlineUsers, userCount };
}
```

---

## Offline Support

### Service Worker Registration

```typescript
// frontend/src/lib/serviceWorker.ts
export function register() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
```

### Offline Queue

```typescript
// frontend/src/lib/offlineQueue.ts
interface QueuedAction {
  id: string;
  action: string;
  payload: any;
  timestamp: string;
  retries: number;
}

class OfflineQueue {
  private readonly STORAGE_KEY = 'mirror_offline_queue';
  private readonly MAX_RETRIES = 3;

  add(action: string, payload: any): string {
    const queue = this.getQueue();
    const id = `${Date.now()}-${Math.random()}`;

    queue.push({
      id,
      action,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0
    });

    this.saveQueue(queue);
    return id;
  }

  async processQueue() {
    if (!navigator.onLine) return;

    const queue = this.getQueue();
    const results = [];

    for (const item of queue) {
      try {
        await this.processItem(item);
        results.push({ id: item.id, success: true });
      } catch (error) {
        item.retries++;
        if (item.retries >= this.MAX_RETRIES) {
          console.error('Max retries reached for:', item);
          results.push({ id: item.id, success: false, error });
        } else {
          results.push({ id: item.id, success: false, retry: true });
        }
      }
    }

    // Remove successful items
    const newQueue = queue.filter(
      (item) => !results.find((r) => r.id === item.id && r.success)
    );

    this.saveQueue(newQueue);
    return results;
  }

  private async processItem(item: QueuedAction) {
    const { action, payload } = item;

    switch (action) {
      case 'createReflection':
        return await supabase.from('reflections').insert([payload]);
      case 'updateProfile':
        return await supabase.from('users').update(payload).eq('id', payload.id);
      case 'vote':
        return await supabase.from('votes').insert([payload]);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private getQueue(): QueuedAction[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private saveQueue(queue: QueuedAction[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
  }

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const offlineQueue = new OfflineQueue();

// Process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineQueue.processQueue();
  });
}
```

### Offline-aware Hooks

```typescript
// frontend/src/hooks/useOfflineAwareMutation.ts
import { useMutation } from '@tanstack/react-query';
import { offlineQueue } from '@/lib/offlineQueue';
import { useToast } from '@/components/ui/use-toast';

export function useOfflineAwareMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: any) => void;
    offlineAction?: string;
  }
) {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (!navigator.onLine && options?.offlineAction) {
        // Queue for later
        offlineQueue.add(options.offlineAction, variables);
        toast({
          title: 'Offline',
          description: 'Your action has been queued and will sync when online.'
        });
        throw new Error('QUEUED_OFFLINE');
      }

      return mutationFn(variables);
    },
    onSuccess: options?.onSuccess,
    onError: (error: any) => {
      if (error.message === 'QUEUED_OFFLINE') {
        // Already handled, don't show error
        return;
      }
      options?.onError?.(error);
    }
  });
}
```

---

## State Management

### Zustand Stores

```typescript
// frontend/src/stores/postureStore.ts
import create from 'zustand';
import { persist } from 'zustand/middleware';

interface PostureState {
  declared: string;
  suggested: string;
  confidence: number;
  reasoning: string;
  last_updated: string;
  setPosture: (posture: string) => void;
  setSuggested: (posture: string, reasoning: string, confidence: number) => void;
}

export const usePostureStore = create<PostureState>()(
  persist(
    (set) => ({
      declared: 'unknown',
      suggested: 'unknown',
      confidence: 0,
      reasoning: '',
      last_updated: new Date().toISOString(),
      setPosture: (posture) =>
        set({
          declared: posture,
          last_updated: new Date().toISOString()
        }),
      setSuggested: (posture, reasoning, confidence) =>
        set({
          suggested: posture,
          reasoning,
          confidence,
          last_updated: new Date().toISOString()
        })
    }),
    {
      name: 'mirror-posture-storage'
    }
  )
);
```

---

## API Integration

### API Client

```typescript
// frontend/src/lib/api.ts
import { supabase } from './supabase';

class MirrorAPI {
  private async getAuthHeaders() {
    const session = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session.data.session?.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  async getReflections(filters?: any) {
    let query = supabase.from('reflections').select('*');

    if (filters?.visibility) {
      query = query.eq('visibility', filters.visibility);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  }

  async createReflection(reflection: any) {
    const { data, error } = await supabase
      .from('reflections')
      .insert([reflection])
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  // MirrorX Engine calls
  async requestMirrorback(reflectionId: string) {
    const headers = await this.getAuthHeaders();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MIRRORX_URL}/mirrorback`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ reflection_id: reflectionId })
      }
    );

    if (!response.ok) throw new Error('Mirrorback request failed');

    return response.json();
  }
}

export const api = new MirrorAPI();
```

---

**Next**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for production deployment configuration.
