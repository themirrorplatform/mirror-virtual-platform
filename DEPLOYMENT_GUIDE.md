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
NEXT_PUBLIC_SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY3R2d2p4bGZremVhaG1zY2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjUxMTksImV4cCI6MjA4MDY0MTExOX0.EdvAQJ_7C8HZW0jn4Q1CLxGfrpgod1KnvzO8pYXLotY
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
DATABASE_URL=postgresql://postgres.bfctvwjxlfkzeahmscbe:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmY3R2d2p4bGZremVhaG1zY2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjUxMTksImV4cCI6MjA4MDY0MTExOX0.EdvAQJ_7C8HZW0jn4Q1CLxGfrpgod1KnvzO8pYXLotY
SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY_HERE
SUPABASE_JWT_SECRET=YOUR_JWT_SECRET_HERE

# CORS
ALLOWED_ORIGINS=https://mirror-virtual-platform.vercel.app,http://localhost:3000

# MirrorX Engine URL (add after deploying MirrorX)
MIRRORX_API_URL=https://your-mirrorx-api.railway.app

# Optional: Rate Limiting
RATE_LIMIT_PER_MINUTE=60
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
# AI Provider Keys
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key (optional)
HUME_API_KEY=your-hume-key (optional)

# Core API URL
CORE_API_URL=https://mirror-core-api-production.up.railway.app

# Database (same as Core API)
DATABASE_URL=postgresql://postgres.bfctvwjxlfkzeahmscbe:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# CORS
ALLOWED_ORIGINS=https://mirror-virtual-platform.vercel.app,http://localhost:3000

# Optional: Conductor Settings
MAX_TOKENS=1000
TEMPERATURE=0.7
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

### Option D: Google Cloud Run

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

### Railway

- View logs: Railway Dashboard → Service → Logs
- Metrics: Railway Dashboard → Service → Metrics
- Set up alerts in Settings

### Vercel

- View logs: Vercel Dashboard → Project → Deployments → Logs
- Analytics: Vercel Dashboard → Analytics
- Real-time logs: `vercel logs`

### Supabase

- Database logs: Supabase Dashboard → Database → Logs
- API logs: Supabase Dashboard → API → Logs
- Monitor queries: Supabase Dashboard → Database → Query Performance

---

## Environment Variables Summary

### Frontend (Vercel)
```env
NEXT_PUBLIC_SUPABASE_URL=https://bfctvwjxlfkzeahmscbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_CORE_API_URL=<railway-core-api-url>
NEXT_PUBLIC_MIRRORX_API_URL=<railway-mirrorx-url>
```

### Core API (Railway)
```env
DATABASE_URL=<supabase-connection-string>
SUPABASE_URL=<supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
ALLOWED_ORIGINS=<frontend-url>,http://localhost:3000
MIRRORX_API_URL=<railway-mirrorx-url>
```

### MirrorX Engine (Railway)
```env
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>
DATABASE_URL=<supabase-connection-string>
CORE_API_URL=<railway-core-api-url>
ALLOWED_ORIGINS=<frontend-url>,http://localhost:3000
```

---

## Cost Estimate

### Free Tier (Development)

- **Vercel**: Free (Hobby plan)
  - 100 GB bandwidth/month
  - Unlimited deployments
  
- **Railway**: $5/month credit (Trial)
  - ~$5/service/month after trial
  
- **Supabase**: Free
  - 500 MB database
  - 2 GB bandwidth/month

**Total**: $0-$10/month for small traffic

### Production Scale

- **Vercel Pro**: $20/month (team features, more bandwidth)
- **Railway**: ~$20-50/month (2 services with autoscaling)
- **Supabase Pro**: $25/month (8 GB database, more connections)

**Total**: $65-95/month for production traffic

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

1. ✅ Deploy frontend to Vercel
2. ✅ Deploy Core API to Railway
3. ✅ Deploy MirrorX Engine to Railway
4. ✅ Update frontend environment variables
5. ✅ Test end-to-end flow
6. 🎯 Set up monitoring and alerts
7. 🎯 Configure custom domain (optional)
8. 🎯 Set up CI/CD for automatic deployments

---

**Questions?** Check logs in Railway/Vercel dashboards or review error messages.
