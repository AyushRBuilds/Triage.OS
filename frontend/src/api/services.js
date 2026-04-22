/* ============================================================
   triage.os — API Service Layer (Supabase)
   All functions query the live Supabase database.
   Real-time subscriptions replace mock setInterval.
   ============================================================ */

import { supabase } from './supabaseClient';

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

function handleError(error, context) {
  console.error(`[triage.os] ${context}:`, error.message);
  throw error;
}

// ══════════════════════════════════════════════════════════════
// AUTH / USER
// ══════════════════════════════════════════════════════════════

export async function getCurrentNurse() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('nurses')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) handleError(error, 'getCurrentNurse');
  return data;
}

// ══════════════════════════════════════════════════════════════
// PATIENTS
// ══════════════════════════════════════════════════════════════

export async function getPatients() {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      vitals (*),
      medications (*),
      assigned_nurse:nurses!assigned_nurse_id (id, name, initials)
    `)
    .order('risk', { ascending: true });

  if (error) handleError(error, 'getPatients');

  // Normalize shape to match the rest of the app
  return (data || []).map(normalizePatient);
}

export async function getPatientById(id) {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      vitals (*),
      medications (*),
      assigned_nurse:nurses!assigned_nurse_id (id, name, initials)
    `)
    .eq('id', id)
    .single();

  if (error) handleError(error, 'getPatientById');
  return normalizePatient(data);
}

export async function updatePatientVitals(patientId, vitals) {
  const { data, error } = await supabase
    .from('vitals')
    .upsert({ patient_id: patientId, ...vitals, recorded_at: new Date().toISOString() }, {
      onConflict: 'patient_id',
    });

  if (error) handleError(error, 'updatePatientVitals');
  return data;
}

export async function addPatient(patient) {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select()
    .single();

  if (error) handleError(error, 'addPatient');
  return data;
}

export async function reassignPatient(patientId, nurseId) {
  const { data, error } = await supabase
    .from('patients')
    .update({ assigned_nurse_id: nurseId })
    .eq('id', patientId);

  if (error) handleError(error, 'reassignPatient');
  return data;
}

// ══════════════════════════════════════════════════════════════
// VITALS — Real-time Supabase Channel
// Replaces the old setInterval mock.
// Returns an object with a .close() method for cleanup.
// ══════════════════════════════════════════════════════════════

export function connectVitalsStream(onMessage) {
  const channel = supabase
    .channel('vitals-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'vitals' },
      (payload) => {
        // Transform payload into the shape the UI expects
        const update = {
          patientId: payload.new.patient_id,
          vitals: {
            hr: payload.new.hr,
            spo2: payload.new.spo2,
            bpSys: payload.new.bp_sys,
            bpDia: payload.new.bp_dia,
            temp: payload.new.temp,
            rr: payload.new.rr,
          },
          timestamp: payload.new.recorded_at,
        };
        onMessage([update]);
      }
    )
    .subscribe();

  return {
    close: () => supabase.removeChannel(channel),
  };
}

// ══════════════════════════════════════════════════════════════
// NURSES
// ══════════════════════════════════════════════════════════════

export async function getNurses() {
  const { data, error } = await supabase
    .from('nurses')
    .select('*, patients(count)')
    .order('name');

  if (error) handleError(error, 'getNurses');
  return (data || []).map((n) => ({
    ...n,
    patientCount: n.patients?.[0]?.count ?? 0,
    maxCapacity: n.max_capacity,
    shift: n.shift_type,
  }));
}

// ══════════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════════

export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      patient:patients!patient_id (id, name),
      creator:nurses!created_by (id, name)
    `)
    .order('created_at', { ascending: false });

  if (error) handleError(error, 'getTasks');

  return (data || []).map((t) => ({
    ...t,
    patientName: t.patient?.name || '',
    createdBy: t.creator?.name || '',
  }));
}

export async function updateTaskStatus(taskId, status) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId);

  if (error) handleError(error, 'updateTaskStatus');
  return data;
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) handleError(error, 'createTask');
  return data;
}

// Real-time tasks subscription
export function subscribeToTasks(onUpdate) {
  const channel = supabase
    .channel('tasks-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
      onUpdate(payload);
    })
    .subscribe();

  return { close: () => supabase.removeChannel(channel) };
}

// ══════════════════════════════════════════════════════════════
// SOAP NOTES
// ══════════════════════════════════════════════════════════════

export async function getSoapNotes() {
  const { data, error } = await supabase
    .from('soap_notes')
    .select('*, patient:patients!patient_id(id, name)')
    .order('recorded_at', { ascending: false });

  if (error) handleError(error, 'getSoapNotes');
  return (data || []).map((n) => ({ ...n, patientName: n.patient?.name || '' }));
}

export async function getSoapNotesByPatient(patientId) {
  const { data, error } = await supabase
    .from('soap_notes')
    .select('*')
    .eq('patient_id', patientId)
    .order('recorded_at', { ascending: false });

  if (error) handleError(error, 'getSoapNotesByPatient');
  return data || [];
}

export async function createSoapNote(note) {
  const { data, error } = await supabase
    .from('soap_notes')
    .insert([note])
    .select()
    .single();

  if (error) handleError(error, 'createSoapNote');
  return data;
}

export async function transcribeAudio(audioBlob) {
  // Still uses a backend endpoint — AI team will implement this
  const formData = new FormData();
  formData.append('audio', audioBlob);
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/soap-notes/transcribe`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Transcription failed');
  return res.json();
}

