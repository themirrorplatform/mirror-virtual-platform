-- =============================================================================
-- DATABASE TESTS - Mirror Virtual Platform
-- =============================================================================
-- Test Suite for PostgreSQL triggers, RLS policies, functions, and data integrity
-- Run with: psql -d mirror_test -f test_database.sql
-- =============================================================================

BEGIN;

-- Setup test schema
CREATE SCHEMA IF NOT EXISTS test;
SET search_path TO test, public;

-- =============================================================================
-- TEST 1: Trigger - Auto-create primary identity on profile creation
-- =============================================================================

CREATE OR REPLACE FUNCTION test_primary_identity_creation() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_identity_count INTEGER;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (gen_random_uuid(), 'test_trigger_user', 'Test User')
  RETURNING id INTO v_profile_id;

  -- Check if primary identity was created
  SELECT COUNT(*) INTO v_identity_count
  FROM public.identities
  WHERE profile_id = v_profile_id AND label = 'primary';

  ASSERT v_identity_count = 1, 'Primary identity not auto-created';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Primary identity auto-creation';
END;
$$ LANGUAGE plpgsql;

SELECT test_primary_identity_creation();

-- =============================================================================
-- TEST 2: Trigger - Auto-create data settings on identity creation
-- =============================================================================

CREATE OR REPLACE FUNCTION test_data_settings_creation() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_identity_id UUID;
  v_settings_count INTEGER;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_settings_user')
  RETURNING id INTO v_profile_id;

  -- Get the auto-created identity
  SELECT id INTO v_identity_id
  FROM public.identities
  WHERE profile_id = v_profile_id AND label = 'primary';

  -- Check if data settings were created
  SELECT COUNT(*) INTO v_settings_count
  FROM public.identity_data_settings
  WHERE identity_id = v_identity_id;

  ASSERT v_settings_count = 1, 'Data settings not auto-created';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Data settings auto-creation';
END;
$$ LANGUAGE plpgsql;

SELECT test_data_settings_creation();

-- =============================================================================
-- TEST 3: Trigger - Data event logging on reflection creation
-- =============================================================================

CREATE OR REPLACE FUNCTION test_reflection_data_event_logging() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_reflection_id BIGINT;
  v_event_count INTEGER;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_event_user')
  RETURNING id INTO v_profile_id;

  -- Create reflection
  INSERT INTO public.reflections (author_id, body, visibility)
  VALUES (v_profile_id, 'Test reflection for event logging', 'public')
  RETURNING id INTO v_reflection_id;

  -- Check if data event was logged
  SELECT COUNT(*) INTO v_event_count
  FROM public.data_events
  WHERE event_type = 'reflection_created'
    AND subject_id = v_reflection_id::text;

  ASSERT v_event_count = 1, 'Data event not logged';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Reflection data event logging';
END;
$$ LANGUAGE plpgsql;

SELECT test_reflection_data_event_logging();

-- =============================================================================
-- TEST 4: RLS Policy - Profiles viewable by everyone
-- =============================================================================

CREATE OR REPLACE FUNCTION test_rls_profiles_public() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_can_view BOOLEAN;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (gen_random_uuid(), 'test_public_profile', 'Public User')
  RETURNING id INTO v_profile_id;

  -- Try to view without authentication (simulated)
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = v_profile_id
  ) INTO v_can_view;

  ASSERT v_can_view = TRUE, 'Profile not viewable publicly';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Profiles are publicly viewable';
END;
$$ LANGUAGE plpgsql;

SELECT test_rls_profiles_public();

-- =============================================================================
-- TEST 5: RLS Policy - Users can only update own profile
-- =============================================================================

CREATE OR REPLACE FUNCTION test_rls_profile_ownership() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (gen_random_uuid(), 'test_owner_profile', 'Owner Test')
  RETURNING id INTO v_profile_id;

  -- This test would require setting auth.uid() in a real scenario
  -- For now, we verify the policy exists
  SELECT 1 FROM pg_policies
  WHERE policyname = 'Users can update their own profile'
    AND tablename = 'profiles';

  ASSERT FOUND, 'Profile ownership policy not found';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Profile ownership policy exists';
END;
$$ LANGUAGE plpgsql;

SELECT test_rls_profile_ownership();

-- =============================================================================
-- TEST 6: Data Integrity - Reflection visibility enum constraint
-- =============================================================================

CREATE OR REPLACE FUNCTION test_reflection_visibility_constraint() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_failed BOOLEAN := FALSE;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_enum_user')
  RETURNING id INTO v_profile_id;

  -- Try to insert invalid visibility
  BEGIN
    INSERT INTO public.reflections (author_id, body, visibility)
    VALUES (v_profile_id, 'Test', 'invalid_visibility');
  EXCEPTION
    WHEN OTHERS THEN
      v_failed := TRUE;
  END;

  ASSERT v_failed = TRUE, 'Invalid visibility was accepted';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Reflection visibility constraint enforced';
