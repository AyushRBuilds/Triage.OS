-- ============================================================
-- 1. TRIAGE.OS TABLE SCHEMA
-- ============================================================

-- Staff/Nurses
CREATE TABLE IF NOT EXISTS public.nurses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    initials TEXT,
    role TEXT,
    ward TEXT,
    shift_type TEXT, -- 'Day', 'Night'
    max_capacity INTEGER DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Patients
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT, -- 'M', 'F'
    bed TEXT,
    ward TEXT,
    risk TEXT, -- 'P1', 'P2', 'P3', 'P4', 'P5'
    initials TEXT,
    diagnosis TEXT,
    assigned_nurse_id TEXT REFERENCES public.nurses(id),
    admitted_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Real-time Vitals
CREATE TABLE IF NOT EXISTS public.vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE UNIQUE,
    heart_rate FLOAT,
    spo2 FLOAT,
    temperature FLOAT,
    bp_sys FLOAT,
    bp_dia FLOAT,
    rr FLOAT,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Medications
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    schedule TEXT,
    time TEXT,
    urgency TEXT, -- 'STAT', 'Urgent', 'Routine'
    status TEXT DEFAULT 'pending' -- 'pending', 'administered', 'missed'
);

-- Tasks (Kanban)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT, -- 'STAT', 'Urgent', 'Routine'
    status TEXT DEFAULT 'todo', -- 'todo', 'inprogress', 'done'
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    created_by TEXT REFERENCES public.nurses(id),
    type TEXT, -- 'nursing', 'medication', 'diagnostic', 'admin'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- SOAP Notes
CREATE TABLE IF NOT EXISTS public.soap_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    raw_text TEXT,
    entities JSONB DEFAULT '[]',
    urgency_level TEXT,
    urgency_confidence FLOAT,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Patient Assignments (Multi-nurse)
CREATE TABLE IF NOT EXISTS public.patient_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    nurse_id TEXT REFERENCES public.nurses(id) ON DELETE CASCADE,
    is_temporary BOOLEAN DEFAULT false,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(patient_id, nurse_id)
);

-- AI Chatbot Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role TEXT,
    text TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id TEXT PRIMARY KEY,
    critical_alerts BOOLEAN DEFAULT true,
    stat_meds BOOLEAN DEFAULT true,
    shift_swaps BOOLEAN DEFAULT true,
    soap_notes BOOLEAN DEFAULT false,
    email_digest BOOLEAN DEFAULT false
);

-- Shift Swap Requests
CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requestor_id TEXT REFERENCES public.nurses(id),
    target_shift_date DATE,
    target_shift_type TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted|Name|ID', 'rejected', 'finalized'
    created_at TIMESTAMPTZ DEFAULT now()
);
