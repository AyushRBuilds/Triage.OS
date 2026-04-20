/* ============================================================
   triage.os — Mock Data
   Realistic clinical data for demo. Replace with API calls.
   ============================================================ */

export const currentNurse = {
  id: 'N001',
  name: 'Priya Mehta',
  role: 'Senior Nurse',
  ward: 'ICU Ward 3',
  avatar: null,
  initials: 'PM',
  shiftStart: '08:00',
  shiftEnd: '20:00',
};

export const patients = [
  {
    id: 'P001',
    name: 'Mr. Raj Sharma',
    age: 67,
    gender: 'M',
    bed: 'Bed 7',
    ward: 'ICU Ward 3',
    risk: 'P1',
    initials: 'RS',
    diagnosis: 'Acute MI, Hypertensive Crisis',
    vitals: { hr: 112, spo2: 91, bpSys: 160, bpDia: 95, temp: 38.2, rr: 24 },
    medications: [
      { name: 'Metoprolol 25mg', schedule: '2x Daily', time: '10:30 AM', urgency: 'STAT' },
      { name: 'Aspirin 300mg', schedule: '1x Daily', time: '08:00 AM', urgency: 'Routine' },
    ],
    assignedNurse: 'Priya Mehta',
    lastUpdated: '14:32:05',
    admittedDate: '2025-04-18',
  },
  {
    id: 'P002',
    name: 'Ms. Anita Patel',
    age: 45,
    gender: 'F',
    bed: 'Bed 3',
    ward: 'ICU Ward 3',
    risk: 'P3',
    initials: 'AP',
    diagnosis: 'Post-op cholecystectomy',
    vitals: { hr: 78, spo2: 97, bpSys: 128, bpDia: 82, temp: 37.1, rr: 16 },
    medications: [
      { name: 'Paracetamol 500mg', schedule: '3x Daily', time: '02:00 PM', urgency: 'Routine' },
    ],
    assignedNurse: 'Kavita Rao',
    lastUpdated: '14:28:12',
    admittedDate: '2025-04-20',
  },
  {
    id: 'P003',
    name: 'Mr. Suresh Kumar',
    age: 72,
    gender: 'M',
    bed: 'Bed 12',
    ward: 'ICU Ward 3',
    risk: 'P2',
    initials: 'SK',
    diagnosis: 'COPD Exacerbation, Pneumonia',
    vitals: { hr: 98, spo2: 89, bpSys: 135, bpDia: 88, temp: 38.8, rr: 28 },
    medications: [
      { name: 'Salbutamol Nebulizer', schedule: '4x Daily', time: '11:00 AM', urgency: 'Urgent' },
      { name: 'Azithromycin 500mg', schedule: '1x Daily', time: '09:00 AM', urgency: 'Routine' },
      { name: 'Methylprednisolone 40mg', schedule: '2x Daily', time: '10:00 AM', urgency: 'STAT' },
    ],
    assignedNurse: 'Priya Mehta',
    lastUpdated: '14:15:33',
    admittedDate: '2025-04-17',
  },
  {
    id: 'P004',
    name: 'Mrs. Lakshmi Devi',
    age: 58,
    gender: 'F',
    bed: 'Bed 5',
    ward: 'ICU Ward 3',
    risk: 'P4',
    initials: 'LD',
    diagnosis: 'Type 2 Diabetes, Stable angina',
    vitals: { hr: 72, spo2: 98, bpSys: 122, bpDia: 78, temp: 36.8, rr: 14 },
    medications: [
      { name: 'Metformin 500mg', schedule: '2x Daily', time: '10:30 AM', urgency: 'Routine' },
      { name: 'Atorvastatin 20mg', schedule: '1x Daily', time: '09:00 PM', urgency: 'Routine' },
    ],
    assignedNurse: 'Priya Mehta',
    lastUpdated: '13:55:00',
    admittedDate: '2025-04-19',
  },
  {
    id: 'P005',
    name: 'Mr. Arjun Reddy',
    age: 34,
    gender: 'M',
    bed: 'Bed 9',
    ward: 'ICU Ward 3',
    risk: 'P1',
    initials: 'AR',
    diagnosis: 'Severe sepsis, UTI source',
    vitals: { hr: 128, spo2: 88, bpSys: 85, bpDia: 52, temp: 39.4, rr: 30 },
    medications: [
      { name: 'Meropenem 1g', schedule: '3x Daily', time: '12:00 PM', urgency: 'STAT' },
      { name: 'Noradrenaline infusion', schedule: 'Continuous', time: 'Running', urgency: 'STAT' },
      { name: 'NS 0.9% 1L', schedule: 'Stat bolus', time: '11:30 AM', urgency: 'STAT' },
    ],
    assignedNurse: 'Kavita Rao',
    lastUpdated: '14:35:22',
    admittedDate: '2025-04-21',
  },
  {
    id: 'P006',
    name: 'Ms. Fatima Khan',
    age: 29,
    gender: 'F',
    bed: 'Bed 2',
    ward: 'ICU Ward 3',
    risk: 'P5',
    initials: 'FK',
    diagnosis: 'Observation — mild asthma exacerbation',
    vitals: { hr: 74, spo2: 99, bpSys: 118, bpDia: 72, temp: 36.6, rr: 15 },
    medications: [
      { name: 'Salbutamol inhaler PRN', schedule: 'As needed', time: '-', urgency: 'Routine' },
    ],
    assignedNurse: 'Priya Mehta',
    lastUpdated: '12:10:45',
    admittedDate: '2025-04-21',
  },
  {
    id: 'P007',
    name: 'Mr. Vikram Singh',
    age: 61,
    gender: 'M',
    bed: 'Bed 11',
    ward: 'ICU Ward 3',
    risk: 'P2',
    initials: 'VS',
    diagnosis: 'GI bleed, Liver cirrhosis',
    vitals: { hr: 105, spo2: 93, bpSys: 98, bpDia: 62, temp: 37.4, rr: 22 },
    medications: [
      { name: 'Pantoprazole 80mg IV', schedule: 'Continuous', time: 'Running', urgency: 'STAT' },
      { name: 'Octreotide infusion', schedule: 'Continuous', time: 'Running', urgency: 'STAT' },
    ],
    assignedNurse: 'Kavita Rao',
    lastUpdated: '14:22:18',
    admittedDate: '2025-04-16',
  },
  {
    id: 'P008',
    name: 'Mrs. Meera Joshi',
    age: 82,
    gender: 'F',
    bed: 'Bed 4',
    ward: 'ICU Ward 3',
    risk: 'P3',
    initials: 'MJ',
    diagnosis: 'Hip fracture, Post-op Day 2',
    vitals: { hr: 82, spo2: 96, bpSys: 140, bpDia: 85, temp: 37.0, rr: 18 },
    medications: [
      { name: 'Morphine 5mg PRN', schedule: 'Every 4h PRN', time: '01:00 PM', urgency: 'Urgent' },
      { name: 'Enoxaparin 40mg', schedule: '1x Daily', time: '09:00 PM', urgency: 'Routine' },
    ],
    assignedNurse: 'Priya Mehta',
    lastUpdated: '13:48:10',
    admittedDate: '2025-04-19',
  },
];

