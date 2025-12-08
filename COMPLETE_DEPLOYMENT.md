# Mirror Virtual Platform - Complete Deployment Guide

## 🎯 What You're Building

A **social media platform** with **MirrorX AI** integration:

- **Discussion Hub** → Reflections, reactions, wishlists, events, leaderboard
- **MirrorX AI** → Identity graph, evolution tracking, bias insights, loop detection
- **Unified Platform** → Single database, seamless AI integration

---

## 📋 Prerequisites

1. **Supabase Account** - https://supabase.com
2. **Node.js 18+** and npm
3. **Python 3.11+** and pip
4. **AI Provider API Keys**:
   - Anthropic (Claude)
   - OpenAI (GPT-4)
   - Google (Gemini)
   - Perplexity
   - Hume (optional)

---

## 🗄️ Step 1: Database Setup

### 1.1 Run Core Schema Migration

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/sql/new
   ```

2. Copy and paste `supabase/migrations/001_mirror_core.sql`

3. Click **Run**

4. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

   Expected tables (16):
   - bias_insights
   - feed_state
   - follows
   - identity_axes
   - identity_axis_values
   - identity_snapshots
   - mirrorbacks
   - profiles
   - reflection_signals
   - reflections
   - regression_markers
   - safety_events

### 1.2 Run Social Features Migration

1. Open Supabase SQL Editor again

2. Copy and paste `supabase/migrations/002_social_features.sql`

3. Click **Run**

4. Verify new tables created (10 more):
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('reactions', 'wishlists', 'wishlist_votes', 'events', 'event_rsvps', 'points', 'checklist_items', 'checklist_progress')
   ORDER BY table_name;
   ```

5. Verify views created:
   ```sql
   SELECT table_name FROM information_schema.views 
   WHERE table_schema = 'public';
   ```

   Expected views:
   - profile_stats
   - leaderboard

---

## ⚙️ Step 2: Environment Configuration

### 2.1 Frontend (.env.local)

Create `frontend/.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-settings>

# MirrorX Engine
VITE_MIRRORX_ENGINE_URL=http://localhost:8001
```

### 2.2 MirrorX Engine (.env)

Create `mirrorx-engine/.env`:

```bash
# Database
SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
SUPABASE_KEY=<your-service-role-key-from-supabase-settings>

# AI Providers (5 workers)
ANTHROPIC_API_KEY=sk-ant-...      # Claude (Voice/Mirrorback)
OPENAI_API_KEY=sk-...              # GPT-4 (Scribe/Transcription)
GOOGLE_API_KEY=...                 # Gemini (Logician/Structure)
PERPLEXITY_API_KEY=...            # Perplexity (Grounder/Facts)
HUME_API_KEY=...                  # Hume (Sensor/Emotion) - Optional

# Frontend CORS
FRONTEND_ORIGIN=http://localhost:3000
```

### 2.3 Core API (.env)

Create `core-api/.env`:

```bash
# Database
SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
SUPABASE_KEY=<your-service-role-key-from-supabase-settings>

# MirrorX Engine
MIRRORX_ENGINE_URL=http://localhost:8001
```

---

## 📦 Step 3: Install Dependencies

### 3.1 MirrorX Engine

```powershell
cd mirrorx-engine
pip install -r requirements.txt
```

### 3.2 Core API

```powershell
cd core-api
pip install -r requirements.txt
```

### 3.3 Frontend

```powershell
cd frontend
npm install
```

---

## 🚀 Step 4: Start Services

### Terminal 1: MirrorX Engine (Port 8001)

```powershell
cd mirrorx-engine
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Verify:** Open http://localhost:8001/docs
- Should see Swagger UI with all MirrorX endpoints

### Terminal 2: Core API (Port 8000)

```powershell
cd core-api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify:** Open http://localhost:8000/docs

### Terminal 3: Frontend (Port 3000)

```powershell
cd frontend
npm run dev
```

**Verify:** Open http://localhost:3000
- Should see Mirror Virtual Platform interface

---

## 🧪 Step 5: Test the Platform

### 5.1 Health Checks

```powershell
# MirrorX Engine
curl http://localhost:8001/api/mirrorx/health

# Core API
curl http://localhost:8000/health
```

### 5.2 Create Test User

1. Open http://localhost:3000
2. Enter email in sign-in box
3. Check email for magic link
4. Click link to complete sign-in

### 5.3 Complete Profile

1. Click profile icon
2. Add display name, bio, avatar
3. Save profile

### 5.4 Post First Reflection

1. Click "Share Reflection" button
2. Write reflection content (e.g., "I'm excited to build this platform but worried about the complexity")
3. Optionally add title and tags
4. Submit

**Expected Result:**
- Reflection appears in feed
- AI mirrorback generated within seconds
- Points awarded automatically
- Checklist progress updated

### 5.5 Verify MirrorX AI Features

**Identity Graph:**
```powershell
$userId = "YOUR_USER_ID_HERE"
curl http://localhost:8001/api/mirrorx/identity/$userId
```

