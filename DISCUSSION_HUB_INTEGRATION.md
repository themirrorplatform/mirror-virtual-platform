# Mirror Discussion Hub Integration Analysis

## 🔍 Current Status: SCHEMA MISMATCH - REQUIRES MIGRATION

The mirror-discussion-hub frontend is currently configured for a **different database schema** than the comprehensive Mirror core schema we just integrated.

---

## Schema Comparison

### Current Discussion Hub Schema (OLD)

Based on `mirrorApi.ts`, the discussion hub expects:

**Tables:**
- `reflections` - with columns: `id`, `title`, `content`, `tags`, `quote`, `video_url`, `author` (FK to profiles), `created_at`
- `mirrorbacks` - with columns: `id`, `content`, `reflection_id`, `author` (FK to profiles), `parent_id`, `created_at`
- `profiles` - with columns: `id`, `display_name`, `avatar_url`, `role`, `bio`, `banner_url`
- `reactions` - with columns: `reflection_id`, `user_id`, `kind` (reflect/appreciate/challenge/save)
- `wishlists` - with columns: `id`, `title`, `description`, `status`, `author`, `created_at`
- `wishlist_votes` - with columns: `wishlist_id`, `user_id`
- `events` - with columns: `id`, `title`, `description`, `starts_at`, `timezone`, `join_url`, `banner_url`
- `event_rsvps` - with columns: `event_id`, `user_id`
- `points` - with columns: `user_id`, `delta`, `reason`
- `follows` - with columns: `follower`, `followee`
- `profile_stats` - view/table for user statistics
- `leaderboard` - view/table for top users
- `checklist_items` - with columns: `item_key`, `sort`
- `checklist_progress` - with columns: `user_id`, `item_key`, `done`, `completed_at`

**Supabase Project:**
- URL: `https://enfjnqfppfhofredyxyg.supabase.co`
- Different from mirror-virtual-platform project

### Mirror Core Schema (NEW)

From `001_mirror_core.sql`:

**Tables:**
- `profiles` - with columns: `id`, `display_name`, `bio`, `avatar_url`, `banner_url`, `role`, `is_admin`, `created_at`, `updated_at`
- `reflections` - with columns: `id`, `author_id`, `body`, `lens_key`, `tone`, `visibility`, `metadata`, `created_at`
- `mirrorbacks` - with columns: `id`, `reflection_id`, `responder_id`, `body`, `tone`, `source`, `metadata`, `created_at`
- `identity_axes` - Identity graph dimensions
- `identity_axis_values` - Belief states
- `identity_snapshots` - Evolution tracking
- `follows` - with columns: `follower_id`, `followed_id`, `created_at`
- `reflection_signals` - Algorithm fuel (view/respond/save/skip)
- `feed_state` - Personalized feed state
- `bias_insights` - Cognitive bias tracking
- `safety_events` - Crisis detection log
- `regression_markers` - Loop/pattern detection

**Supabase Project:**
- URL: `https://bfctvwjxlfkzeahmscbe.supabase.co`
- Core platform project

---

## Key Differences

### 1. **Reflections Table**

| Field | Discussion Hub | Mirror Core | Status |
|-------|----------------|-------------|--------|
| Primary key | `id` | `id` | ✅ Match |
| Author FK | `author` | `author_id` | ⚠️ Rename needed |
| Content | `content` | `body` | ⚠️ Rename needed |
| Title | `title` | ❌ Missing | ⚠️ Store in metadata |
| Tags | `tags` (array) | ❌ Missing | ⚠️ Store in metadata |
| Quote | `quote` | ❌ Missing | ⚠️ Store in metadata |
| Video | `video_url` | ❌ Missing | ⚠️ Store in metadata |
| Lens | ❌ Missing | `lens_key` | ✅ Optional |
| Tone | ❌ Missing | `tone` | ✅ New feature |
| Visibility | ❌ Missing | `visibility` | ✅ New feature |
| Metadata | ❌ Missing | `metadata` (jsonb) | ✅ Can store title/tags/quote/video |

