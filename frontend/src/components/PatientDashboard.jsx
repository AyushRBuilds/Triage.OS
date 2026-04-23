import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, Heart, Wind, FileText, User, Calendar, ChevronRight, Search, Filter, Info, Download } from 'lucide-react';
import { getPatients, getSoapNotesByPatient } from '../api/services';
import { useAuth } from '../contexts/AuthContext';
import { getRiskBadgeClass, getRiskColor } from '../data/mockData';
import { useSimulatedVitals } from '../hooks/useSimulatedVitals';
import VitalMiniCard from './ui/VitalMiniCard';
import './PatientDashboard.css';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [rawPatients, setRawPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [showExpandedVitals, setShowExpandedVitals] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Live vitals
  const { patients } = useSimulatedVitals(rawPatients);
  
  const selectedPatient = selectedPatientId ? patients.find(p => p.id === selectedPatientId) : null;

  const downloadReport = async (patient) => {
    if (!patient) return;
    setIsDownloading(true);
    try {
      const notes = await getSoapNotesByPatient(patient.id);
      const reportContent = `
============================================================
           T.OS — COMPREHENSIVE PATIENT REPORT
============================================================
GENERATED AT: ${new Date().toLocaleString()}

PATIENT INFORMATION
-------------------
Name:       ${patient.name}
Age/Gender: ${patient.age}y / ${patient.gender}
Bed:        ${patient.bed}
Ward:       ${patient.ward}
Risk Level: ${patient.risk}
Admitted:   ${patient.admittedDate}

CLINICAL STATUS
---------------
Diagnosis:  ${patient.diagnosis}
Vitals (Last Recorded):
  - HR:   ${patient.vitals?.hr || 'N/A'} bpm
  - SpO2: ${patient.vitals?.spo2 || 'N/A'} %
  - BP:   ${patient.vitals?.bpSys || 'N/A'}/${patient.vitals?.bpDia || 'N/A'} mmHg
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
      link.download = `Report_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const generateSparkline = (base, variance, count = 12) =>
    Array.from({ length: count }, () => base + Math.round((Math.random() - 0.5) * variance * 2));

  useEffect(() => {
    async function load() {
      const p = await getPatients();

      // Filter for nurses
      let filtered = p;
      if (user?.role === 'nurse') {
        filtered = p.filter(patient =>
          patient.assignedNurses?.some(n => n.id === user?.id) || patient.assignedNurse === user?.name
        );
      } else if (user?.role === 'admin' || user?.role === 'doctor') {
        // can see all patients
        filtered = p;
      }

      setRawPatients(filtered);
      
      // Deep link to patient from URL if present
      const params = new URLSearchParams(location.search);
      const patientIdParam = params.get('patient');
      
      if (patientIdParam && filtered.some(pt => pt.id === patientIdParam)) {
        setSelectedPatientId(patientIdParam);
      } else if (filtered.length > 0) {
        setSelectedPatientId(filtered[0].id);
      }
    }
    load();
  }, [user, location.search]);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.risk === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const getVitalColor = (type, val) => {
    if (type === 'hr' && (val > 120 || val < 50)) return 'var(--risk-p1)';
    if (type === 'hr' && (val > 100 || val < 60)) return 'var(--risk-p2)';
    if (type === 'spo2' && val < 90) return 'var(--risk-p1)';
    if (type === 'spo2' && val < 95) return 'var(--risk-p2)';
    return 'var(--green-primary)';
  };

  return (
    <div className="pd-page" id="patient-dashboard">
      {/* Left: Patient list */}
      <div className="pd-list">
        <div className="pd-list-header">
          <h3 className="text-section-title">Patients</h3>
          <span className="badge badge-p4">{filteredPatients.length}</span>
        </div>

        <div className="pd-filters">
          <div className="pd-search-wrap">
            <Search size={14} className="pd-search-icon" />
            <input
              className="input input-pill pd-search"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="pd-risk-filter" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option value="all">All Risk</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Moderate</option>
            <option value="P4">P4 Low</option>
            <option value="P5">P5 Stable</option>
          </select>
        </div>

        <div className="pd-patient-list">
          {filteredPatients.map((p) => (
            <button
              key={p.id}
              className={`pd-patient-item ${selectedPatient?.id === p.id ? 'active' : ''}`}
              onClick={() => setSelectedPatientId(p.id)}
            >
              <div className="pd-patient-avatar" style={{ background: getRiskColor(p.risk) }}>
                {p.initials}
              </div>
              <div className="pd-patient-meta">
                <span className="pd-patient-name">{p.name}</span>
                <span className="pd-patient-sub">{p.bed} · {p.age}y {p.gender}</span>
              </div>
              <span className={`badge ${getRiskBadgeClass(p.risk)}`}>{p.risk}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Patient detail */}
      {selectedPatient ? (
        <div className="pd-detail">
          {/* Profile header */}
          <div className="pd-detail-header card">
            <div className="pd-detail-avatar" style={{ background: getRiskColor(selectedPatient.risk) }}>
              {selectedPatient.initials}
            </div>
            <div className="pd-detail-info">
              <h2 className="pd-detail-name">{selectedPatient.name}</h2>
              <div className="pd-detail-tags">
                <span className={`badge ${getRiskBadgeClass(selectedPatient.risk)}`}>{selectedPatient.risk}</span>
                <span className="pd-detail-tag"><User size={11} /> {selectedPatient.age}y, {selectedPatient.gender === 'M' ? 'Male' : 'Female'}</span>
                <span className="pd-detail-tag"><Activity size={11} /> {selectedPatient.bed}</span>
                <span className="pd-detail-tag"><Calendar size={11} /> Admitted {selectedPatient.admittedDate}</span>
              </div>
            </div>
            <div className="pd-detail-actions">
              <button className={`btn btn-sm ${showExpandedVitals ? 'btn-ghost' : 'btn-primary'}`} onClick={() => setShowExpandedVitals(!showExpandedVitals)}>
                <Activity size={14} /> {showExpandedVitals ? 'Hide Vitals' : 'Vitals'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => downloadReport(selectedPatient)} disabled={isDownloading}>
                <Download size={14} /> {isDownloading ? 'Downloading...' : 'Report'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/soap-notes?patient=${selectedPatient.id}`)}>
                <FileText size={14} /> SOAP Notes
              </button>
            </div>
          </div>

          {/* Current Condition */}
          <div className="pd-section">
            <h4 className="pd-section-title">Current Condition</h4>
            <div className="pd-condition-card card">
              <span className="text-label">Diagnosis</span>
              <p className="pd-diagnosis">{selectedPatient.diagnosis}</p>
              <span className="text-label" style={{ marginTop: 12 }}>Assigned Nurses</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {selectedPatient.assignedNurses?.length > 0 ? (
                  selectedPatient.assignedNurses.map((nurse, idx) => (
                    <span key={idx} className="badge badge-outline" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}>
                      <User size={12} /> {nurse.name}
                      {nurse.isTemporary && (
                        <Info size={12} style={{ color: 'var(--blue-primary)' }} title="Assigned temporarily via Shift Swap" />
                      )}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>None assigned</span>
                )}
              </div>
              <span className="text-label" style={{ marginTop: 8 }}>Last Updated</span>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selectedPatient.lastUpdated}</p>
            </div>
          </div>

          {/* Expanded Vitals Section */}
          {showExpandedVitals && (
            <div className="pd-section animate-slide-up" style={{ marginTop: 24, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <VitalMiniCard
                  label="HEART RATE"
                  value={selectedPatient.vitals.hr}
                  unit="bpm"
                  type="hr"
                  sparklineData={generateSparkline(selectedPatient.vitals.hr, 8)}
                />
                <VitalMiniCard
                  label="SPO2"
                  value={selectedPatient.vitals.spo2}
                  unit="%"
                  type="spo2"
                  sparklineData={generateSparkline(selectedPatient.vitals.spo2, 3)}
                />
                <VitalMiniCard
                  label="BLOOD PRESSURE"
                  value={`${selectedPatient.vitals.bpSys}/${selectedPatient.vitals.bpDia}`}
                  unit="mmHg"
                  type="bpSys"
                  sparklineData={generateSparkline(selectedPatient.vitals.bpSys, 10)}
                />
                <div className="card" style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column' }}>
                  <span className="text-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>TEMPERATURE</span>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{selectedPatient.vitals.temp || '37.2'}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>°C</span>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column' }}>
                  <span className="text-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>RESPIRATORY RATE</span>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{selectedPatient.vitals.rr || '18'}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>breaths/min</span>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column' }}>
                  <span className="text-label" style={{ fontSize: 11, letterSpacing: '0.5px' }}>PAIN SCORE</span>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{selectedPatient.vitals.pain || '4'}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}>/10</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medications */}
          <div className="pd-section">
            <h4 className="pd-section-title">Current Medications</h4>
            <div className="pd-meds-list">
              {selectedPatient.medications?.map((m, i) => (
                <div key={i} className="pd-med-item card">
                  <div className="pd-med-info">
                    <span className="pd-med-name">{m.name}</span>
                    <span className="pd-med-schedule">{m.schedule} · {m.time}</span>
                  </div>
                  <span className={`badge ${m.urgency === 'STAT' ? 'badge-stat' : m.urgency === 'Urgent' ? 'badge-urgent' : 'badge-routine'}`}>
                    {m.urgency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Medical History (mock) */}
          <div className="pd-section">
            <h4 className="pd-section-title">Medical History</h4>
            <div className="pd-history card">
              <div className="pd-history-timeline">
                <div className="pd-history-entry">
                  <div className="pd-history-dot" />
                  <div className="pd-history-content">
                    <span className="pd-history-date">{selectedPatient.admittedDate}</span>
                    <span className="pd-history-event">Admitted to {selectedPatient.ward}</span>
                    <span className="pd-history-desc">Diagnosis: {selectedPatient.diagnosis?.split(',')[0]}</span>
                  </div>
                </div>
                <div className="pd-history-entry">
                  <div className="pd-history-dot" />
                  <div className="pd-history-content">
                    <span className="pd-history-date">Initial Assessment</span>
                    <span className="pd-history-event">Risk classified as {selectedPatient.risk}</span>
                    <span className="pd-history-desc">Assigned to {selectedPatient.assignedNurse}</span>
                  </div>
                </div>
                <div className="pd-history-entry">
                  <div className="pd-history-dot active" />
                  <div className="pd-history-content">
                    <span className="pd-history-date">Ongoing</span>
                    <span className="pd-history-event">Active treatment & monitoring</span>
                    <span className="pd-history-desc">{selectedPatient.medications?.length || 0} active medications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="pd-detail pd-empty">
          <User size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          <p className="text-body">Select a patient to view details</p>
        </div>
      )}
    </div>
  );
}
