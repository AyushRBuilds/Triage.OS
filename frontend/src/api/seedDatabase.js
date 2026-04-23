import { supabase } from './supabaseClient';

export async function resetDatabaseToSeed() {
  try {
    // 1. Delete existing data (reverse dependency order)
    await supabase.from('patient_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vitals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('medications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('soap_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nurses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Insert Nurses
    const nursesData = [
      { name: 'Priya Mehta', email: 'priya@triage.os', initials: 'PM', ward: 'ICU Ward 3', shift_type: 'Day', max_capacity: 8, role: 'Senior Nurse' },
      { name: 'Kavita Rao', email: 'kavita@triage.os', initials: 'KR', ward: 'ICU Ward 3', shift_type: 'Day', max_capacity: 8, role: 'Staff Nurse' },
      { name: 'Deepak Nair', email: 'deepak@triage.os', initials: 'DN', ward: 'ICU Ward 3', shift_type: 'Night', max_capacity: 8, role: 'Junior Nurse' },
      { name: 'Ramesh Gupta', email: 'ramesh@triage.os', initials: 'RG', ward: 'ICU Ward 2', shift_type: 'Night', max_capacity: 8, role: 'Senior Nurse' },
      { name: 'Sunita Mishra', email: 'sunita@triage.os', initials: 'SM', ward: 'General Ward 1', shift_type: 'Day', max_capacity: 8, role: 'Staff Nurse' },
      { name: 'Anil Joshi', email: 'anil@triage.os', initials: 'AJ', ward: 'ICU Ward 3', shift_type: 'Night', max_capacity: 8, role: 'Junior Nurse' }
    ];
    const { data: nurses, error: errN } = await supabase.from('nurses').insert(nursesData).select();
    if (errN) throw errN;

    // 3. Insert Patients
    const patientsData = [
      { name: 'Mr. Raj Sharma', age: 67, gender: 'M', bed: 'Bed 7', ward: 'ICU Ward 3', risk: 'P1', initials: 'RS', diagnosis: 'Acute MI, Hypertensive Crisis', admitted_date: '2025-04-18', assigned_nurse_id: nurses.find(n => n.name === 'Priya Mehta').id },
      { name: 'Ms. Anita Patel', age: 45, gender: 'F', bed: 'Bed 3', ward: 'ICU Ward 3', risk: 'P3', initials: 'AP', diagnosis: 'Post-op cholecystectomy', admitted_date: '2025-04-20', assigned_nurse_id: nurses.find(n => n.name === 'Kavita Rao').id },
      { name: 'Mr. Suresh Kumar', age: 72, gender: 'M', bed: 'Bed 12', ward: 'ICU Ward 3', risk: 'P2', initials: 'SK', diagnosis: 'COPD Exacerbation, Pneumonia', admitted_date: '2025-04-17', assigned_nurse_id: nurses.find(n => n.name === 'Priya Mehta').id },
      { name: 'Mrs. Lakshmi Devi', age: 58, gender: 'F', bed: 'Bed 5', ward: 'ICU Ward 3', risk: 'P4', initials: 'LD', diagnosis: 'Type 2 Diabetes, Stable angina', admitted_date: '2025-04-19', assigned_nurse_id: nurses.find(n => n.name === 'Priya Mehta').id },
      { name: 'Mr. Arjun Reddy', age: 34, gender: 'M', bed: 'Bed 9', ward: 'ICU Ward 3', risk: 'P1', initials: 'AR', diagnosis: 'Severe sepsis, UTI source', admitted_date: '2025-04-21', assigned_nurse_id: nurses.find(n => n.name === 'Kavita Rao').id },
      { name: 'Ms. Fatima Khan', age: 29, gender: 'F', bed: 'Bed 2', ward: 'ICU Ward 3', risk: 'P5', initials: 'FK', diagnosis: 'Observation - mild asthma exacerbation', admitted_date: '2025-04-21', assigned_nurse_id: nurses.find(n => n.name === 'Priya Mehta').id },
      { name: 'Mr. Vikram Singh', age: 61, gender: 'M', bed: 'Bed 11', ward: 'ICU Ward 3', risk: 'P2', initials: 'VS', diagnosis: 'GI bleed, Liver cirrhosis', admitted_date: '2025-04-16', assigned_nurse_id: nurses.find(n => n.name === 'Kavita Rao').id },
      { name: 'Mrs. Meera Joshi', age: 82, gender: 'F', bed: 'Bed 4', ward: 'ICU Ward 3', risk: 'P3', initials: 'MJ', diagnosis: 'Hip fracture, Post-op Day 2', admitted_date: '2025-04-19', assigned_nurse_id: nurses.find(n => n.name === 'Priya Mehta').id }
    ];
    const { data: patients, error: errP } = await supabase.from('patients').insert(patientsData).select();
    if (errP) throw errP;

    // 4. Patient Assignments
    const assignments = patients.map(p => ({ patient_id: p.id, nurse_id: p.assigned_nurse_id }));
    const { error: errA } = await supabase.from('patient_assignments').insert(assignments);
    if (errA) throw errA;

    // 5. Vitals
    const vitalsData = [
      { patient_id: patients.find(p=>p.name==='Mr. Raj Sharma').id, hr: 112, spo2: 91, bp_sys: 160, bp_dia: 95, temp: 38.2, rr: 24, risk_score: 0.85 },
      { patient_id: patients.find(p=>p.name==='Ms. Anita Patel').id, hr: 78, spo2: 97, bp_sys: 128, bp_dia: 82, temp: 37.1, rr: 16, risk_score: 0.20 },
      { patient_id: patients.find(p=>p.name==='Mr. Suresh Kumar').id, hr: 98, spo2: 89, bp_sys: 135, bp_dia: 88, temp: 38.8, rr: 28, risk_score: 0.65 },
      { patient_id: patients.find(p=>p.name==='Mrs. Lakshmi Devi').id, hr: 72, spo2: 98, bp_sys: 122, bp_dia: 78, temp: 36.8, rr: 14, risk_score: 0.10 },
      { patient_id: patients.find(p=>p.name==='Mr. Arjun Reddy').id, hr: 128, spo2: 88, bp_sys: 85, bp_dia: 52, temp: 39.4, rr: 30, risk_score: 0.92 },
      { patient_id: patients.find(p=>p.name==='Ms. Fatima Khan').id, hr: 74, spo2: 99, bp_sys: 118, bp_dia: 72, temp: 36.6, rr: 15, risk_score: 0.05 },
      { patient_id: patients.find(p=>p.name==='Mr. Vikram Singh').id, hr: 105, spo2: 93, bp_sys: 98, bp_dia: 62, temp: 37.4, rr: 22, risk_score: 0.60 },
      { patient_id: patients.find(p=>p.name==='Mrs. Meera Joshi').id, hr: 82, spo2: 96, bp_sys: 140, bp_dia: 85, temp: 37.0, rr: 18, risk_score: 0.25 }
    ];
    await supabase.from('vitals').insert(vitalsData);

    // 6. Tasks
    const tasksData = [
      { title: 'ECG for Bed 7', description: 'Stat ECG — chest pain episode', priority: 'STAT', status: 'todo', type: 'diagnostic', patient_id: patients.find(p=>p.name==='Mr. Raj Sharma').id, assigned_to: 'Dr. Mehta' },
      { title: 'Vitals Check — Bed 12', description: 'Q1H vitals monitoring', priority: 'Urgent', status: 'inprogress', type: 'vitals', patient_id: patients.find(p=>p.name==='Mr. Suresh Kumar').id, assigned_to: 'Priya Mehta' },
      { title: 'Administer Meropenem', description: '1g IV — sepsis protocol', priority: 'STAT', status: 'todo', type: 'medication', patient_id: patients.find(p=>p.name==='Mr. Arjun Reddy').id, assigned_to: 'Kavita Rao' },
      { title: 'Wound dressing — Bed 4', description: 'Surgical site inspection + dressing change', priority: 'Routine', status: 'todo', type: 'nursing', patient_id: patients.find(p=>p.name==='Mrs. Meera Joshi').id, assigned_to: 'Priya Mehta' },
      { title: 'Blood gas analysis — Bed 9', description: 'ABG for sepsis monitoring', priority: 'STAT', status: 'inprogress', type: 'diagnostic', patient_id: patients.find(p=>p.name==='Mr. Arjun Reddy').id, assigned_to: 'Dr. Patel' }
    ];
    await supabase.from('tasks').insert(tasksData);

    // 7. Meds
    const medsData = [
      { patient_id: patients.find(p=>p.name==='Mr. Raj Sharma').id, name: 'Metoprolol 25mg', schedule: '2x Daily', time: '10:30 AM', urgency: 'STAT', status: 'pending' },
      { patient_id: patients.find(p=>p.name==='Mr. Arjun Reddy').id, name: 'Meropenem 1g', schedule: '3x Daily', time: '12:00 PM', urgency: 'STAT', status: 'pending' },
      { patient_id: patients.find(p=>p.name==='Mr. Vikram Singh').id, name: 'Pantoprazole 80mg IV', schedule: 'Continuous', time: 'Running', urgency: 'STAT', status: 'pending' }
    ];
    await supabase.from('medications').insert(medsData);

    // 8. Chat
    await supabase.from('chat_messages').insert([
      { role: 'suggestion', text: 'Who is highest risk right now?' },
      { role: 'suggestion', text: 'What meds are due in the next hour?' },
      { role: 'suggestion', text: 'Summarize Bed 7 status' },
      { role: 'suggestion', text: 'Any STAT alerts pending?' }
    ]);

    return { success: true };
  } catch (error) {
    console.error('Seed reset failed:', error);
    return { success: false, error };
  }
}