export const nurses = [
  { id: 'N001', name: 'Priya Mehta', role: 'Senior Nurse', ward: 'ICU Ward 3', initials: 'PM', patientCount: 4, maxCapacity: 8, shift: 'Day' },
  { id: 'N002', name: 'Kavita Rao', role: 'Staff Nurse', ward: 'ICU Ward 3', initials: 'KR', patientCount: 3, maxCapacity: 8, shift: 'Day' },
  { id: 'N003', name: 'Deepak Nair', role: 'Junior Nurse', ward: 'ICU Ward 3', initials: 'DN', patientCount: 1, maxCapacity: 8, shift: 'Day' },
  { id: 'N004', name: 'Ramesh Gupta', role: 'Senior Nurse', ward: 'ICU Ward 2', initials: 'RG', patientCount: 6, maxCapacity: 8, shift: 'Night' },
  { id: 'N005', name: 'Sunita Mishra', role: 'Staff Nurse', ward: 'General Ward 1', initials: 'SM', patientCount: 5, maxCapacity: 8, shift: 'Day' },
  { id: 'N006', name: 'Anil Joshi', role: 'Junior Nurse', ward: 'ICU Ward 3', initials: 'AJ', patientCount: 2, maxCapacity: 8, shift: 'Night' },
];

export const tasks = [
  { id: 'T001', title: 'ECG for Bed 7', description: 'Stat ECG — chest pain episode', priority: 'STAT', status: 'todo', patientId: 'P001', patientName: 'Mr. Raj Sharma', createdBy: 'Dr. Mehta', createdAt: '09:15 AM', type: 'diagnostic' },
  { id: 'T002', title: 'Vitals Check — Bed 12', description: 'Q1H vitals monitoring', priority: 'Urgent', status: 'inprogress', patientId: 'P003', patientName: 'Mr. Suresh Kumar', createdBy: 'Dr. Singh', createdAt: '10:00 AM', type: 'vitals' },
  { id: 'T003', title: 'Administer Meropenem', description: '1g IV — sepsis protocol', priority: 'STAT', status: 'todo', patientId: 'P005', patientName: 'Mr. Arjun Reddy', createdBy: 'Dr. Patel', createdAt: '11:30 AM', type: 'medication' },
  { id: 'T004', title: 'Wound dressing — Bed 4', description: 'Surgical site inspection + dressing change', priority: 'Routine', status: 'todo', patientId: 'P008', patientName: 'Mrs. Meera Joshi', createdBy: 'Dr. Kumar', createdAt: '08:00 AM', type: 'nursing' },
  { id: 'T005', title: 'Blood gas analysis — Bed 9', description: 'ABG for sepsis monitoring', priority: 'STAT', status: 'inprogress', patientId: 'P005', patientName: 'Mr. Arjun Reddy', createdBy: 'Dr. Patel', createdAt: '12:15 PM', type: 'diagnostic' },
  { id: 'T006', title: 'Discharge summary — Bed 2', description: 'Prepare discharge docs for Fatima Khan', priority: 'Routine', status: 'done', patientId: 'P006', patientName: 'Ms. Fatima Khan', createdBy: 'Dr. Mehta', createdAt: '07:30 AM', type: 'admin' },
  { id: 'T007', title: 'Pain assessment — Bed 4', description: 'Post-op pain scoring', priority: 'Urgent', status: 'done', patientId: 'P008', patientName: 'Mrs. Meera Joshi', createdBy: 'Nurse Priya', createdAt: '06:00 AM', type: 'nursing' },
  { id: 'T008', title: 'Blood transfusion setup — Bed 11', description: '2 units PRBC — GI bleed', priority: 'STAT', status: 'todo', patientId: 'P007', patientName: 'Mr. Vikram Singh', createdBy: 'Dr. Reddy', createdAt: '01:45 PM', type: 'medication' },
];

