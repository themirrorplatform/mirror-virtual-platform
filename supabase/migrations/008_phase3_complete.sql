-- Migration: Phase 3 Complete - Contact Forms, Email Queue, Admin Tools
-- Description: Contact form submissions, email notification system, admin dashboard,
--              and additional utilities for Phase 3 completion
-- Created: 2025-12-07

-- ============================================================================
-- CONTACT & COMMUNICATION SYSTEM
-- ============================================================================

-- Contact form submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(500) DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'spam', 'archived')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    
    INDEX idx_contact_submissions_status (status),
    INDEX idx_contact_submissions_email (email),
    INDEX idx_contact_submissions_created_at (created_at DESC)
);

-- Email queue for sending notifications
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    from_email VARCHAR(255) DEFAULT 'noreply@themirrorplatform.com',
    reply_to VARCHAR(255),
    subject VARCHAR(500) NOT NULL,
    body_text TEXT,
    body_html TEXT,
    template_name VARCHAR(100),
    template_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_email_queue_status (status),
    INDEX idx_email_queue_scheduled (scheduled_for),
    INDEX idx_email_queue_priority (priority)
);

-- Email templates
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_text TEXT NOT NULL,
    body_html TEXT NOT NULL,
    variables TEXT[], -- List of available template variables
    category VARCHAR(100), -- welcome, notification, marketing, etc
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- ADMIN & MODERATION SYSTEM
-- ============================================================================

-- Admin activity log
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- create, update, delete, approve, reject, etc
    resource_type VARCHAR(100) NOT NULL, -- user, post, comment, submission, etc
    resource_id UUID,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_admin_activity_admin (admin_id),
    INDEX idx_admin_activity_resource (resource_type, resource_id),
    INDEX idx_admin_activity_created_at (created_at DESC)
);

-- Feature flags for gradual rollout
CREATE TABLE IF NOT EXISTS public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    conditions JSONB DEFAULT '{}', -- user_role, user_id, etc
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Site configuration
CREATE TABLE IF NOT EXISTS public.site_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    value_type VARCHAR(50) DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
    category VARCHAR(100), -- general, email, analytics, features, etc
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false, -- Hide from logs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- WAITLIST & BETA ACCESS
-- ============================================================================

-- Waitlist for beta access
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    source VARCHAR(100), -- website, referral, event, etc
    referrer_id UUID REFERENCES public.waitlist(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'accepted', 'declined', 'removed')),
    priority INTEGER DEFAULT 5,
    metadata JSONB DEFAULT '{}',
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_waitlist_status (status),
    INDEX idx_waitlist_created_at (created_at)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_contact_submissions_assigned ON public.contact_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_email_queue_to_email ON public.email_queue(to_email);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON public.admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_site_config_category ON public.site_config(category);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================================================

-- Contact submissions updated_at
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status != OLD.status AND NEW.status = 'read' THEN
        NEW.read_at = NOW();
    END IF;
    IF NEW.status != OLD.status AND NEW.status = 'replied' THEN
        NEW.replied_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Email queue updated_at
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status != OLD.status AND NEW.status = 'sent' THEN
        NEW.sent_at = NOW();
    END IF;
    IF NEW.status = 'failed' THEN
        NEW.attempts = NEW.attempts + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_queue_updated_at
    BEFORE UPDATE ON public.email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_email_queue_updated_at();

-- Email templates updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
    BEFORE UPDATE ON public.email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_email_templates_updated_at();

-- Feature flags updated_at
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

-- Site config updated_at
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

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Contact submissions
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert on contact_submissions"
    ON public.contact_submissions FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admin full access on contact_submissions"
    ON public.contact_submissions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Email queue
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on email_queue"
    ON public.email_queue FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Email templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on email_templates"
    ON public.email_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Admin activity log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read access on admin_activity_log"
    ON public.admin_activity_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System insert on admin_activity_log"
    ON public.admin_activity_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Feature flags
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on active feature_flags"
    ON public.feature_flags FOR SELECT
    TO anon, authenticated
    USING (is_enabled = true);

CREATE POLICY "Admin full access on feature_flags"
    ON public.feature_flags FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Site config
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read on non-sensitive site_config"
    ON public.site_config FOR SELECT
    TO anon, authenticated
    USING (is_sensitive = false);

CREATE POLICY "Admin full access on site_config"
    ON public.site_config FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Waitlist
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert on waitlist"
    ON public.waitlist FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admin full access on waitlist"
    ON public.waitlist FOR ALL
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

