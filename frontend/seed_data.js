import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjblwimdgjqbqczkeanr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmx3aW1kZ2pxYnFjemtlYW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODI1NTYsImV4cCI6MjA5MjM1ODU1Nn0.Kkgk0pQVvJUtBO0nWmrwmiirtE5BOpNN1X2FRkHV0kY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting DB wipe...");
  
  // Wipe all existing data via delete without relying on raw SQL
  await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('medications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('vitals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('soap_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('nurses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Cleared old data. Seeding Nurses...");
  
  const nursesData = [
    { name: 'Priya Mehta', email: 'priya@triage.os', initials: 'PM', ward: 'ICU Ward 3', shift_type: 'Day', max_capacity: 8, role: 'Senior Nurse' },
    { name: 'Kavita Rao', email: 'kavita@triage.os', initials: 'KR', ward: 'ICU Ward 3', shift_type: 'Day', max_capacity: 8, role: 'Staff Nurse' },
    { name: 'Deepak Nair', email: 'deepak@triage.os', initials: 'DN', ward: 'ICU Ward 3', shift_type: 'Night', max_capacity: 8, role: 'Junior Nurse' },
    { name: 'Ramesh Gupta', email: 'ramesh@triage.os', initials: 'RG', ward: 'ICU Ward 2', shift_type: 'Night', max_capacity: 8, role: 'Senior Nurse' },
    { name: 'Sunita Mishra', email: 'sunita@triage.os', initials: 'SM', ward: 'General Ward 1', shift_type: 'Day', max_capacity: 8, role: 'Staff Nurse' },
    { name: 'Anil Joshi', email: 'anil@triage.os', initials: 'AJ', ward: 'ICU Ward 3', shift_type: 'Night', max_capacity: 8, role: 'Junior Nurse' }
  ];

  const { data: insertedNurses, error: nurseErr } = await supabase.from('nurses').insert(nursesData).select();
  if (nurseErr) return console.error("Nurse error:", nurseErr);
  
  const nurseMap = {};
  insertedNurses.forEach(n => nurseMap[n.name] = n.id);

  console.log("Seeding Patients...");
  const patientsData = [
    { name: 'Mr. Raj Sharma', age: 67, gender: 'M', bed: 'Bed 7', ward: 'ICU Ward 3', risk: 'P1', initials: 'RS', diagnosis: 'Acute MI, Hypertensive Crisis', assigned_nurse_id: nurseMap['Priya Mehta'], admitted_date: '2025-04-18' },
    { name: 'Ms. Anita Patel', age: 45, gender: 'F', bed: 'Bed 3', ward: 'ICU Ward 3', risk: 'P3', initials: 'AP', diagnosis: 'Post-op cholecystectomy', assigned_nurse_id: nurseMap['Kavita Rao'], admitted_date: '2025-04-20' },
    { name: 'Mr. Suresh Kumar', age: 72, gender: 'M', bed: 'Bed 12', ward: 'ICU Ward 3', risk: 'P2', initials: 'SK', diagnosis: 'COPD Exacerbation, Pneumonia', assigned_nurse_id: nurseMap['Priya Mehta'], admitted_date: '2025-04-17' },
    { name: 'Mrs. Lakshmi Devi', age: 58, gender: 'F', bed: 'Bed 5', ward: 'ICU Ward 3', risk: 'P4', initials: 'LD', diagnosis: 'Type 2 Diabetes, Stable angina', assigned_nurse_id: nurseMap['Priya Mehta'], admitted_date: '2025-04-19' },
    { name: 'Mr. Arjun Reddy', age: 34, gender: 'M', bed: 'Bed 9', ward: 'ICU Ward 3', risk: 'P1', initials: 'AR', diagnosis: 'Severe sepsis, UTI source', assigned_nurse_id: nurseMap['Kavita Rao'], admitted_date: '2025-04-21' },
    { name: 'Ms. Fatima Khan', age: 29, gender: 'F', bed: 'Bed 2', ward: 'ICU Ward 3', risk: 'P5', initials: 'FK', diagnosis: 'Observation — mild asthma exacerbation', assigned_nurse_id: nurseMap['Priya Mehta'], admitted_date: '2025-04-21' },
    { name: 'Mr. Vikram Singh', age: 61, gender: 'M', bed: 'Bed 11', ward: 'ICU Ward 3', risk: 'P2', initials: 'VS', diagnosis: 'GI bleed, Liver cirrhosis', assigned_nurse_id: nurseMap['Kavita Rao'], admitted_date: '2025-04-16' },
    { name: 'Mrs. Meera Joshi', age: 82, gender: 'F', bed: 'Bed 4', ward: 'ICU Ward 3', risk: 'P3', initials: 'MJ', diagnosis: 'Hip fracture, Post-op Day 2', assigned_nurse_id: nurseMap['Priya Mehta'], admitted_date: '2025-04-19' }
  ];

  const { data: insertedPatients, error: patErr } = await supabase.from('patients').insert(patientsData).select();
  if (patErr) return console.error("Patient error:", patErr);

  const pMap = {};
  insertedPatients.forEach(p => pMap[p.name] = p.id);

  console.log("Seeding Vitals...");
  await supabase.from('vitals').insert([
    { patient_id: pMap['Mr. Raj Sharma'], hr: 112, spo2: 91, bp_sys: 160, bp_dia: 95, temp: 38.2, rr: 24, risk_score: 0.85 },
    { patient_id: pMap['Ms. Anita Patel'], hr: 78, spo2: 97, bp_sys: 128, bp_dia: 82, temp: 37.1, rr: 16, risk_score: 0.20 },
    { patient_id: pMap['Mr. Suresh Kumar'], hr: 98, spo2: 89, bp_sys: 135, bp_dia: 88, temp: 38.8, rr: 28, risk_score: 0.65 },
    { patient_id: pMap['Mrs. Lakshmi Devi'], hr: 72, spo2: 98, bp_sys: 122, bp_dia: 78, temp: 36.8, rr: 14, risk_score: 0.10 },
    { patient_id: pMap['Mr. Arjun Reddy'], hr: 128, spo2: 88, bp_sys: 85, bp_dia: 52, temp: 39.4, rr: 30, risk_score: 0.92 },
    { patient_id: pMap['Ms. Fatima Khan'], hr: 74, spo2: 99, bp_sys: 118, bp_dia: 72, temp: 36.6, rr: 15, risk_score: 0.05 },
    { patient_id: pMap['Mr. Vikram Singh'], hr: 105, spo2: 93, bp_sys: 98, bp_dia: 62, temp: 37.4, rr: 22, risk_score: 0.60 },
    { patient_id: pMap['Mrs. Meera Joshi'], hr: 82, spo2: 96, bp_sys: 140, bp_dia: 85, temp: 37.0, rr: 18, risk_score: 0.25 }
  ]);

  console.log("Seeding Medications...");
  await supabase.from('medications').insert([
    { patient_id: pMap['Mr. Raj Sharma'], name: 'Metoprolol 25mg', schedule: '2x Daily', time: '10:30 AM', urgency: 'STAT', status: 'pending' },
    { patient_id: pMap['Mr. Raj Sharma'], name: 'Aspirin 300mg', schedule: '1x Daily', time: '08:00 AM', urgency: 'Routine', status: 'pending' },
    { patient_id: pMap['Ms. Anita Patel'], name: 'Paracetamol 500mg', schedule: '3x Daily', time: '02:00 PM', urgency: 'Routine', status: 'pending' },
    { patient_id: pMap['Mr. Suresh Kumar'], name: 'Salbutamol Nebulizer', schedule: '4x Daily', time: '11:00 AM', urgency: 'Urgent', status: 'pending' }
  ]);

  console.log("Seeding Tasks...");
  await supabase.from('tasks').insert([
    { title: 'ECG for Bed 7', description: 'Stat ECG', priority: 'STAT', status: 'todo', type: 'diagnostic', patient_id: pMap['Mr. Raj Sharma'] },
    { title: 'Vitals Check — Bed 12', description: 'Q1H vitals', priority: 'Urgent', status: 'inprogress', type: 'vitals', patient_id: pMap['Mr. Suresh Kumar'] }
  ]);

  console.log("Seeding Chat...");
  await supabase.from('chat_messages').insert([
    { role: 'suggestion', text: 'Who is highest risk right now?' },
    { role: 'suggestion', text: 'What meds are due in the next hour?' }
  ]);

  console.log("✅ ALL DONE! Refresh the frontend!");
}

seed();
