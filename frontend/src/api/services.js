/* ============================================================
   triage.os — API Service Layer
   Currently returns mock data. Replace BASE_URL and remove
   mock imports when backend is ready.
   ============================================================ */

import {
  patients as mockPatients,
  nurses as mockNurses,
  tasks as mockTasks,
  soapNotes as mockSoapNotes,
  chatMessages as mockChatMessages,
  shiftSwapRequests as mockShiftSwaps,
  triageScoreHistory as mockTriageScores,
  scheduleData as mockSchedule,
  currentNurse as mockCurrentNurse,
} from '../data/mockData';

// ── Configuration ────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const USE_MOCK = true; // Set to false when backend is ready

// ── Generic fetch wrapper ────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ── Simulate network delay for mock data ─────────────────────
function mockDelay(data, ms = 200) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// ══════════════════════════════════════════════════════════════
// AUTH / USER
// ══════════════════════════════════════════════════════════════

export async function getCurrentNurse() {
  if (USE_MOCK) return mockDelay({ ...mockCurrentNurse });
  return apiFetch('/auth/me');
}

// ══════════════════════════════════════════════════════════════
// PATIENTS
// ══════════════════════════════════════════════════════════════

export async function getPatients() {
  if (USE_MOCK) return mockDelay([...mockPatients]);
  return apiFetch('/patients');
}

export async function getPatientById(id) {
  if (USE_MOCK) {
    const patient = mockPatients.find((p) => p.id === id);
    return mockDelay(patient || null);
  }
  return apiFetch(`/patients/${id}`);
}

export async function updatePatientVitals(id, vitals) {
  if (USE_MOCK) return mockDelay({ success: true, vitals });
  return apiFetch(`/patients/${id}/vitals`, {
    method: 'PUT',
    body: JSON.stringify(vitals),
  });
}

export async function addPatient(patient) {
  if (USE_MOCK) return mockDelay({ success: true, id: `P${Date.now()}` });
  return apiFetch('/patients', {
    method: 'POST',
    body: JSON.stringify(patient),
  });
}

export async function reassignPatient(patientId, nurseId) {
  if (USE_MOCK) return mockDelay({ success: true });
  return apiFetch(`/patients/${patientId}/reassign`, {
    method: 'PUT',
    body: JSON.stringify({ nurseId }),
  });
}

// ══════════════════════════════════════════════════════════════
// VITALS (WebSocket / Streaming)
// ══════════════════════════════════════════════════════════════

export function connectVitalsStream(onMessage) {
  if (USE_MOCK) {
    // Simulate WebSocket with setInterval
    const intervalId = setInterval(() => {
      const simulatedUpdate = mockPatients.map((p) => ({
        patientId: p.id,
        vitals: {
          hr: p.vitals.hr + Math.round((Math.random() - 0.5) * 4),
          spo2: Math.min(100, Math.max(70, p.vitals.spo2 + Math.round((Math.random() - 0.5) * 2))),
          bpSys: p.vitals.bpSys + Math.round((Math.random() - 0.5) * 6),
          bpDia: p.vitals.bpDia + Math.round((Math.random() - 0.5) * 4),
          temp: +(p.vitals.temp + (Math.random() - 0.5) * 0.2).toFixed(1),
          rr: p.vitals.rr + Math.round((Math.random() - 0.5) * 2),
        },
        timestamp: new Date().toISOString(),
      }));
      onMessage(simulatedUpdate);
    }, 3000);

    return { close: () => clearInterval(intervalId) };
  }

  // Real WebSocket connection
  const wsUrl = BASE_URL.replace('http', 'ws').replace('/api', '/ws/vitals');
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  return ws;
}

// ══════════════════════════════════════════════════════════════
// NURSES
// ══════════════════════════════════════════════════════════════

export async function getNurses() {
  if (USE_MOCK) return mockDelay([...mockNurses]);
  return apiFetch('/nurses');
}

// ══════════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════════

export async function getTasks() {
  if (USE_MOCK) return mockDelay([...mockTasks]);
  return apiFetch('/tasks');
}