// ══════════════════════════════════════════════════════════════
// NURSE CHAT (RAG)
// ══════════════════════════════════════════════════════════════

export async function getChatHistory() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) handleError(error, 'getChatHistory');
  return (data || []).map((m) => ({
    ...m,
    timestamp: new Date(m.created_at).toLocaleTimeString('en-IN', { hour12: false }),
  }));
}

export async function sendChatMessage(message) {
  // Save user message first
  await supabase.from('chat_messages').insert([{ role: 'user', text: message }]);

  // Call the AI backend (ML team endpoint)
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error('Chat request failed');
  const reply = await res.json();

  // Save AI response to DB
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ role: 'assistant', text: reply.text, source: reply.source }])
    .select()
    .single();

  if (error) handleError(error, 'sendChatMessage');
  return { ...data, timestamp: new Date(data.created_at).toLocaleTimeString('en-IN', { hour12: false }) };
}

// ══════════════════════════════════════════════════════════════
// SHIFT SWAP
// ══════════════════════════════════════════════════════════════

export async function getShiftSwapRequests() {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .select('*, requestor:nurses!requestor_id(id, name, initials, role)')
    .order('created_at', { ascending: false });

  if (error) handleError(error, 'getShiftSwapRequests');

  return (data || []).map((r) => ({
    ...r,
    requestor: r.requestor,
    currentShift: {
      type: r.target_shift_type,
      date: r.target_shift_date,
    },
    reason: r.reason,
    status: r.status,
  }));
}

export async function respondToShiftSwap(requestId, action) {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update({ status: action }) // action = 'accepted' | 'rejected'
    .eq('id', requestId);

  if (error) handleError(error, 'respondToShiftSwap');
  return data;
}

// Real-time shift swap subscription
export function subscribeToShiftSwaps(onUpdate) {
  const channel = supabase
    .channel('shift-swap-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_swap_requests' }, (payload) => {
      onUpdate(payload);
    })
    .subscribe();

  return { close: () => supabase.removeChannel(channel) };
}

// ══════════════════════════════════════════════════════════════
// DELETE OPERATIONS
// ══════════════════════════════════════════════════════════════

export async function deleteSoapNote(noteId) {
  const { error } = await supabase
    .from('soap_notes')
    .delete()
    .eq('id', noteId);
  if (error) handleError(error, 'deleteSoapNote');
}

export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  if (error) handleError(error, 'deleteTask');
}

export async function deletePatient(patientId) {
  // Delete related records first (vitals, medications, tasks, soap_notes)
  // then delete the patient. If you have ON DELETE CASCADE on FKs, skip these.
  await supabase.from('vitals').delete().eq('patient_id', patientId);
  await supabase.from('medications').delete().eq('patient_id', patientId);
  await supabase.from('tasks').delete().eq('patient_id', patientId);
  await supabase.from('soap_notes').delete().eq('patient_id', patientId);

  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId);
  if (error) handleError(error, 'deletePatient');
}

// ══════════════════════════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════════════════════════

export async function getTriageScoreHistory() {
  // This will come from your AI/ML team writing to a `triage_scores` table.
  // Placeholder until backend provides it:
  return [];
}

export async function getScheduleData() {
  return {};
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD STATS (computed from live DB)
// ══════════════════════════════════════════════════════════════

export async function getDashboardStats() {
  const [{ count: totalPatients }, { count: p1Count }, { count: statMeds }, { count: onShift }] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('risk', 'P1'),
    supabase.from('medications').select('*', { count: 'exact', head: true }).eq('urgency', 'STAT').eq('status', 'pending'),
    supabase.from('nurses').select('*', { count: 'exact', head: true }).eq('shift_type', 'Day'),
  ]);

  return { totalPatients, p1Count, statMeds, onShift };
}

// ══════════════════════════════════════════════════════════════
// INTERNAL NORMALIZER
// Maps snake_case DB columns → camelCase shape the UI expects
// ══════════════════════════════════════════════════════════════

function normalizePatient(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    bed: p.bed,
    ward: p.ward,
    risk: p.risk,
    initials: p.initials,
    diagnosis: p.diagnosis,
    assignedNurse: p.assigned_nurse?.name || '',
    admittedDate: p.admitted_date,
    lastUpdated: p.updated_at
      ? new Date(p.updated_at).toLocaleTimeString('en-IN', { hour12: false })
      : '',
    vitals: p.vitals
      ? {
          hr: p.vitals.hr,
          spo2: p.vitals.spo2,
          bpSys: p.vitals.bp_sys,
          bpDia: p.vitals.bp_dia,
          temp: p.vitals.temp,
          rr: p.vitals.rr,
        }
      : { hr: 0, spo2: 0, bpSys: 0, bpDia: 0, temp: 0, rr: 0 },
    medications: (p.medications || []).map((m) => ({
      name: m.name,
      schedule: m.schedule,
      time: m.time,
      urgency: m.urgency,
      status: m.status,
    })),
  };
}
