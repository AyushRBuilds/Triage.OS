import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PenLine, X, Plus, Search, Pin, Trash2, Edit3, Tag, Flag,
  Bold, Italic, List, Mic, MicOff, ChevronDown, Check, AlertCircle,
  Clock, User, RotateCcw, Filter
} from 'lucide-react';
import { toast } from '../Toast';
import { patients as mockPatients } from '../../data/mockData';
import './FloatingNotes.css';

// ── Constants ──────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Medication', 'Urgent', 'Observation', 'Vitals', 'General'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const NOTE_COLORS = ['#ffffff', '#dcfce7', '#fef9c3', '#ffedd5', '#fce7f3', '#dbeafe'];

const PRIORITY_META = {
  Low:      { color: '#6b7280', bg: '#f3f4f6' },
  Medium:   { color: '#d97706', bg: '#fef3c7' },
  High:     { color: '#ea580c', bg: '#fff7ed' },
  Critical: { color: '#dc2626', bg: '#fee2e2' },
};

const now = () => new Date().toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });

let _nextId = Date.now();
const uid = () => ++_nextId;

const SEED_NOTES = [
  {
    id: uid(), title: 'Administer Meropenem', content: '<b>1g IV</b> — Bed 9, check allergy flag before administration.',
    category: 'Medication', priority: 'Critical', pinned: true, deleted: false,
    color: '#fff7ed', patientId: null, patientName: 'Arjun Reddy', tags: ['medication', 'stat'],
    createdAt: now(), updatedAt: now(),
  },
  {
    id: uid(), title: 'SpO₂ Monitor', content: 'Patient showing intermittent dips. Increase O₂ flow to 4L/min.',
    category: 'Observation', priority: 'High', pinned: false, deleted: false,
    color: '#eff6ff', patientId: null, patientName: 'Suresh Kumar', tags: ['vitals'],
    createdAt: now(), updatedAt: now(),
  },
];

// ── Database Layer ────────────────────────────────────────────────────────
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

function useDbNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Robust ID selection: prioritize id, then uid, then email
  const nurseId = user?.id || user?.uid || user?.email;

  const fetchNotes = useCallback(async () => {
    if (!nurseId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_notes')
        .select('*')
        .eq('nurse_id', nurseId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotes(data.map(n => ({
        ...n,
        patientName: n.patient_name,
        pinned: n.is_pinned,
        updatedAt: new Date(n.created_at).toLocaleTimeString()
      })));
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      // Don't toast on fetch to avoid spam, but log it
    } finally {
      setLoading(false);
    }
  }, [nurseId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (note) => {
    if (!nurseId) {
      toast.error('Session expired. Please logout and login again.');
      return;
    }
    try {
      const { error } = await supabase
        .from('personal_notes')
        .insert([{
          nurse_id: nurseId,
          title: note.title,
          content: note.content,
          category: note.category,
          priority: note.priority,
          color: note.color,
          patient_name: note.patientName,
          is_pinned: false
        }]);
      
      if (error) throw error;
      toast.success('Note saved to database!');
      fetchNotes();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(`Failed to save: ${err.message}`);
    }
  };

  const updateNote = async (id, patch) => {
    try {
      const { error } = await supabase
        .from('personal_notes')
        .update({
          title: patch.title,
          content: patch.content,
          category: patch.category,
          priority: patch.priority,
          color: patch.color,
          patient_name: patch.patientName,
          is_pinned: patch.pinned
        })
        .eq('id', id);
      
      if (error) throw error;
      fetchNotes();
    } catch (err) {
      toast.error('Failed to update note.');
    }
  };

  const hardDelete = async (id) => {
    try {
      const { error } = await supabase.from('personal_notes').delete().eq('id', id);
      if (error) throw error;
      toast.success('Note deleted successfully.');
      fetchNotes();
    } catch (err) {
      toast.error('Failed to delete note.');
    }
  };

  const togglePin = async (id) => {
    const note = notes.find(n => n.id === id);
    try {
      const { error } = await supabase
        .from('personal_notes')
        .update({ is_pinned: !note.pinned })
        .eq('id', id);
      
      if (error) throw error;
      fetchNotes();
    } catch (err) {
      toast.error('Failed to pin note.');
    }
  };

  return { notes, loading, addNote, updateNote, hardDelete, togglePin, fetchNotes };
}

// ── Rich‑text mini toolbar ─────────────────────────────────────────────────
function RichToolbar({ onFormat }) {
  return (
    <div className="fn-rich-toolbar">
      <button type="button" className="fn-format-btn" title="Bold" onClick={() => onFormat('bold')}><Bold size={12}/></button>
      <button type="button" className="fn-format-btn" title="Italic" onClick={() => onFormat('italic')}><Italic size={12}/></button>
      <button type="button" className="fn-format-btn" title="Bullets" onClick={() => onFormat('insertUnorderedList')}><List size={12}/></button>
    </div>
  );
}

// ── Note editor form ───────────────────────────────────────────────────────
function NoteEditor({ initial, onSave, onCancel, linkedPatientName }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || 'General');
  const [priority, setPriority] = useState(initial?.priority || 'Medium');
  const [color, setColor] = useState(initial?.color || '#ffffff');
  const [patientName, setPatientName] = useState(initial?.patientName || linkedPatientName || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [isListening, setIsListening] = useState(false);
  const bodyRef = useRef(null);
  const recognitionRef = useRef(null);
  // seed body
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.innerHTML = initial?.content || '';
  }, []);

  const handleSave = () => {
    const content = bodyRef.current?.innerHTML || '';
    if (!title.trim() && !content.trim()) return;
    onSave({
      title: title || 'Untitled note',
      content,
      category,
      priority,
      color,
      patientName,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  const applyFormat = (cmd) => {
    document.execCommand(cmd, false, null);
    bodyRef.current?.focus();
  };

  // Voice-to-text
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast.error('Speech recognition not supported. Use Chrome.');
    if (isListening) { recognitionRef.current?.stop(); return; }
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = false;
    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);
    r.onresult = (e) => {
      const txt = e.results[0][0].transcript;
      document.execCommand('insertText', false, txt);
    };
    recognitionRef.current = r;
    r.start();
  };

  return (
    <div className="fn-editor" style={{ background: color }}>
      {/* Title + Colors */}
      <div className="fn-editor-section">
        <label className="fn-label">Title</label>
        <div className="fn-editor-header">
          <input
            className="fn-title-input"
            placeholder="Enter note title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ background: color }}
          />
          <div className="fn-editor-colors">
            {NOTE_COLORS.map(c => (
              <button key={c} className={`fn-color-swatch ${color === c ? 'selected' : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} type="button"/>
            ))}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="fn-editor-section">
        <label className="fn-label">Details</label>
        <div className="fn-editor-meta">
          <select className="fn-select" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="fn-select fn-priority-select" value={priority}
            onChange={e => setPriority(e.target.value)}
            style={{ color: PRIORITY_META[priority].color, background: PRIORITY_META[priority].bg }}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
          <input className="fn-select" placeholder="Link Patient…" value={patientName}
            onChange={e => setPatientName(e.target.value)} list="fn-patient-list"/>
          <datalist id="fn-patient-list">
            {mockPatients.map(p => <option key={p.id} value={p.name}/>)}
          </datalist>
        </div>
      </div>

      {/* Content */}
      <div className="fn-editor-section">
        <label className="fn-label">Content</label>
        <RichToolbar onFormat={applyFormat} />
        <div
          ref={bodyRef}
          className="fn-body-editor"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write your note here…"
          style={{ background: color }}
        />
      </div>

      {/* Tags */}
      <div className="fn-editor-section">
        <label className="fn-label">Tags</label>
        <input className="fn-tags-input" placeholder="e.g. medication, stat, observation (comma-separated)"
          value={tags} onChange={e => setTags(e.target.value)}
          style={{ background: color }}/>
      </div>

      <div className="fn-editor-footer">
        <button type="button" className={`fn-voice-btn ${isListening ? 'active' : ''}`} onClick={toggleVoice}>
          {isListening ? <><MicOff size={13}/> Stop</> : <><Mic size={13}/> Voice</>}
        </button>
        <div className="fn-editor-actions">
          <button type="button" className="fn-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="fn-btn-save" onClick={handleSave}>Save note</button>
        </div>
      </div>
    </div>
  );
}

// ── Single note card ───────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete, onPin }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pm = PRIORITY_META[note.priority] || PRIORITY_META.Medium;

  return (
    <div className="fn-note-card" style={{ background: note.color || '#fff' }}>
      {note.pinned && <span className="fn-pin-badge"><Pin size={9}/> Pinned</span>}

      <div className="fn-note-top">
        <h4 className="fn-note-title">{note.title}</h4>
        <div className="fn-note-actions">
          <button className="fn-icon-btn" title="Pin" onClick={() => onPin(note.id)}>
            <Pin size={13} style={{ color: note.pinned ? 'var(--green-primary)' : undefined }}/>
          </button>
          <button className="fn-icon-btn" title="Edit" onClick={() => onEdit(note)}><Edit3 size={13}/></button>
          {confirmDelete
            ? <button className="fn-icon-btn fn-confirm-del" onClick={() => onDelete(note.id)}><Check size={13}/> Confirm</button>
            : <button className="fn-icon-btn" title="Delete" onClick={() => setConfirmDelete(true)}><Trash2 size={13}/></button>
          }
        </div>
      </div>

      <div className="fn-note-body" dangerouslySetInnerHTML={{ __html: note.content }}/>

      <div className="fn-note-footer">
        <span className="fn-priority-chip" style={{ color: pm.color, background: pm.bg }}>
          <Flag size={9}/> {note.priority}
        </span>
        <span className="fn-category-chip"><Tag size={9}/> {note.category}</span>
        {note.patientName && <span className="fn-patient-chip"><User size={9}/> {note.patientName}</span>}
        <span className="fn-note-time"><Clock size={9}/> {note.updatedAt}</span>
      </div>

      {note.tags?.length > 0 && (
        <div className="fn-tags-row">
          {note.tags.map(t => <span key={t} className="fn-tag">#{t}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Main FloatingNotes component ───────────────────────────────────────────
export default function FloatingNotes({ linkedPatientName = null, isInline = false, onClose = null }) {
  const [isOpen, setIsOpen] = useState(isInline ? true : false);
  const [editing, setEditing] = useState(null); // null = list, {} = new, note = edit
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterPri, setFilterPri] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const { notes, addNote, updateNote, hardDelete, togglePin } = useDbNotes();

  const handleSave = (data) => {
    if (editing && editing.id) {
      updateNote(editing.id, data);
    } else {
      addNote({ ...data });
    }
    setEditing(null);
  };

  const handleDelete = (id) => hardDelete(id);

  const handleClose = () => {
    setIsOpen(false);
    setEditing(null);
    if (onClose) onClose();
  };

  const visible = notes.filter(n => {
    if (filterCat !== 'All' && n.category !== filterCat) return false;
    if (filterPri !== 'All' && n.priority !== filterPri) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [n.title, n.content, n.patientName, ...(n.tags || [])].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  // If inline mode, skip FAB and always show panel
  if (isInline) {
    return (
      <div className="fn-panel fn-panel-inline animate-fade-in" id="floating-notes-panel">
        <div className="fn-header">
          <div className="fn-header-left">
            <PenLine size={16}/>
            <span>Notes</span>
            <span className="fn-count">{visible.length}</span>
          </div>
          <div className="fn-header-actions">
            <button className="fn-header-btn" title="Filters" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14}/>
            </button>
            <button className="fn-header-btn fn-add-btn" title="New note" onClick={() => setEditing({})}>
              <Plus size={14}/>
            </button>
            <button className="fn-header-btn" title="Close" onClick={handleClose}>
              <X size={16}/>
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="fn-filter-bar">
            <select className="fn-select-sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="fn-select-sm" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
              <option value="All">All Priorities</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        )}
        <div className="fn-search-bar">
          <Search size={14} className="fn-search-icon"/>
          <input className="fn-search-input" placeholder="Search notes, patients, tags…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="fn-clear-search" onClick={() => setSearch('')}><X size={12}/></button>}
        </div>
        <div className="fn-body">
          {editing !== null ? (
            <NoteEditor initial={editing?.id ? editing : null} onSave={handleSave}
              onCancel={() => setEditing(null)} linkedPatientName={linkedPatientName} />
          ) : (
            <div className="fn-notes-list">
              {visible.length === 0 && (
                <div className="fn-empty"><PenLine size={32} opacity={0.2}/>
                  <p>No notes yet. <button onClick={() => setEditing({})}>Add one</button></p>
                </div>
              )}
              {visible.map(note => (
                <NoteCard key={note.id} note={note} onEdit={n => setEditing(n)}
                  onDelete={handleDelete} onPin={togglePin} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original FAB mode (kept as fallback)
  return (
    <>
      {!isOpen && (
        <button className="fn-fab" id="floating-notes-btn" onClick={() => setIsOpen(true)} title="Quick Notes">
          <PenLine size={22}/>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="fn-panel animate-fade-in" id="floating-notes-panel">
          {/* Header */}
          <div className="fn-header">
            <div className="fn-header-left">
              <PenLine size={16}/>
              <span>Notes</span>
              <span className="fn-count">{visible.length}</span>
            </div>
            <div className="fn-header-actions">
              <button className="fn-header-btn" title="Filters" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={14}/>
              </button>
              <button className="fn-header-btn fn-add-btn" title="New note" onClick={() => setEditing({})}>
                <Plus size={14}/>
              </button>
              <button className="fn-header-btn" title="Close" onClick={handleClose}>
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* Filter bar */}
          {showFilters && (
            <div className="fn-filter-bar">
              <select className="fn-select-sm" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="fn-select-sm" value={filterPri} onChange={e => setFilterPri(e.target.value)}>
                <option value="All">All Priorities</option>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="fn-search-bar">
            <Search size={14} className="fn-search-icon"/>
            <input
              className="fn-search-input"
              placeholder="Search notes, patients, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="fn-clear-search" onClick={() => setSearch('')}><X size={12}/></button>}
          </div>

          {/* Editor / List */}
          <div className="fn-body">
            {editing !== null ? (
              <NoteEditor
                initial={editing?.id ? editing : null}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
                linkedPatientName={linkedPatientName}
              />
            ) : (
              <div className="fn-notes-list">
                {visible.length === 0 && (
                  <div className="fn-empty">
                    <PenLine size={32} opacity={0.2}/>
                    <p>No notes yet. <button onClick={() => setEditing({})}>Add one</button></p>
                  </div>
                )}
                {visible.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={n => setEditing(n)}
                    onDelete={handleDelete}
                    onPin={togglePin}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
