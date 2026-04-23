-- =============================================================================
-- Triage.OS — Seed Data
-- Run AFTER schema.sql has created all tables.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────
-- Clear existing seed data (safe re-run)
-- ─────────────────────────────────────────────────────────────
truncate public.chat_messages       cascade;
truncate public.shift_swap_requests cascade;
truncate public.tasks               cascade;
truncate public.soap_notes          cascade;
truncate public.medications         cascade;
truncate public.vitals              cascade;
truncate public.patient_assignments cascade;
truncate public.patients            cascade;
truncate public.nurses              cascade;

-- ─────────────────────────────────────────────────────────────
-- NURSES (6 staff)
-- ─────────────────────────────────────────────────────────────
insert into public.nurses (name, email, initials, ward, shift_type, max_capacity, role) values
  ('Priya Mehta',    'priya@triage.os',  'PM', 'ICU Ward 3',     'Day',   8, 'Senior Nurse'),
  ('Kavita Rao',     'kavita@triage.os', 'KR', 'ICU Ward 3',     'Day',   8, 'Staff Nurse'),
  ('Deepak Nair',    'deepak@triage.os', 'DN', 'ICU Ward 3',     'Night', 8, 'Junior Nurse'),
  ('Ramesh Gupta',   'ramesh@triage.os', 'RG', 'ICU Ward 2',     'Night', 8, 'Senior Nurse'),
  ('Sunita Mishra',  'sunita@triage.os', 'SM', 'General Ward 1', 'Day',   8, 'Staff Nurse'),
  ('Anil Joshi',     'anil@triage.os',   'AJ', 'ICU Ward 3',     'Night', 8, 'Junior Nurse');

-- ─────────────────────────────────────────────────────────────
-- PATIENTS (8 patients, bed numbers match mockData.js + WardOverview)
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- PATIENT ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
insert into public.patient_assignments (patient_id, nurse_id)
select id, assigned_nurse_id 
from public.patients 
where assigned_nurse_id is not null;

-- ─────────────────────────────────────────────────────────────
-- VITALS (one row per patient)
-- ─────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────
-- MEDICATIONS (16 meds across 8 patients)
-- ─────────────────────────────────────────────────────────────
insert into public.medications (patient_id, name, schedule, time, urgency, status)
select p.id, v.med, v.schedule, v.time, v.urgency, 'pending'
from public.patients p
join (values
  ('Mr. Raj Sharma',    'Metoprolol 25mg',        '2x Daily',     '10:30 AM', 'STAT'),
  ('Mr. Raj Sharma',    'Aspirin 300mg',           '1x Daily',     '08:00 AM', 'Routine'),
  ('Ms. Anita Patel',   'Paracetamol 500mg',       '3x Daily',     '02:00 PM', 'Routine'),
  ('Mr. Suresh Kumar',  'Salbutamol Nebulizer',    '4x Daily',     '11:00 AM', 'Urgent'),
  ('Mr. Suresh Kumar',  'Azithromycin 500mg',      '1x Daily',     '09:00 AM', 'Routine'),
  ('Mr. Suresh Kumar',  'Methylprednisolone 40mg', '2x Daily',     '10:00 AM', 'STAT'),
  ('Mrs. Lakshmi Devi', 'Metformin 500mg',         '2x Daily',     '10:30 AM', 'Routine'),
  ('Mrs. Lakshmi Devi', 'Atorvastatin 20mg',       '1x Daily',     '09:00 PM', 'Routine'),
  ('Mr. Arjun Reddy',   'Meropenem 1g',            '3x Daily',     '12:00 PM', 'STAT'),
  ('Mr. Arjun Reddy',   'Noradrenaline infusion',  'Continuous',   'Running',  'STAT'),
  ('Mr. Arjun Reddy',   'NS 0.9% 1L',             'Stat bolus',   '11:30 AM', 'STAT'),
  ('Ms. Fatima Khan',   'Salbutamol inhaler PRN',  'As needed',    '-',        'Routine'),
  ('Mr. Vikram Singh',  'Pantoprazole 80mg IV',    'Continuous',   'Running',  'STAT'),
  ('Mr. Vikram Singh',  'Octreotide infusion',     'Continuous',   'Running',  'STAT'),
  ('Mrs. Meera Joshi',  'Morphine 5mg PRN',        'Every 4h PRN', '01:00 PM', 'Urgent'),
  ('Mrs. Meera Joshi',  'Enoxaparin 40mg',         '1x Daily',     '09:00 PM', 'Routine')
) as v(patient_name, med, schedule, time, urgency) on p.name = v.patient_name;

