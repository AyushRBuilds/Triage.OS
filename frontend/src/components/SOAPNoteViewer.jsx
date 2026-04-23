import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Save, Trash2, Clock, ChevronDown, FileText, Plus, Edit3, X, Zap, AlertTriangle, Activity, Pill, Stethoscope, Brain, Loader2 } from 'lucide-react';
import { getSoapNotes, createSoapNote, deleteSoapNote, getPatients } from '../api/services';
import { supabase } from '../api/supabaseClient';
import { toast } from './Toast';
import './SOAPNoteViewer.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SOAPNoteViewer() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(searchParams.get('patient') || 'all');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(() => sessionStorage.getItem('soap_liveTranscript') || '');
  const [aiResult, setAiResult] = useState(() => {
    const saved = sessionStorage.getItem('soap_aiResult');
    return saved ? JSON.parse(saved) : null;
  });
  const [processing, setProcessing] = useState(() => sessionStorage.getItem('soap_processing') === 'true');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(sessionStorage.getItem('soap_liveTranscript') || '');

  useEffect(() => {
    sessionStorage.setItem('soap_liveTranscript', liveTranscript);
  }, [liveTranscript]);

  useEffect(() => {
    if (aiResult) {
      sessionStorage.setItem('soap_aiResult', JSON.stringify(aiResult));
    } else {
      sessionStorage.removeItem('soap_aiResult');
    }
  }, [aiResult]);

  useEffect(() => {
    const handleFinished = () => {
      const saved = sessionStorage.getItem('soap_aiResult');
      if (saved) {
        setAiResult(JSON.parse(saved));
      }
      setProcessing(false);
    };
    const handleError = () => {
      setProcessing(false);
      toast.error('AI pipeline failed. Check that the backend is running.');
    };

    window.addEventListener('soap_ai_finished', handleFinished);
    window.addEventListener('soap_ai_error', handleError);
    return () => {
      window.removeEventListener('soap_ai_finished', handleFinished);
      window.removeEventListener('soap_ai_error', handleError);
    };
  }, []);

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

  // ── Speech Recognition ──────────────────────────────────
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech Recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    setAiResult(null);

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t + ' ';
        } else {
          interim = t;
        }
      }
      if (final) finalTranscriptRef.current += final;
      setLiveTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // If still supposed to be recording, restart (browser stops after silence)
      if (recognitionRef.current && isRecording) {
        try { recognition.start(); } catch(e) { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    const text = finalTranscriptRef.current.trim() || liveTranscript.trim();
    if (!text) return;

    // Send to backend AI pipeline
    setProcessing(true);
    sessionStorage.setItem('soap_processing', 'true');
    try {
      const res = await fetch(`${API_URL}/soap/process_raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text }),
      });
      if (!res.ok) throw new Error(`Pipeline failed: ${res.status}`);
      const result = await res.json();
      const fullResult = { ...result, raw_text: text };
      
      sessionStorage.setItem('soap_aiResult', JSON.stringify(fullResult));
      sessionStorage.removeItem('soap_processing');
      window.dispatchEvent(new Event('soap_ai_finished'));
    } catch (err) {
      console.error('SOAP pipeline error:', err);
      sessionStorage.removeItem('soap_processing');
      window.dispatchEvent(new Event('soap_ai_error'));
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ── Save AI result as SOAP note ─────────────────────────
  const handleSaveAiResult = async () => {
    if (!aiResult) return;
    const patientId =
      selectedPatient !== 'all' ? selectedPatient : (formData.patientId || '').trim();
    if (!patientId) {
      toast.warning('Choose a patient before saving. Use the filter on the left, or pick one under "Assign to Patient".');
      return;
    }
    setSaving(true);
    try {
      const patient = patients.find((p) => String(p.id) === String(patientId));
      const saved = await createSoapNote({
        patient_id: patientId,
        subjective: aiResult.subjective,
        objective: aiResult.objective,
        assessment: aiResult.assessment,
        plan: aiResult.plan,
        raw_text: aiResult.raw_text,
        entities: aiResult.entities || [],
        urgency_level: aiResult.urgency_level,
        urgency_confidence: aiResult.urgency_confidence,
      });
      setNotes((prev) => [{ ...saved, patientName: patient?.name || '' }, ...prev]);
      setAiResult(null);
      setLiveTranscript('');
      finalTranscriptRef.current = '';
      toast.success('SOAP note saved successfully!');
    } catch (err) {
      console.error('Failed to save note:', err);
      const msg = err?.message || String(err);
      toast.error(`Could not save SOAP note: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Manual SOAP note save ───────────────────────────────
  const handleAddNote = async () => {
    if (!formData.patientId || !formData.subjective.trim()) return;
    setSaving(true);
    try {
      const patient = patients.find((p) => String(p.id) === String(formData.patientId));

      if (editingNote) {
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
        toast.success('SOAP note updated successfully!');
      } else {
        const saved = await createSoapNote({
          patient_id: formData.patientId,
          subjective: formData.subjective,
          objective: formData.objective,
          assessment: formData.assessment,
          plan: formData.plan,
          entities: {},
        });
        setNotes((prev) => [{ ...saved, patientName: patient?.name || '' }, ...prev]);
        toast.success('SOAP note saved successfully!');
      }

      setFormData({ patientId: selectedPatient !== 'all' ? selectedPatient : '', subjective: '', objective: '', assessment: '', plan: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to save SOAP note:', err);
      const msg = err?.message || String(err);
      toast.error(`Could not save SOAP note: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteSoapNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setDeleteConfirm(null);
      toast.success('Note deleted successfully.');
    } catch (err) {
      console.error('Failed to delete note:', err);
      toast.error('Could not delete note: ' + (err.message || JSON.stringify(err)));
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

  // ── Urgency color helper ────────────────────────────────
  const urgencyColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l === 'unknown' || l === 'n/a' || l === 'na') {
      return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
    }
    if (l === 'critical' || l === 'stat') return { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' };
    if (l === 'urgent' || l === 'high') return { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' };
    if (l === 'medium') return { bg: '#DBEAFE', color: '#2563EB', border: '#BFDBFE' };
    if (l === 'routine' || l === 'low') return { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' };
    return { bg: '#D1FAE5', color: '#059669', border: '#A7F3D0' };
  };

  // ── Entity label to icon ────────────────────────────────
  const entityIcon = (label) => {
    const l = (label || '').toUpperCase();
    if (['SYMPTOM', 'COMPLAINT', 'HISTORY'].includes(l)) return <Stethoscope size={10} />;
    if (['DRUG', 'MEDICATION', 'DOSAGE', 'TREATMENT'].includes(l)) return <Pill size={10} />;
    if (['VITAL', 'LAB', 'MEASUREMENT', 'TEST', 'FINDING'].includes(l)) return <Activity size={10} />;
    if (['DISEASE', 'CONDITION', 'DIAGNOSIS', 'DISORDER'].includes(l)) return <Brain size={10} />;
    return <Zap size={10} />;
  };

  const entityClass = (label) => {
    const l = (label || '').toUpperCase();
    if (['SYMPTOM', 'COMPLAINT', 'HISTORY', 'DURATION'].includes(l)) return 'entity-symptom';
    if (['DRUG', 'MEDICATION', 'DOSAGE', 'TREATMENT', 'PROCEDURE'].includes(l)) return 'entity-med';
    if (['VITAL', 'LAB', 'MEASUREMENT', 'TEST', 'FINDING'].includes(l)) return 'entity-vital';
    if (['DISEASE', 'CONDITION', 'DIAGNOSIS', 'DISORDER'].includes(l)) return 'entity-condition';
    return 'entity-other';
  };

  return (
    <div className="soap-page" id="soap-notes-page">
      {/* Left panel — Notes list */}
      <div className="soap-left">
        <div className="soap-left-header">
          <h3 className="text-section-title">SOAP Notes</h3>
          <div className="soap-left-actions">
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingNote(null); setShowAddForm(true); setAiResult(null); }}>
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
                  <button className="soap-delete-btn" onClick={() => setDeleteConfirm(note.id)} title="Delete note">
                    <Trash2 size={12} />
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

      {/* Right panel — Voice + AI */}
      <div className="soap-right">
        {showAddForm ? (
          /* ── Manual Add/Edit Form ── */
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
        ) : aiResult ? (
          /* ── AI Pipeline Results ── */
          <div className="soap-ai-result animate-fade-in">
            <div className="soap-form-header">
              <h3 className="text-section-title"><Brain size={18} /> AI Analysis Complete</h3>
              <button className="kanban-modal-close" onClick={() => { setAiResult(null); setLiveTranscript(''); finalTranscriptRef.current = ''; }}><X size={18} /></button>
            </div>

            {/* Urgency + Risk badges */}
            <div className="soap-ai-badges">
              <div className="soap-ai-badge" style={{
                background: urgencyColor(aiResult.urgency_level).bg,
                color: urgencyColor(aiResult.urgency_level).color,
                border: `1px solid ${urgencyColor(aiResult.urgency_level).border}`,
              }}>
                <AlertTriangle size={14} />
                <div>
                  <span className="soap-ai-badge-label">Triage Urgency</span>
                  <span className="soap-ai-badge-value">{aiResult.urgency_level}</span>
                </div>
                <span className="soap-ai-badge-conf">{(aiResult.urgency_confidence * 100).toFixed(1)}%</span>
              </div>
              {aiResult.preliminary_risk !== null && aiResult.preliminary_risk !== undefined && (
                <div className="soap-ai-badge" style={{
                  background: aiResult.preliminary_risk > 0.7 ? '#FEE2E2' : aiResult.preliminary_risk > 0.4 ? '#FEF3C7' : '#D1FAE5',
                  color: aiResult.preliminary_risk > 0.7 ? '#DC2626' : aiResult.preliminary_risk > 0.4 ? '#D97706' : '#059669',
                  border: `1px solid ${aiResult.preliminary_risk > 0.7 ? '#FECACA' : aiResult.preliminary_risk > 0.4 ? '#FDE68A' : '#A7F3D0'}`,
                }}>
                  <Activity size={14} />
                  <div>
                    <span className="soap-ai-badge-label">Risk Score</span>
                    <span className="soap-ai-badge-value">{(aiResult.preliminary_risk * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Entities */}
            {aiResult.entities && aiResult.entities.length > 0 && (
              <div className="soap-ai-entities">
                <span className="text-label">Extracted Entities ({aiResult.entities.length})</span>
                <div className="soap-entity-tags">
                  {aiResult.entities.map((ent, i) => (
                    <span key={i} className={`soap-entity-tag ${entityClass(ent.label)}`}>
                      {entityIcon(ent.label)} {ent.text}
                      <span className="soap-entity-tag-type">{ent.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Raw transcript */}
            <div className="soap-ai-raw">
              <span className="text-label">Raw Transcript</span>
              <p className="soap-ai-raw-text">{aiResult.raw_text}</p>
            </div>

            {/* Structured SOAP preview */}
            <div className="soap-ai-soap-preview">
              <span className="text-label">Structured SOAP Note (AI-Generated)</span>
              <div className="soap-sections" style={{ marginTop: 8 }}>
                <div className="soap-section"><span className="soap-section-label">S</span><p>{aiResult.subjective || '—'}</p></div>
                <div className="soap-section"><span className="soap-section-label">O</span><p>{aiResult.objective || '—'}</p></div>
                <div className="soap-section"><span className="soap-section-label">A</span><p>{aiResult.assessment || '—'}</p></div>
                <div className="soap-section"><span className="soap-section-label">P</span><p>{aiResult.plan || '—'}</p></div>
              </div>
            </div>

            {/* Patient selector + save */}
            <div className="soap-ai-save-area">
              {selectedPatient === 'all' && (
                <div className="kanban-form-field" style={{ marginBottom: 12 }}>
                  <label className="text-label">Assign to Patient *</label>
                  <select className="input" value={formData.patientId} onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}>
                    <option value="">Select patient</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.bed}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="soap-form-actions">
                <button className="btn btn-ghost" onClick={() => { setAiResult(null); setLiveTranscript(''); finalTranscriptRef.current = ''; }}>
                  <Trash2 size={14} /> Discard
                </button>
                <button className="btn btn-primary" onClick={handleSaveAiResult} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save SOAP Note'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Voice Recording Panel ── */
          <div className="soap-voice-card">
            <h3 className="text-section-title" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Mic size={18} style={{ color: 'var(--green-primary)' }}/> Voice Recording
            </h3>
            <p className="text-body" style={{ marginBottom: 40, textAlign: 'center', maxWidth: 420, margin: '0 auto 40px auto', lineHeight: 1.6 }}>
              Tap the microphone and speak your clinical notes. When you stop, the AI will extract entities, classify urgency, and structure a SOAP note for you.
            </p>
            <div className="soap-mic-area">
              <button className={`soap-mic-btn ${isRecording ? 'recording' : ''}`} onClick={handleMicClick} id="soap-mic-button" disabled={processing}>
                {processing ? <Loader2 size={36} className="soap-spinner" /> : isRecording ? <MicOff size={36} /> : <Mic size={36} />}
              </button>
              <span className="text-body" style={{ marginTop: 16, fontWeight: 600, color: isRecording ? 'var(--green-primary)' : 'var(--text-secondary)' }}>
                {processing ? 'Running AI pipeline...' : isRecording ? 'Recording... Tap to stop & analyze' : 'Tap to record'}
              </span>
            </div>

            {isRecording && (
              <div className="soap-waveform">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="soap-waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}

            {/* Live transcript while speaking */}
            {(isRecording || liveTranscript) && !processing && !aiResult && (
              <div className="soap-live-transcript card animate-fade-in">
                <span className="text-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={12}/> {isRecording ? 'Live Transcript' : 'Transcript'}</span>
                <p className="soap-ai-raw-text" style={{ marginTop: 8 }}>{liveTranscript || 'Listening...'}</p>
                {isRecording && <div className="soap-live-dot" />}
              </div>
            )}

            {processing && (
              <div className="soap-processing card animate-fade-in" style={{ background: 'var(--green-light)', border: '1px solid #bbf7d0', color: 'var(--green-text)' }}>
                <Loader2 size={20} className="soap-spinner" />
                <span style={{ fontWeight: 600 }}>Running NER, Urgency Classifier & Risk Scorer...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setDeleteConfirm(null)}>
          <div className="card animate-fade-in" style={{width: 320, padding: 24, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16}} onClick={(e) => e.stopPropagation()}>
            <div style={{marginBottom: 16, color: '#ef4444', display: 'flex', justifyContent: 'center'}}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{marginBottom: 8, fontSize: 18, fontWeight: 600, color: 'var(--text-main)'}}>Delete SOAP Note?</h3>
            <p style={{marginBottom: 24, color: 'var(--text-muted)'}}>This action cannot be undone.</p>
            <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
              <button className="btn btn-ghost" style={{flex: 1}} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" style={{flex: 1, background: '#ef4444', borderColor: '#ef4444', color: 'white'}} onClick={() => handleDeleteNote(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}