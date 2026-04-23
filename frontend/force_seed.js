import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
let SUPABASE_URL = '', SUPABASE_KEY = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
});
// Use anon key, but we need to insert. RLS is disabled, so we can insert.
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log('Seeding Nurses...');
  const nursesData = [
    { name: 'Priya Mehta', email: 'priya@triage.os', initials: 'PM', ward: 'ICU Ward 3', shift_type: 'Day', max_capacity: 8, role: 'Senior Nurse' },
    { name: 'Kavita Rao', email: 'kavita@triage.os', initials: 'KR', ward: 'ICU Ward 3', shift_type: 'Day', max_capacity: 8, role: 'Staff Nurse' },
    { name: 'Deepak Nair', email: 'deepak@triage.os', initials: 'DN', ward: 'ICU Ward 3', shift_type: 'Night', max_capacity: 8, role: 'Junior Nurse' },
    { name: 'Ramesh Gupta', email: 'ramesh@triage.os', initials: 'RG', ward: 'ICU Ward 2', shift_type: 'Night', max_capacity: 8, role: 'Senior Nurse' },
    { name: 'Sunita Mishra', email: 'sunita@triage.os', initials: 'SM', ward: 'General Ward 1', shift_type: 'Day', max_capacity: 8, role: 'Staff Nurse' },
    { name: 'Anil Joshi', email: 'anil@triage.os', initials: 'AJ', ward: 'ICU Ward 3', shift_type: 'Night', max_capacity: 8, role: 'Junior Nurse' }
  ];

  const { data: nurses, error: errN } = await supabase.from('nurses').insert(nursesData).select();
  if (errN) { console.error('Error inserting nurses:', errN); return; }
  console.log('Inserted nurses:', nurses.length);

  console.log('Seeding Patients...');
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
  if (errP) { console.error('Error inserting patients:', errP); return; }
  console.log('Inserted patients:', patients.length);

  console.log('Seeding Patient Assignments...');
  const assignments = patients.map(p => ({
    patient_id: p.id,
    nurse_id: p.assigned_nurse_id
  }));

  const { data: pa, error: errPA } = await supabase.from('patient_assignments').insert(assignments).select();
  if (errPA) { console.error('Error inserting assignments:', errPA); return; }
  console.log('Inserted assignments:', pa.length);

  console.log('Done! Nurses can now login.');
}

seed();