-- ─────────────────────────────────────────────────────────────
-- TASKS (8 Kanban tasks)
-- ─────────────────────────────────────────────────────────────
insert into public.tasks (title, description, priority, status, type, patient_id, assigned_to)
select v.title, v.description, v.priority, v.status, v.type, p.id, v.assigned
from (values
  ('ECG for Bed 7',               'Stat ECG — chest pain episode',            'STAT',    'todo',       'diagnostic', 'Mr. Raj Sharma',   'Dr. Mehta'),
  ('Vitals Check — Bed 12',      'Q1H vitals monitoring',                     'Urgent',  'inprogress', 'vitals',     'Mr. Suresh Kumar', 'Priya Mehta'),
  ('Administer Meropenem',        '1g IV — sepsis protocol',                   'STAT',    'todo',       'medication', 'Mr. Arjun Reddy',  'Kavita Rao'),
  ('Wound dressing — Bed 4',     'Surgical site inspection + dressing change', 'Routine', 'todo',       'nursing',    'Mrs. Meera Joshi', 'Priya Mehta'),
  ('Blood gas analysis — Bed 9', 'ABG for sepsis monitoring',                  'STAT',    'inprogress', 'diagnostic', 'Mr. Arjun Reddy',  'Dr. Patel'),
  ('Discharge summary — Bed 2',  'Prepare discharge docs for Fatima Khan',     'Routine', 'done',       'admin',      'Ms. Fatima Khan',  'Dr. Mehta'),
  ('Pain assessment — Bed 4',    'Post-op pain scoring',                       'Urgent',  'done',       'nursing',    'Mrs. Meera Joshi', 'Priya Mehta'),
  ('Blood transfusion — Bed 11', '2 units PRBC — GI bleed',                    'STAT',    'todo',       'medication', 'Mr. Vikram Singh', 'Dr. Reddy')
) as v(title, description, priority, status, type, patient_name, assigned)
join public.patients p on p.name = v.patient_name;

-- ─────────────────────────────────────────────────────────────
-- SHIFT SWAP REQUESTS (3 requests)
-- ─────────────────────────────────────────────────────────────
insert into public.shift_swap_requests (requestor_id, target_shift_date, target_shift_type, reason, status)
select n.id, v.shift_date::date, v.shift_type, v.reason, v.status
from (values
  ('Deepak Nair',   '2025-04-22', 'Night', 'Family emergency — father hospitalized', 'pending'),
  ('Sunita Mishra', '2025-04-23', 'Day',   'Medical appointment — follow-up',        'pending'),
  ('Anil Joshi',    '2025-04-24', 'Night', 'Exam preparation leave',                 'accepted')
) as v(nurse_name, shift_date, shift_type, reason, status)
join public.nurses n on n.name = v.nurse_name;

-- ─────────────────────────────────────────────────────────────
-- CHAT SUGGESTIONS (4 starter prompts)
-- ─────────────────────────────────────────────────────────────
insert into public.chat_messages (role, text) values
  ('suggestion', 'Who is highest risk right now?'),
  ('suggestion', 'What meds are due in the next hour?'),
  ('suggestion', 'Summarize Bed 7 status'),
  ('suggestion', 'Any STAT alerts pending?');

-- ─────────────────────────────────────────────────────────────
-- SOAP NOTES (3 sample AI-generated notes)
-- ─────────────────────────────────────────────────────────────
insert into public.soap_notes (patient_id, subjective, objective, assessment, plan, raw_text, entities, urgency_level, urgency_confidence)
select p.id, v.subjective, v.objective, v.assessment, v.plan, v.raw_text,
  v.entities::jsonb, v.urgency, v.confidence
