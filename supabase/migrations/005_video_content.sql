-- Migration: Video Content Management
-- Description: Create table for managing video backgrounds and media content
-- Created: 2025-12-07

-- Create video_content table
CREATE TABLE IF NOT EXISTS public.video_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    poster_url TEXT,
    section VARCHAR(100) NOT NULL CHECK (section IN ('hero', 'about', 'future', 'testimonials', 'custom')),
    aspect_ratio NUMERIC(5,4) DEFAULT 0.5625, -- 16:9 default
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    autoplay BOOLEAN DEFAULT true,
    loop BOOLEAN DEFAULT true,
    muted BOOLEAN DEFAULT true,
    playsinline BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_video_content_section ON public.video_content(section);
CREATE INDEX IF NOT EXISTS idx_video_content_active ON public.video_content(is_active);
CREATE INDEX IF NOT EXISTS idx_video_content_order ON public.video_content(display_order);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_video_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_content_updated_at
    BEFORE UPDATE ON public.video_content
    FOR EACH ROW
    EXECUTE FUNCTION update_video_content_updated_at();

-- Add RLS policies
ALTER TABLE public.video_content ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for active videos
CREATE POLICY "Allow public read on active videos"
    ON public.video_content
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Policy: Admin full access
CREATE POLICY "Allow admin full access on video_content"
    ON public.video_content
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Insert default video content (placeholders)
INSERT INTO public.video_content (title, description, video_url, poster_url, section, aspect_ratio, display_order)
VALUES 
    (
        'Hero Background Video',
        'Main hero section background video - temple reflection theme',
        '/videos/hero-video.mp4',
        '/images/hero-poster.jpg',
        'hero',
        0.5625,
        1
    ),
    (
        'About Section Video',
        'About The Mirror background video',
        '/videos/about-video.mp4',
        '/images/about-poster.jpg',
        'about',
        0.5250,
        2
    ),
    (
        'Future Vision Video',
        'What''s Next section background video - portrait format',
        '/videos/future-video.mp4',
        '/images/future-poster.jpg',
        'future',
        1.5000,
        3
    );

-- Add comments
COMMENT ON TABLE public.video_content IS 'Manages video backgrounds and media content for various sections';
COMMENT ON COLUMN public.video_content.section IS 'Section where video appears: hero, about, future, testimonials, custom';
COMMENT ON COLUMN public.video_content.aspect_ratio IS 'Video aspect ratio (height/width) for responsive sizing';
COMMENT ON COLUMN public.video_content.metadata IS 'Additional metadata in JSON format (duration, file_size, etc.)';
