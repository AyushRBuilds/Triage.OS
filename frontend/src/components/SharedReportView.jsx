import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
<<<<<<< HEAD
import { Download, FileDown, AlertTriangle, Loader2, Activity } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { getSoapNotesByPatient } from '../api/services';
import './PatientDashboard.css';

export default function SharedReportView() {
  const { patientId } = useParams();
=======
import { Download, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { getSoapNotesByPatient, normalizePatient } from '../api/services';
import { decodeShareToken } from '../utils/shareHelper';
import './PatientDashboard.css';

export default function SharedReportView() {
  console.log('[SharedReportView] Component Mounting...');
  const params = useParams();
  
  // Fallback: manually parse if rendered outside a Route context
  const token = params.patientId || window.location.pathname.split('/').pop();
  
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
<<<<<<< HEAD
    async function loadData() {
      setLoading(true);
      try {
        // Fetch patient details directly from Supabase (bypassing normalizePatient if needed, but let's try to match structure)
=======
    console.log('[SharedReportView] Effect Running with token:', token);
    async function loadData() {
      if (!token) {
        setError('No report token provided');
        setLoading(false);
        return;
      }

      const actualId = decodeShareToken(token);
      console.log('[SharedReportView] Decoded actualId:', actualId);
      
      if (!actualId) {
        setError('The shared link is invalid or has been corrupted.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
        const { data: p, error: pErr } = await supabase
          .from('patients')
          .select(`
            *,
            vitals (*),
            medications (*)
          `)
<<<<<<< HEAD
          .eq('id', patientId)
          .single();

        if (pErr) throw pErr;
        if (!p) throw new Error('Patient not found');

        // Transform to match app structure
        const normalizedPatient = {
          ...p,
          vitals: p.vitals || { hr: 0, spo2: 0, bp_sys: 0, bp_dia: 0, temp: 0 },
          medications: p.medications || []
        };

        const n = await getSoapNotesByPatient(patientId);
        
        setPatient(normalizedPatient);
        setNotes(n);
      } catch (err) {
        console.error('Failed to load shared report:', err);
        setError(err.message);
=======
          .eq('id', actualId)
          .single();

        if (pErr) throw pErr;
        if (!p) throw new Error('Clinical record not found in database.');

        const normalizedPatient = normalizePatient(p);
        const n = await getSoapNotesByPatient(actualId);
        
        setPatient(normalizedPatient);
        setNotes(n || []);
      } catch (err) {
        console.error('[SharedReport] Load Error:', err);
        setError(err.message || 'An unexpected error occurred while loading the report.');
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
      } finally {
        setLoading(false);
      }
    }

<<<<<<< HEAD
    if (patientId) loadData();
  }, [patientId]);

  const downloadReport = () => {
    if (!patient) return;

    const reportContent = `
============================================================
           TRIAGE.OS — SHARED CLINICAL REPORT
============================================================
GENERATED AT: ${new Date().toLocaleString()}

PATIENT INFORMATION
-------------------
Name:       ${patient.name}
Age/Gender: ${patient.age}y / ${patient.gender}
Bed:        ${patient.bed}
Ward:       ${patient.ward}
Risk Level: ${patient.risk}
Admitted:   ${patient.admitted_date}

CLINICAL STATUS
---------------
Diagnosis:  ${patient.diagnosis}
Vitals (Last Recorded):
  - HR:   ${patient.vitals?.hr || 'N/A'} bpm
  - SpO2: ${patient.vitals?.spo2 || 'N/A'} %
  - BP:   ${patient.vitals?.bp_sys || 'N/A'}/${patient.vitals?.bp_dia || 'N/A'} mmHg
  - Temp: ${patient.vitals?.temp || 'N/A'} °C

MEDICATIONS
-----------
${patient.medications?.length > 0 
  ? patient.medications.map(m => `- ${m.name} (${m.urgency}): ${m.schedule} @ ${m.time}`).join('\n')
  : 'No active medications.'}

RECENT CLINICAL NOTES (SOAP)
----------------------------
${notes.length > 0 
  ? notes.map(n => `
Date: ${new Date(n.recorded_at).toLocaleString()}
Urgency: ${n.urgency_level || 'N/A'}
[SUBJECTIVE]
${n.subjective || 'N/A'}
[OBJECTIVE]
${n.objective || 'N/A'}
[ASSESSMENT]
${n.assessment || 'N/A'}
[PLAN]
${n.plan || 'N/A'}
------------------------------------------------------------`).join('\n')
  : 'No clinical notes found.'}

============================================================
END OF REPORT
============================================================
    `;

=======
    loadData();
  }, [token]);

  const downloadReport = () => {
    if (!patient) return;
    const reportContent = `TRIAGE.OS SHARED REPORT\nPatient: ${patient.name}\nGenerated: ${new Date().toLocaleString()}`;
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
<<<<<<< HEAD
    link.download = `Report_${patient.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
=======
    link.download = `Report_${patient.name || 'Patient'}.txt`;
    link.click();
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
  };

  if (loading) {
    return (
<<<<<<< HEAD
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Loader2 size={48} className="soap-spinner" style={{ color: 'var(--green-primary)' }} />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Securely loading clinical report...</p>
=======
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#10b981' }} />
        <p style={{ marginTop: 20, opacity: 0.6 }}>Securely accessing clinical record...</p>
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
      </div>
    );
  }

<<<<<<< HEAD
  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: 20, textAlign: 'center' }}>
        <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Access Denied or Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>The report you are looking for might have expired or the link is invalid. Please contact the clinical administrator.</p>
=======
  if (error || !patient) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white', padding: 20, textAlign: 'center' }}>
        <AlertTriangle size={50} style={{ color: '#ef4444', marginBottom: 20 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Access Error</h2>
        <p style={{ color: '#888', marginTop: 10, maxWidth: 400 }}>{error || 'Patient data could not be retrieved.'}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 30, padding: '10px 20px', background: '#333', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer' }}>Try Again</button>
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px' }}>
              t<span style={{ color: 'var(--green-primary)' }}>.os</span> Shared Report
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Confidential Clinical Record</p>
          </div>
          <button className="btn btn-primary" onClick={downloadReport}>
            <Download size={18} /> Download .txt
          </button>
        </div>

        <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', padding: 40, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: '1.6', color: 'var(--text-main)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ margin: 0, letterSpacing: '2px', fontSize: 20 }}>PATIENT SUMMARY</h2>
            <div style={{ height: 1, background: 'var(--border-default)', margin: '20px auto', width: '60%' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[PATIENT IDENTITY]</div>
              <div>Name: {patient.name}</div>
              <div>Age/Sex: {patient.age}y / {patient.gender}</div>
              <div>Bed: {patient.bed}</div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[ADMISSION DATA]</div>
              <div>Ward: {patient.ward}</div>
              <div>Date: {patient.admitted_date}</div>
              <div>Risk: {patient.risk}</div>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[CURRENT DIAGNOSIS]</div>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: 20, borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
              {patient.diagnosis}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[VITALS]</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.5 }}>HR</div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{patient.vitals?.hr || 'N/A'}</div>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.5 }}>SPO2</div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{patient.vitals?.spo2 || 'N/A'}%</div>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.5 }}>BP</div>
                <div style={{ fontSize: 18, fontWeight: 'bold' }}>{patient.vitals?.bp_sys || 'N/A'}/{patient.vitals?.bp_dia || 'N/A'}</div>
=======
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>t<span style={{ color: '#10b981' }}>.os</span> Shared Report</h1>
            <p style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>CONFIDENTIAL MEDICAL RECORD</p>
          </div>
          <button 
            style={{ background: '#10b981', color: 'black', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={downloadReport}
          >
            <Download size={16} /> Download .txt
          </button>
        </div>

        <div style={{ background: '#151515', border: '1px solid #333', borderRadius: 24, padding: 40, boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ borderBottom: '1px solid #333', paddingBottom: 30, marginBottom: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <div>
              <label style={{ fontSize: 10, color: '#10b981', fontWeight: 800, display: 'block', marginBottom: 12, letterSpacing: '1px' }}>PATIENT IDENTITY</label>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{patient?.name || 'Unknown'}</div>
              <div style={{ fontSize: 14, opacity: 0.6, marginTop: 4 }}>{patient?.age || '??'}y · {patient?.gender || '?'} · {patient?.bed || 'No Bed'}</div>
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#10b981', fontWeight: 800, display: 'block', marginBottom: 12, letterSpacing: '1px' }}>ADMISSION STATUS</label>
              <div style={{ fontSize: 14 }}>Ward: <span style={{ opacity: 0.6 }}>{patient?.ward || 'Unassigned'}</span></div>
              <div style={{ fontSize: 14 }}>Risk: <span style={{ color: '#ef4444', fontWeight: 700 }}>{patient?.risk || 'P?'}</span></div>
              <div style={{ fontSize: 14 }}>Date: <span style={{ opacity: 0.6 }}>{patient?.admittedDate || 'N/A'}</span></div>
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ fontSize: 10, color: '#10b981', fontWeight: 800, display: 'block', marginBottom: 12, letterSpacing: '1px' }}>CURRENT DIAGNOSIS</label>
            <div style={{ fontSize: 16, lineHeight: 1.6, background: '#222', padding: 20, borderRadius: 12, border: '1px solid #444' }}>
              {patient?.diagnosis || 'No diagnosis on record.'}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <label style={{ fontSize: 10, color: '#10b981', fontWeight: 800, display: 'block', marginBottom: 16, letterSpacing: '1px' }}>LATEST VITALS</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15 }}>
              <div style={{ background: '#222', padding: 15, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.4 }}>HEART RATE</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{patient?.vitals?.hr || '--'} <span style={{ fontSize: 10, opacity: 0.4 }}>bpm</span></div>
              </div>
              <div style={{ background: '#222', padding: 15, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.4 }}>SPO2</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{patient?.vitals?.spo2 || '--'} <span style={{ fontSize: 10, opacity: 0.4 }}>%</span></div>
              </div>
              <div style={{ background: '#222', padding: 15, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.4 }}>BP</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{patient?.vitals?.bpSys || '--'}/{patient?.vitals?.bpDia || '--'}</div>
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
              </div>
            </div>
          </div>

          <div>
<<<<<<< HEAD
            <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 16 }}>[CLINICAL PROGRESS NOTES]</div>
            {notes.length > 0 ? (
              notes.map((note, idx) => (
                <div key={idx} style={{ marginBottom: 24, padding: 20, borderLeft: '3px solid var(--green-primary)', background: 'rgba(0,0,0,0.02)', borderRadius: '0 12px 12px 0' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{new Date(note.recorded_at).toLocaleDateString()} at {new Date(note.recorded_at).toLocaleTimeString()}</span>
                    <span style={{ color: 'var(--green-primary)' }}>{note.urgency_level}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div><span style={{ fontWeight: 'bold', opacity: 0.5 }}>S:</span> {note.subjective}</div>
                    {note.objective && <div><span style={{ fontWeight: 'bold', opacity: 0.5 }}>O:</span> {note.objective}</div>}
                    {note.assessment && <div><span style={{ fontWeight: 'bold', opacity: 0.5 }}>A:</span> {note.assessment}</div>}
                    {note.plan && <div><span style={{ fontWeight: 'bold', opacity: 0.5 }}>P:</span> {note.plan}</div>}
=======
            <label style={{ fontSize: 10, color: '#10b981', fontWeight: 800, display: 'block', marginBottom: 20, letterSpacing: '1px' }}>PROGRESS NOTES</label>
            {notes.length > 0 ? (
              notes.map((note, idx) => (
                <div key={idx} style={{ marginBottom: 20, padding: 20, background: '#222', borderRadius: 12, borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 10, display: 'flex', justifyContent: 'space-between', opacity: 0.6 }}>
                    <span>{new Date(note.recorded_at).toLocaleDateString()} · {new Date(note.recorded_at).toLocaleTimeString()}</span>
                    <span style={{ color: '#10b981' }}>{note.urgency_level || 'Routine'}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                    {note.subjective && <p><strong>S:</strong> {note.subjective}</p>}
                    {note.assessment && <p><strong>A:</strong> {note.assessment}</p>}
                    {note.plan && <p><strong>P:</strong> {note.plan}</p>}
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
                  </div>
                </div>
              ))
            ) : (
<<<<<<< HEAD
              <div style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>No clinical notes available for this report.</div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 60, borderTop: '1px dashed var(--border-default)', paddingTop: 32 }}>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.5 }}>This document is a confidential medical record produced by Triage.OS.</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 11, opacity: 0.3 }}>ID: {patientId}</p>
          </div>
=======
              <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13 }}>No clinical notes available.</div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, opacity: 0.2, fontSize: 10 }}>
          <p>This is an automated report generated by Triage.OS.</p>
          <p>ID Hash: {token?.substring(0, 8)}...</p>
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
        </div>
      </div>
    </div>
  );
}