export const soapNotes = [
  {
    id: 'SN001',
    patientId: 'P001',
    patientName: 'Mr. Raj Sharma',
    timestamp: '14:30:00',
    date: '2025-04-21',
    subjective: 'Patient reports crushing chest pain rated 7/10, radiating to left arm. States "it feels like an elephant sitting on my chest." Pain started 2 hours ago, not relieved by rest.',
    objective: 'HR 112 bpm, BP 160/95 mmHg, SpO2 91%, Temp 38.2°C. Diaphoretic, pale. ECG shows ST elevation in leads V1-V4. Troponin I elevated at 2.4 ng/mL.',
    assessment: 'Acute ST-elevation MI with hemodynamic instability. High risk — P1 classification.',
    plan: 'Stat cardiology consult. Start heparin drip. Morphine 4mg IV for pain. Prepare for possible cath lab. Continuous telemetry monitoring.',
    entities: {
      vitals: ['HR 112 bpm', 'BP 160/95 mmHg', 'SpO2 91%', 'Temp 38.2°C'],
      medications: ['heparin drip', 'Morphine 4mg IV'],
      conditions: ['ST-elevation MI', 'hemodynamic instability'],
    },
  },
  {
    id: 'SN002',
    patientId: 'P003',
    patientName: 'Mr. Suresh Kumar',
    timestamp: '13:45:00',
    date: '2025-04-21',
    subjective: 'Patient complains of increasing dyspnea over past 6 hours. "I can\'t catch my breath even sitting up." Reports productive cough with yellow-green sputum.',
    objective: 'HR 98 bpm, BP 135/88, SpO2 89% on 2L NC, Temp 38.8°C, RR 28. Bilateral crackles on auscultation, worse on right. Using accessory muscles.',
    assessment: 'COPD exacerbation with community-acquired pneumonia. P2 risk — requires close monitoring.',
    plan: 'Increase O2 to 4L via Venturi mask. Stat nebulizer salbutamol + ipratropium. Start IV azithromycin. Methylprednisolone 40mg IV. Consider BiPAP if no improvement in 2 hours.',
    entities: {
      vitals: ['HR 98 bpm', 'BP 135/88', 'SpO2 89%', 'Temp 38.8°C', 'RR 28'],
      medications: ['salbutamol', 'ipratropium', 'azithromycin', 'Methylprednisolone'],
      conditions: ['COPD exacerbation', 'community-acquired pneumonia'],
    },
  },
  {
    id: 'SN003',
    patientId: 'P005',
    patientName: 'Mr. Arjun Reddy',
    timestamp: '14:20:00',
    date: '2025-04-21',
    subjective: 'Patient altered, responding only to painful stimuli. Wife reports he had fever and chills for 3 days, with urinary burning.',
    objective: 'HR 128 bpm, BP 85/52 mmHg, SpO2 88%, Temp 39.4°C, RR 30. Lactate 4.2 mmol/L. WBC 22,000. Blood cultures drawn x2. Urine cloudy with sediment.',
    assessment: 'Severe sepsis secondary to UTI, progressing toward septic shock. P1 — critical.',
    plan: 'Sepsis bundle initiated. NS 30mL/kg bolus. Meropenem 1g IV stat. Start noradrenaline if MAP <65 after fluids. Foley catheter insertion. ICU team notified.',
    entities: {
      vitals: ['HR 128 bpm', 'BP 85/52 mmHg', 'SpO2 88%', 'Temp 39.4°C', 'RR 30'],
      medications: ['Meropenem 1g IV', 'noradrenaline', 'NS 30mL/kg'],
      conditions: ['Severe sepsis', 'UTI', 'septic shock'],
    },
  },
];

