import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
        const { data: p, error: pErr } = await supabase
          .from('patients')
          .select(`
            *,
            vitals (*),
            medications (*)
          `)
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
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  const downloadReport = () => {
    if (!patient) return;
    const reportContent = `TRIAGE.OS SHARED REPORT\nPatient: ${patient.name}\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_${patient.name || 'Patient'}.txt`;
    link.click();
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#10b981' }} />
        <p style={{ marginTop: 20, opacity: 0.6 }}>Securely accessing clinical record...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: 'white', padding: 20, textAlign: 'center' }}>
        <AlertTriangle size={50} style={{ color: '#ef4444', marginBottom: 20 }} />
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Access Error</h2>
        <p style={{ color: '#888', marginTop: 10, maxWidth: 400 }}>{error || 'Patient data could not be retrieved.'}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: 30, padding: '10px 20px', background: '#333', border: 'none', color: 'white', borderRadius: 8, cursor: 'pointer' }}>Try Again</button>
      </div>
    );
  }

  return (
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
              </div>
            </div>
          </div>

          <div>
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
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 13 }}>No clinical notes available.</div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40, opacity: 0.2, fontSize: 10 }}>
          <p>This is an automated report generated by Triage.OS.</p>
          <p>ID Hash: {token?.substring(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
}