Expected response:
```json
{
  "user_id": "...",
  "snapshot": {
    "tensions": ["growth_vs_safety"],
    "themes": ["excitement", "worry", "complexity"],
    "loops": [],
    "beliefs": [...]
  },
  "has_data": true
}
```

**Evolution Timeline:**
```powershell
curl http://localhost:8001/api/mirrorx/evolution/$userId
```

**Bias Insights:**
```powershell
curl http://localhost:8001/api/mirrorx/bias/$userId
```

### 5.6 Test Social Features

**Reactions:**
1. Click "Reflect" button on a reflection
2. Verify count increases

**Wishlists:**
1. Go to Wishlist tab
2. Create feature request
3. Vote on existing items

**Events:**
1. Go to Events tab
2. View upcoming events (if seeded)
3. RSVP to an event

**Leaderboard:**
1. View leaderboard sidebar
2. Verify points are calculated correctly

---

## 🔧 Troubleshooting

### Database Connection Failed

**Error:** `Error connecting to Supabase`

**Solution:**
1. Check `SUPABASE_URL` in .env files
2. Verify `SUPABASE_KEY` (use service role key for backends)
3. Check Supabase project is active
4. Verify migrations ran successfully

### AI Provider Failed

**Error:** `Provider 'anthropic' failed: Invalid API key`

**Solution:**
1. Verify API key format (Claude: `sk-ant-...`)
2. Check key is active on provider dashboard
3. Verify no rate limits exceeded
4. Check provider has sufficient credits

### Mirrorback Not Generated

**Issue:** Reflection saved but no AI response

**Diagnosis:**
1. Check MirrorX Engine logs in terminal
2. Verify MirrorX Engine is running on port 8001
3. Check `VITE_MIRRORX_ENGINE_URL` in frontend .env
4. Verify AI provider keys are configured

**Solution:**
```powershell
# Test MirrorX Engine directly
curl -X POST http://localhost:8001/api/mirrorx/reflect `
  -H "Content-Type: application/json" `
  -d "{\"user_id\": \"$userId\", \"reflection_text\": \"Test reflection\"}"
```

### Points Not Awarded

**Issue:** Actions completed but no points showing

**Diagnosis:**
1. Check database triggers are created:
   ```sql
   SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trigger_award%';
   ```

2. Verify points table has entries:
   ```sql
   SELECT * FROM points ORDER BY created_at DESC LIMIT 10;
   ```

**Solution:**
If triggers missing, re-run `002_social_features.sql`

### Frontend Build Errors

**Error:** `Cannot find module '@supabase/supabase-js'`

**Solution:**
```powershell
cd frontend
npm install @supabase/supabase-js
```

**Error:** `Type error in mirrorApi.ts`

**Solution:**
Ensure `vite-env.d.ts` exists in `frontend/src/`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MIRRORX_ENGINE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 📊 Architecture Overview

```
User Browser
      ↓
Frontend (React/Vite) :3000
      ↓
   Supabase (PostgreSQL)
      ↓ (for AI features)
MirrorX Engine (FastAPI) :8001
      ↓
5 AI Providers
  ├─ Claude (Voice)
  ├─ GPT-4 (Scribe)
  ├─ Gemini (Logician)
  ├─ Perplexity (Grounder)
  └─ Hume (Sensor)
```

### Data Flow: Reflection Submission

1. **User writes reflection** in frontend
2. **Frontend calls** `Reflections.create()` in mirrorApi.ts
3. **Reflection saved** to Supabase `reflections` table
4. **Trigger awards** 5 points (automatic)
5. **Frontend calls** MirrorX Engine `/api/mirrorx/reflect`
6. **MirrorX runs** 8-step conductor pipeline:
   - Safety check
   - Emotion analysis (Hume)
   - Semantic parsing (GPT-4)
   - Identity merging (Graph)
   - Logic mapping (Gemini)
   - Grounding (Perplexity)
   - Tone decision
   - Mirrorback generation (Claude)
7. **AI mirrorback saved** to `mirrorbacks` table
8. **Identity graph updated** (axes, values, snapshot)
9. **Evolution detected** (growth, loops, breakthroughs)
10. **Response returned** with mirrorback + insights
11. **Frontend displays** mirrorback to user

---