export const chatMessages = [
  { id: 'C001', role: 'suggestion', text: 'Who is highest risk right now?' },
  { id: 'C002', role: 'suggestion', text: 'What meds are due in the next hour?' },
  { id: 'C003', role: 'suggestion', text: 'Summarize Bed 7 status' },
  { id: 'C004', role: 'suggestion', text: 'Any STAT alerts pending?' },
  { id: 'C005', role: 'user', text: 'Who is highest risk right now?', timestamp: '14:32:00' },
  { id: 'C006', role: 'assistant', text: 'Based on current vitals, **Mr. Arjun Reddy (Bed 9)** is highest risk — classified P1 Critical.\n\n• HR: 128 bpm (tachycardic)\n• BP: 85/52 mmHg (hypotensive)\n• SpO2: 88% (below threshold)\n• Temp: 39.4°C (febrile)\n• Lactate: 4.2 mmol/L\n\nHe has severe sepsis from a UTI source and is on the sepsis pathway with noradrenaline and meropenem. Recommend immediate reassessment.', timestamp: '14:32:05', source: 'Vitals at 14:35, SOAP note at 14:20' },
  { id: 'C007', role: 'user', text: 'What meds are STAT for the next 2 hours?', timestamp: '14:33:00' },
  { id: 'C008', role: 'assistant', text: 'Here are the **STAT medications** due soon:\n\n1. **Meropenem 1g IV** — Mr. Arjun Reddy (Bed 9) — Due 12:00 PM ⚠️ OVERDUE\n2. **Metoprolol 25mg** — Mr. Raj Sharma (Bed 7) — Due 10:30 AM ⚠️ OVERDUE\n3. **Methylprednisolone 40mg IV** — Mr. Suresh Kumar (Bed 12) — Due 10:00 AM ⚠️ OVERDUE\n4. **Pantoprazole 80mg IV** — Mr. Vikram Singh (Bed 11) — Continuous, running\n\n⚠️ 3 STAT meds appear overdue. Please verify administration status.', timestamp: '14:33:08', source: 'Medication records, last updated 14:00' },
];

