-- Migration: Phase 2 Complete - Gallery, Analytics, Assets, Navigation
-- Description: Comprehensive migration for all Phase 2 features including gallery management,
--              site analytics, asset management, and navigation tracking
-- Created: 2025-12-07

-- ============================================================================
-- GALLERY MANAGEMENT SYSTEM
-- ============================================================================

-- Gallery collections table
CREATE TABLE IF NOT EXISTS public.gallery_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon identifier
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Gallery images table
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    caption TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    aspect_ratio NUMERIC(5,4) GENERATED ALWAYS AS (height::numeric / width::numeric) STORED,
    file_size INTEGER, -- bytes
    mime_type VARCHAR(100) DEFAULT 'image/jpeg',
    alt_text VARCHAR(500),
    collection_id UUID REFERENCES public.gallery_collections(id) ON DELETE SET NULL,
    tags TEXT[], -- array of tags for searching
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- exif, location, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id)
);

-- Gallery image views (for analytics)
CREATE TABLE IF NOT EXISTS public.gallery_image_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID REFERENCES public.gallery_images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SITE ANALYTICS SYSTEM
-- ============================================================================

-- Page views tracking
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_path VARCHAR(500) NOT NULL,
    page_title VARCHAR(500),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    device_type VARCHAR(50), -- desktop, mobile, tablet
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    duration_seconds INTEGER, -- time spent on page
    bounce BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for fast queries
    INDEX idx_page_views_path (page_path),
    INDEX idx_page_views_session (session_id),
    INDEX idx_page_views_viewed_at (viewed_at DESC)
);

-- User sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    landing_page VARCHAR(500),
    exit_page VARCHAR(500),
    page_count INTEGER DEFAULT 1,
    total_duration_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_started_at (started_at DESC)
);

-- Event tracking (clicks, interactions, etc)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name VARCHAR(255) NOT NULL,
    event_category VARCHAR(100), -- navigation, engagement, conversion, etc
    event_label VARCHAR(255),
    event_value NUMERIC,
    page_path VARCHAR(500),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_events_name (event_name),
    INDEX idx_events_category (event_category),
    INDEX idx_events_created_at (created_at DESC)
);

-- ============================================================================
-- SITE ASSETS MANAGEMENT
-- ============================================================================

-- Assets table for images, videos, documents
CREATE TABLE IF NOT EXISTS public.site_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('image', 'video', 'document', 'audio', 'other')),
    category VARCHAR(100), -- hero, gallery, icon, background, etc
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER, -- bytes
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_seconds INTEGER, -- for video/audio
    alt_text VARCHAR(500),
    tags TEXT[],
    is_public BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id),
    
    INDEX idx_site_assets_type (asset_type),
    INDEX idx_site_assets_category (category),
    INDEX idx_site_assets_public (is_public)
);

-- ============================================================================
-- NAVIGATION & MENU SYSTEM
-- ============================================================================