-- Default email templates
INSERT INTO public.email_templates (name, subject, body_text, body_html, variables, category)
VALUES 
    (
        'contact_confirmation',
        'Thank you for contacting The Mirror',
        'Hi {{name}},

Thank you for reaching out to The Mirror. We have received your message and will get back to you within 24-48 hours.

Your message:
{{message}}

Best regards,
The Mirror Team',
        '<p>Hi {{name}},</p><p>Thank you for reaching out to The Mirror. We have received your message and will get back to you within 24-48 hours.</p><p><strong>Your message:</strong><br>{{message}}</p><p>Best regards,<br>The Mirror Team</p>',
        ARRAY['name', 'email', 'message'],
        'notification'
    ),
    (
        'admin_new_contact',
        'New Contact Form Submission',
        'New contact form submission received:

Name: {{name}}
Email: {{email}}
Phone: {{phone}}
Subject: {{subject}}

Message:
{{message}}

View in admin: {{admin_url}}',
        '<h2>New Contact Form Submission</h2><p><strong>Name:</strong> {{name}}<br><strong>Email:</strong> {{email}}<br><strong>Phone:</strong> {{phone}}<br><strong>Subject:</strong> {{subject}}</p><p><strong>Message:</strong><br>{{message}}</p><p><a href="{{admin_url}}">View in admin</a></p>',
        ARRAY['name', 'email', 'phone', 'subject', 'message', 'admin_url'],
        'notification'
    ),
    (
        'waitlist_invite',
        'You''re invited to join The Mirror',
        'Hi {{name}},

Great news! You''re invited to join The Mirror platform.

Click here to accept your invitation: {{invite_url}}

This invitation expires in 7 days.

We''re excited to have you join us.

Best,
The Mirror Team',
        '<p>Hi {{name}},</p><p>Great news! You''re invited to join The Mirror platform.</p><p><a href="{{invite_url}}" style="background-color: #d6af36; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block; margin: 20px 0;">Accept Invitation</a></p><p>This invitation expires in 7 days.</p><p>We''re excited to have you join us.</p><p>Best,<br>The Mirror Team</p>',
        ARRAY['name', 'email', 'invite_url'],
        'invitation'
    )
ON CONFLICT (name) DO NOTHING;

-- Default site configuration
INSERT INTO public.site_config (key, value, value_type, category, description)
VALUES 
    ('site_name', 'The Mirror', 'string', 'general', 'Website name'),
    ('site_url', 'https://themirrorplatform.com', 'string', 'general', 'Website URL'),
    ('contact_email', 'contact@themirrorplatform.com', 'string', 'general', 'Main contact email'),
    ('admin_email', 'admin@themirrorplatform.com', 'string', 'general', 'Admin notification email'),
    ('enable_analytics', 'true', 'boolean', 'analytics', 'Enable analytics tracking'),
    ('enable_contact_form', 'true', 'boolean', 'features', 'Enable contact form submissions'),
    ('enable_waitlist', 'true', 'boolean', 'features', 'Enable waitlist signups'),
    ('max_contact_rate_limit', '5', 'number', 'security', 'Max contact form submissions per hour per IP'),
    ('recaptcha_site_key', '', 'string', 'security', 'Google reCAPTCHA site key'),
    ('recaptcha_secret_key', '', 'string', 'security', 'Google reCAPTCHA secret key (sensitive)', true)
ON CONFLICT (key) DO NOTHING;

-- Default feature flags
INSERT INTO public.feature_flags (name, description, is_enabled, rollout_percentage)
VALUES 
    ('gallery_enabled', 'Enable public gallery feature', true, 100),
    ('ai_assistant', 'Enable MirrorX AI assistant', false, 0),
    ('social_features', 'Enable social sharing and interactions', false, 0),
    ('premium_features', 'Enable premium tier features', false, 0),
    ('beta_access', 'Enable beta access features', false, 10)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get pending email queue
CREATE OR REPLACE FUNCTION get_pending_emails(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    to_email VARCHAR,
    subject VARCHAR,
    scheduled_for TIMESTAMPTZ,
    priority INTEGER,
    attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        eq.id,
        eq.to_email,
        eq.subject,
        eq.scheduled_for,
        eq.priority,
        eq.attempts
    FROM public.email_queue eq
    WHERE eq.status = 'pending'
      AND eq.scheduled_for <= NOW()
      AND eq.attempts < eq.max_attempts
    ORDER BY eq.priority ASC, eq.scheduled_for ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get contact submission stats
CREATE OR REPLACE FUNCTION get_contact_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    status VARCHAR,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.status,
        COUNT(*) as count
    FROM public.contact_submissions cs
    WHERE cs.created_at BETWEEN start_date AND end_date
    GROUP BY cs.status
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check feature flag
CREATE OR REPLACE FUNCTION is_feature_enabled(feature_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    enabled BOOLEAN;
BEGIN
    SELECT is_enabled INTO enabled
    FROM public.feature_flags
    WHERE name = feature_name;
    
    RETURN COALESCE(enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.contact_submissions IS 'Contact form submissions from website visitors';
COMMENT ON TABLE public.email_queue IS 'Queue for sending transactional and notification emails';
COMMENT ON TABLE public.email_templates IS 'Reusable email templates with variable substitution';
COMMENT ON TABLE public.admin_activity_log IS 'Audit log of admin actions for security and compliance';
COMMENT ON TABLE public.feature_flags IS 'Feature toggles for gradual rollout and A/B testing';
COMMENT ON TABLE public.site_config IS 'Centralized site configuration key-value store';
COMMENT ON TABLE public.waitlist IS 'Beta access waitlist with referral tracking';

COMMENT ON FUNCTION get_pending_emails IS 'Returns emails ready to be sent from queue';
COMMENT ON FUNCTION get_contact_stats IS 'Returns contact submission statistics by status';
COMMENT ON FUNCTION is_feature_enabled IS 'Checks if a feature flag is enabled';
