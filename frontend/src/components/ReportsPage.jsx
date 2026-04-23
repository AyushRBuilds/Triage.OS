import { useState, useEffect } from 'react';
import { FileText, Download, Search, User, Calendar, Activity, ChevronRight, FileDown, Share2 } from 'lucide-react';
import { getPatients, getSoapNotesByPatient } from '../api/services';
import { getRiskBadgeClass } from '../data/mockData';
import { toast } from './Toast';
import { encodeShareToken } from '../utils/shareHelper';
import './PatientDashboard.css'; // Reuse some styles

export default function ReportsPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getPatients();
      setPatients(p);
      if (p.length > 0) handleSelectPatient(p[0]);
    }
    load();
  }, []);

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    try {
      const notes = await getSoapNotesByPatient(patient.id);
      setRecentNotes(notes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.bed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadReport = () => {
    if (!selectedPatient) return;

    const reportContent = `
============================================================
         T.OS — COMPREHENSIVE PATIENT REPORT
============================================================
GENERATED AT: ${new Date().toLocaleString()}

PATIENT INFORMATION
-------------------
Name:       ${selectedPatient.name}
Age/Gender: ${selectedPatient.age}y / ${selectedPatient.gender}
Bed:        ${selectedPatient.bed}
Ward:       ${selectedPatient.ward}
Risk Level: ${selectedPatient.risk}
Admitted:   ${selectedPatient.admittedDate}

CLINICAL STATUS
---------------
Diagnosis:  ${selectedPatient.diagnosis}
Vitals (Last Recorded):
  - HR:   ${selectedPatient.vitals?.hr || 'N/A'} bpm
  - SpO2: ${selectedPatient.vitals?.spo2 || 'N/A'} %
  - BP:   ${selectedPatient.vitals?.bpSys || 'N/A'}/${selectedPatient.vitals?.bpDia || 'N/A'} mmHg
  - Temp: ${selectedPatient.vitals?.temp || 'N/A'} °C

MEDICATIONS
-----------
${selectedPatient.medications?.length > 0 
  ? selectedPatient.medications.map(m => `- ${m.name} (${m.urgency}): ${m.schedule} @ ${m.time}`).join('\n')
  : 'No active medications.'}

RECENT CLINICAL NOTES (SOAP)
----------------------------
${recentNotes.length > 0 
  ? recentNotes.map(n => `
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
    link.download = `Report_${selectedPatient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Report downloaded successfully');
  };

  const shareReport = async () => {
    if (!selectedPatient) return;
    
    const token = encodeShareToken(selectedPatient.id);
    const shareUrl = `${window.location.origin}/share/report/${token}`;
    console.log('Generating Share URL:', shareUrl);
    const shareText = `Triage.OS Report for ${selectedPatient.name}\nBed: ${selectedPatient.bed}\nRisk: ${selectedPatient.risk}\nDiagnosis: ${selectedPatient.diagnosis}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Triage.OS - ${selectedPatient.name}`,
          text: shareText,
          url: shareUrl
        });
        toast.success('Shared successfully');
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Could not share. Please copy manually.');
        }
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n\nLink: ${shareUrl}`);
        toast.success('Report link copied to clipboard');
      } catch (err) {
        toast.error('Share not supported on this browser');
      }
    }
  };

  return (
    <div className="pd-page" id="reports-page">
      {/* Left: Patient selection */}
      <div className="pd-list">
        <div className="pd-list-header">
          <h3 className="text-section-title">Reports Overview</h3>
        </div>

        <div className="pd-filters">
          <div className="pd-search-wrap">
            <Search size={14} className="pd-search-icon" />
            <input
              className="input input-pill pd-search"
              placeholder="Filter patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="pd-patient-list">
          {filteredPatients.map((p) => (
            <button
              key={p.id}
              className={`pd-patient-item ${selectedPatient?.id === p.id ? 'active' : ''}`}
              onClick={() => handleSelectPatient(p)}
            >
              <div className="pd-patient-avatar" style={{ background: 'var(--green-primary)' }}>
                {p.initials}
              </div>
              <div className="pd-patient-meta">
                <span className="pd-patient-name">{p.name}</span>
                <span className="pd-patient-sub">{p.bed} · {p.ward}</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Right: Report Preview */}
      <div className="pd-detail">
        {selectedPatient ? (
          <div className="animate-fade-in">
            <div className="pd-detail-header card">
              <div className="pd-detail-info">
                <h2 className="pd-detail-name">Report Preview: {selectedPatient.name}</h2>
                <p className="text-body" style={{ marginTop: 4 }}>Review patient history and clinical notes before downloading.</p>
              </div>
              <div className="pd-detail-actions" style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={downloadReport}>
                  <Download size={16} /> Download .txt
                </button>
                <button className="btn btn-ghost" onClick={shareReport}>
                  <Share2 size={16} /> Share
                </button>
              </div>
            </div>

            <div className="pd-section">
              <div className="card" style={{ background: 'var(--bg-main)', border: '1px solid var(--border-default)', padding: 32, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: '1.6', color: 'var(--text-main)' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, letterSpacing: '2px' }}>T.OS</h3>
                  <p style={{ margin: '4px 0', opacity: 0.7 }}>Comprehensive Patient Report</p>
                  <div style={{ height: 1, background: 'var(--border-default)', margin: '16px auto', width: '80%' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[PATIENT IDENTITY]</div>
                    <div>Name: {selectedPatient.name}</div>
                    <div>Age/Sex: {selectedPatient.age}y / {selectedPatient.gender}</div>
                    <div>Bed: {selectedPatient.bed}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[ADMISSION DATA]</div>
                    <div>Ward: {selectedPatient.ward}</div>
                    <div>Date: {selectedPatient.admittedDate}</div>
                    <div>Risk: {selectedPatient.risk}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[CURRENT DIAGNOSIS]</div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 4 }}>
                    {selectedPatient.diagnosis}
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--green-primary)', marginBottom: 8 }}>[CLINICAL NOTES]</div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>Loading notes...</div>
                  ) : recentNotes.length > 0 ? (
                    recentNotes.map((note, idx) => (
                      <div key={idx} style={{ marginBottom: 16, padding: 12, borderLeft: '2px solid var(--green-primary)', background: 'rgba(0,0,0,0.02)' }}>
                        <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4 }}>{new Date(note.recorded_at).toLocaleDateString()} — {note.urgency_level}</div>
                        <div style={{ opacity: 0.8 }}>{note.subjective?.substring(0, 100)}...</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ opacity: 0.5 }}>No notes recorded for this patient.</div>
                  )}
                </div>

                <div style={{ textAlign: 'center', marginTop: 40, borderTop: '1px dashed var(--border-default)', paddingTop: 20 }}>
                  <p style={{ margin: 0, fontSize: 11, opacity: 0.5 }}>This is an automated report generated by t.os Clinical Intelligence System.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="pd-empty">
            <FileDown size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p>Select a patient to generate a report</p>
          </div>
        )}
      </div>
    </div>
  );
}