-- Navigation menus
CREATE TABLE IF NOT EXISTS public.navigation_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_name VARCHAR(100) UNIQUE NOT NULL, -- main, footer, mobile, etc
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Navigation items
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_id UUID REFERENCES public.navigation_menus(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE, -- for nested menus
    label VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    icon VARCHAR(50), -- icon identifier or emoji
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    open_in_new_tab BOOLEAN DEFAULT false,
    css_classes VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_navigation_items_menu_id (menu_id),
    INDEX idx_navigation_items_parent_id (parent_id),
    INDEX idx_navigation_items_order (display_order)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gallery_collections_featured ON public.gallery_collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_gallery_collections_order ON public.gallery_collections(display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_images_collection ON public.gallery_images(collection_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_published ON public.gallery_images(is_published);
CREATE INDEX IF NOT EXISTS idx_gallery_images_tags ON public.gallery_images USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_gallery_image_views_image ON public.gallery_image_views(image_id);
CREATE INDEX IF NOT EXISTS idx_gallery_image_views_viewed_at ON public.gallery_image_views(viewed_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Gallery collections updated_at
CREATE OR REPLACE FUNCTION update_gallery_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_collections_updated_at
    BEFORE UPDATE ON public.gallery_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_collections_updated_at();

-- Gallery images updated_at
CREATE OR REPLACE FUNCTION update_gallery_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gallery_images_updated_at
    BEFORE UPDATE ON public.gallery_images
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_images_updated_at();

-- Site assets updated_at
CREATE OR REPLACE FUNCTION update_site_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_assets_updated_at
    BEFORE UPDATE ON public.site_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_site_assets_updated_at();

-- Navigation menus updated_at
CREATE OR REPLACE FUNCTION update_navigation_menus_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER navigation_menus_updated_at
    BEFORE UPDATE ON public.navigation_menus
    FOR EACH ROW
    EXECUTE FUNCTION update_navigation_menus_updated_at();

-- Navigation items updated_at
CREATE OR REPLACE FUNCTION update_navigation_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER navigation_items_updated_at
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW
    EXECUTE FUNCTION update_navigation_items_updated_at();

-- Update image count in collections
CREATE OR REPLACE FUNCTION update_collection_image_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.gallery_collections
        SET image_count = image_count + 1
        WHERE id = NEW.collection_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.gallery_collections
        SET image_count = image_count - 1
        WHERE id = OLD.collection_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.collection_id != NEW.collection_id THEN
        UPDATE public.gallery_collections
        SET image_count = image_count - 1
        WHERE id = OLD.collection_id;
        UPDATE public.gallery_collections
        SET image_count = image_count + 1
        WHERE id = NEW.collection_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collection_count
    AFTER INSERT OR UPDATE OR DELETE ON public.gallery_images
    FOR EACH ROW
    EXECUTE FUNCTION update_collection_image_count();

-- Update view count on gallery images
CREATE OR REPLACE FUNCTION update_gallery_image_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.gallery_images
    SET view_count = view_count + 1
    WHERE id = NEW.image_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_image_views
    AFTER INSERT ON public.gallery_image_views
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_image_view_count();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Gallery collections
ALTER TABLE public.gallery_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on gallery collections"
    ON public.gallery_collections FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Admin full access on gallery collections"
    ON public.gallery_collections FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Gallery images
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on published gallery images"
    ON public.gallery_images FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

CREATE POLICY "Admin full access on gallery images"
    ON public.gallery_images FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Gallery image views
ALTER TABLE public.gallery_image_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert on gallery_image_views"
    ON public.gallery_image_views FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admin read access on gallery_image_views"
    ON public.gallery_image_views FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Page views
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert on page_views"
    ON public.page_views FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admin read access on page_views"
    ON public.page_views FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- User sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert/update on user_sessions"
    ON public.user_sessions FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert on events"
    ON public.events FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admin read access on events"
    ON public.events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Site assets
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on public assets"
    ON public.site_assets FOR SELECT
    TO anon, authenticated
    USING (is_public = true);

CREATE POLICY "Admin full access on site_assets"
    ON public.site_assets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Navigation
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on navigation_menus"
    ON public.navigation_menus FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Public read access on navigation_items"
    ON public.navigation_items FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admin full access on navigation_menus"
    ON public.navigation_menus FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admin full access on navigation_items"
    ON public.navigation_items FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Create default navigation menus
INSERT INTO public.navigation_menus (menu_name, is_active)
VALUES 
    ('main', true),
    ('footer', true),
    ('mobile', true)
ON CONFLICT (menu_name) DO NOTHING;

-- Insert main navigation items
DO $$
DECLARE
    main_menu_id UUID;
BEGIN
    SELECT id INTO main_menu_id FROM public.navigation_menus WHERE menu_name = 'main';
    
    INSERT INTO public.navigation_items (menu_id, label, url, display_order, is_active)
    VALUES 
        (main_menu_id, 'The Mirror', '/', 1, true),
        (main_menu_id, 'About The Mirror', '/about', 2, true),
        (main_menu_id, 'The Mirror Provides', '/provides', 3, true),
        (main_menu_id, 'Future of The Mirror', '/future', 4, true),
        (main_menu_id, 'Gallery', '/gallery', 5, true)
    ON CONFLICT DO NOTHING;
END $$;

-- Create default gallery collections
INSERT INTO public.gallery_collections (title, slug, description, icon, is_featured, display_order)
VALUES 
    ('Dawn & Dusk', 'dawn-dusk', 'Liminal moments between day and night, symbolic of transformation', '🌅', true, 1),
    ('Sacred Spaces', 'sacred-spaces', 'Architecture designed for contemplation across cultures and centuries', '🏛️', true, 2),
    ('Water & Light', 'water-light', 'The original mirror—how water has reflected humanity for millennia', '🌊', true, 3),
    ('Urban Reflections', 'urban-reflections', 'Finding stillness in the city', '🏙️', false, 4),
    ('Natural Mirrors', 'natural-mirrors', 'Nature as the ultimate reflection', '🌲', false, 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get popular gallery images
CREATE OR REPLACE FUNCTION get_popular_gallery_images(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    image_url TEXT,
    view_count INTEGER,
    collection_title VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gi.id,
        gi.title,
        gi.image_url,
        gi.view_count,
        gc.title as collection_title
    FROM public.gallery_images gi
    LEFT JOIN public.gallery_collections gc ON gi.collection_id = gc.id
    WHERE gi.is_published = true
    ORDER BY gi.view_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get page analytics summary
CREATE OR REPLACE FUNCTION get_page_analytics(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    page_path VARCHAR,
    view_count BIGINT,
    unique_visitors BIGINT,
    avg_duration_seconds NUMERIC,
    bounce_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.page_path,
        COUNT(*) as view_count,
        COUNT(DISTINCT pv.session_id) as unique_visitors,
        AVG(pv.duration_seconds)::NUMERIC(10,2) as avg_duration_seconds,
        (COUNT(*) FILTER (WHERE pv.bounce = true)::NUMERIC / COUNT(*)::NUMERIC * 100)::NUMERIC(5,2) as bounce_rate
    FROM public.page_views pv
    WHERE pv.viewed_at BETWEEN start_date AND end_date
    GROUP BY pv.page_path
    ORDER BY view_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.gallery_collections IS 'Organized collections of gallery images with metadata';
COMMENT ON TABLE public.gallery_images IS 'Individual gallery images with full metadata and tracking';
COMMENT ON TABLE public.gallery_image_views IS 'Tracks views on gallery images for analytics';
COMMENT ON TABLE public.page_views IS 'Detailed page view tracking for analytics';
COMMENT ON TABLE public.user_sessions IS 'User session aggregation for behavior analysis';
COMMENT ON TABLE public.events IS 'Custom event tracking for user interactions';
COMMENT ON TABLE public.site_assets IS 'Centralized asset management for all site media';
COMMENT ON TABLE public.navigation_menus IS 'Navigation menu definitions (main, footer, mobile)';
COMMENT ON TABLE public.navigation_items IS 'Individual navigation menu items with hierarchy support';

COMMENT ON FUNCTION get_popular_gallery_images IS 'Returns most viewed gallery images';
COMMENT ON FUNCTION get_page_analytics IS 'Returns page analytics summary for date range';
