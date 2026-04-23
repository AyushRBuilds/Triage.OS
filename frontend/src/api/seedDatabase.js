import { supabase } from './supabaseClient';

export async function resetDatabaseToSeed() {
  try {
    // 1. Delete existing data
    await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('shift_swap_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patient_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vitals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('medications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('soap_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('nurses').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Insert Nurses
    const nursesData = [
      { id: 'nurse-priya', name: 'Priya Mehta', email: 'priya@triage.os', initials: 'PM', ward: 'ICU Ward 3', role: 'Senior Nurse' },
      { id: 'nurse-kavita', name: 'Kavita Rao', email: 'kavita@triage.os', initials: 'KR', ward: 'ICU Ward 3', role: 'Staff Nurse' },
      { id: 'nurse-deepak', name: 'Deepak Nair', email: 'deepak@triage.os', initials: 'DN', ward: 'ICU Ward 3', role: 'Junior Nurse' }
    ];
    await supabase.from('nurses').upsert(nursesData);

    // 3. Insert 12 Patients with conditions
    const patientsData = [
      { id: '00000001', name: 'Mr. Raj Sharma', age: 67, risk: 'P1', bed: 'Bed 7', diagnosis: 'Acute MI', assigned_nurse_id: 'nurse-priya' },
      { id: '00000002', name: 'Mr. Arjun Reddy', age: 34, risk: 'P1', bed: 'Bed 9', diagnosis: 'Septic Shock', assigned_nurse_id: 'nurse-kavita' },
      { id: '00000003', name: 'Mr. Suresh Kumar', age: 72, risk: 'P2', bed: 'Bed 12', diagnosis: 'COPD Exacerbation', assigned_nurse_id: 'nurse-priya' },
      { id: '00000004', name: 'Ms. Sunita Rao', age: 53, risk: 'P2', bed: 'Bed 8', diagnosis: 'DKA', assigned_nurse_id: 'nurse-kavita' },
      { id: '00000005', name: 'Ms. Anita Patel', age: 45, risk: 'P3', bed: 'Bed 3', diagnosis: 'Post-op Recovery', assigned_nurse_id: 'nurse-priya' },
      { id: '00000006', name: 'Mr. Rahul Verma', age: 41, risk: 'P1', bed: 'Bed 1', diagnosis: 'Polytrauma', assigned_nurse_id: 'nurse-kavita' },
      { id: '00000007', name: 'Mrs. Lakshmi Devi', age: 58, risk: 'P4', bed: 'Bed 5', diagnosis: 'Stable Angina', assigned_nurse_id: 'nurse-priya' },
      { id: '00000008', name: 'Mr. Vikram Singh', age: 61, risk: 'P2', bed: 'Bed 11', diagnosis: 'GI Bleed', assigned_nurse_id: 'nurse-kavita' },
      { id: '00000009', name: 'Ms. Fatima Khan', age: 29, risk: 'P5', bed: 'Bed 2', diagnosis: 'Observation', assigned_nurse_id: 'nurse-priya' },
      { id: '00000010', name: 'Mrs. Meera Joshi', age: 82, risk: 'P3', bed: 'Bed 4', diagnosis: 'Hip Fracture', assigned_nurse_id: 'nurse-kavita' },
      { id: '00000011', name: 'Mr. Amit Shah', age: 38, risk: 'P3', bed: 'Bed 6', diagnosis: 'Pancreatitis', assigned_nurse_id: 'nurse-priya' },
      { id: '00000012', name: 'Mrs. Rekha Mani', age: 75, risk: 'P4', bed: 'Bed 10', diagnosis: 'Heart Failure', assigned_nurse_id: 'nurse-kavita' }
    ];
    // Map to full UUIDs for DB
    const finalPatients = patientsData.map(p => ({
        ...p,
        id: `00000000-0000-0000-0000-${p.id.padStart(12, '0')}`,
        initials: p.name.split(' ').map(n => n[0]).join('')
    }));
    await supabase.from('patients').upsert(finalPatients);

    // 4. Vitals - Condition-based
    const vitalsData = finalPatients.map(p => {
        if (p.risk === 'P1') return { patient_id: p.id, heart_rate: 118, spo2: 89, temperature: 38.8, bp_sys: 165, bp_dia: 102, rr: 28 };
        if (p.risk === 'P2') return { patient_id: p.id, heart_rate: 98, spo2: 93, temperature: 37.9, bp_sys: 142, bp_dia: 92, rr: 22 };
        return { patient_id: p.id, heart_rate: 74, spo2: 98, temperature: 37.0, bp_sys: 118, bp_dia: 76, rr: 16 };
    });
    await supabase.from('vitals').upsert(vitalsData);

    return { success: true };
  } catch (error) {
    console.error('Reset failed:', error);
    return { success: false, error };
  }
}
