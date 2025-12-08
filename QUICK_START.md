# Quick Start: Running Mirror Virtual Platform

## 🚀 Complete Setup in 5 Steps

---

## Step 1: Database Migration (REQUIRED FIRST)

### Option A: Manual SQL Execution (Recommended - CLI install failed)

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/sql/new
   ```

2. Copy the entire contents of:
   ```
   supabase/migrations/001_mirror_core.sql
   ```

3. Paste into SQL Editor and click **Run**

4. Verify success - you should see:
   - 7 enum types created
   - 16 tables created
   - No errors in output

### What Gets Created:
- `profiles`, `reflections`, `mirrorbacks`
- `identity_axes`, `identity_axis_values`, `identity_snapshots`
- `bias_insights`, `safety_events`, `regression_markers`
- `follows`, `reflection_signals`, `feed_state`

---

## Step 2: Configure Environment Variables

### MirrorX Engine (AI Backend)

Create `.env` in `mirrorx-engine/`:

```bash
# Database (from Supabase dashboard)
SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
SUPABASE_KEY=eyJ...  # Your service role key

# AI Providers (5 workers)
ANTHROPIC_API_KEY=sk-ant-...      # Claude (Voice/Mirrorback)
OPENAI_API_KEY=sk-...              # GPT-4 (Scribe/Transcription)
GOOGLE_API_KEY=...                 # Gemini (Logician/Structure)
PERPLEXITY_API_KEY=...            # Perplexity (Grounder/Facts)
HUME_API_KEY=...                  # Hume (Sensor/Emotion) - Optional

# Frontend
FRONTEND_ORIGIN=http://localhost:3000
```

### Core API

Create `.env` in `core-api/`:

```bash
# Database
SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
SUPABASE_KEY=eyJ...  # Your service role key

# MirrorX Engine
MIRRORX_ENGINE_URL=http://localhost:8001
```

### Frontend

Create `.env.local` in `frontend/`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Step 3: Install Dependencies

### MirrorX Engine

```powershell
cd mirrorx-engine
pip install -r requirements.txt
```

**Expected packages:**
- fastapi==0.109.0
- uvicorn[standard]==0.27.0
- supabase==2.3.0
- anthropic==0.21.3
- openai==1.10.0
- google-generativeai==0.3.2
- perplexityai==0.1.0
- hume==0.5.0

### Core API

```powershell
cd core-api
pip install -r requirements.txt
```

### Frontend

```powershell
cd frontend
npm install
```

---

## Step 4: Start Services

### Terminal 1: MirrorX Engine (AI Backend)

```powershell
cd mirrorx-engine
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Verify:** Open http://localhost:8001/docs
- You should see Swagger UI with all endpoints

**Key Endpoints:**
- POST `/api/mirrorx/reflect` - Main reflection pipeline
- GET `/api/mirrorx/identity/{user_id}` - Identity graph
- GET `/api/mirrorx/evolution/{user_id}` - Evolution timeline
- GET `/api/mirrorx/health` - Health check

### Terminal 2: Core API (Database Layer)

```powershell
cd core-api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify:** Open http://localhost:8000/docs

### Terminal 3: Frontend (Next.js)

```powershell
cd frontend
npm run dev
```

**Verify:** Open http://localhost:3000

---

## Step 5: Test the System

### Quick Health Check

```powershell
# MirrorX Engine
curl http://localhost:8001/api/mirrorx/health

# Core API
curl http://localhost:8000/health
```

### Create Test User

```powershell
curl -X POST http://localhost:8001/api/mirrorx/user/create `
  -H "Content-Type: application/json" `
  -d '{"name": "Test User"}'
```

**Response:**
```json
{"user_id": "123e4567-e89b-12d3-a456-426614174000"}
```

### Submit Test Reflection

```powershell
$userId = "YOUR_USER_ID_HERE"
curl -X POST http://localhost:8001/api/mirrorx/reflect `
  -H "Content-Type: application/json" `
  -d "{\"user_id\": \"$userId\", \"reflection_text\": \"I feel stuck in my career. I want to grow but I'm afraid of failing.\"}"
```

**Expected Response:**
```json
{
  "reflection_id": "abc123",
  "mirrorback": "You're holding tension between growth and safety...",
  "tone": "validating",
  "lint_passed": true,
  "evolution_events": ["tension_detected"],
  "tensions": ["growth_vs_safety"],
  "loops": [],
  "identity_delta_summary": "New axis detected: career_ambition"
}
```

### Check Identity Graph

```powershell
curl http://localhost:8001/api/mirrorx/identity/$userId
```