END;
$$ LANGUAGE plpgsql;

SELECT test_reflection_visibility_constraint();

-- =============================================================================
-- TEST 7: Data Integrity - Cannot follow yourself
-- =============================================================================

CREATE OR REPLACE FUNCTION test_follow_self_constraint() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_failed BOOLEAN := FALSE;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_self_follow')
  RETURNING id INTO v_profile_id;

  -- Try to follow yourself
  BEGIN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (v_profile_id, v_profile_id);
  EXCEPTION
    WHEN check_violation THEN
      v_failed := TRUE;
  END;

  ASSERT v_failed = TRUE, 'Self-follow was allowed';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Cannot follow yourself';
END;
$$ LANGUAGE plpgsql;

SELECT test_follow_self_constraint();

-- =============================================================================
-- TEST 8: Data Integrity - Identity axis value range (-1 to 1)
-- =============================================================================

CREATE OR REPLACE FUNCTION test_axis_value_range() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_axis_id BIGINT;
  v_failed BOOLEAN := FALSE;
BEGIN
  -- Create test profile and axis
  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_axis_user')
  RETURNING id INTO v_profile_id;

  INSERT INTO public.identity_axes (identity_id, key, label)
  VALUES (v_profile_id, 'test_axis', 'Test Axis')
  RETURNING id INTO v_axis_id;

  -- Try to insert value > 1
  BEGIN
    INSERT INTO public.identity_axis_values (axis_id, value)
    VALUES (v_axis_id, 1.5);
  EXCEPTION
    WHEN check_violation THEN
      v_failed := TRUE;
  END;

  ASSERT v_failed = TRUE, 'Axis value > 1 was accepted';

  -- Cleanup
  DELETE FROM public.profiles WHERE id = v_profile_id;

  RAISE NOTICE 'TEST PASSED: Axis value range constraint enforced';
END;
$$ LANGUAGE plpgsql;

SELECT test_axis_value_range();

-- =============================================================================
-- TEST 9: Foreign Key Cascade - Deleting profile deletes reflections
-- =============================================================================

CREATE OR REPLACE FUNCTION test_cascade_delete_reflections() RETURNS void AS $$
DECLARE
  v_profile_id UUID;
  v_reflection_count INTEGER;
BEGIN
  -- Create test profile
  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_cascade_user')
  RETURNING id INTO v_profile_id;

  -- Create reflections
  INSERT INTO public.reflections (author_id, body)
  VALUES (v_profile_id, 'Test reflection 1');
  INSERT INTO public.reflections (author_id, body)
  VALUES (v_profile_id, 'Test reflection 2');

  -- Delete profile
  DELETE FROM public.profiles WHERE id = v_profile_id;

  -- Check reflections were deleted
  SELECT COUNT(*) INTO v_reflection_count
  FROM public.reflections WHERE author_id = v_profile_id;

  ASSERT v_reflection_count = 0, 'Reflections not cascaded on profile delete';

  RAISE NOTICE 'TEST PASSED: Profile deletion cascades to reflections';
END;
$$ LANGUAGE plpgsql;

SELECT test_cascade_delete_reflections();

-- =============================================================================
-- TEST 10: Unique Constraint - Cannot duplicate follow relationship
-- =============================================================================

CREATE OR REPLACE FUNCTION test_unique_follow() RETURNS void AS $$
DECLARE
  v_profile1_id UUID;
  v_profile2_id UUID;
  v_failed BOOLEAN := FALSE;
BEGIN
  -- Create test profiles
  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_follower')
  RETURNING id INTO v_profile1_id;

  INSERT INTO public.profiles (id, username)
  VALUES (gen_random_uuid(), 'test_following')
  RETURNING id INTO v_profile2_id;

  -- Create follow
  INSERT INTO public.follows (follower_id, following_id)
  VALUES (v_profile1_id, v_profile2_id);

  -- Try to create duplicate
  BEGIN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (v_profile1_id, v_profile2_id);
  EXCEPTION
    WHEN unique_violation THEN
      v_failed := TRUE;
  END;

  ASSERT v_failed = TRUE, 'Duplicate follow was allowed';

  -- Cleanup
  DELETE FROM public.profiles WHERE id IN (v_profile1_id, v_profile2_id);

  RAISE NOTICE 'TEST PASSED: Follow unique constraint enforced';
END;
$$ LANGUAGE plpgsql;

SELECT test_unique_follow();

-- =============================================================================
-- TEST SUMMARY
-- =============================================================================

SELECT 'ALL DATABASE TESTS COMPLETED SUCCESSFULLY' AS test_summary;

ROLLBACK;  -- Rollback all test data