export async function updateTaskStatus(taskId, status) {
  if (USE_MOCK) return mockDelay({ success: true });
  return apiFetch(`/tasks/${taskId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function createTask(task) {
  if (USE_MOCK) return mockDelay({ success: true, id: `T${Date.now()}` });
  return apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

// ══════════════════════════════════════════════════════════════
// SOAP NOTES
// ══════════════════════════════════════════════════════════════

export async function getSoapNotes() {
  if (USE_MOCK) return mockDelay([...mockSoapNotes]);
  return apiFetch('/soap-notes');
}

export async function getSoapNotesByPatient(patientId) {
  if (USE_MOCK) {
    const notes = mockSoapNotes.filter((n) => n.patientId === patientId);
    return mockDelay(notes);
  }
  return apiFetch(`/soap-notes?patientId=${patientId}`);
}

export async function createSoapNote(note) {
  if (USE_MOCK) return mockDelay({ success: true, id: `SN${Date.now()}` });
  return apiFetch('/soap-notes', {
    method: 'POST',
    body: JSON.stringify(note),
  });
}

export async function transcribeAudio(audioBlob) {
  if (USE_MOCK) {
    return mockDelay({
      text: 'Patient reports persistent chest pain rated 6 out of 10. Blood pressure is 145 over 92. Heart rate is 98 beats per minute. Started on Metoprolol 25mg twice daily.',
      entities: {
        vitals: ['BP 145/92', 'HR 98 bpm'],
        medications: ['Metoprolol 25mg'],
        conditions: ['persistent chest pain'],
      },
    });
  }
  const formData = new FormData();
  formData.append('audio', audioBlob);
  return apiFetch('/soap-notes/transcribe', {
    method: 'POST',
    headers: {}, // Let browser set multipart headers
    body: formData,
  });
}

// ══════════════════════════════════════════════════════════════
// NURSE CHAT (RAG)
// ══════════════════════════════════════════════════════════════

export async function getChatHistory() {
  if (USE_MOCK) return mockDelay([...mockChatMessages]);
  return apiFetch('/chat/history');
}

export async function sendChatMessage(message) {
  if (USE_MOCK) {
    // Simulate AI response
    const responses = [
      { text: 'Based on the current ward data, all P1 patients have been assessed within the last 30 minutes. No new critical alerts pending.', source: 'Ward data at ' + new Date().toLocaleTimeString() },
      { text: 'There are 3 STAT medications pending administration. Mr. Raj Sharma (Bed 7) has Metoprolol overdue by 4 hours. Please verify.', source: 'Medication records, last sync 5 min ago' },
      { text: 'Mr. Suresh Kumar (Bed 12) shows SpO2 trending down from 93% to 89% over the past 2 hours. Recommend increasing O2 delivery and ordering ABG.', source: 'Vitals trend analysis' },
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    return mockDelay({
      id: `C${Date.now()}`,
      role: 'assistant',
      text: response.text,
      source: response.source,
      timestamp: new Date().toLocaleTimeString(),
    }, 1500);
  }
  return apiFetch('/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// ══════════════════════════════════════════════════════════════
// SHIFT SWAP
// ══════════════════════════════════════════════════════════════

export async function getShiftSwapRequests() {
  if (USE_MOCK) return mockDelay([...mockShiftSwaps]);
  return apiFetch('/shift-swap');
}

export async function respondToShiftSwap(requestId, action) {
  if (USE_MOCK) return mockDelay({ success: true, action });
  return apiFetch(`/shift-swap/${requestId}/${action}`, {
    method: 'POST',
  });
}

// ══════════════════════════════════════════════════════════════
// ANALYTICS / CHARTS
// ══════════════════════════════════════════════════════════════

export async function getTriageScoreHistory() {
  if (USE_MOCK) return mockDelay([...mockTriageScores]);
  return apiFetch('/analytics/triage-scores');
}

export async function getScheduleData() {
  if (USE_MOCK) return mockDelay({ ...mockSchedule });
  return apiFetch('/schedule');
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════════════

export async function getDashboardStats() {
  if (USE_MOCK) {
    const totalPatients = mockPatients.length;
    const p1Count = mockPatients.filter((p) => p.risk === 'P1').length;
    const statMeds = mockPatients.reduce(
      (acc, p) => acc + p.medications.filter((m) => m.urgency === 'STAT').length,
      0
    );
    const onShift = mockNurses.filter((n) => n.shift === 'Day').length;
    return mockDelay({ totalPatients, p1Count, statMeds, onShift });
  }
  return apiFetch('/dashboard/stats');
}
