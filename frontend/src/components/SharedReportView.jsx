import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileDown, AlertTriangle, Loader2, Activity } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { getSoapNotesByPatient } from '../api/services';
import './PatientDashboard.css';

export default function SharedReportView() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch patient details directly from Supabase (bypassing normalizePatient if needed, but let's try to match structure)
        const { data: p, error: pErr } = await supabase
          .from('patients')
          .select(`
            *,
            vitals (*),
            medications (*)
          `)
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
      } finally {
        setLoading(false);
      }
    }

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

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_${patient.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <Loader2 size={48} className="soap-spinner" style={{ color: 'var(--green-primary)' }} />
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Securely loading clinical report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: 20, textAlign: 'center' }}>
        <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Access Denied or Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400 }}>The report you are looking for might have expired or the link is invalid. Please contact the clinical administrator.</p>
      </div>
    );
  }

  return (
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
              </div>
            </div>
          </div>

          <div>
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
                  </div>
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.5, textAlign: 'center', padding: 20 }}>No clinical notes available for this report.</div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 60, borderTop: '1px dashed var(--border-default)', paddingTop: 32 }}>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.5 }}>This document is a confidential medical record produced by Triage.OS.</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 11, opacity: 0.3 }}>ID: {patientId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
