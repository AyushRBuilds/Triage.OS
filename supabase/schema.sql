-- =============================================================================
-- Triage.OS — Supabase / Postgres Schema (FULL RESET)
-- =============================================================================
-- WARNING: This drops ALL app tables and recreates them blank.
-- Run in Supabase SQL Editor or: psql $DATABASE_URL -f supabase/schema.sql
-- =============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1) Tear down (dependency order: children → parents)
-- ─────────────────────────────────────────────────────────────
drop table if exists public.soap_notes        cascade;
drop table if exists public.shift_swap_requests cascade;
drop table if exists public.tasks             cascade;
drop table if exists public.medications       cascade;
drop table if exists public.vitals            cascade;
drop table if exists public.chat_messages     cascade;
drop table if exists public.user_preferences  cascade;
drop table if exists public.patients          cascade;
drop table if exists public.patient_assignments cascade;
drop table if exists public.nurses            cascade;

-- ─────────────────────────────────────────────────────────────
-- 2) Extensions
-- ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 3) nurses
-- ─────────────────────────────────────────────────────────────
create table public.nurses (
  id           uuid primary key default gen_random_uuid(),
  email        text,
  name         text not null,
  initials     text,
  ward         text,
  shift_type   text,
  max_capacity integer default 6,
  role         text,
  phone        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index idx_nurses_email_unique on public.nurses (email);
create index idx_nurses_shift_type on public.nurses (shift_type);

-- ─────────────────────────────────────────────────────────────
-- 4) patients
-- ─────────────────────────────────────────────────────────────
create table public.patients (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  age               integer,
  gender            text,
  bed               text,
  ward              text,
  risk              text default 'P3',
  initials          text,
  diagnosis         text,
  assigned_nurse_id uuid references public.nurses(id) on delete set null,
  admitted_date     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_patients_assigned_nurse on public.patients (assigned_nurse_id);
create index idx_patients_risk on public.patients (risk);

-- ─────────────────────────────────────────────────────────────
-- 4.5) patient_assignments (many-to-many)
-- ─────────────────────────────────────────────────────────────
create table public.patient_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nurse_id uuid not null references public.nurses(id) on delete cascade,
  is_temporary boolean default false,
  assigned_at timestamptz default now(),
  unique(patient_id, nurse_id)
);

-- ─────────────────────────────────────────────────────────────
-- 5) vitals (one row per patient — upsert on patient_id)
--    Frontend columns: hr, spo2, bp_sys, bp_dia, temp, rr, risk_score
-- ─────────────────────────────────────────────────────────────
create table public.vitals (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references public.patients(id) on delete cascade,
  hr           real,
  spo2         real,
  bp_sys       real,
  bp_dia       real,
  temp         real,
  rr           real,
  risk_score   real,
  recorded_at  timestamptz not null default now(),
  constraint vitals_patient_id_key unique (patient_id)
);

create index idx_vitals_recorded_at on public.vitals (recorded_at desc);

-- ─────────────────────────────────────────────────────────────
-- 6) medications
--    Frontend columns: name, schedule, time, urgency, status
-- ─────────────────────────────────────────────────────────────
create table public.medications (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients(id) on delete cascade,
  name        text not null,
  schedule    text,
  time        text,
  urgency     text,
  status      text,
  created_at  timestamptz not null default now()
);

create index idx_medications_patient on public.medications (patient_id);
create index idx_medications_urgency_status on public.medications (urgency, status);

