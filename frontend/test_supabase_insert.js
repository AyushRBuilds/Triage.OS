import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjblwimdgjqbqczkeanr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqYmx3aW1kZ2pxYnFjemtlYW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODI1NTYsImV4cCI6MjA5MjM1ODU1Nn0.Kkgk0pQVvJUtBO0nWmrwmiirtE5BOpNN1X2FRkHV0kY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .insert([{
      requestor_id: 'nurse-priya',
      target_shift_date: '2026-05-01',
      target_shift_type: 'Day',
      reason: 'Testing from script',
      status: 'pending',
    }])
    .select('*, requestor:nurses!requestor_id(id, name, initials, role)')
    .single();

  if (error) {
    console.error('Error with nurse-priya:', error);
  } else {
    console.log('Success with nurse-priya:', data);
  }

  // Now test with admin user
  const { data: d2, error: e2 } = await supabase
    .from('shift_swap_requests')
    .insert([{
      requestor_id: 'admin-demo',
      target_shift_date: '2026-05-01',
      target_shift_type: 'Day',
      reason: 'Testing admin request',
      status: 'pending',
    }])
    .select('*, requestor:nurses!requestor_id(id, name, initials, role)')
    .single();

  if (e2) {
    console.error('\nError with admin-demo:', e2);
  } else {
    console.log('\nSuccess with admin-demo:', d2);
  }
}

testInsert();
