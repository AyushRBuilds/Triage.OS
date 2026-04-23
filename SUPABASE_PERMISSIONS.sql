-- ============================================================
-- 2. TRIAGE.OS PERMISSIONS (THE KEYS)
-- ============================================================

-- Grant core usage and table access to the public (anon) role
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Disable Row Level Security (RLS) for all tables
ALTER TABLE public.nurses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.soap_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests DISABLE ROW LEVEL SECURITY;

-- Enable Real-time for live notifications
-- Run this block together
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.vitals, 
    public.medications, 
    public.shift_swap_requests, 
    public.soap_notes, 
    public.tasks;
COMMIT;
