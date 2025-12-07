-- Migration: Contact Form Submissions
-- Description: Create table for storing contact form submissions with proper validation
-- Created: 2025-12-07

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    ip_address INET,
    user_agent TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON public.contact_submissions(submitted_at DESC);

-- Add email validation constraint
ALTER TABLE public.contact_submissions 
ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_submissions_updated_at
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for anonymous users (form submission)
CREATE POLICY "Allow anonymous insert on contact_submissions"
    ON public.contact_submissions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow select for authenticated admins only
CREATE POLICY "Allow admin select on contact_submissions"
    ON public.contact_submissions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: Allow update for authenticated admins only
CREATE POLICY "Allow admin update on contact_submissions"
    ON public.contact_submissions
    FOR UPDATE
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

-- Create admin notification function (optional - for future use)
CREATE OR REPLACE FUNCTION notify_admin_new_contact()
RETURNS TRIGGER AS $$
BEGIN
    -- This can be extended to send email notifications
    -- For now, just log the event
    RAISE NOTICE 'New contact submission from: %', NEW.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_admin_on_contact
    AFTER INSERT ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_contact();

-- Add comments for documentation
COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from website visitors';
COMMENT ON COLUMN public.contact_submissions.status IS 'Submission status: new, read, replied, archived';
COMMENT ON COLUMN public.contact_submissions.ip_address IS 'IP address of submitter for spam prevention';
COMMENT ON COLUMN public.contact_submissions.user_agent IS 'Browser user agent for analytics';
