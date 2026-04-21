import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Save, Trash2, Clock, ChevronDown, FileText, Plus, Edit3, X } from 'lucide-react';
import { getSoapNotes, createSoapNote, getPatients, transcribeAudio } from '../api/services';
import { supabase } from '../api/supabaseClient';
import './SOAPNoteViewer.css';

export default function SOAPNoteViewer() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get('patient') || 'all');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  useEffect(() => {
    async function load() {
      const [n, p] = await Promise.all([getSoapNotes(), getPatients()]);
      setNotes(n);
      setPatients(p);
    }
    load();
  }, []);

  useEffect(() => {
    if (selectedPatient !== 'all') {
      setFormData((prev) => ({ ...prev, patientId: selectedPatient }));
    }
  }, [selectedPatient]);

  const filteredNotes = selectedPatient === 'all'
    ? notes
    : notes.filter((n) => n.patient_id === selectedPatient || n.patientId === selectedPatient);

  const selectedPatientData = patients.find((p) => p.id === selectedPatient);

  const handleMicClick = async () => {
    if (isRecording) {
      setIsRecording(false);
      const result = await transcribeAudio(null);
      setTranscript(result);
    } else {
      setIsRecording(true);
      setTranscript(null);
    }
  };

  // Save voice-transcribed note to Supabase
  const handleSave = async () => {
    if (!transcript) return;
    setSaving(true);
    try {
      const patientId = selectedPatient !== 'all' ? selectedPatient : patients[0]?.id;
      const patient = patients.find((p) => p.id === patientId);
      const saved = await createSoapNote({
        patient_id: patientId,
        subjective: transcript.text,
        objective: '',
        assessment: '',
        plan: '',
        entities: transcript.entities || {},
      });
      setNotes((prev) => [{ ...saved, patientName: patient?.name || '' }, ...prev]);
      setTranscript(null);
      setIsRecording(false);
    } catch (err) {
      console.error('Failed to save note:', err);
      alert('Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  // Save / update manual SOAP note to Supabase
  const handleAddNote = async () => {
    if (!formData.patientId || !formData.subjective.trim()) return;
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === formData.patientId);

      if (editingNote) {
        // UPDATE existing note
        const { data, error } = await supabase
          .from('soap_notes')
          .update({
            subjective: formData.subjective,
            objective: formData.objective,
            assessment: formData.assessment,
            plan: formData.plan,
          })
          .eq('id', editingNote)
          .select()
          .single();
        if (error) throw error;
        setNotes((prev) => prev.map((n) => n.id === editingNote ? { ...data, patientName: patient?.name || n.patientName } : n));
        setEditingNote(null);
      } else {
        // INSERT new note
        const saved = await createSoapNote({
          patient_id: formData.patientId,
          subjective: formData.subjective,
          objective: formData.objective,
          assessment: formData.assessment,
          plan: formData.plan,
          entities: {},
        });
        setNotes((prev) => [{ ...saved, patientName: patient?.name || '' }, ...prev]);
      }

      setFormData({ patientId: selectedPatient !== 'all' ? selectedPatient : '', subjective: '', objective: '', assessment: '', plan: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to save SOAP note:', err);
      alert('Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note.id);
    setFormData({
      patientId: note.patient_id || note.patientId,
      subjective: note.subjective || '',
      objective: note.objective || '',
      assessment: note.assessment || '',
      plan: note.plan || '',
    });
    setShowAddForm(true);
  };

  return (
    <div className="soap-page" id="soap-notes-page">
      {/* Left panel */}
      <div className="soap-left">
        <div className="soap-left-header">
          <h3 className="text-section-title">SOAP Notes</h3>
          <div className="soap-left-actions">
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingNote(null); setShowAddForm(true); }}>
              <Plus size={14} /> Add Note
            </button>
            <div className="soap-dropdown-wrapper">
              <button className="soap-dropdown-btn" onClick={() => setShowDropdown(!showDropdown)}>
                {selectedPatient === 'all' ? 'All Patients' : selectedPatientData?.name || 'Select'}
                <ChevronDown size={14} />
              </button>
              {showDropdown && (
                <div className="soap-dropdown-menu card">
                  <button className="soap-dropdown-item" onClick={() => { setSelectedPatient('all'); setShowDropdown(false); }}>
                    All Patients
                  </button>
                  {patients.map((p) => (
                    <button key={p.id} className="soap-dropdown-item" onClick={() => { setSelectedPatient(p.id); setShowDropdown(false); }}>
                      {p.name} — {p.bed}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedPatientData && (
          <div className="soap-patient-banner card">
            <div className="soap-pat-avatar" style={{ background: selectedPatientData.risk === 'P1' ? 'var(--risk-p1)' : 'var(--green-primary)' }}>
              {selectedPatientData.initials}
            </div>
            <div className="soap-pat-info">
              <span className="soap-pat-name">{selectedPatientData.name}</span>
              <span className="text-body">{selectedPatientData.bed} · {selectedPatientData.diagnosis?.split(',')[0]}</span>
            </div>
            <span className={`badge badge-${selectedPatientData.risk.toLowerCase()}`}>{selectedPatientData.risk}</span>
          </div>
        )}

        <div className="soap-notes-count">
          <span className="text-label">{filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} found</span>
        </div>

        <div className="soap-timeline">
          {filteredNotes.map((note, idx) => (
            <div key={note.id} className="soap-note-entry card animate-fade-in">
              {idx < filteredNotes.length - 1 && <div className="soap-timeline-line" />}
              <div className="soap-note-header">
                <span className="badge badge-available"><FileText size={10} /> {note.patientName || 'Unknown'}</span>
                <div className="soap-note-header-right">
                  <span className="soap-note-time">
                    <Clock size={10} /> {note.recorded_at ? new Date(note.recorded_at).toLocaleTimeString() : ''} · {note.recorded_at ? new Date(note.recorded_at).toLocaleDateString() : ''}
                  </span>
                  <button className="soap-edit-btn" onClick={() => handleEditNote(note)} title="Edit note">
                    <Edit3 size={12} />
                  </button>
                </div>
              </div>
              <div className="soap-sections">
                <div className="soap-section"><span className="soap-section-label">S</span><p>{note.subjective}</p></div>
                {note.objective && <div className="soap-section"><span className="soap-section-label">O</span><p>{note.objective}</p></div>}
                {note.assessment && <div className="soap-section"><span className="soap-section-label">A</span><p>{note.assessment}</p></div>}
                {note.plan && <div className="soap-section"><span className="soap-section-label">P</span><p>{note.plan}</p></div>}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && (
            <div className="soap-empty">
              <FileText size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-body">No SOAP notes found for this patient</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>
                <Plus size={14} /> Create First Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="soap-right">
        {showAddForm ? (
          <div className="soap-add-form animate-fade-in">
            <div className="soap-form-header">
              <h3 className="text-section-title">{editingNote ? 'Edit SOAP Note' : 'New SOAP Note'}</h3>
              <button className="kanban-modal-close" onClick={() => { setShowAddForm(false); setEditingNote(null); }}><X size={18} /></button>
            </div>
            <div className="soap-form-fields">
              <div className="kanban-form-field">
                <label className="text-label">Patient *</label>
                <select className="input" value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}>
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.bed}</option>
                  ))}
                </select>
              </div>
              <div className="soap-form-section">
                <label className="soap-form-label"><span className="soap-section-label">S</span> Subjective *</label>
                <textarea className="input soap-form-textarea" placeholder="Patient's reported symptoms..." value={formData.subjective} onChange={(e) => setFormData({ ...formData, subjective: e.target.value })} />
              </div>
              <div className="soap-form-section">
                <label className="soap-form-label"><span className="soap-section-label">O</span> Objective</label>
                <textarea className="input soap-form-textarea" placeholder="Measurable, observable data..." value={formData.objective} onChange={(e) => setFormData({ ...formData, objective: e.target.value })} />
              </div>
              <div className="soap-form-section">
                <label className="soap-form-label"><span className="soap-section-label">A</span> Assessment</label>
                <textarea className="input soap-form-textarea" placeholder="Diagnosis, clinical interpretation..." value={formData.assessment} onChange={(e) => setFormData({ ...formData, assessment: e.target.value })} />
              </div>
              <div className="soap-form-section">
                <label className="soap-form-label"><span className="soap-section-label">P</span> Plan</label>
                <textarea className="input soap-form-textarea" placeholder="Treatment plan, next steps..." value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value })} />
              </div>
              <div className="soap-form-actions">
                <button className="btn btn-ghost" onClick={() => { setShowAddForm(false); setEditingNote(null); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddNote} disabled={!formData.patientId || !formData.subjective.trim() || saving}>
                  <Save size={14} /> {saving ? 'Saving...' : editingNote ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-section-title" style={{ marginBottom: 8 }}>Voice Recording</h3>
            <p className="text-body" style={{ marginBottom: 32 }}>
              Tap the microphone to start recording. Your voice will be transcribed into structured SOAP notes.
            </p>
            <div className="soap-mic-area">
              <button className={`soap-mic-btn ${isRecording ? 'recording' : ''}`} onClick={handleMicClick} id="soap-mic-button">
                {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <span className="text-body" style={{ marginTop: 12 }}>
                {isRecording ? 'Recording... Tap to stop' : 'Tap to record'}
              </span>
            </div>
            {isRecording && (
              <div className="soap-waveform">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="soap-waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
            {transcript && (
              <div className="soap-transcript card animate-slide-up">
                <h4 className="text-card-title" style={{ marginBottom: 8 }}>Transcribed Text</h4>
                <p className="soap-transcript-text">{transcript.text}</p>
                <div className="soap-entity-legend">
                  <span className="entity-vital">Vitals</span>
                  <span className="entity-med">Medications</span>
                  <span className="entity-condition">Conditions</span>
                </div>
                <div className="soap-transcript-actions">
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    <Save size={14} /> {saving ? 'Saving...' : 'Save SOAP Note'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setTranscript(null)}><Trash2 size={14} /> Discard</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}