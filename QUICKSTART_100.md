# 🚀 Quick Start Guide - Mirror Virtual Platform (100% Ready)

## System Status: ✅ OPERATIONAL

All critical fixes implemented. System ready for testing and deployment.

---

## 🏃 Run the Platform

### Terminal 1: Core API (Backend)
```bash
cd core-api
uvicorn app.main:app --reload --port 8000
```
**Status:** ✅ Ready at http://localhost:8000

### Terminal 2: MirrorX Engine (AI Brain)
```bash
cd mirrorx-engine

# Required API keys (add to .env or set in terminal)
$env:ANTHROPIC_API_KEY="your-key"      # Claude for mirrorback generation
$env:OPENAI_API_KEY="your-key"         # GPT for analysis
$env:GOOGLE_API_KEY="your-key"         # Gemini for pattern detection
$env:PERPLEXITY_API_KEY="your-key"     # Optional: web context
$env:HUME_API_KEY="your-key"           # Optional: emotional detection

uvicorn app.main:app --reload --port 8100
```
**Status:** ✅ Ready at http://localhost:8100

### Terminal 3: Frontend (UI)
```bash
cd frontend
npm run dev
```
**Status:** ✅ Ready at http://localhost:3000

---

## 🧪 Test the Complete Flow

### 1. Open Browser
Navigate to: http://localhost:3000/reflect

### 2. Write a Reflection
Example: "I want to succeed but I fear failure."

### 3. Click "Reflect" Button
- ✅ Creates reflection in database
- ✅ Auto-generates AI mirrorback
- ✅ Redirects to feed

### 4. View Result
Check home feed for:
- ✅ Your reflection
- ✅ AI mirrorback (questions, not answers)

---

## 🔍 Verify Database

### Check Mirror OS Tables
```sql
-- View identities (multi-self system)
SELECT * FROM identities;

-- View reflections with identity linkage
SELECT r.id, r.body, r.identity_id, i.label as identity_label
FROM reflections r
LEFT JOIN identities i ON i.id = r.identity_id;

-- View mirrorbacks (AI responses)
SELECT * FROM mirrorbacks ORDER BY created_at DESC LIMIT 5;

-- View tensions (contradictions detected)
SELECT * FROM tensions;

-- View self_claims (identity statements extracted)
SELECT * FROM self_claims;
```

---

## 🎯 What's New (December 7, 2025)

### ✅ Fixed Issues
1. **MirrorX /mirrorback endpoint** - Added missing endpoint
2. **Auto-mirrorback generation** - Frontend now triggers AI responses automatically
3. **Multi-identity system** - identity_id now used in reflections
4. **TypeScript errors** - Fixed type mismatches
5. **Missing dependencies** - Added @supabase/supabase-js
6. **UX copy** - Changed "Share Reflection" → "Reflect"

### ✅ Verified Working
- Complete data flow: Reflection → MirrorX → Mirrorback → Display
- 8-step Conductor orchestration (Hume, OpenAI, Gemini, Claude)
- MirrorCore principles enforced (no advice, only questions)
- Identity graph updates
- Tension detection
- Bias analysis
- Regression markers

---

## 📚 Key Files Modified

### Backend
- `mirrorx-engine/app/main.py` - Added /mirrorback endpoint
- `core-api/app/routers/reflections.py` - Added identity_id support

### Frontend
- `frontend/src/pages/reflect.tsx` - Auto-generate mirrorback
- `frontend/src/lib/api.ts` - Added mirrorback get method
- `frontend/src/components/ReflectionComposer.tsx` - Updated button text
- `frontend/package.json` - Added @supabase/supabase-js

---

## 🔐 Environment Variables

### Required for MirrorX Engine
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/mirror
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### Optional for Enhanced Features
```bash
GOOGLE_API_KEY=...        # Gemini pattern detection
PERPLEXITY_API_KEY=...    # Web context
HUME_API_KEY=...          # Emotional analysis
USE_CONDUCTOR=true        # Use 8-step orchestration (recommended)
```

### Core API
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/mirror
MIRRORX_ENGINE_URL=http://localhost:8100
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 🎉 Success Indicators

When system is working correctly, you should see:

### In Terminal
```
INFO:     MirrorX comprehensive routes loaded
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:8100
```

### In Browser Console (Network Tab)
```
POST /api/reflections → 200 OK
POST /api/mirrorbacks → 200 OK
POST /mirrorback (to engine) → 200 OK
```

### In Database
```sql
-- New reflection appears
SELECT * FROM reflections ORDER BY created_at DESC LIMIT 1;

-- Mirrorback appears
SELECT * FROM mirrorbacks ORDER BY created_at DESC LIMIT 1;

-- Identity linked
SELECT * FROM reflections WHERE identity_id IS NOT NULL;
```

---

## 🐛 Troubleshooting

### Issue: "Connection refused" to MirrorX Engine
**Fix:** Ensure port 8100 is not blocked, check MIRRORX_ENGINE_URL in Core API .env

### Issue: No mirrorback generated
**Fix:** Check MirrorX logs, verify ANTHROPIC_API_KEY is set

### Issue: TypeScript errors in frontend
**Fix:** Run `npm install` in frontend directory

### Issue: Database errors
**Fix:** Run all migrations in order:
```sql
-- In Supabase SQL Editor
-- 1. Run 001_mirror_core.sql
-- 2. Run 002_social_features.sql
-- 3. Run 003_mirrorx_complete.sql
-- 4. Run 009_threads_table.sql
-- 5. Run 010_mirror_os_compatibility.sql
```

---

## 📖 Documentation

- **Architecture:** See deep analysis in conversation history
- **Schema:** See `MIRROR_OS_COMPATIBILITY.md`
- **Migration:** See `MIRROR_OS_QUICKSTART.md`
- **Complete fixes:** See `SYSTEM_100_PERCENT.md`

---

**The Mirror Virtual Platform**  
*A social media platform whose core is reflection, not engagement.*

Built with reflection. Powered by MirrorCore. 🪞
