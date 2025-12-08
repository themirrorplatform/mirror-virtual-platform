-- ============================================================================
-- Edge Functions Database Triggers Setup
-- The Mirror Platform - Supabase Integration
-- ============================================================================

-- Enable HTTP extension for calling Edge Functions from database
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Store service role key for Edge Function authentication
-- IMPORTANT: Replace with your actual service role key
ALTER DATABASE postgres SET app.settings.service_role_key = 'your_service_role_key_here';

-- ============================================================================
-- 1. Contact Submission Notification Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_contact_submission()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT := 'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/send-contact-notification';
  service_key TEXT;
BEGIN
  -- Get service role key from settings
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Call Edge Function asynchronously
  PERFORM
    extensions.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record', to_jsonb(NEW),
        'type', 'INSERT'
      )
    );
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to call send-contact-notification function: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_contact_submission_created ON public.contact_submissions;
CREATE TRIGGER on_contact_submission_created
  AFTER INSERT ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_submission();

COMMENT ON FUNCTION notify_contact_submission IS 'Triggers Edge Function to send email notification on contact form submission';

-- ============================================================================
-- 2. User Profile Sync Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_user_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT := 'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/sync-user-profile';
  service_key TEXT;
BEGIN
  -- Get service role key from settings
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Call Edge Function to create profile
  PERFORM
    extensions.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record', to_jsonb(NEW),
        'type', 'INSERT'
      )
    );
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call sync-user-profile function: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_on_signup();

COMMENT ON FUNCTION sync_user_profile_on_signup IS 'Triggers Edge Function to create user profile on auth signup';

-- ============================================================================
-- 3. Reflection Broadcast Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION broadcast_reflection_event()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT := 'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/broadcast-reflection';
  service_key TEXT;
  operation TEXT;
BEGIN
  -- Get service role key from settings
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Determine operation type
  operation := TG_OP;
  
  -- Call Edge Function for realtime broadcast
  PERFORM
    extensions.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := jsonb_build_object(
        'record', to_jsonb(NEW),
        'type', operation
      )
    );
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call broadcast-reflection function: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_reflection_created_or_updated ON public.reflections;
CREATE TRIGGER on_reflection_created_or_updated
  AFTER INSERT OR UPDATE ON public.reflections
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_reflection_event();

COMMENT ON FUNCTION broadcast_reflection_event IS 'Triggers Edge Function to broadcast reflection events to realtime channels';

-- ============================================================================
-- 4. Helper Function: Call Edge Function
-- ============================================================================

CREATE OR REPLACE FUNCTION call_edge_function(
  function_name TEXT,
  payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  function_url TEXT;
  service_key TEXT;
  response JSONB;
BEGIN
  -- Build function URL
  function_url := 'https://enfjnqfppfhofredyxyg.supabase.co/functions/v1/' || function_name;
  
  -- Get service role key
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Make HTTP request
  SELECT INTO response
    content::jsonb
  FROM
    extensions.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_key
      ),
      body := payload::text
    );
    
  RETURN response;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call Edge Function %: %', function_name, SQLERRM;
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION call_edge_function IS 'Generic helper to call any Edge Function from database';

-- ============================================================================
-- 5. Test Functions
-- ============================================================================

-- Test contact notification (run manually after setup)
-- SELECT notify_contact_submission() with a test record

-- Test profile sync (run manually after setup)
-- SELECT sync_user_profile_on_signup() with a test record

-- Test reflection broadcast (run manually after setup)
-- SELECT broadcast_reflection_event() with a test record

-- Test generic edge function caller
-- SELECT call_edge_function('analytics-aggregator', '{"days": 7}'::jsonb);

-- ============================================================================
-- 6. Grants and Permissions
-- ============================================================================

-- Grant execute permissions on trigger functions to postgres role
GRANT EXECUTE ON FUNCTION notify_contact_submission() TO postgres;
GRANT EXECUTE ON FUNCTION sync_user_profile_on_signup() TO postgres;
GRANT EXECUTE ON FUNCTION broadcast_reflection_event() TO postgres;
GRANT EXECUTE ON FUNCTION call_edge_function(TEXT, JSONB) TO postgres, authenticated;

-- ============================================================================
-- Post-Setup Instructions
-- ============================================================================

-- 1. Replace 'your_service_role_key_here' with your actual service role key:
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'eyJhbGc...';

-- 2. Deploy all Edge Functions:
--    supabase functions deploy

-- 3. Verify triggers are working:
--    INSERT INTO contact_submissions (...) VALUES (...);
--    Check Edge Function logs

-- 4. Set up cron schedules:
--    supabase functions schedule analytics-aggregator --cron "0 2 * * *"
--    supabase functions schedule cleanup-sessions --cron "0 3 * * 0"