### 2. **Mirrorbacks Table**

| Field | Discussion Hub | Mirror Core | Status |
|-------|----------------|-------------|--------|
| Primary key | `id` | `id` | ✅ Match |
| Reflection FK | `reflection_id` | `reflection_id` | ✅ Match |
| Author FK | `author` | `responder_id` | ⚠️ Rename needed |
| Content | `content` | `body` | ⚠️ Rename needed |
| Parent | `parent_id` | ❌ Missing | ⚠️ Nested threads not in core |
| Tone | ❌ Missing | `tone` | ✅ New feature |
| Source | ❌ Missing | `source` (ai/human) | ✅ New feature |
| Metadata | ❌ Missing | `metadata` (jsonb) | ✅ Can store parent_id |

### 3. **Profiles Table**

| Field | Discussion Hub | Mirror Core | Status |
|-------|----------------|-------------|--------|
| All fields | Match | Match | ✅ Compatible |

### 4. **Follows Table**

| Field | Discussion Hub | Mirror Core | Status |
|-------|----------------|-------------|--------|
| Follower | `follower` | `follower_id` | ⚠️ Rename needed |
| Followed | `followee` | `followed_id` | ⚠️ Rename needed |

### 5. **Missing Tables in Mirror Core**

- ❌ `reactions` - Discussion hub feature (reflect/appreciate/challenge/save)
- ❌ `wishlists` - Feature request voting
- ❌ `wishlist_votes` - Wishlist voting
- ❌ `events` - Event management
- ❌ `event_rsvps` - Event RSVPs
- ❌ `points` - Gamification system
- ❌ `profile_stats` - User statistics view
- ❌ `leaderboard` - Top users ranking
- ❌ `checklist_items` - Onboarding checklist
- ❌ `checklist_progress` - User checklist progress

### 6. **New Tables in Mirror Core** (Not in Discussion Hub)

- ✅ `identity_axes` - Identity graph (MirrorX AI)
- ✅ `identity_axis_values` - Belief states (MirrorX AI)
- ✅ `identity_snapshots` - Evolution tracking (MirrorX AI)
- ✅ `reflection_signals` - Algorithm fuel
- ✅ `feed_state` - Personalized feed
- ✅ `bias_insights` - Cognitive bias tracking
- ✅ `safety_events` - Crisis detection
- ✅ `regression_markers` - Loop detection

---

## Integration Options

### Option 1: Migrate Discussion Hub to Mirror Core Schema (RECOMMENDED)

**Pros:**
- Single unified schema
- Access to MirrorX AI features (identity graph, evolution, bias insights)
- Cleaner data model with `metadata` jsonb for extensibility
- Better separation of concerns (reflections vs social features)

**Cons:**
- Requires updating frontend API calls
- Need to add missing social tables (reactions, wishlists, events, points)
- Migration of existing data (if any)

**Steps:**
1. Add social feature tables to Mirror Core schema
2. Create migration SQL to extend 001_mirror_core.sql
3. Update `mirrorApi.ts` to use new field names
4. Update React components to use `body` instead of `content`, etc.
5. Store title/tags/quote/video in `metadata` jsonb

### Option 2: Keep Separate Schemas

**Pros:**
- No immediate changes needed
- Discussion hub continues working as-is

**Cons:**
- Two separate databases
- No access to MirrorX AI features from discussion hub
- Data duplication if users exist in both
- Complex integration later

---

## Recommended Migration Plan

### Phase 1: Extend Mirror Core Schema (Add Social Features)

Create `002_social_features.sql`:

```sql
-- Reactions (from discussion hub)
CREATE TABLE IF NOT EXISTS public.reactions (
  id            bigserial PRIMARY KEY,
  reflection_id bigint NOT NULL REFERENCES public.reflections(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('reflect', 'appreciate', 'challenge', 'save')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reflection_id, user_id, kind)
);

-- Wishlists (feature requests)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id          bigserial PRIMARY KEY,
  author_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'planned', 'in_progress', 'completed', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Wishlist votes
CREATE TABLE IF NOT EXISTS public.wishlist_votes (
  wishlist_id bigint NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (wishlist_id, user_id)
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id          bigserial PRIMARY KEY,
  title       text NOT NULL,
  description text,
  starts_at   timestamptz NOT NULL,
  timezone    text NOT NULL DEFAULT 'UTC',
  join_url    text,
  banner_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id   bigint NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Points (gamification)
CREATE TABLE IF NOT EXISTS public.points (
  id         bigserial PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delta      integer NOT NULL,
  reason     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profile stats (materialized view or function)
CREATE OR REPLACE VIEW public.profile_stats AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT r.id) AS reflection_count,
  COUNT(DISTINCT m.id) AS mirrorback_count,
  COALESCE(SUM(pt.delta), 0) AS total_points
FROM public.profiles p
LEFT JOIN public.reflections r ON r.author_id = p.id
LEFT JOIN public.mirrorbacks m ON m.responder_id = p.id
LEFT JOIN public.points pt ON pt.user_id = p.id
GROUP BY p.id;

-- Leaderboard (materialized view)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  user_id,
  total_points AS score
FROM public.profile_stats
ORDER BY total_points DESC;

-- Checklist items
CREATE TABLE IF NOT EXISTS public.checklist_items (
  item_key text PRIMARY KEY,
  label    text NOT NULL,
  sort     integer NOT NULL DEFAULT 0
);

-- Checklist progress
CREATE TABLE IF NOT EXISTS public.checklist_progress (
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_key     text NOT NULL REFERENCES public.checklist_items(item_key) ON DELETE CASCADE,
  done         boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  PRIMARY KEY (user_id, item_key)
);

-- RLS policies for all new tables...
-- (Similar pattern to existing tables)
```

### Phase 2: Update mirrorApi.ts

Update field names and add metadata handling:

```typescript
// OLD
const { data } = await supabase
  .from("reflections")
  .insert({
    author: userId,
    title: params.title,
    content: params.content,
    tags: params.tags ?? [],
    quote: params.quote ?? null,
    video_url: params.video_url ?? null,
  });

// NEW
const { data } = await supabase
  .from("reflections")
  .insert({
    author_id: userId,
    body: params.content,
    visibility: 'public',
    tone: 'raw',
    metadata: {
      title: params.title,
      tags: params.tags ?? [],
      quote: params.quote ?? null,
      video_url: params.video_url ?? null,
    }
  });
```

### Phase 3: Update React Components

Update components to read from metadata:

```typescript
// ReflectionCard.tsx
interface ReflectionCardProps {
  id: number;
  author: { name: string; role: string; avatar: string; id?: string };
  // OLD: title: string;
  // OLD: content: string;
  // OLD: tags?: string[];
  
  // NEW: Read from body and metadata
  body: string;
  metadata: {
    title?: string;
    tags?: string[];
    quote?: string;
    video_url?: string;
  };
  // ... rest
}
```

### Phase 4: Add MirrorX AI Integration

Connect discussion hub to MirrorX Engine for AI-powered mirrorbacks:

```typescript
// In mirrorApi.ts
export const Reflections = {
  async create(userId: string, params: any) {
    // 1. Save reflection to Supabase
    const { data: reflection, error } = await supabase
      .from("reflections")
      .insert({...})
      .single();
    
    if (error) return { data: null, error };
    
    // 2. Call MirrorX Engine for AI mirrorback
    try {
      const response = await fetch('http://localhost:8001/api/mirrorx/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          reflection_text: params.content,
        })
      });
      
      const { mirrorback, identity_delta_summary } = await response.json();
      
      // AI mirrorback automatically saved by MirrorX Engine
      // Return reflection with additional context
      return {
        data: {
          ...reflection,
          ai_mirrorback: mirrorback,
          identity_insight: identity_delta_summary,
        },
        error: null
      };
    } catch (err) {
      console.error('MirrorX Engine error:', err);
      // Still return reflection even if AI fails
      return { data: reflection, error: null };
    }
  }
};
```