## 🎨 Feature Matrix

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| **Core Platform** |
| User Auth | ✅ Ready | Supabase Magic Link | Email-based sign-in |
| Profiles | ✅ Ready | `profiles` table | Display name, bio, avatar, banner |
| Reflections | ✅ Ready | `reflections` table | Body, metadata (title/tags/quote/video) |
| Mirrorbacks | ✅ Ready | `mirrorbacks` table | AI + human responses |
| **Social Features** |
| Reactions | ✅ Ready | `reactions` table | Reflect, appreciate, challenge, save |
| Follows | ✅ Ready | `follows` table | User-to-user following |
| Wishlists | ✅ Ready | `wishlists` table | Feature requests + voting |
| Events | ✅ Ready | `events` table | Community gatherings + RSVPs |
| Points | ✅ Ready | `points` table | Gamification with auto-awards |
| Leaderboard | ✅ Ready | `leaderboard` view | Top users by points |
| Checklist | ✅ Ready | `checklist_*` tables | Onboarding progress |
| **MirrorX AI** |
| Conductor Pipeline | ✅ Ready | mirrorx-engine | 8-step AI orchestration |
| Identity Graph | ✅ Ready | `identity_*` tables | Axes, values, snapshots |
| Evolution Detection | ✅ Ready | evolution_engine.py | Growth, loops, breakthroughs |
| Bias Insights | ✅ Ready | `bias_insights` table | Cognitive bias tracking |
| Safety Events | ✅ Ready | `safety_events` table | Crisis detection |
| Regression Markers | ✅ Ready | `regression_markers` table | Loop patterns |
| Feed Algorithm | ✅ Ready | `reflection_signals` table | Personalized feed |

---

## 🔐 Security Checklist

- [x] Row Level Security (RLS) enabled on all tables
- [x] Users can only read/write their own data (except public reflections)
- [x] Service role key used for backend operations
- [x] Anon key used for frontend operations
- [x] Safety check before AI processing
- [x] Crisis detection with action logging
- [x] API keys stored in .env (not committed to git)

---

## 🚢 Production Deployment

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MIRRORX_ENGINE_URL` (production URL)

### MirrorX Engine → Railway/Render

```bash
# Add Procfile
echo "web: uvicorn app.main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Deploy
railway up
# or
render deploy
```

Set environment variables in Railway/Render dashboard (all from Step 2.2)

### Database → Supabase (Already Cloud)

Your Supabase project is already production-ready at:
`https://bfctvwjxlfkzeahmscbe.supabase.co`

---

## 📈 Monitoring

### Database Metrics
- Go to Supabase Dashboard → Database → Usage
- Monitor: Connection count, table sizes, query performance

### API Performance
- Check MirrorX Engine logs for slow AI responses
- Monitor: Response times, error rates, provider latency

### User Engagement
```sql
-- Active users today
SELECT COUNT(DISTINCT author_id) FROM reflections 
WHERE created_at > now() - interval '1 day';

-- Total reflections
SELECT COUNT(*) FROM reflections;

-- AI mirrorback success rate
SELECT 
  COUNT(*) FILTER (WHERE source = 'ai') as ai_count,
  COUNT(*) as total_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE source = 'ai') / COUNT(*), 2) as success_rate
FROM mirrorbacks;
```

---

## ✅ Deployment Checklist

- [ ] Run 001_mirror_core.sql in Supabase
- [ ] Run 002_social_features.sql in Supabase
- [ ] Verify all 26 tables exist
- [ ] Configure .env files (3 locations)
- [ ] Install dependencies (3 services)
- [ ] Start MirrorX Engine (verify /docs works)
- [ ] Start Core API (verify /docs works)
- [ ] Start Frontend (verify UI loads)
- [ ] Create test user account
- [ ] Post test reflection
- [ ] Verify AI mirrorback generated
- [ ] Test reactions (reflect/appreciate/challenge/save)
- [ ] Test wishlists (create + vote)
- [ ] Check leaderboard updates
- [ ] Verify points awarded correctly
- [ ] Test identity graph endpoint
- [ ] Test evolution timeline endpoint
- [ ] Test bias insights endpoint
- [ ] Review security (RLS policies active)
- [ ] Deploy to production (Vercel + Railway/Render)

---

## 🎉 Success Criteria

Your platform is **fully operational** when:

1. ✅ Users can sign up and complete profiles
2. ✅ Users can post reflections with title/tags/quotes
3. ✅ AI generates mirrorbacks within 5 seconds
4. ✅ Reactions work (reflect/appreciate/challenge/save)
5. ✅ Points are awarded automatically
6. ✅ Leaderboard shows top users
7. ✅ Wishlists accept feature requests
8. ✅ Events show upcoming gatherings
9. ✅ Identity graph tracks user beliefs
10. ✅ Evolution timeline shows growth/loops
11. ✅ Bias insights detect patterns
12. ✅ Safety checks prevent crisis content

---

## 📚 Documentation

- **Integration Status:** `INTEGRATION_STATUS.md`
- **Discussion Hub Analysis:** `DISCUSSION_HUB_INTEGRATION.md`
- **Quick Start:** `QUICK_START.md`
- **Architecture:** `MIRRORX_INTEGRATION.md`
- **API Docs:** http://localhost:8001/docs (when running)

---

## 🆘 Support

**Database Issues:**
- Check Supabase logs in dashboard
- Verify migrations ran successfully
- Review RLS policies

**AI Issues:**
- Check MirrorX Engine terminal output
- Verify API keys are valid
- Test each provider individually

**Frontend Issues:**
- Check browser console for errors
- Verify .env.local has correct URLs
- Check network tab for failed requests

---

## Status: 🟢 READY TO DEPLOY

All code is written. All migrations are ready. All configurations are documented.

**Next step:** Run migrations and start services! 🚀