-- ─────────────────────────────────────────────────────────────
-- 7) tasks (Kanban: todo | inprogress | done)
--    Frontend columns: title, description, patient_id, priority,
--                      status, type, deadline, assigned_to, created_by
-- ─────────────────────────────────────────────────────────────
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  patient_id   uuid references public.patients(id) on delete set null,
  priority     text,
  status       text not null default 'todo',
  type         text,
  deadline     timestamptz,
  assigned_to  text,
  created_by   uuid references public.nurses(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_tasks_patient on public.tasks (patient_id);
create index idx_tasks_status on public.tasks (status);
create index idx_tasks_created_at on public.tasks (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- 8) soap_notes
--    Frontend columns: patient_id, subjective, objective, assessment,
--                      plan, raw_text, entities (jsonb), urgency_level,
--                      urgency_confidence, recorded_at
-- ─────────────────────────────────────────────────────────────
create table public.soap_notes (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references public.patients(id) on delete cascade,
  subjective           text,
  objective            text,
  assessment           text,
  plan                 text,
  raw_text             text,
  entities             jsonb not null default '[]'::jsonb,
  urgency_level        text,
  urgency_confidence   double precision,
  recorded_at          timestamptz not null default now(),
  created_at           timestamptz not null default now()
);

create index idx_soap_notes_patient on public.soap_notes (patient_id);
create index idx_soap_notes_recorded_at on public.soap_notes (recorded_at desc);

-- ─────────────────────────────────────────────────────────────
-- 9) chat_messages
--    Frontend columns: role, text, source
-- ─────────────────────────────────────────────────────────────
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  role        text not null,
  text        text not null,
  source      text,
  created_at  timestamptz not null default now()
);

create index idx_chat_messages_created_at on public.chat_messages (created_at);

-- ─────────────────────────────────────────────────────────────
-- 10) user_preferences (user_id = email string)
-- ─────────────────────────────────────────────────────────────
create table public.user_preferences (
  user_id         text primary key,
  critical_alerts boolean not null default true,
  stat_meds       boolean not null default true,
  shift_swaps     boolean not null default true,
  soap_notes      boolean not null default false,
  email_digest    boolean not null default false,
  updated_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- 11) shift_swap_requests
