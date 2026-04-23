import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let SUPABASE_URL = '';
let SUPABASE_KEY = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) SUPABASE_KEY = line.split('=')[1].trim();
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('\n--- Checking Vitals ---');
  const { data: vitals, error: verr } = await supabase.from('vitals').select('*');
  console.log('Vitals records found:', vitals?.length || 0);
  if (verr) console.error('Error fetching vitals:', verr);
  if (vitals && vitals.length > 0) console.log('Sample Vitals:', vitals[0]);
  
  console.log('\n--- Checking Patients ---');
  const { data: pts, error: perr } = await supabase.from('patients').select('id, name');
  console.log('Patients found:', pts?.length || 0);
  if (pts) console.log('Patient IDs:', pts.map(p => p.id));
}
test();
