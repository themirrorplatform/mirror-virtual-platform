# Deployment Guide - The Mirror Virtual Platform

Complete deployment guide for all three services: Frontend, Core API, and MirrorX Engine.

---

## Prerequisites

- GitHub account with push access to repository
- Vercel account (for frontend)
- Railway account (for backend APIs)
- Supabase project already configured ✅

---

## 1. Frontend Deployment (Next.js)

### Deploy to Netlify

The repository already includes `netlify.toml` configuration.

**Step 1: Connect Repository**

1. Go to Netlify dashboard: https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Select repository: `themirrorplatform/mirror-virtual-platform`
5. Netlify will auto-detect `netlify.toml` configuration

**Step 2: Configure Build Settings**

Netlify will use settings from `netlify.toml`:
- **Base directory**: `frontend/`
- **Build command**: `npm run build`
- **Publish directory**: `frontend/.next`

**Step 3: Add Environment Variables**

In Netlify dashboard → Site settings → Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://enfjnqfppfhofredyxyg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzc5MzQsImV4cCI6MjA3ODY1MzkzNH0.JbfoDSXYuzvA14A1Or22m6wS40GKwLPzrVb8qHgpsKc
NEXT_PUBLIC_CORE_API_URL=https://your-core-api.railway.app
NEXT_PUBLIC_MIRRORX_API_URL=https://your-mirrorx-api.railway.app
NODE_VERSION=18
```

**Step 4: Deploy**

Click "Deploy site" - Netlify will build and deploy automatically.

**Expected Result**:
- URL: Your existing Netlify URL (themirrorplatform.online)
- Build time: ~2-3 minutes
- Auto-deploy on git push to main branch

**API Proxying**

The `netlify.toml` includes proxy rules:
- Frontend calls `/api/core/*` → Routes to Core API
- Frontend calls `/api/mirrorx/*` → Routes to MirrorX Engine

Update proxy URLs in `netlify.toml` after deploying backend services.

---

## 2. Core API Deployment (FastAPI)

### Deploy to Railway

**Step 1: Create New Project**

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `themirrorplatform/mirror-virtual-platform`
4. Railway will detect the repository

**Step 2: Configure Core API Service**

1. Click "Add Service" → "Empty Service"
2. Name it: `mirror-core-api`
3. Settings:
   - **Root Directory**: `/core-api`
   - **Build Command**: (leave empty, uses Dockerfile)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Step 3: Add Environment Variables**

```bash
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://enfjnqfppfhofredyxyg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzkzNCwiZXhwIjoyMDc4NjUzOTM0fQ.ZlMAlV7ptEG0ZzyjuACZXRgnSQswhLVdsFEUj13V6T0
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzc5MzQsImV4cCI6MjA3ODY1MzkzNH0.JbfoDSXYuzvA14A1Or22m6wS40GKwLPzrVb8qHgpsKc

# CORS
ALLOWED_ORIGINS=https://themirrorplatform.online,http://localhost:3000,http://localhost:5173
FRONTEND_ORIGIN=https://themirrorplatform.online

# MirrorX Engine URL (add after deploying MirrorX)
MIRRORX_API_URL=https://your-mirrorx-api.railway.app

# Rate Limiting
DEFAULT_RATE_LIMIT_PER_MINUTE=60

# System Settings
CACHE_TTL_SECONDS=300
MAINTENANCE_MODE=false
```

**Step 4: Deploy**

Railway will automatically build using `core-api/Dockerfile` and deploy.

**Expected Result**:
- URL: `https://mirror-core-api-production.up.railway.app`
- Health check: `https://your-url.railway.app/health`
- Deploy time: ~3-5 minutes

---

## 3. MirrorX Engine Deployment (FastAPI + AI)

### Deploy to Railway

**Step 1: Create Service**

1. In same Railway project, click "Add Service"
2. Name it: `mirrorx-engine`
3. Settings:
   - **Root Directory**: `/mirrorx-engine`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Step 2: Add Environment Variables**

```bash
# Supabase
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://enfjnqfppfhofredyxyg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzkzNCwiZXhwIjoyMDc4NjUzOTM0fQ.ZlMAlV7ptEG0ZzyjuACZXRgnSQswhLVdsFEUj13V6T0
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzc5MzQsImV4cCI6MjA3ODY1MzkzNH0.JbfoDSXYuzvA14A1Or22m6wS40GKwLPzrVb8qHgpsKc

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ANTHROPIC_KEY_HERE
ANTHROPIC_MODEL=claude-opus-4-5-20251101
ANTHROPIC_TONE_MODEL=claude-3-haiku-20240307

# OpenAI (GPT-4, GPT-3.5)
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE

# Google / Gemini
GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE
GOOGLE_APPLICATION_CREDENTIALS=mirrorx-workers-ab0d14c8188b.json

# Hume AI (emotion analysis)
HUME_API_KEY=YOUR_HUME_KEY_HERE

# Perplexity
PERPLEXITY_API_KEY=pplx-YOUR_PERPLEXITY_KEY_HERE

# Core API URL
CORE_API_URL=https://mirror-core-api-production.up.railway.app

# CORS
ALLOWED_ORIGINS=https://themirrorplatform.online,http://localhost:3000,http://localhost:5173
FRONTEND_ORIGIN=https://themirrorplatform.online

# Conductor Settings
MAX_TOKENS=1000
TEMPERATURE=0.7
MIRRORCORE_SYSTEM_PROMPT=mirrorcore_system_prompt.txt
```

**Step 3: Deploy**

Railway will build using `mirrorx-engine/Dockerfile` and deploy.

**Expected Result**:
- URL: `https://mirrorx-engine-production.up.railway.app`
- Health check: `https://your-url.railway.app/health`
- Deploy time: ~3-5 minutes

---

## 4. Update Frontend URLs

After deploying Core API and MirrorX Engine, update frontend environment variables:

**In Vercel Dashboard:**

1. Go to your frontend project settings
2. Environment Variables
3. Update:
   ```
   NEXT_PUBLIC_CORE_API_URL=https://mirror-core-api-production.up.railway.app
   NEXT_PUBLIC_MIRRORX_API_URL=https://mirrorx-engine-production.up.railway.app
   ```
4. Click "Redeploy" to apply changes

---

## 5. Verify Deployment

### Frontend Check

```bash
curl https://mirror-virtual-platform.vercel.app
```

Should return Next.js app HTML.

### Core API Check

```bash
curl https://your-core-api.railway.app/health
```

Should return: `{"status": "healthy"}`

### MirrorX Engine Check

```bash
curl https://your-mirrorx-api.railway.app/health
```

Should return: `{"status": "healthy"}`

### End-to-End Test

1. Visit frontend: `https://mirror-virtual-platform.vercel.app`
2. Create a reflection
3. Verify mirrorback is generated
4. Check database in Supabase

---

## Alternative Deployment Options

### Frontend: Vercel (Alternative to Netlify)

If you prefer Vercel over Netlify:

1. Go to https://vercel.com/new
2. Import repository, set root directory to `frontend`
3. Add same environment variables
4. Deploy

### Backend: Render (Alternative to Railway)

Core API and MirrorX can also be deployed to Render.com:

1. Go to https://dashboard.render.com
2. New → Web Service
3. Connect GitHub repo
4. Configure similar to Railway (use Dockerfile)
5. Add environment variables

### Backend: Fly.io (Alternative to Railway)

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy Core API
cd core-api
fly launch
fly deploy

# Deploy MirrorX Engine
cd ../mirrorx-engine
fly launch
fly deploy
```

### Backend: Google Cloud Run (Alternative to Railway)

```bash
# Core API
cd core-api
gcloud run deploy mirror-core-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated

# MirrorX Engine
cd ../mirrorx-engine
gcloud run deploy mirrorx-engine \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Monitoring & Logs

### Netlify

- View logs: Netlify Dashboard → Site → Deploys → Deploy log
- Functions logs: Netlify Dashboard → Functions
- Analytics: Netlify Dashboard → Analytics
- Real-time logs: `netlify watch`

### Railway

- View logs: Railway Dashboard → Service → Logs
- Metrics: Railway Dashboard → Service → Metrics
- Set up alerts in Settings

### Supabase

- Database logs: Supabase Dashboard → Database → Logs
- API logs: Supabase Dashboard → API → Logs
- Monitor queries: Supabase Dashboard → Database → Query Performance

---

## Environment Variables Summary

### Frontend (Netlify)
```env
NEXT_PUBLIC_SUPABASE_URL=https://enfjnqfppfhofredyxyg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzc5MzQsImV4cCI6MjA3ODY1MzkzNH0.JbfoDSXYuzvA14A1Or22m6wS40GKwLPzrVb8qHgpsKc
NEXT_PUBLIC_CORE_API_URL=<railway-core-api-url>
NEXT_PUBLIC_MIRRORX_API_URL=<railway-mirrorx-url>
NODE_VERSION=18
```

### Core API (Railway)
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://enfjnqfppfhofredyxyg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzkzNCwiZXhwIjoyMDc4NjUzOTM0fQ.ZlMAlV7ptEG0ZzyjuACZXRgnSQswhLVdsFEUj13V6T0
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzc5MzQsImV4cCI6MjA3ODY1MzkzNH0.JbfoDSXYuzvA14A1Or22m6wS40GKwLPzrVb8qHgpsKc
ALLOWED_ORIGINS=https://themirrorplatform.online,http://localhost:3000,http://localhost:5173
FRONTEND_ORIGIN=https://themirrorplatform.online
MIRRORX_API_URL=<railway-mirrorx-url>
DEFAULT_RATE_LIMIT_PER_MINUTE=60
CACHE_TTL_SECONDS=300
MAINTENANCE_MODE=false
```

### MirrorX Engine (Railway)
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://enfjnqfppfhofredyxyg.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzkzNCwiZXhwIjoyMDc4NjUzOTM0fQ.ZlMAlV7ptEG0ZzyjuACZXRgnSQswhLVdsFEUj13V6T0
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuZmpucWZwcGZob2ZyZWR5eHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzc5MzQsImV4cCI6MjA3ODY1MzkzNH0.JbfoDSXYuzvA14A1Or22m6wS40GKwLPzrVb8qHgpsKc
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ANTHROPIC_KEY_HERE
ANTHROPIC_MODEL=claude-opus-4-5-20251101
ANTHROPIC_TONE_MODEL=claude-3-haiku-20240307
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE
GOOGLE_APPLICATION_CREDENTIALS=mirrorx-workers-ab0d14c8188b.json
HUME_API_KEY=YOUR_HUME_KEY_HERE
PERPLEXITY_API_KEY=pplx-YOUR_PERPLEXITY_KEY_HERE
CORE_API_URL=<railway-core-api-url>
ALLOWED_ORIGINS=https://themirrorplatform.online,http://localhost:3000,http://localhost:5173
FRONTEND_ORIGIN=https://themirrorplatform.online
MAX_TOKENS=1000
TEMPERATURE=0.7
MIRRORCORE_SYSTEM_PROMPT=mirrorcore_system_prompt.txt
```

---

## Cost Estimate

### Free Tier (Development)

- **Netlify**: Free (Starter plan)
  - 100 GB bandwidth/month
  - Unlimited deployments
  - 300 build minutes/month
  
- **Railway**: $5/month credit (Trial)
  - ~$5/service/month after trial
  
- **Supabase**: Free
  - 500 MB database
  - 2 GB bandwidth/month

**Total**: $0-$10/month for small traffic

### Production Scale

- **Netlify Pro**: $19/month (team features, more bandwidth, faster builds)
- **Railway**: ~$20-50/month (2 services with autoscaling)
- **Supabase Pro**: $25/month (8 GB database, more connections)

**Total**: $64-94/month for production traffic

---

## Troubleshooting

### Build Fails

**Frontend**:
```bash
cd frontend
npm install
npm run build
# Check for errors locally first
```

**Backend**:
```bash
cd core-api
pip install -r requirements.txt
uvicorn app.main:app --reload
# Test locally before deploying
```

### CORS Errors

Update `ALLOWED_ORIGINS` in both APIs to include your frontend URL.

### Database Connection Errors

Verify `DATABASE_URL` includes the correct password and uses the pooler port (6543).

### 502 Bad Gateway

- Check service logs in Railway
- Verify health check endpoint returns 200
- Increase timeout settings

---

## Next Steps

1. ✅ Deploy frontend to Netlify (update base directory to `frontend/`)
2. ✅ Deploy Core API to Railway
3. ✅ Deploy MirrorX Engine to Railway
4. ✅ Update frontend environment variables in Netlify
5. ✅ Update API proxy URLs in `netlify.toml`
6. ✅ Test end-to-end flow
7. 🎯 Set up monitoring and alerts
8. 🎯 Custom domain already configured (themirrorplatform.online)
9. 🎯 CI/CD automatic on git push (already enabled)

---

**Questions?** Check logs in Railway/Vercel dashboards or review error messages.
