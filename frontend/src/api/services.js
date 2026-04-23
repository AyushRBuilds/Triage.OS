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
  const detail = [error.message, error.details, error.hint].filter(Boolean).join(' — ');
  console.error(`[triage.os] ${context}:`, detail || error);
  const err = new Error(detail || error.message || String(error));
  err.code = error.code;
  err.original = error;
  throw err;
}

/** Normalize patient FK for Supabase (uuid string vs numeric id from <select>). */
function normalizePatientIdForDb(id) {
  if (id == null || id === '') return id;
  if (typeof id === 'number' && !Number.isNaN(id)) return id;
  const s = String(id).trim();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  return s;
}

/** Build a row Supabase accepts for `soap_notes` (timestamps, JSON, no undefined). */
function buildSoapNoteRow(note) {
  const entities = note.entities;
  let entitiesJson = [];
  if (Array.isArray(entities)) entitiesJson = entities;
  else if (entities && typeof entities === 'object') entitiesJson = entities;

  const row = {
    patient_id: normalizePatientIdForDb(note.patient_id),
    subjective: note.subjective ?? null,
    objective: note.objective ?? null,
    assessment: note.assessment ?? null,
    plan: note.plan ?? null,
    raw_text: note.raw_text ?? null,
    entities: entitiesJson,
    urgency_level: note.urgency_level ?? null,
    recorded_at: note.recorded_at || new Date().toISOString(),
  };
  if (note.urgency_confidence != null && note.urgency_confidence !== '') {
    const n = Number(note.urgency_confidence);
    if (!Number.isNaN(n)) row.urgency_confidence = n;
  }
  return row;
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
      assigned_nurse:nurses!assigned_nurse_id (id, name, initials),
      patient_assignments (
        is_temporary,
        assigned_at,
        nurse:nurses (id, name, initials)
      )
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
      assigned_nurse:nurses!assigned_nurse_id (id, name, initials),
      patient_assignments (
        is_temporary,
        assigned_at,
        nurse:nurses (id, name, initials)
      )
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

export async function allocateNurseToPatient(patientId, nurseId, isTemporary = false) {
  const { data, error } = await supabase
    .from('patient_assignments')
    .upsert({ patient_id: patientId, nurse_id: nurseId, is_temporary: isTemporary }, { onConflict: 'patient_id,nurse_id' });
  if (error) handleError(error, 'allocateNurseToPatient');
  return data;
}

export async function unallocateNurseFromPatient(patientId, nurseId) {
  const { data, error } = await supabase
    .from('patient_assignments')
    .delete()
    .match({ patient_id: patientId, nurse_id: nurseId });
  if (error) handleError(error, 'unallocateNurseFromPatient');
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
      { event: '*', schema: 'public', table: 'vitals' },
      (payload) => {
        if (!payload.new) return;
        // Transform payload into the shape the UI expects
        const update = {
          patientId: payload.new.patient_id,
          vitals: {
            hr: payload.new.heart_rate,
            spo2: payload.new.spo2,
            bpSys: payload.new.bp_sys,
            bpDia: payload.new.bp_dia,
            temp: payload.new.temperature,
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
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env');
  }
  const payload = buildSoapNoteRow(note);
  const { data, error } = await supabase
    .from('soap_notes')
    .insert([payload])
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

export async function respondToShiftSwap(requestId, action, responderId, responderName) {
  let dbStatus = action;
  if (action === 'accepted' && responderId) {
    dbStatus = `accepted|${responderName || 'Colleague'}|${responderId}`;
    // We NO LONGER transfer patients here. We wait for the requestor to confirm.
  }

  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update({ status: dbStatus }) // action = 'accepted|Name|ID' | 'rejected'
    .eq('id', requestId);

  if (error) handleError(error, 'respondToShiftSwap');
  return data;
}

export async function confirmShiftSwapTransfer(requestId, responderId) {
  // 1. Get the requestor_id from the request
  const { data: req } = await supabase.from('shift_swap_requests').select('requestor_id').eq('id', requestId).single();
  if (!req?.requestor_id) return null;
  
  const requestorId = req.requestor_id;

  // 2. Find all patients assigned to the requestor
  const { data: requestorAssignments } = await supabase
    .from('patient_assignments')
    .select('patient_id')
    .eq('nurse_id', requestorId);

  // 3. Find all patients already assigned to the responder
  const { data: responderAssignments } = await supabase
    .from('patient_assignments')
    .select('patient_id')
    .eq('nurse_id', responderId);

  const responderPatientIds = new Set((responderAssignments || []).map(a => a.patient_id));

  // 4. Identify patients NOT shared
  const patientsToTransfer = (requestorAssignments || [])
    .map(a => a.patient_id)
    .filter(pid => !responderPatientIds.has(pid));

  // 5. Create temporary assignments for the non-shared patients
  const newAssignments = patientsToTransfer.map(pid => ({
    patient_id: pid,
    nurse_id: responderId,
    is_temporary: true
  }));

  if (newAssignments.length > 0) {
    await supabase.from('patient_assignments').insert(newAssignments);
  }

  // 6. Mark as finalized
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update({ status: 'finalized' })
    .eq('id', requestId);
    
  if (error) handleError(error, 'confirmShiftSwapTransfer');
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
  
  // Handle new assignment logic & 24hr expiration
  const now = new Date().getTime();
  const validAssignments = (p.patient_assignments || []).filter(a => {
    if (a.is_temporary) {
      const assignedTime = new Date(a.assigned_at).getTime();
      // Drop temporary assignments older than 24 hours
      if (now - assignedTime > 24 * 60 * 60 * 1000) return false;
    }
    return true;
  });

  const assignedNurses = validAssignments.map(a => ({
    id: a.nurse?.id,
    name: a.nurse?.name,
    initials: a.nurse?.initials,
    isTemporary: a.is_temporary
  }));

  // Fallback string for legacy UI components
  const primaryNurseName = assignedNurses.length > 0 
    ? assignedNurses.map(n => n.name).join(', ') 
    : (p.assigned_nurse?.name || '');

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
    assignedNurse: primaryNurseName,
    assignedNurses: assignedNurses,
    admittedDate: p.admitted_date,
    lastUpdated: p.updated_at
      ? new Date(p.updated_at).toLocaleTimeString('en-IN', { hour12: false })
      : '',
    vitals: (p.vitals && p.vitals.length > 0)
      ? {
          hr: p.vitals[0].heart_rate || 0,
          spo2: p.vitals[0].spo2 || 0,
          bpSys: p.vitals[0].bp_sys || 0,
          bpDia: p.vitals[0].bp_dia || 0,
          temp: p.vitals[0].temperature || 0,
          rr: p.vitals[0].rr || 0,
        }
      : { hr: 72, spo2: 98, bpSys: 120, bpDia: 80, temp: 37, rr: 16 }, // Clinical fallback
    medications: (p.medications || []).map((m) => ({
      name: m.name,
      schedule: m.schedule,
      time: m.time,
      urgency: m.urgency,
      status: m.status,
    })),
  };
}