**Expected Response:**
```json
{
  "user_id": "...",
  "snapshot": {
    "tensions": ["growth_vs_safety"],
    "themes": ["career", "fear", "ambition"],
    "loops": [],
    "beliefs": [
      {"axis": "career_ambition", "value": "I want to grow", "confidence": 0.7}
    ]
  },
  "has_data": true
}
```

---

## Troubleshooting

### Database Connection Failed

**Error:** `Error connecting to Supabase`

**Solution:**
1. Check `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
2. Verify service role key (not anon key) is used
3. Check Supabase project is active in dashboard

### AI Provider Failed

**Error:** `Provider 'anthropic' failed: Invalid API key`

**Solution:**
1. Check API key format (Claude: `sk-ant-...`)
2. Verify key is active on provider dashboard
3. Check rate limits haven't been exceeded

**Note:** System has fallbacks - if one provider fails, others continue

### Migration Failed

**Error:** `relation "profiles" does not exist`

**Solution:**
1. Run `001_mirror_core.sql` in Supabase SQL Editor
2. Check for errors in SQL output
3. Verify all 16 tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Frontend Can't Connect

**Error:** `Network request failed`

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`
2. Verify Core API is running on port 8000
3. Check CORS configuration in `mirrorx-engine/app/main.py`

---

## Development Workflow

### Making Changes

1. **Database Schema Changes:**
   - Create new migration file in `supabase/migrations/`
   - Run in SQL Editor
   - Update `database_comprehensive.py` functions

2. **API Route Changes:**
   - Edit `mirrorx-engine/app/api_routes_comprehensive.py`
   - Server auto-reloads (if using `--reload`)
   - Test in Swagger UI at `/docs`

3. **Conductor Changes:**
   - Edit `mirrorx-engine/app/conductor.py`
   - Test with `/api/mirrorx/reflect` endpoint
   - Check logs for pipeline execution

### Testing

```powershell
# Run Python tests
cd mirrorx-engine
pytest

# Run frontend tests
cd frontend
npm test
```

### Logs

All services log to console. Key log sources:

- **MirrorX Engine:** `logger.info()` in conductor, identity_graph, evolution_engine
- **Core API:** FastAPI automatic logging
- **Frontend:** Browser console + Next.js server logs

---

## Production Deployment

### Environment Differences

**Development:**
- Services run on localhost
- Auto-reload enabled
- Debug logging
- CORS set to `*`

**Production:**
- Services run on cloud infrastructure
- Auto-reload disabled
- Info-level logging
- CORS restricted to frontend domain

### Recommended Stack

- **Frontend:** Vercel (Next.js native)
- **APIs:** Railway, Render, or AWS ECS
- **Database:** Supabase (already cloud-hosted)

### Environment Variables (Production)

```bash
# Production .env for MirrorX Engine
SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
SUPABASE_KEY=<production-service-role-key>
ANTHROPIC_API_KEY=<prod-key>
OPENAI_API_KEY=<prod-key>
GOOGLE_API_KEY=<prod-key>
PERPLEXITY_API_KEY=<prod-key>
HUME_API_KEY=<prod-key>
FRONTEND_ORIGIN=https://mirror.yourdomain.com
LOG_LEVEL=INFO
```

---

## Architecture Summary

```
User (Browser)
      ↓
Frontend (Next.js) :3000
      ↓
Core API (FastAPI) :8000
      ↓
MirrorX Engine (FastAPI) :8001
      ↓
Supabase (PostgreSQL)
      ↓
5 AI Providers (Claude, GPT, Gemini, Perplexity, Hume)
```

---

## Next Steps

Once everything is running:

1. **Explore the Identity Graph:**
   - Submit multiple reflections
   - Watch identity axes emerge
   - See tensions and loops detected

2. **Test Evolution Detection:**
   - Submit reflections with growth
   - Submit reflections with regression
   - Check `/api/mirrorx/evolution/{user_id}`

3. **Monitor Bias Insights:**
   - Check `/api/mirrorx/bias/{user_id}`
   - See cognitive patterns tracked

4. **Build Frontend Integration:**
   - Connect React components to new endpoints
   - Display identity graph visually
   - Show evolution timeline

---

## Support & Documentation

- **Integration Guide:** `MIRRORX_INTEGRATION.md`
- **Integration Status:** `INTEGRATION_STATUS.md`
- **Migration Guide:** `RUN_MIGRATION.md`
- **API Docs:** http://localhost:8001/docs (when running)

---

## Status: 🟢 READY TO RUN

All code is complete. Follow steps above to start the system. 🚀
