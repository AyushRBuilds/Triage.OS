import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Wind, Thermometer, Activity, Plus, Save, ChevronDown } from 'lucide-react';
import { getPatients, updatePatientVitals } from '../api/services';
import { useSimulatedVitals } from '../hooks/useSimulatedVitals';
import VitalMiniCard from './ui/VitalMiniCard';
import { toast } from './Toast';
import './VitalsPage.css';

export default function VitalsPage() {
  const [searchParams] = useSearchParams();
  const [rawPatients, setRawPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patient') || '');
  const [showForm, setShowForm] = useState(false);
  const [vitalForm, setVitalForm] = useState({ hr: '', spo2: '', bpSys: '', bpDia: '', temp: '', rr: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const { patients, isConnected } = useSimulatedVitals(rawPatients);

  useEffect(() => {
    async function load() {
      const p = await getPatients();
      setRawPatients(p);
      if (!selectedPatientId && p.length > 0) {
        setSelectedPatientId(p[0].id);
      }
    }
    load();
  }, []);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const generateSparkline = (base, variance, count = 12) =>
    Array.from({ length: count }, () => base + Math.round((Math.random() - 0.5) * variance * 2));

  const handleSave = async () => {
    if (!selectedPatientId) return;
    setSaving(true);
    try {
      // Only send fields that were actually filled in
      const updates = {};
      if (vitalForm.hr)     updates.hr     = parseInt(vitalForm.hr);
      if (vitalForm.spo2)   updates.spo2   = parseInt(vitalForm.spo2);
      if (vitalForm.bpSys)  updates.bp_sys = parseInt(vitalForm.bpSys);
      if (vitalForm.bpDia)  updates.bp_dia = parseInt(vitalForm.bpDia);
      if (vitalForm.temp)   updates.temp   = parseFloat(vitalForm.temp);
      if (vitalForm.rr)     updates.rr     = parseInt(vitalForm.rr);

      if (Object.keys(updates).length > 0) {
        await updatePatientVitals(selectedPatientId, updates);
      }
      setSaveMsg('Vitals saved successfully!');
      setShowForm(false);
      setVitalForm({ hr: '', spo2: '', bpSys: '', bpDia: '', temp: '', rr: '' });
      setTimeout(() => setSaveMsg(''), 3000);
      toast.success('Vitals saved successfully!');
    } catch (err) {
      console.error('Failed to save vitals:', err);
      toast.error('Could not save vitals. Check Supabase RLS policies.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vitals-page" id="vitals-page">
      <div className="vitals-header">
        <div className="vitals-header-left">
          <h3 className="text-section-title">Patient Vitals</h3>
          {isConnected && (
            <span className="live-badge">
              <span className="pulse-dot" /> Live
            </span>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> {showForm ? 'Cancel' : 'Add / Update Vitals'}
        </button>
      </div>

      {/* Patient selector */}
      <div className="vitals-selector">
        <label className="text-label">Select Patient</label>
        <select
          className="vitals-select"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          id="vitals-patient-select"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.bed} — {p.risk}
            </option>
          ))}
        </select>
      </div>

      {saveMsg && (
        <div className="vitals-save-msg animate-fade-in">
          <Save size={14} /> {saveMsg}
        </div>
      )}

      {/* Vitals display */}
      {selectedPatient && (
        <>
          {/* Patient info banner */}
          <div className="vitals-patient-banner card">
            <div className="vitals-pat-avatar" style={{ background: selectedPatient.risk === 'P1' ? 'var(--risk-p1)' : 'var(--green-primary)' }}>
              {selectedPatient.initials}
            </div>
            <div className="vitals-pat-info">
              <span className="vitals-pat-name">{selectedPatient.name}</span>
              <span className="text-body">{selectedPatient.bed} · {selectedPatient.ward} · {selectedPatient.diagnosis?.split(',')[0]}</span>
            </div>
            <span className={`badge badge-${selectedPatient.risk.toLowerCase()}`}>{selectedPatient.risk}</span>
          </div>

          {/* Vitals grid */}
          <div className="vitals-grid">
            <VitalMiniCard
              label="Heart Rate"
              value={selectedPatient.vitals.hr}
              unit="bpm"
              type="hr"
              sparklineData={generateSparkline(selectedPatient.vitals.hr, 8)}
            />
            <VitalMiniCard
              label="SpO2"
              value={selectedPatient.vitals.spo2}
              unit="%"
              type="spo2"
              sparklineData={generateSparkline(selectedPatient.vitals.spo2, 3)}
            />
            <VitalMiniCard
              label="Blood Pressure"
              value={`${selectedPatient.vitals.bpSys}/${selectedPatient.vitals.bpDia}`}
              unit="mmHg"
              type="bpSys"
              sparklineData={generateSparkline(selectedPatient.vitals.bpSys, 10)}
            />
            <div className="vital-detail-card card">
              <span className="text-label">Temperature</span>
              <span className="vital-detail-value">{selectedPatient.vitals.temp || '37.2'}</span>
              <span className="text-unit">°C</span>
            </div>
            <div className="vital-detail-card card">
              <span className="text-label">Respiratory Rate</span>
              <span className="vital-detail-value">{selectedPatient.vitals.rr || '18'}</span>
              <span className="text-unit">breaths/min</span>
            </div>
            <div className="vital-detail-card card">
              <span className="text-label">Pain Score</span>
              <span className="vital-detail-value">{selectedPatient.vitals.pain || '4'}</span>
              <span className="text-unit">/10</span>
            </div>
          </div>

          {/* Add/Update form */}
          {showForm && (
            <div className="vitals-form card animate-slide-up">
              <h4 className="text-card-title" style={{ marginBottom: 16 }}>Update Vitals for {selectedPatient.name}</h4>
              <div className="vitals-form-grid">
                <div className="vitals-form-field">
                  <label className="text-label">Heart Rate (bpm)</label>
                  <input type="number" className="input" placeholder={selectedPatient.vitals.hr} value={vitalForm.hr} onChange={(e) => setVitalForm({ ...vitalForm, hr: e.target.value })} />
                </div>
                <div className="vitals-form-field">
                  <label className="text-label">SpO2 (%)</label>
                  <input type="number" className="input" placeholder={selectedPatient.vitals.spo2} value={vitalForm.spo2} onChange={(e) => setVitalForm({ ...vitalForm, spo2: e.target.value })} />
                </div>
                <div className="vitals-form-field">
                  <label className="text-label">Systolic BP</label>
                  <input type="number" className="input" placeholder={selectedPatient.vitals.bpSys} value={vitalForm.bpSys} onChange={(e) => setVitalForm({ ...vitalForm, bpSys: e.target.value })} />
                </div>
                <div className="vitals-form-field">
                  <label className="text-label">Diastolic BP</label>
                  <input type="number" className="input" placeholder={selectedPatient.vitals.bpDia} value={vitalForm.bpDia} onChange={(e) => setVitalForm({ ...vitalForm, bpDia: e.target.value })} />
                </div>
                <div className="vitals-form-field">
                  <label className="text-label">Temperature (°C)</label>
                  <input type="number" step="0.1" className="input" placeholder="37.2" value={vitalForm.temp} onChange={(e) => setVitalForm({ ...vitalForm, temp: e.target.value })} />
                </div>
                <div className="vitals-form-field">
                  <label className="text-label">Respiratory Rate</label>
                  <input type="number" className="input" placeholder="18" value={vitalForm.rr} onChange={(e) => setVitalForm({ ...vitalForm, rr: e.target.value })} />
                </div>
              </div>
              <div className="vitals-form-actions">
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save Vitals'}</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
