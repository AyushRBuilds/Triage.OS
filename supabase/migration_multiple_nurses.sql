-- =============================================================================
-- Migration: Multiple Nurses per Patient & Shift Swap Logic
-- =============================================================================

-- 1. Create the join table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nurse_id uuid not null references public.nurses(id) on delete cascade,
  is_temporary boolean default false,
  assigned_at timestamptz default now(),
  UNIQUE(patient_id, nurse_id)
);

-- 2. Migrate existing 1-to-1 data into the new table
INSERT INTO public.patient_assignments (patient_id, nurse_id)
SELECT id, assigned_nurse_id 
FROM public.patients 
WHERE assigned_nurse_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Disable RLS for the new table (since auth is disabled)
ALTER TABLE public.patient_assignments DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.patient_assignments TO anon, authenticated;

-- 4. Enable Realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_assignments;

-- Note: We are keeping the old `assigned_nurse_id` column in `patients` 
-- just as a fallback/history, but the app will now read/write 
-- entirely from `patient_assignments`.
