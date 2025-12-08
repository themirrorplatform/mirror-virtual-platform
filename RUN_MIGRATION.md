# 🚀 Manual Migration Instructions

Since the Supabase CLI can't be installed via npm, run the migration manually:

## Quick Deploy (5 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/sql/new

### Step 2: Copy the Migration File
Open this file in VS Code:
```
C:\Users\ilyad\mirror-virtual-platform\supabase\migrations\001_mirror_core.sql
```

### Step 3: Paste and Run
1. Copy the entire contents (Ctrl+A, Ctrl+C)
2. Paste into the Supabase SQL Editor
3. Click **RUN** (or press Ctrl+Enter)

### Step 4: Verify Success
You should see output like:
```
Success. No rows returned
CREATE EXTENSION
CREATE TYPE
CREATE TYPE
CREATE TABLE
...
```

---

## What Gets Created

✅ **7 Enum Types**
- reflection_visibility (public, circle, private)
- reflection_tone (raw, processing, clear)
- mirrorback_source (ai, human)
- axis_origin (system_seed, llm_suggested, user_created)
- signal_type (view, respond, save, skip, mute_author)
- safety_severity (info, warning, critical)
- regression_type (loop, self_attack, judgment_spike, avoidance)

✅ **Core Tables**
- profiles (Surface Identity)
- reflections (Core Content)
- mirrorbacks (AI/Human Responses)

✅ **Identity Graph**
- identity_axes (e.g. 'wealth.story')
- identity_axis_values (specific beliefs)
- identity_snapshots (evolution over time)

✅ **Social Graph**
- follows (who follows whom)
- reflection_signals (view, save, skip tracking)
- feed_state (cursor-based pagination)

✅ **Intelligence Tables**
- bias_insights (dimension, direction, confidence)
- safety_events (self-harm, harassment detection)
- regression_markers (loop, self_attack tracking)

---

## After Running the Migration

Check your tables in Supabase:
https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/editor

You should see **16 new tables** with full RLS policies!

---

## Next Steps

Once the migration runs successfully:
1. ✅ Verify tables exist in Database → Tables
2. ✅ Check RLS policies are enabled
3. ✅ Tell me "migration done" and we'll configure core-api + mirrorx-engine

---

## Alternative: Use psql (Advanced)

If you have PostgreSQL client installed:

1. Get your database URL:
   https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/settings/database

2. Run:
   ```powershell
   psql "your_database_url_here" -f "C:\Users\ilyad\mirror-virtual-platform\supabase\migrations\001_mirror_core.sql"
   ```

---

**Recommendation:** Use the SQL Editor method (Step 1-3 above). It's the fastest and most reliable!
