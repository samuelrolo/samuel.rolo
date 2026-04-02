-- =====================================================================
-- SHARE2INSPIRE - JOB CONTACTS & FOLLOW-UP REMINDERS
-- Tabela para associar recrutadores/hiring managers a vagas guardadas
-- com lembretes de follow-up
--
-- Created: 2026-04-02
-- Purpose: Networking contacts linked to saved jobs pipeline
-- =====================================================================

-- Create job_contacts table
CREATE TABLE IF NOT EXISTS public.job_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.saved_jobs(id) ON DELETE SET NULL,
    
    -- Contact info
    name TEXT NOT NULL,
    role TEXT,                          -- e.g. 'Recrutador', 'Hiring Manager', 'Referência'
    company TEXT,
    email TEXT,
    phone TEXT,
    linkedin_url TEXT,
    
    -- Relationship
    relationship TEXT,                  -- e.g. 'Contacto direto', 'Referência', 'Recrutador externo'
    notes TEXT,
    
    -- Follow-up
    last_contact_date DATE,
    next_follow_up DATE,
    follow_up_status TEXT DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'done', 'skipped')),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_contacts_user_id 
ON public.job_contacts(user_id);

CREATE INDEX IF NOT EXISTS idx_job_contacts_job_id 
ON public.job_contacts(job_id);

CREATE INDEX IF NOT EXISTS idx_job_contacts_next_follow_up 
ON public.job_contacts(next_follow_up)
WHERE next_follow_up IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE public.job_contacts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own contacts
CREATE POLICY "Users can view own contacts"
ON public.job_contacts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts"
ON public.job_contacts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own contacts
CREATE POLICY "Users can update own contacts"
ON public.job_contacts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
ON public.job_contacts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_job_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_job_contacts_updated_at
    BEFORE UPDATE ON public.job_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_job_contacts_updated_at();

-- Comments for documentation
COMMENT ON TABLE public.job_contacts IS 
'Contacts (recruiters, hiring managers) associated with saved jobs for networking and follow-up tracking';

COMMENT ON COLUMN public.job_contacts.role IS 
'Role of the contact: Recrutador, Hiring Manager, Referência, RH, etc.';

COMMENT ON COLUMN public.job_contacts.relationship IS 
'Type of relationship: Contacto direto, Referência, Recrutador externo, LinkedIn, etc.';

COMMENT ON COLUMN public.job_contacts.follow_up_status IS 
'Status of follow-up: pending (needs action), done (completed), skipped (not needed)';
