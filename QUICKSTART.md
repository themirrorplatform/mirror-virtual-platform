# 🪞 The Mirror Virtual Platform - Quick Start

## ✅ Your Project is Connected to Supabase!

**Supabase Project:** https://bfctvwjxlfkzeahmscbe.supabase.co

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Setup Script

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

### Step 2: Complete Supabase Configuration

1. Go to: https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/settings/api

2. Get these values:
   - **JWT Secret** (under JWT Settings)
   - **service_role key** (under Project API keys)
   - **Database URL** (Settings → Database → Connection string)

3. Update `core-api/.env`:
   ```env
   SUPABASE_JWT_SECRET=your_jwt_secret_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   DATABASE_URL=your_database_url_here
   ```

### Step 3: Run Database Migrations

1. Go to SQL Editor: https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/sql

2. Create a new query and run each migration file in order:
   - `supabase/migrations/001_mirror_core.sql`
   - `supabase/migrations/002_reflection_intelligence.sql`
   - `supabase/migrations/003_mirrorx_complete.sql`
   - `supabase/migrations/004_notifications_search_avatars.sql`

### Step 4: Start the Application

**Terminal 1 - Backend:**
```bash
cd core-api
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 5: Open the Application

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs
- **Supabase Dashboard:** https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe

---

## ✨ Features Included

✅ **Authentication** - Supabase JWT with sign up/sign in  
✅ **Profile Management** - Avatar upload, bio, display name  
✅ **Reflections** - Create, edit, delete reflections  
✅ **Lens System** - 6 lenses (wealth, mind, belief, ai, life, heart)  
✅ **Feed Algorithm** - Reflection-first personalized feed  
✅ **Notifications** - Follow, mirrorback, signal notifications  
✅ **Search** - Full-text search for reflections and users  
✅ **Infinite Scroll** - Cursor-based pagination  
✅ **MirrorX AI** - AI-powered mirrorbacks (requires MirrorX Engine)  

---

## 📚 Documentation

- **Full Setup Guide:** [SUPABASE_DEPLOYMENT.md](./SUPABASE_DEPLOYMENT.md)
- **Features Guide:** [FEATURES_IMPLEMENTED.md](./FEATURES_IMPLEMENTED.md)
- **Quick Summary:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## 🎯 Quick Test Checklist

- [ ] Sign up with email/password
- [ ] Upload profile avatar
- [ ] Create a reflection
- [ ] Search for reflections
- [ ] Follow another user (create a second account)
- [ ] Check notifications
- [ ] Browse lens pages (/lens/wealth, /lens/mind, etc.)
- [ ] Test infinite scroll on feed

---

## 🆘 Need Help?

1. **Check logs:** Backend logs in terminal, frontend console in browser
2. **Verify environment:** All values in `.env` files are correct
3. **Check Supabase:** Dashboard shows users, data, and no errors
4. **Review docs:** See SUPABASE_DEPLOYMENT.md for troubleshooting

---

## 🔗 Important Links

- **GitHub Repo:** https://github.com/themirrorplatform/mirror-virtual-platform
- **Supabase Dashboard:** https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe
- **Local Frontend:** http://localhost:3000
- **Local API:** http://localhost:8000/docs

---

**Status:** ✅ Ready to deploy! All features implemented and pushed to GitHub.

**Next:** Run the setup script and complete Supabase configuration (Steps 1-3 above).
