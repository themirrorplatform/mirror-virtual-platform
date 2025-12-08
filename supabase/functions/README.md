# Supabase Edge Functions - Deployment Guide

## Overview
Complete Edge Functions setup for The Mirror Platform, including database triggers, scheduled jobs, webhooks, and realtime broadcasts.

## 📋 Prerequisites

1. **Supabase CLI** installed:
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** configured:
   ```bash
   supabase link --project-ref enfjnqfppfhofredyxyg
   ```

3. **Environment Variables** set up in Supabase Dashboard:
   - Go to Project Settings > Edge Functions
   - Add all variables from `.env.example`

## 🚀 Deployment

### Deploy All Functions
```bash
cd supabase/functions
supabase functions deploy
```

### Deploy Individual Function
```bash
supabase functions deploy send-contact-notification
supabase functions deploy process-reflection
supabase functions deploy sync-user-profile
supabase functions deploy broadcast-reflection
supabase functions deploy analytics-aggregator
supabase functions deploy cleanup-sessions
supabase functions deploy webhook-handler
```

## 🔧 Function Configuration

### 1. send-contact-notification
**Trigger:** Database trigger on `contact_submissions` INSERT  
**Purpose:** Sends email notification to admin when contact form is submitted  
**Environment Variables:**
- `RESEND_API_KEY` (required)
- `ADMIN_EMAIL` (optional, defaults to admin@themirrorplatform.online)

**Database Trigger Setup:**
```sql
CREATE OR REPLACE FUNCTION notify_contact_submission()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/send-contact-notification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      body := jsonb_build_object('record', to_jsonb(NEW), 'type', 'INSERT')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_contact_submission_created
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_submission();
```

### 2. process-reflection
**Trigger:** API call from frontend  
**Purpose:** Saves reflection and triggers AI mirrorback generation  
**Environment Variables:**
- `MIRRORX_API_URL` (required)

**Usage:**
```typescript
const response = await fetch(
  'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/process-reflection',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      user_id: user.id,
      reflection_text: 'My reflection...',
      thread_id: 'optional-thread-id',
      tone: 'adaptive'
    })
  }
);
```

### 3. sync-user-profile
**Trigger:** Database trigger on `auth.users` INSERT  
**Purpose:** Auto-creates profile when user signs up  

**Database Trigger Setup:**
```sql
CREATE OR REPLACE FUNCTION sync_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/sync-user-profile',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      body := jsonb_build_object('record', to_jsonb(NEW), 'type', 'INSERT')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_on_signup();
```

### 4. broadcast-reflection
**Trigger:** Database trigger on `reflections` INSERT/UPDATE  
**Purpose:** Broadcasts reflection events to realtime channels  

**Database Trigger Setup:**
```sql
CREATE OR REPLACE FUNCTION broadcast_reflection_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/broadcast-reflection',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
      body := jsonb_build_object('record', to_jsonb(NEW), 'type', TG_OP)
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reflection_created_or_updated
  AFTER INSERT OR UPDATE ON public.reflections
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_reflection_event();
```

### 5. analytics-aggregator
**Trigger:** Cron schedule (daily at 2 AM UTC)  
**Purpose:** Computes daily analytics summaries  

**Schedule Setup:**
```bash
supabase functions schedule analytics-aggregator --cron "0 2 * * *"
```

**Manual Trigger:**
```bash
curl -X POST https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/analytics-aggregator?days=30 \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 6. cleanup-sessions
**Trigger:** Cron schedule (weekly on Sunday at 3 AM UTC)  
**Purpose:** Removes old sessions and analytics data (>90 days)  

**Schedule Setup:**
```bash
supabase functions schedule cleanup-sessions --cron "0 3 * * 0"
```

### 7. webhook-handler
**Trigger:** External webhook POST  
**Purpose:** Generic webhook receiver for external integrations  
**Environment Variables:**
- `WEBHOOK_SECRET` (optional, for signature verification)

**Usage:**
```bash
curl -X POST https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/webhook-handler \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: signature_here" \
  -d '{"type": "payment.success", "data": {...}}'
```

## 🔐 Security Setup

### Set Service Role Key (Required for Database Triggers)
```sql
-- Run this in your Supabase SQL Editor
ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key_here';
```

### Enable HTTP Extension (Required for Trigger Functions)
```sql
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
```

## 📊 Monitoring

### View Function Logs
```bash
supabase functions logs send-contact-notification
supabase functions logs process-reflection --follow
```

### View All Functions
```bash
supabase functions list
```

## 🧪 Testing

### Test Locally
```bash
supabase functions serve send-contact-notification --env-file .env
```

### Test with Curl
```bash
# Test send-contact-notification
curl -X POST http://localhost:54321/functions/v1/send-contact-notification \
  -H "Content-Type: application/json" \
  -d '{"record": {"id": "1", "name": "Test", "email": "test@test.com", "subject": "Test", "message": "Test message"}}'
```

## 📝 Migration SQL

Create a new migration file to set up all database triggers:

```bash
supabase migration new setup_edge_function_triggers
```

Copy the SQL from `edge_function_triggers.sql` into the new migration file.

## 🚨 Troubleshooting

### Function Not Deploying
- Ensure you're linked to the correct project: `supabase link --project-ref enfjnqfppfhofredyxyg`
- Check environment variables in Supabase Dashboard
- Verify Deno is accessible: `deno --version`

### Triggers Not Firing
- Ensure HTTP extension is enabled: `CREATE EXTENSION http;`
- Verify service role key is set in database settings
- Check function logs for errors

### CORS Issues
- Edge Functions automatically handle CORS
- For custom CORS, use the `cors` import in import_map.json

## 📚 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Mirror Platform Documentation](../README.md)

## ✅ Post-Deployment Checklist

- [ ] All functions deployed successfully
- [ ] Environment variables configured in Supabase Dashboard
- [ ] Database triggers created for automated functions
- [ ] Cron schedules set for analytics-aggregator and cleanup-sessions
- [ ] HTTP extension enabled in database
- [ ] Service role key configured in database settings
- [ ] Test each function with sample data
- [ ] Monitor logs for errors
- [ ] Update frontend to use new Edge Functions endpoints