export const shiftSwapRequests = [
  {
    id: 'SS001',
    requestor: { name: 'Deepak Nair', initials: 'DN', role: 'Junior Nurse' },
    currentShift: { type: 'Night', time: '8PM – 8AM', ward: 'ICU Ward 3', date: '2025-04-22' },
    patientsAssigned: 1,
    reason: 'Family emergency — father hospitalized',
    status: 'pending',
  },
  {
    id: 'SS002',
    requestor: { name: 'Sunita Mishra', initials: 'SM', role: 'Staff Nurse' },
    currentShift: { type: 'Day', time: '8AM – 8PM', ward: 'General Ward 1', date: '2025-04-23' },
    patientsAssigned: 5,
    reason: 'Medical appointment — follow-up',
    status: 'pending',
  },
  {
    id: 'SS003',
    requestor: { name: 'Anil Joshi', initials: 'AJ', role: 'Junior Nurse' },
    currentShift: { type: 'Night', time: '8PM – 8AM', ward: 'ICU Ward 3', date: '2025-04-24' },
    patientsAssigned: 2,
    reason: 'Exam preparation leave',
    status: 'accepted',
  },
];

export const triageScoreHistory = [
  { month: 'Jan', score: 72 },
  { month: 'Feb', score: 68 },
  { month: 'Mar', score: 77 },
  { month: 'Apr', score: 82 },
  { month: 'May', score: 95 },
  { month: 'Jun', score: 88 },
  { month: 'Jul', score: 71 },
  { month: 'Aug', score: 65 },
  { month: 'Sep', score: 77 },
  { month: 'Oct', score: 83 },
  { month: 'Nov', score: 90 },
  { month: 'Dec', score: 87 },
];

export const scheduleData = {
  days: [
    { day: 'Mon', date: 11, tasks: 3 },
    { day: 'Tue', date: 12, tasks: 5, active: true },
    { day: 'Wed', date: 13, tasks: 2 },
    { day: 'Thu', date: 14, tasks: 4 },
    { day: 'Fri', date: 15, tasks: 1 },
    { day: 'Sat', date: 16, tasks: 0 },
    { day: 'Sun', date: 17, tasks: 0 },
    { day: 'Mon', date: 18, tasks: 3 },
    { day: 'Tue', date: 19, tasks: 2 },
    { day: 'Wed', date: 20, tasks: 4 },
  ],
};

// Helper function to get risk color
export const getRiskColor = (risk) => {
  const map = { P1: '#EF4444', P2: '#F97316', P3: '#F59E0B', P4: '#8FD14F', P5: '#A0ADA0' };
  return map[risk] || '#A0ADA0';
};

// Helper function to get risk badge class
export const getRiskBadgeClass = (risk) => {
  const map = { P1: 'badge-p1', P2: 'badge-p2', P3: 'badge-p3', P4: 'badge-p4', P5: 'badge-p5' };
  return map[risk] || 'badge-p5';
};

// Helper to get vital status
export const getVitalStatus = (type, value) => {
  switch (type) {
    case 'hr':
      if (value > 120 || value < 50) return 'critical';
      if (value > 100 || value < 60) return 'warning';
      return 'normal';
    case 'spo2':
      if (value < 90) return 'critical';
      if (value < 95) return 'warning';
      return 'normal';
    case 'bpSys':
      if (value > 180 || value < 90) return 'critical';
      if (value > 140 || value < 100) return 'warning';
      return 'normal';
    case 'temp':
      if (value > 39 || value < 35) return 'critical';
      if (value > 38 || value < 36) return 'warning';
      return 'normal';
    case 'rr':
      if (value > 28 || value < 10) return 'critical';
      if (value > 22 || value < 12) return 'warning';
      return 'normal';
    default:
      return 'normal';
  }
};
