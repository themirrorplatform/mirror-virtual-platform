# 🧠 MirrorX Engine Integration with Comprehensive Schema

## Overview

This document outlines the integration between the MirrorX AI engine and the comprehensive Mirror database schema.

---

## Database Schema Alignment

### Core Tables (Already Implemented in 001_mirror_core.sql)

✅ **profiles** - Surface identity
- Maps to old `mx_users` table
- Fields: id (uuid), display_name, bio, avatar_url, banner_url, role, is_admin

✅ **reflections** - Core content
- Maps to old `mx_reflections` table  
- Fields: id (bigserial), author_id (uuid), body (text), lens_key, tone, visibility, metadata

✅ **mirrorbacks** - AI/human responses
- Maps to old `mx_mirrorbacks` table
- Fields: id (bigserial), reflection_id, responder_id, body, tone, source, metadata

### Identity Graph Tables (NEW - Full Implementation)

✅ **identity_axes** - Identity dimensions (e.g., 'wealth.story', 'self.trust')
- Tracks all dimensions of identity exploration
- Fields: id, identity_id (uuid → profiles), axis_key, origin, label

✅ **identity_axis_values** - Specific beliefs/statements
- Maps to old `mx_belief_states` table
- Fields: id, axis_id, value, confidence, source_reflection_id

✅ **identity_snapshots** - Evolution over time
- Stores complete identity state at each reflection
- Fields: id, identity_id, snapshot_at, summary (jsonb with tensions, themes, loops)

### Social & Algorithm Tables (NEW)

✅ **follows** - Social graph
✅ **reflection_signals** - User engagement (view, save, skip, etc.)
✅ **feed_state** - Personalized feed cursor

### Intelligence Tables (NEW - Critical for MirrorX)

✅ **bias_insights** - Bias tracking (studied, not hidden)
- Fields: id, identity_id, reflection_id, dimension, direction, confidence, notes

✅ **safety_events** - Safety monitoring
- Fields: id, identity_id, reflection_id, category, severity, action_taken, metadata

✅ **regression_markers** - Growth pattern tracking
- Fields: id, identity_id, reflection_id, kind (loop, self_attack, judgment_spike, avoidance), description, severity

---

## Conductor Integration Points

### 1. Reflection Ingestion

**Endpoint:** `POST /api/mirrorx/reflect`

**Flow:**
```
User reflection 
  → Safety check (safety_events table)
  → Conductor 8-step pipeline
    1. Emotion scan (Hume) → Store in metadata
    2. Semantic parse (GPT) → identity_axis_values
    3. Identity merge (GPT) → identity_snapshots
    4. Logic map (Gemini) → Store contradictions in bias_insights
    5. Grounding (Perplexity) → metadata
    6. Tone decision → reflection.tone
    7. Mirrorback (Claude) → mirrorbacks table
    8a. Safety filter → safety_events if needed
    8b. Identity delta → Update identity_axes, identity_axis_values
  → Evolution detection → regression_markers
  → Response to user
```

### 2. Identity Graph Updates

**After each reflection:**

1. **Identity Delta Applied:**
   - New/updated `identity_axes` rows
   - New `identity_axis_values` rows
   - New `identity_snapshots` row with complete state

2. **Bias Detection:**
   - `bias_insights` rows for detected patterns
   - Dimension: 'political', 'self-worth', 'religious', etc.
   - Direction: 'self-blame', 'other-blame', 'absolutist', etc.

3. **Regression Tracking:**
   - `regression_markers` rows for loops, self-attacks
   - Links to specific reflections
   - Severity scoring (1-5)

### 3. Evolution Engine

**Detects:**
- **Growth:** Belief shifts, tension softening
- **Stagnation:** Repeated topics, flat emotions
- **Loops:** Recurring patterns (stored in `regression_markers`)
- **Regression:** Tension intensification
- **Breakthroughs:** Resolutions, reframings
- **Blind Spots:** Persistent contradictions (stored in `bias_insights`)

**Stores in:**
- `identity_snapshots.summary.evolution_state`
- `regression_markers` for loops/regressions
- `bias_insights` for blind spots

---

## Database.py Updates Needed

### Current State
- Uses old table names: `mx_users`, `mx_reflections`, `mx_mirrorbacks`, `mx_belief_states`
- Limited identity tracking
- No bias/safety/regression tables

### Required Changes

1. **Table Name Mapping:**
```python
# Old → New
mx_users → profiles
mx_reflections → reflections  
mx_mirrorbacks → mirrorbacks
mx_belief_states → identity_axis_values
```

2. **New Functions Needed:**
```python
def save_bias_insight(identity_id, reflection_id, dimension, direction, confidence)
def save_safety_event(identity_id, reflection_id, category, severity, action_taken)
def save_regression_marker(identity_id, reflection_id, kind, description, severity)
def get_identity_axes(identity_id) → List[IdentityAxis]
def update_identity_snapshot(identity_id, summary_jsonb)
```

3. **Identity Graph Integration:**
```python
# After conductor pipeline completes:
apply_identity_delta_to_db(
    supabase_client=supabase,
    reflection_id=reflection_id,
    user_id=user_id,
    identity_delta=conductor_result.identity_delta,
    bundle=conductor_result.bundle
)

# This should:
# 1. Insert/update identity_axes
# 2. Insert identity_axis_values
# 3. Create identity_snapshot
# 4. Store bias_insights if detected
# 5. Store safety_events if flagged
# 6. Store regression_markers if detected
```

---

## API Endpoints

### MirrorX Engine Routes

```python
# Main reflection endpoint (uses conductor)
POST /api/mirrorx/reflect
  Body: { user_id, reflection_text }
  Response: { reflection_id, mirrorback, tone, evolution_events, tensions, loops }

# Identity graph query
GET /api/mirrorx/identity/{user_id}
  Response: { axes, snapshots, recent_evolution }

# Evolution timeline
GET /api/mirrorx/evolution/{user_id}
  Response: { growth_events, loop_events, breakthrough_events, blind_spots }

# Regression analysis
GET /api/mirrorx/regression/{user_id}
  Response: { loops, self_attacks, judgment_spikes, avoidance_patterns }

# Bias insights
GET /api/mirrorx/bias/{user_id}
  Response: { dimensions, directions, confidence_levels }

# User history (enhanced)
GET /api/mirrorx/history/{user_id}
  Response: { reflections, mirrorbacks, identity_evolution, themes }
```

---

## Environment Variables Required

```env
# Supabase (already configured)
SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# AI Providers (for conductor)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=pplx-...
HUME_API_KEY=... (optional, has fallback)

# Frontend
FRONTEND_ORIGIN=http://localhost:3000
```

---

## Next Steps

1. ✅ Run migration: `001_mirror_core.sql` in Supabase SQL Editor
2. 🔄 Update `mirrorx-engine/app/database.py` to use new table names
3. 🔄 Add new database functions for bias/safety/regression
4. 🔄 Create API routes in `mirrorx-engine/app/main.py`
5. 🔄 Configure `.env` with AI provider keys
6. 🔄 Test full pipeline with sample reflection
7. 🔄 Connect `core-api` to call `mirrorx-engine` endpoints

---

## Testing Checklist

- [ ] User can create reflection via POST /api/mirrorx/reflect
- [ ] Conductor pipeline completes all 8 steps
- [ ] Identity graph updates in database (identity_axes, identity_axis_values, identity_snapshots)
- [ ] Bias insights detected and stored
- [ ] Regression markers tracked for loops
- [ ] Safety events logged if needed
- [ ] Evolution events returned in response
- [ ] Frontend receives mirrorback with context

---

**Status:** Ready for migration run + database.py updates
