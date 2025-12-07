-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================
-- Add notifications for follows, mirrorbacks, and other interactions

CREATE TYPE notification_type AS ENUM (
  'follow',
  'mirrorback',
  'signal',
  'mention'
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id              bigserial PRIMARY KEY,
  recipient_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id        uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  reflection_id   bigint REFERENCES public.reflections(id) ON DELETE CASCADE,
  mirrorback_id   bigint REFERENCES public.mirrorbacks(id) ON DELETE CASCADE,
  is_read         boolean NOT NULL DEFAULT false,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_reflection ON public.notifications(reflection_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (recipient_id = auth.uid());

-- ============================================================================
-- SEARCH INDEXES
-- ============================================================================
-- Full-text search indexes for reflections and profiles

-- Add full-text search to reflections
CREATE INDEX IF NOT EXISTS idx_reflections_search 
  ON public.reflections 
  USING gin(to_tsvector('english', body));

-- Add full-text search to profiles
CREATE INDEX IF NOT EXISTS idx_profiles_search 
  ON public.profiles 
  USING gin(
    to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(bio, '') || ' ' || username)
  );

-- ============================================================================
-- AVATAR STORAGE BUCKET
-- ============================================================================
-- Create storage bucket for profile pictures

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
