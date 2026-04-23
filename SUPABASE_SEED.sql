-- ============================================================
-- 3. TRIAGE.OS ULTIMATE SEED DATA (v2)
-- ============================================================

-- A. NURSES (All roles represented)
INSERT INTO public.nurses (id, name, email, initials, role, ward, shift_type)
VALUES 
  ('nurse-priya', 'Priya Mehta', 'priya@triage.os', 'PM', 'Senior Nurse', 'ICU Ward 3', 'Day'),
  ('nurse-kavita', 'Kavita Rao', 'kavita@triage.os', 'KR', 'Staff Nurse', 'ICU Ward 3', 'Day'),
  ('nurse-deepak', 'Deepak Nair', 'deepak@triage.os', 'DN', 'Junior Nurse', 'ICU Ward 3', 'Day')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- B. PATIENTS (Divided strictly between the nurses)
-- NURSE 1 (Priya) Patients: 01, 02, 03, 04
-- NURSE 2 (Kavita) Patients: 05, 06, 07, 08
-- NURSE 3 (Deepak) Patients: 09, 10, 11, 12
INSERT INTO public.patients (id, name, age, gender, bed, ward, risk, initials, diagnosis, assigned_nurse_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mr. Raj Sharma', 67, 'M', 'Bed 7', 'ICU Ward 3', 'P1', 'RS', 'Acute MI, Hypertensive Crisis', 'nurse-priya'),
  ('00000000-0000-0000-0000-000000000002', 'Ms. Anita Patel', 45, 'F', 'Bed 3', 'ICU Ward 3', 'P3', 'AP', 'Post-op cholecystectomy', 'nurse-priya'),
  ('00000000-0000-0000-0000-000000000003', 'Mr. Suresh Kumar', 72, 'M', 'Bed 12', 'ICU Ward 3', 'P2', 'SK', 'COPD Exacerbation, Pneumonia', 'nurse-priya'),
  ('00000000-0000-0000-0000-000000000004', 'Mrs. Lakshmi Devi', 58, 'F', 'Bed 5', 'ICU Ward 3', 'P4', 'LD', 'Type 2 Diabetes, Stable angina', 'nurse-priya'),
  ('00000000-0000-0000-0000-000000000005', 'Mr. Arjun Reddy', 34, 'M', 'Bed 9', 'ICU Ward 3', 'P1', 'AR', 'Severe sepsis, UTI source', 'nurse-kavita'),
  ('00000000-0000-0000-0000-000000000006', 'Ms. Fatima Khan', 29, 'F', 'Bed 2', 'ICU Ward 3', 'P5', 'FK', 'Observation — mild asthma', 'nurse-kavita'),
  ('00000000-0000-0000-0000-000000000007', 'Mr. Vikram Singh', 61, 'M', 'Bed 11', 'ICU Ward 3', 'P2', 'VS', 'GI bleed, Liver cirrhosis', 'nurse-kavita'),
  ('00000000-0000-0000-0000-000000000008', 'Mrs. Meera Joshi', 82, 'F', 'Bed 4', 'ICU Ward 3', 'P3', 'MJ', 'Hip fracture, Post-op Day 2', 'nurse-kavita'),
  ('00000000-0000-0000-0000-000000000009', 'Master Aryan Sah', 12, 'M', 'Bed 1', 'Pediatric ICU', 'P4', 'AS', 'Post-op Appendectomy', 'nurse-deepak'),
  ('00000000-0000-0000-0000-000000000010', 'Mr. John Doe', 50, 'M', 'Bed 15', 'General Ward 1', 'P5', 'JD', 'Routine Checkup', 'nurse-deepak'),
  ('00000000-0000-0000-0000-000000000011', 'Mrs. Sarah Connor', 42, 'F', 'Bed 16', 'ICU Ward 3', 'P2', 'SC', 'Multiple Trauma', 'nurse-deepak'),
  ('00000000-0000-0000-0000-000000000012', 'Mr. Bruce Wayne', 38, 'M', 'Bed 17', 'ICU Ward 3', 'P1', 'BW', 'Head Injury, Concussion', 'nurse-deepak')
ON CONFLICT (id) DO NOTHING;

-- C. VITALS (Comprehensive set for all patients)
INSERT INTO public.vitals (patient_id, heart_rate, spo2, temperature, bp_sys, bp_dia, rr)
VALUES
  ('00000000-0000-0000-0000-000000000001', 112, 91, 38.2, 160, 95, 24),
  ('00000000-0000-0000-0000-000000000002', 78, 97, 37.1, 128, 82, 16),
  ('00000000-0000-0000-0000-000000000003', 98, 89, 38.8, 135, 88, 28),
  ('00000000-0000-0000-0000-000000000004', 88, 98, 36.6, 120, 80, 18),
  ('00000000-0000-0000-0000-000000000005', 145, 86, 39.4, 85, 52, 30),
  ('00000000-0000-0000-0000-000000000006', 72, 99, 37.0, 110, 70, 14),
  ('00000000-0000-0000-0000-000000000007', 105, 93, 37.4, 98, 62, 22),
  ('00000000-0000-0000-0000-000000000008', 92, 95, 37.8, 142, 88, 20),
  ('00000000-0000-0000-0000-000000000009', 110, 98, 37.2, 105, 65, 22),
  ('00000000-0000-0000-0000-000000000010', 80, 99, 36.8, 120, 80, 16),
  ('00000000-0000-0000-0000-000000000011', 120, 94, 38.5, 130, 85, 25),
  ('00000000-0000-0000-0000-000000000012', 55, 96, 36.5, 150, 100, 12)
ON CONFLICT (patient_id) DO UPDATE SET heart_rate = EXCLUDED.heart_rate, spo2 = EXCLUDED.spo2, temperature = EXCLUDED.temperature;

-- D. MEDICATIONS
INSERT INTO public.medications (patient_id, name, urgency, status, schedule, time)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Metoprolol 25mg', 'STAT', 'pending', 'Now', '20:00'),
  ('00000000-0000-0000-0000-000000000005', 'Vancomycin 1g', 'STAT', 'pending', 'Now', '20:15'),
  ('00000000-0000-0000-0000-000000000003', 'Salbutamol Neb', 'Urgent', 'pending', 'Q4H', '22:00'),
  ('00000000-0000-0000-0000-000000000011', 'Morphine 5mg', 'STAT', 'pending', 'Now', '20:30')
ON CONFLICT DO NOTHING;

-- E. TASKS (Notification Seed)
INSERT INTO public.tasks (title, priority, status, patient_id, created_by, type)
VALUES
  ('Prep for Emergency Intubation', 'STAT', 'todo', '00000000-0000-0000-0000-000000000005', 'nurse-kavita', 'nursing'),
  ('Repeat ECG in 30 mins', 'Urgent', 'inprogress', '00000000-0000-0000-0000-000000000001', 'nurse-priya', 'diagnostic'),
  ('Wound Dressing Change', 'Routine', 'todo', '00000000-0000-0000-0000-000000000002', 'nurse-priya', 'nursing'),
  ('Neuro Obs Q1H', 'Urgent', 'todo', '00000000-0000-0000-0000-000000000012', 'nurse-deepak', 'vitals')
ON CONFLICT DO NOTHING;

-- F. SOAP NOTES
INSERT INTO public.soap_notes (patient_id, subjective, objective, assessment, plan, urgency_level)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Chest pressure +ve', 'HR 112, BP 160/95', 'Anterior MI', 'Cath Lab prep', 'Stat'),
  ('00000000-0000-0000-0000-000000000005', 'Drowsy, fever', 'SpO2 86%, T 39.4', 'Septic Shock', 'Vasopressors started', 'Critical'),
  ('00000000-0000-0000-0000-000000000003', 'Short of breath', 'SPO2 89%, Wheezing', 'COPD Exacerbation', 'Nebulization given', 'Urgent')
ON CONFLICT DO NOTHING;

-- G. ASSIGNMENTS
INSERT INTO public.patient_assignments (patient_id, nurse_id)
SELECT id, assigned_nurse_id FROM public.patients WHERE assigned_nurse_id IS NOT NULL
ON CONFLICT DO NOTHING;
