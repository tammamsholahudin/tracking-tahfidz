-- migration_v1_2_portal.sql
-- NON-DESTRUCTIVE MIGRATION FOR PORTAL ACCESS (v1.2)

-- 1. Create Portal Links Table
CREATE TABLE IF NOT EXISTS public.portal_links (
    id VARCHAR(50) PRIMARY KEY, -- plnk-xxxxxxxxx
    entity_type VARCHAR(50) NOT NULL, -- 'wali_kelas' | 'kepala_sekolah'
    portal_name VARCHAR(255) NOT NULL,
    target_classes JSONB NOT NULL, -- Array of class ids or ["ALL"]
    password_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- 2. Create Portal Access Logs Table
CREATE TABLE IF NOT EXISTS public.portal_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id VARCHAR(50) REFERENCES public.portal_links(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    is_success BOOLEAN DEFAULT true
);

-- 3. Enable RLS
ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_access_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Only Admins can manage portal links
CREATE POLICY "Admin can manage portal links" ON public.portal_links
    FOR ALL
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Allow anonymous read to check if link exists/validate password
-- (Since it's read-only and requires a link_id to lookup anyway)
CREATE POLICY "Anonymous can view specific portal link" ON public.portal_links
    FOR SELECT
    USING (true);

-- Admin can manage access logs
CREATE POLICY "Admin can manage portal logs" ON public.portal_access_logs
    FOR ALL
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Anonymous can insert access logs (for telemetry when accessing portal)
CREATE POLICY "Anonymous can insert logs" ON public.portal_access_logs
    FOR INSERT
    WITH CHECK (true);
