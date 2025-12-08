# Quick Start: Mirror OS Migration

## Apply Migration 010

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy/paste contents of `supabase/migrations/010_mirror_os_compatibility.sql`
5. Click **Run**

### Option 2: Supabase CLI
```bash
# From project root
supabase db push

# Or apply specific migration
supabase db reset --db-url "postgresql://..."
```

### Option 3: Direct psql
```bash
# Using psql
psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  -f supabase/migrations/010_mirror_os_compatibility.sql
```

## Verify Migration

### Check Tables Created
```sql
-- Should show 15 new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'identities',
    'thread_reflections',
    'connections',
    'reaction_events',
    'self_claims',
    'tensions',
    'tension_feedback',
    'identity_signals',
    'external_sources',
    'external_artifacts',
    'external_to_reflections',
    'data_policies',
    'identity_data_settings',
    'data_events'
  )
ORDER BY table_name;
```

### Check Enum Types Created
```sql
-- Should show 6 new enum types
SELECT typname 
FROM pg_type 
WHERE typname IN (
  'connection_type',
  'reaction_type',
  'target_type',
  'tension_type',
  'link_type'
)
ORDER BY typname;
```

### Check Triggers Active
```sql
-- Should show 3 triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_profile_created',
  'on_identity_created',
  'on_reflection_created'
)
ORDER BY trigger_name;
```

### Check RLS Enabled
```sql
-- Should show all new tables with RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'identities',
    'connections',
    'reaction_events',
    'self_claims',
    'tensions'
  )
ORDER BY tablename;
```

## Test Basic Functionality

### 1. Create Test Profile (if not exists)
```sql
-- Insert test profile (will auto-create primary identity)
INSERT INTO public.profiles (id, username, display_name)
VALUES (
  auth.uid(), -- Or use a test UUID
  'test_user',
  'Test User'
)
ON CONFLICT (id) DO NOTHING;
```

### 2. Verify Primary Identity Created
```sql
-- Should return one identity with label='primary'
SELECT * FROM public.identities
WHERE profile_id = auth.uid();
```

### 3. Verify Data Settings Created
```sql
-- Should return one settings record
SELECT * FROM public.identity_data_settings ids
JOIN public.identities i ON i.id = ids.identity_id
WHERE i.profile_id = auth.uid();
```

### 4. Check Data Policies Inserted
```sql
-- Should return 4 policies
SELECT policy_key, description
FROM public.data_policies
ORDER BY policy_key;
```

## Expected Results

✅ **Tables**: 15 new tables created  
✅ **Enums**: 6 new enum types  
✅ **Triggers**: 3 auto-triggers active  
✅ **RLS**: All tables secured  
✅ **Policies**: 4 foundational policies  
✅ **Indexes**: 47+ indexes created  

## Rollback (if needed)

```sql
-- Drop all new tables (CASCADE will remove dependencies)
DROP TABLE IF EXISTS public.data_events CASCADE;
DROP TABLE IF EXISTS public.identity_data_settings CASCADE;
DROP TABLE IF EXISTS public.data_policies CASCADE;
DROP TABLE IF EXISTS public.external_to_reflections CASCADE;
DROP TABLE IF EXISTS public.external_artifacts CASCADE;
DROP TABLE IF EXISTS public.external_sources CASCADE;
DROP TABLE IF EXISTS public.identity_signals CASCADE;
DROP TABLE IF EXISTS public.tension_feedback CASCADE;
DROP TABLE IF EXISTS public.tensions CASCADE;
DROP TABLE IF EXISTS public.self_claims CASCADE;
DROP TABLE IF EXISTS public.reaction_events CASCADE;
DROP TABLE IF EXISTS public.connections CASCADE;
DROP TABLE IF EXISTS public.thread_reflections CASCADE;
DROP TABLE IF EXISTS public.identities CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS link_type CASCADE;
DROP TYPE IF EXISTS regression_type CASCADE;
DROP TYPE IF EXISTS tension_type CASCADE;
DROP TYPE IF EXISTS target_type CASCADE;
DROP TYPE IF EXISTS reaction_type CASCADE;
DROP TYPE IF EXISTS connection_type CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP TRIGGER IF EXISTS on_identity_created ON public.identities;
DROP TRIGGER IF EXISTS on_reflection_created ON public.reflections;
DROP TRIGGER IF EXISTS update_identity_signals_updated_at ON public.identity_signals;

-- Drop functions
DROP FUNCTION IF EXISTS create_primary_identity() CASCADE;
DROP FUNCTION IF EXISTS create_identity_data_settings() CASCADE;
DROP FUNCTION IF EXISTS log_reflection_created() CASCADE;
```

## Troubleshooting

### Issue: "relation already exists"
**Cause**: Migration already applied  
**Solution**: Migration is idempotent, safe to re-run

### Issue: "column identity_id does not exist on reflections"
**Cause**: Column addition failed  
**Solution**: Manually add:
```sql
ALTER TABLE public.reflections
ADD COLUMN IF NOT EXISTS identity_id UUID REFERENCES public.identities(id) ON DELETE SET NULL;
```

### Issue: "trigger already exists"
**Cause**: Triggers from previous migration  
**Solution**: Drop and recreate:
```sql
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_primary_identity();
```

## Next Steps

1. **Backend APIs**: Create routers for new tables
   - `connections.py` - Identity relationships
   - `reactions.py` - Rich reactions
   - `tensions.py` - Tension management

2. **Frontend Components**: Build UI for new features
   - `IdentitySelector.tsx` - Switch identities
   - `ReactionButtons.tsx` - Rich reactions
   - `TensionExplorer.tsx` - View tensions

3. **Testing**: Verify end-to-end workflows
   - Create reflection → Check data_events log
   - Create profile → Verify identity auto-created
   - Test RLS policies → Ensure data isolation

---

**Documentation**: See `MIRROR_OS_COMPATIBILITY.md` for full analysis  
**Migration**: `supabase/migrations/010_mirror_os_compatibility.sql`  
**Status**: ✅ Production Ready
