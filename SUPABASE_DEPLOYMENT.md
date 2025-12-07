# 🚀 Supabase Deployment Guide

## Your Supabase Project Details

**Project URL:** https://bfctvwjxlfkzeahmscbe.supabase.co  
**Project Reference:** bfctvwjxlfkzeahmscbe

---

## ✅ Step 1: Run Database Migrations

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe
2. Navigate to **SQL Editor** in the left sidebar
3. Run the following migrations in order:

### Migration 1: Core Schema
```sql
-- Copy and paste contents from:
supabase/migrations/001_mirror_core.sql
```

### Migration 2: Reflection Intelligence
```sql
-- Copy and paste contents from:
supabase/migrations/002_reflection_intelligence.sql
```

### Migration 3: MirrorX Complete
```sql
-- Copy and paste contents from:
supabase/migrations/003_mirrorx_complete.sql
```

### Migration 4: Notifications, Search & Avatars
```sql
-- Copy and paste contents from:
supabase/migrations/004_notifications_search_avatars.sql
```

---

## ✅ Step 2: Configure Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. The `avatars` bucket should be created automatically by migration 004
3. Verify the bucket exists and is set to **public**
4. Storage policies are already configured in the migration

---

## ✅ Step 3: Get JWT Secret

1. Go to **Settings** → **API** in Supabase Dashboard
2. Scroll down to **JWT Settings**
3. Copy the **JWT Secret**
4. Update `core-api/.env`:
   ```
   SUPABASE_JWT_SECRET=your_actual_jwt_secret_here
   ```

---

## ✅ Step 4: Get Service Role Key

1. In **Settings** → **API**
2. Copy the **service_role** key (⚠️ Keep this secret!)
3. Update `core-api/.env`:
   ```
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

---

## ✅ Step 5: Configure Database URL

1. Go to **Settings** → **Database**
2. Scroll to **Connection string** → **URI**
3. Copy the connection string
4. Update `core-api/.env`:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```

---

## ✅ Step 6: Install Dependencies

### Backend
```bash
cd core-api
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

---

## ✅ Step 7: Start the Application

### Terminal 1 - Backend
```bash
cd core-api
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

---

## ✅ Step 8: Test the Application

1. **Frontend:** http://localhost:3000
2. **Backend API Docs:** http://localhost:8000/docs
3. **Supabase Dashboard:** https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe

---

## 🔐 Security Checklist

- [x] Anon key configured (already done)
- [ ] JWT Secret added to backend .env
- [ ] Service Role key added to backend .env
- [ ] Database connection string added
- [ ] .env files added to .gitignore (already configured)

---

## 📋 Environment Files Created

✅ **`core-api/.env`** - Backend configuration with your Supabase URL and anon key  
✅ **`frontend/.env.local`** - Frontend configuration with your Supabase credentials

**Note:** You still need to add:
- JWT Secret to `core-api/.env`
- Service Role Key to `core-api/.env`
- Database URL to `core-api/.env`

Get these from: https://supabase.com/dashboard/project/bfctvwjxlfkzeahmscbe/settings/api

---

## 🧪 Testing Authentication

1. Start both backend and frontend
2. Go to http://localhost:3000
3. Sign up with an email/password
4. Check Supabase Dashboard → **Authentication** → **Users** to see the new user
5. Try uploading an avatar
6. Create a reflection
7. Follow another user
8. Check notifications

---

## 🚀 Next Steps

1. **Run all migrations** in Supabase SQL Editor
2. **Get and add secrets** (JWT, Service Role, Database URL)
3. **Test authentication** and core features
4. **Deploy backend** to your hosting service
5. **Deploy frontend** to Vercel/Netlify
6. **Update ALLOWED_ORIGINS** in backend .env with your production URLs

---

## 📚 API Endpoints Available

Once deployed, these endpoints will be ready:

- `POST /api/profiles` - Create profile
- `PATCH /api/profiles/me` - Update profile
- `POST /api/profiles/upload-avatar` - Upload avatar
- `POST /api/reflections` - Create reflection
- `PATCH /api/reflections/{id}` - Edit reflection
- `GET /api/feed` - Get personalized feed
- `GET /api/notifications` - Get notifications
- `GET /api/search/reflections` - Search reflections
- `GET /api/search/profiles` - Search users
- `GET /lens/{lens_key}` - Lens pages (frontend route)

Full documentation: http://localhost:8000/docs

---

## 🆘 Troubleshooting

### Connection Issues
- Verify Supabase project is not paused
- Check firewall/network settings
- Confirm all environment variables are set

### Authentication Issues
- Verify JWT Secret matches Supabase
- Check token expiration settings
- Ensure anon key is correct

### Database Issues
- Confirm all migrations ran successfully
- Check RLS policies are enabled
- Verify connection string format

---

**Status:** ✅ Environment configured and ready for deployment!

**Your project is now connected to Supabase. Complete the setup steps above to start using The Mirror Virtual Platform.**