--     Frontend columns: requestor_id, target_shift_date,
--                       target_shift_type, reason, status
-- ─────────────────────────────────────────────────────────────
create table public.shift_swap_requests (
  id                uuid primary key default gen_random_uuid(),
  requestor_id      uuid not null references public.nurses(id) on delete cascade,
  target_shift_date date,
  target_shift_type text,
  reason            text,
  status            text not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_shift_swap_requestor on public.shift_swap_requests (requestor_id);
create index idx_shift_swap_status on public.shift_swap_requests (status);
create index idx_shift_swap_created_at on public.shift_swap_requests (created_at desc);

-- =============================================================================
-- DISABLE ROW LEVEL SECURITY (auth removed — all access via anon key)
-- =============================================================================
alter table public.nurses              disable row level security;
alter table public.patients            disable row level security;
alter table public.vitals              disable row level security;
alter table public.medications         disable row level security;
alter table public.tasks               disable row level security;
alter table public.soap_notes          disable row level security;
alter table public.chat_messages       disable row level security;
alter table public.user_preferences    disable row level security;
alter table public.shift_swap_requests disable row level security;
alter table public.patient_assignments disable row level security;

-- Also drop any existing RLS policies that might block anon access
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Grant full access to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all on all tables    in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- =============================================================================
-- Realtime (enable for live vitals, tasks, shift swaps)
-- =============================================================================
alter publication supabase_realtime add table public.vitals;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.shift_swap_requests;
alter publication supabase_realtime add table public.patient_assignments;

-- =============================================================================
-- SEED DATA — Nurses
-- =============================================================================
insert into public.nurses (name, email, initials, ward, shift_type, max_capacity, role) values
  ('Priya Mehta',    'priya@triage.os',  'PM', 'ICU Ward 3',     'Day',   8, 'Senior Nurse'),
  ('Kavita Rao',     'kavita@triage.os', 'KR', 'ICU Ward 3',     'Day',   8, 'Staff Nurse'),
  ('Deepak Nair',    'deepak@triage.os', 'DN', 'ICU Ward 3',     'Night', 8, 'Junior Nurse'),
  ('Ramesh Gupta',   'ramesh@triage.os', 'RG', 'ICU Ward 2',     'Night', 8, 'Senior Nurse'),
  ('Sunita Mishra',  'sunita@triage.os', 'SM', 'General Ward 1', 'Day',   8, 'Staff Nurse'),
  ('Anil Joshi',     'anil@triage.os',   'AJ', 'ICU Ward 3',     'Night', 8, 'Junior Nurse');

-- =============================================================================
-- SEED DATA — Patients (bed numbers match mockData.js + WardOverview)
-- =============================================================================
insert into public.patients (name, age, gender, bed, ward, risk, initials, diagnosis, assigned_nurse_id, admitted_date)
select
  v.name, v.age, v.gender, v.bed, v.ward, v.risk, v.initials, v.diagnosis,
  (select id from public.nurses where name = v.nurse limit 1),
  v.admitted::timestamptz
from (values
  ('Mr. Raj Sharma',    67, 'M', 'Bed 7',  'ICU Ward 3', 'P1', 'RS', 'Acute MI, Hypertensive Crisis',          'Priya Mehta',  '2025-04-18'),
  ('Ms. Anita Patel',   45, 'F', 'Bed 3',  'ICU Ward 3', 'P3', 'AP', 'Post-op cholecystectomy',                'Kavita Rao',   '2025-04-20'),
  ('Mr. Suresh Kumar',  72, 'M', 'Bed 12', 'ICU Ward 3', 'P2', 'SK', 'COPD Exacerbation, Pneumonia',           'Priya Mehta',  '2025-04-17'),
  ('Mrs. Lakshmi Devi', 58, 'F', 'Bed 5',  'ICU Ward 3', 'P4', 'LD', 'Type 2 Diabetes, Stable angina',         'Priya Mehta',  '2025-04-19'),
  ('Mr. Arjun Reddy',   34, 'M', 'Bed 9',  'ICU Ward 3', 'P1', 'AR', 'Severe sepsis, UTI source',              'Kavita Rao',   '2025-04-21'),
  ('Ms. Fatima Khan',   29, 'F', 'Bed 2',  'ICU Ward 3', 'P5', 'FK', 'Observation — mild asthma exacerbation', 'Priya Mehta',  '2025-04-21'),
  ('Mr. Vikram Singh',  61, 'M', 'Bed 11', 'ICU Ward 3', 'P2', 'VS', 'GI bleed, Liver cirrhosis',              'Kavita Rao',   '2025-04-16'),
  ('Mrs. Meera Joshi',  82, 'F', 'Bed 4',  'ICU Ward 3', 'P3', 'MJ', 'Hip fracture, Post-op Day 2',            'Priya Mehta',  '2025-04-19')
) as v(name, age, gender, bed, ward, risk, initials, diagnosis, nurse, admitted);

-- =============================================================================
-- SEED DATA — Patient Assignments
-- =============================================================================
insert into public.patient_assignments (patient_id, nurse_id)
select id, assigned_nurse_id 
from public.patients 
where assigned_nurse_id is not null;

-- =============================================================================
-- SEED DATA — Vitals (one per patient)
-- =============================================================================
insert into public.vitals (patient_id, hr, spo2, bp_sys, bp_dia, temp, rr, risk_score)
select p.id, v.hr, v.spo2, v.bp_sys, v.bp_dia, v.temp, v.rr, v.risk
from public.patients p
join (values
  ('Mr. Raj Sharma',    112, 91, 160, 95, 38.2, 24, 0.85),
  ('Ms. Anita Patel',    78, 97, 128, 82, 37.1, 16, 0.20),
  ('Mr. Suresh Kumar',   98, 89, 135, 88, 38.8, 28, 0.65),
  ('Mrs. Lakshmi Devi',  72, 98, 122, 78, 36.8, 14, 0.10),
  ('Mr. Arjun Reddy',   128, 88,  85, 52, 39.4, 30, 0.92),
  ('Ms. Fatima Khan',    74, 99, 118, 72, 36.6, 15, 0.05),
  ('Mr. Vikram Singh',  105, 93,  98, 62, 37.4, 22, 0.60),
  ('Mrs. Meera Joshi',   82, 96, 140, 85, 37.0, 18, 0.25)
) as v(name, hr, spo2, bp_sys, bp_dia, temp, rr, risk) on p.name = v.name;

-- =============================================================================
-- SEED DATA — Medications
-- =============================================================================
insert into public.medications (patient_id, name, schedule, time, urgency, status)
select p.id, v.med, v.schedule, v.time, v.urgency, 'pending'
from public.patients p
join (values
  ('Mr. Raj Sharma',    'Metoprolol 25mg',        '2x Daily',      '10:30 AM', 'STAT'),
  ('Mr. Raj Sharma',    'Aspirin 300mg',           '1x Daily',      '08:00 AM', 'Routine'),
  ('Ms. Anita Patel',   'Paracetamol 500mg',       '3x Daily',      '02:00 PM', 'Routine'),
  ('Mr. Suresh Kumar',  'Salbutamol Nebulizer',    '4x Daily',      '11:00 AM', 'Urgent'),
  ('Mr. Suresh Kumar',  'Azithromycin 500mg',      '1x Daily',      '09:00 AM', 'Routine'),
  ('Mr. Suresh Kumar',  'Methylprednisolone 40mg', '2x Daily',      '10:00 AM', 'STAT'),
  ('Mrs. Lakshmi Devi', 'Metformin 500mg',         '2x Daily',      '10:30 AM', 'Routine'),
  ('Mrs. Lakshmi Devi', 'Atorvastatin 20mg',       '1x Daily',      '09:00 PM', 'Routine'),
  ('Mr. Arjun Reddy',   'Meropenem 1g',            '3x Daily',      '12:00 PM', 'STAT'),
  ('Mr. Arjun Reddy',   'Noradrenaline infusion',  'Continuous',     'Running',  'STAT'),
  ('Mr. Arjun Reddy',   'NS 0.9% 1L',             'Stat bolus',     '11:30 AM', 'STAT'),
  ('Ms. Fatima Khan',   'Salbutamol inhaler PRN',  'As needed',      '-',        'Routine'),
  ('Mr. Vikram Singh',  'Pantoprazole 80mg IV',    'Continuous',     'Running',  'STAT'),
  ('Mr. Vikram Singh',  'Octreotide infusion',     'Continuous',     'Running',  'STAT'),
  ('Mrs. Meera Joshi',  'Morphine 5mg PRN',        'Every 4h PRN',   '01:00 PM', 'Urgent'),
  ('Mrs. Meera Joshi',  'Enoxaparin 40mg',         '1x Daily',       '09:00 PM', 'Routine')
) as v(patient_name, med, schedule, time, urgency) on p.name = v.patient_name;

-- =============================================================================
-- SEED DATA — Tasks
-- =============================================================================
insert into public.tasks (title, description, priority, status, type, patient_id, assigned_to)
select v.title, v.description, v.priority, v.status, v.type, p.id, v.assigned
from (values
  ('ECG for Bed 7',                'Stat ECG — chest pain episode',                   'STAT',    'todo',       'diagnostic',  'Mr. Raj Sharma',    'Dr. Mehta'),
  ('Vitals Check — Bed 12',       'Q1H vitals monitoring',                            'Urgent',  'inprogress', 'vitals',      'Mr. Suresh Kumar',  'Priya Mehta'),
  ('Administer Meropenem',         '1g IV — sepsis protocol',                          'STAT',    'todo',       'medication',  'Mr. Arjun Reddy',   'Kavita Rao'),
  ('Wound dressing — Bed 4',      'Surgical site inspection + dressing change',        'Routine', 'todo',       'nursing',     'Mrs. Meera Joshi',  'Priya Mehta'),
  ('Blood gas analysis — Bed 9',  'ABG for sepsis monitoring',                         'STAT',    'inprogress', 'diagnostic',  'Mr. Arjun Reddy',   'Dr. Patel'),
  ('Discharge summary — Bed 2',   'Prepare discharge docs for Fatima Khan',            'Routine', 'done',       'admin',       'Ms. Fatima Khan',   'Dr. Mehta'),
  ('Pain assessment — Bed 4',     'Post-op pain scoring',                              'Urgent',  'done',       'nursing',     'Mrs. Meera Joshi',  'Priya Mehta'),
  ('Blood transfusion — Bed 11',  '2 units PRBC — GI bleed',                           'STAT',    'todo',       'medication',  'Mr. Vikram Singh',  'Dr. Reddy')
) as v(title, description, priority, status, type, patient_name, assigned)
join public.patients p on p.name = v.patient_name;

-- =============================================================================
-- SEED DATA — Chat suggestions
-- =============================================================================
insert into public.chat_messages (role, text) values
  ('suggestion', 'Who is highest risk right now?'),
  ('suggestion', 'What meds are due in the next hour?'),
  ('suggestion', 'Summarize Bed 7 status'),
  ('suggestion', 'Any STAT alerts pending?');

-- =============================================================================
-- Done! All tables created, RLS disabled, seed data loaded.
-- =============================================================================
