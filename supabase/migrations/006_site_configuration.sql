-- Migration: Site Configuration and Settings
-- Description: Create table for managing website configuration and feature flags
-- Created: 2025-12-07

-- Create site_config table
CREATE TABLE IF NOT EXISTS public.site_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_site_config_key ON public.site_config(key);
CREATE INDEX IF NOT EXISTS idx_site_config_category ON public.site_config(category);
CREATE INDEX IF NOT EXISTS idx_site_config_public ON public.site_config(is_public);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_site_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER site_config_updated_at
    BEFORE UPDATE ON public.site_config
    FOR EACH ROW
    EXECUTE FUNCTION update_site_config_updated_at();

-- Add RLS policies
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for public configs only
CREATE POLICY "Allow public read on public configs"
    ON public.site_config
    FOR SELECT
    TO anon, authenticated
    USING (is_public = true);

-- Policy: Admin full access
CREATE POLICY "Allow admin full access on site_config"
    ON public.site_config
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

-- Insert default configuration values
INSERT INTO public.site_config (key, value, description, category, is_public)
VALUES 
    (
        'site_name',
        '"The Mirror Platform"'::jsonb,
        'Website name displayed in header and meta tags',
        'branding',
        true
    ),
    (
        'site_tagline',
        '"Reflection starts where the noise ceases"'::jsonb,
        'Main tagline for the platform',
        'branding',
        true
    ),
    (
        'contact_email',
        '"themirrorplatform@gmail.com"'::jsonb,
        'Primary contact email address',
        'contact',
        true
    ),
    (
        'contact_phone',
        '"(555) 123-4567"'::jsonb,
        'Contact phone number',
        'contact',
        true
    ),
    (
        'social_links',
        '{
            "facebook": "https://facebook.com/themirrorplatform",
            "linkedin": "https://linkedin.com/company/themirrorplatform",
            "twitter": "https://twitter.com/themirrorplatform",
            "instagram": "https://instagram.com/themirrorplatform",
            "youtube": "https://youtube.com/@themirrorplatform",
            "pinterest": "https://pinterest.com/themirrorplatform",
            "reddit": "https://reddit.com/r/themirrorplatform",
            "email": "themirrorplatform@gmail.com"
        }'::jsonb,
        'Social media links for footer and sharing',
        'social',
        true
    ),
    (
        'colors_primary_gold',
        '"#d6af36"'::jsonb,
        'Primary gold color from original website',
        'design',
        true
    ),
    (
        'colors_gold_soft',
        '"#cba35d"'::jsonb,
        'Soft gold accent color',
        'design',
        true
    ),
    (
        'fonts_headline',
        '"Work Sans"'::jsonb,
        'Font family for headlines (h1, h2, h3)',
        'design',
        true
    ),
    (
        'fonts_body',
        '"Inter"'::jsonb,
        'Font family for body text',
        'design',
        true
    ),
    (
        'feature_video_backgrounds',
        'true'::jsonb,
        'Enable video backgrounds on hero sections',
        'features',
        false
    ),
    (
        'feature_contact_form',
        'true'::jsonb,
        'Enable contact form submission',
        'features',
        false
    ),
    (
        'feature_recaptcha',
        'false'::jsonb,
        'Enable Google reCAPTCHA on contact form',
        'features',
        false
    ),
    (
        'recaptcha_site_key',
        '""'::jsonb,
        'Google reCAPTCHA site key (public)',
        'api_keys',
        true
    ),
    (
        'analytics_enabled',
        'false'::jsonb,
        'Enable Google Analytics tracking',
        'analytics',
        false
    );

-- Create helper function to get config value
CREATE OR REPLACE FUNCTION get_site_config(config_key VARCHAR)
RETURNS JSONB AS $$
DECLARE
    config_value JSONB;
BEGIN
    SELECT value INTO config_value
    FROM public.site_config
    WHERE key = config_key
    AND is_public = true;
    
    RETURN config_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.site_config IS 'Stores website configuration settings and feature flags';
COMMENT ON COLUMN public.site_config.is_public IS 'Whether this config is accessible to anonymous users';
COMMENT ON FUNCTION get_site_config IS 'Helper function to retrieve public configuration values';