from (values
  (
    'Mr. Raj Sharma',
    'Patient reports crushing chest pain rated 7/10, radiating to left arm. States "it feels like an elephant sitting on my chest." Pain started 2 hours ago, not relieved by rest.',
    'HR 112 bpm, BP 160/95 mmHg, SpO2 91%, Temp 38.2°C. Diaphoretic, pale. ECG shows ST elevation in leads V1-V4. Troponin I elevated at 2.4 ng/mL.',
    'Acute ST-elevation MI with hemodynamic instability. High risk — P1 classification.',
    'Stat cardiology consult. Start heparin drip. Morphine 4mg IV for pain. Prepare for possible cath lab. Continuous telemetry monitoring.',
    'Patient complaining of severe crushing chest pain 7 out of 10 radiating to left arm started 2 hours ago not relieved by rest heart rate 112 BP 160 over 95 SpO2 91 percent temp 38.2 ECG shows ST elevation V1 through V4 troponin elevated 2.4',
    '[{"text":"chest pain","label":"SYMPTOM"},{"text":"HR 112","label":"VITAL"},{"text":"BP 160/95","label":"VITAL"},{"text":"ST elevation","label":"FINDING"},{"text":"heparin","label":"DRUG"},{"text":"Morphine 4mg","label":"DRUG"}]',
    'Critical',
    0.94
  ),
  (
    'Mr. Suresh Kumar',
    'Patient complains of increasing dyspnea over past 6 hours. "I can''t catch my breath even sitting up." Reports productive cough with yellow-green sputum.',
    'HR 98 bpm, BP 135/88, SpO2 89% on 2L NC, Temp 38.8°C, RR 28. Bilateral crackles on auscultation, worse on right. Using accessory muscles.',
    'COPD exacerbation with community-acquired pneumonia. P2 risk — requires close monitoring.',
    'Increase O2 to 4L via Venturi mask. Stat nebulizer salbutamol + ipratropium. Start IV azithromycin. Methylprednisolone 40mg IV. Consider BiPAP if no improvement in 2 hours.',
    'Patient has increasing shortness of breath past 6 hours cannot breathe even sitting up productive cough yellow green sputum heart rate 98 BP 135 over 88 SpO2 89 on 2 liters temp 38.8 respiratory rate 28 bilateral crackles using accessory muscles',
    '[{"text":"dyspnea","label":"SYMPTOM"},{"text":"cough","label":"SYMPTOM"},{"text":"SpO2 89%","label":"VITAL"},{"text":"salbutamol","label":"DRUG"},{"text":"azithromycin","label":"DRUG"},{"text":"COPD","label":"CONDITION"},{"text":"pneumonia","label":"CONDITION"}]',
    'Urgent',
    0.87
  ),
  (
    'Mr. Arjun Reddy',
    'Patient altered, responding only to painful stimuli. Wife reports he had fever and chills for 3 days, with urinary burning.',
    'HR 128 bpm, BP 85/52 mmHg, SpO2 88%, Temp 39.4°C, RR 30. Lactate 4.2 mmol/L. WBC 22,000. Blood cultures drawn x2. Urine cloudy with sediment.',
    'Severe sepsis secondary to UTI, progressing toward septic shock. P1 — critical.',
    'Sepsis bundle initiated. NS 30mL/kg bolus. Meropenem 1g IV stat. Start noradrenaline if MAP <65 after fluids. Foley catheter insertion. ICU team notified.',
    'Patient is altered responding only to pain wife says fever and chills 3 days urinary burning heart rate 128 BP 85 over 52 SpO2 88 percent temp 39.4 respiratory rate 30 lactate 4.2 WBC 22000 urine cloudy',
    '[{"text":"altered mental status","label":"SYMPTOM"},{"text":"fever","label":"SYMPTOM"},{"text":"HR 128","label":"VITAL"},{"text":"BP 85/52","label":"VITAL"},{"text":"Meropenem","label":"DRUG"},{"text":"noradrenaline","label":"DRUG"},{"text":"sepsis","label":"CONDITION"},{"text":"UTI","label":"CONDITION"}]',
    'Critical',
    0.96
  )
) as v(patient_name, subjective, objective, assessment, plan, raw_text, entities, urgency, confidence)
join public.patients p on p.name = v.patient_name;

-- =============================================================================
-- Done! Seed data loaded for all tables.
-- =============================================================================