---

## Immediate Action Items

### 🔴 CRITICAL: Decide on Integration Approach

**Question:** Do you want to:

1. **Merge** discussion-hub schema into mirror-virtual-platform? (Single unified database)
2. **Keep separate** and build API bridge between them? (Two databases, cross-communicate)
3. **Migrate** discussion-hub data to mirror-virtual-platform and sunset old schema?

### 🟡 MEDIUM: Current State Analysis

**Discussion Hub:**
- Running on separate Supabase project: `enfjnqfppfhofredyxyg`
- Has production data/users? (Unknown)
- Schema mismatch with Mirror Core

**Mirror Virtual Platform:**
- Running on Supabase project: `bfctvwjxlfkzeahmscbe`
- Fresh schema ready to deploy (001_mirror_core.sql)
- Has MirrorX AI integration

### 🟢 LOW: Feature Gaps

**Missing in Mirror Core (from Discussion Hub):**
- Reactions (reflect/appreciate/challenge/save)
- Wishlists (feature requests)
- Events (community gatherings)
- Points/Leaderboard (gamification)
- Checklist (onboarding)
- Nested mirrorback threads (parent_id)

**Missing in Discussion Hub (from Mirror Core):**
- Identity graph (axes, values, snapshots)
- Evolution detection
- Bias insights
- Safety events
- Regression markers
- Reflection signals (algorithm)
- Feed state (personalization)

---

## Recommendations

### For Unified Platform (BEST OPTION)

1. **Run 001_mirror_core.sql** on mirror-virtual-platform Supabase project
2. **Create 002_social_features.sql** to add discussion hub features
3. **Update discussion-hub .env.local** to point to mirror-virtual-platform URL
4. **Update mirrorApi.ts** to use Mirror Core field names
5. **Update React components** to read from metadata jsonb
6. **Add MirrorX Engine integration** for AI mirrorbacks
7. **Migrate existing data** from old project (if needed)

**Timeline:** 2-3 days of focused work

**Benefits:**
- Single source of truth
- Full MirrorX AI features available
- Unified user base
- Easier maintenance

### For Separate Projects (QUICK OPTION)

1. **Keep discussion-hub as-is** on separate Supabase
2. **Add API bridge** to call MirrorX Engine from discussion-hub
3. **Sync users** between projects via webhook/API
4. **Share auth tokens** if using same Supabase org

**Timeline:** 1 day of configuration

**Benefits:**
- No immediate changes
- Discussion hub works today
- Can migrate later

**Drawbacks:**
- Data duplication
- Complex cross-project queries
- Two databases to maintain

---

## Next Steps

1. **Decide:** Merge or keep separate?
2. **If merge:** I'll create 002_social_features.sql migration
3. **If separate:** I'll create API bridge documentation
4. **Update:** mirrorApi.ts to match chosen approach
5. **Test:** End-to-end reflection → mirrorback flow

---

## Status Summary

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Discussion Hub Frontend | ✅ Complete | Update API calls if merging |
| Discussion Hub Schema | ⚠️ Separate | Decide: merge or bridge |
| Mirror Core Schema | ✅ Ready | Run 001_mirror_core.sql |
| MirrorX Engine | ✅ Complete | Add to discussion hub |
| Social Features | ⚠️ Missing in Core | Create 002_social_features.sql |
| Identity Graph | ⚠️ Not in Hub | Add UI components |

---

**Recommendation:** Merge schemas for unified platform with full MirrorX AI capabilities.

Let me know your preference and I'll proceed with the integration! 🚀
