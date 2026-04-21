import { useState, useEffect } from 'react';
import { ArrowLeftRight, Users, Clock, Check, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { getShiftSwapRequests, respondToShiftSwap, getNurses } from '../api/services';
import { supabase } from '../api/supabaseClient';
import './ShiftSwapPanel.css';

export default function ShiftSwapPanel() {
  const [requests, setRequests] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    colleagueId: '',
    shiftType: 'Night',
    shiftTime: '8PM – 8AM',
    date: '',
    reason: '',
  });

  useEffect(() => {
    async function load() {
      const [r, n] = await Promise.all([getShiftSwapRequests(), getNurses()]);
      setRequests(r);
      setNurses(n);
    }
    load();
  }, []);

  const handleRespond = async (requestId, action) => {
    // action from UI is 'accept' | 'decline', DB expects 'accepted' | 'rejected'
    const dbStatus = action === 'accept' ? 'accepted' : 'rejected';
    await respondToShiftSwap(requestId, dbStatus);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: dbStatus } : r))
    );
  };

  const handleDelete = async (requestId) => {
    const { error } = await supabase
      .from('shift_swap_requests')
      .delete()
      .eq('id', requestId);
    if (error) {
      console.error('Delete failed:', error.message);
      alert('Could not delete request. Check Supabase RLS policies.');
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setDeleteConfirm(null);
  };

  const handleSubmitRequest = async () => {
    if (!formData.colleagueId || !formData.date || !formData.reason) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('shift_swap_requests')
        .insert([{
          requestor_id: formData.colleagueId,
          target_shift_date: formData.date,
          target_shift_type: formData.shiftType,
          reason: formData.reason,
          status: 'pending',
        }])
        .select('*, requestor:nurses!requestor_id(id, name, initials, role)')
        .single();

      if (error) throw error;

      const newReq = {
        ...data,
        requestor: data.requestor,
        currentShift: { type: data.target_shift_type, date: data.target_shift_date },
        reason: data.reason,
        status: data.status,
        outgoing: true,
      };
      setRequests((prev) => [newReq, ...prev]);
      setFormData({ colleagueId: '', shiftType: 'Night', shiftTime: '8PM – 8AM', date: '', reason: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to submit request:', err.message);
      alert('Could not submit request.');
    } finally {
      setSaving(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const resolvedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="shift-page" id="shift-swap-page">
      <div className="shift-header">
        <div>
          <h3 className="text-section-title">Shift Swap Requests</h3>
          <p className="text-body" style={{ marginTop: 4 }}>Manage incoming shift swap requests from your colleagues</p>
        </div>
        <div className="shift-header-right">
          <div className="shift-stats">
            <div className="shift-stat-pill"><Clock size={14} /><span>{pendingRequests.length} Pending</span></div>
            <div className="shift-stat-pill resolved"><Check size={14} /><span>{resolvedRequests.length} Resolved</span></div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> New Request
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="kanban-modal-backdrop" onClick={() => setDeleteConfirm(null)}>
          <div className="kanban-modal card animate-slide-up shift-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shift-delete-icon">
              <AlertTriangle size={32} />
            </div>
            <h4 className="text-card-title" style={{ textAlign: 'center' }}>Delete Request?</h4>
            <p className="text-body" style={{ textAlign: 'center', marginBottom: 20 }}>
              This will permanently remove this shift swap request from the database.
            </p>
            <div className="kanban-form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn shift-delete-confirm-btn" onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Form Modal */}
      {showForm && (
        <div className="kanban-modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="kanban-modal card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="kanban-modal-header">
              <h4 className="text-card-title">Send Shift Swap Request</h4>
              <button className="kanban-modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="kanban-form">
              <div className="kanban-form-field">
                <label className="text-label">Select Colleague *</label>
                <select className="input" value={formData.colleagueId} onChange={(e) => setFormData({ ...formData, colleagueId: e.target.value })}>
                  <option value="">Choose a nurse</option>
                  {nurses.map((n) => (
                    <option key={n.id} value={n.id}>{n.name} — {n.role}</option>
                  ))}
                </select>
              </div>
              <div className="kanban-form-row">
                <div className="kanban-form-field">
                  <label className="text-label">Shift Type</label>
                  <select className="input" value={formData.shiftType} onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div className="kanban-form-field">
                  <label className="text-label">Date *</label>
                  <input className="input" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div className="kanban-form-field">
                <label className="text-label">Reason *</label>
                <textarea className="input kanban-textarea" placeholder="e.g., Family commitment" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
              </div>
              <div className="kanban-form-actions">
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmitRequest} disabled={!formData.colleagueId || !formData.date || !formData.reason || saving}>
                  <ArrowLeftRight size={14} /> {saving ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending */}
      {pendingRequests.length > 0 && (
        <div className="shift-section">
          <h4 className="text-label" style={{ marginBottom: 12 }}>Pending Requests</h4>
          <div className="shift-cards">
            {pendingRequests.map((req) => (
              <div key={req.id} className="shift-card card animate-fade-in">
                <div className="shift-card-top">
                  <div className="shift-card-avatar">{req.requestor?.initials || '?'}</div>
                  <div className="shift-card-info">
                    <span className="shift-card-name">{req.requestor?.name || 'Unknown'}</span>
                    <span className="shift-card-role text-body">{req.requestor?.role || ''}</span>
                  </div>
                  {req.outgoing && <span className="badge badge-p4">Outgoing</span>}
                  <button className="shift-delete-btn" onClick={() => setDeleteConfirm(req.id)} title="Delete request">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="shift-card-details">
                  <div className="shift-detail"><Clock size={12} /><span>Shift: {req.currentShift?.type} · {req.currentShift?.date}</span></div>
                </div>
                <div className="shift-card-reason">
                  <span className="text-label">Reason</span>
                  <p className="text-body">{req.reason}</p>
                </div>
                {!req.outgoing && (
                  <div className="shift-card-actions">
                    <button className="btn btn-ghost btn-sm shift-decline-btn" onClick={() => handleRespond(req.id, 'decline')}>
                      <X size={14} /> Decline
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleRespond(req.id, 'accept')}>
                      <Check size={14} /> Accept Shift
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolvedRequests.length > 0 && (
        <div className="shift-section">
          <h4 className="text-label" style={{ marginBottom: 12 }}>Resolved</h4>
          <div className="shift-cards">
            {resolvedRequests.map((req) => (
              <div key={req.id} className="shift-card card shift-card-resolved">
                <div className="shift-card-top">
                  <div className="shift-card-avatar" style={{ opacity: 0.5 }}>{req.requestor?.initials || '?'}</div>
                  <div className="shift-card-info">
                    <span className="shift-card-name">{req.requestor?.name || 'Unknown'}</span>
                    <span className="shift-card-role text-body">{req.requestor?.role || ''}</span>
                  </div>
                  <span className={`badge ${req.status === 'accepted' ? 'badge-available' : 'badge-p1'}`}>
                    {req.status === 'accepted' ? 'Approved' : 'Rejected'}
                  </span>
                  <button className="shift-delete-btn" onClick={() => setDeleteConfirm(req.id)} title="Delete request">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="shift-detail" style={{ marginTop: 8 }}>
                  <Clock size={12} />
                  <span>{req.currentShift?.type} · {req.currentShift?.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="shift-empty">
          <ArrowLeftRight size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          <p className="text-body">No shift swap requests</p>
        </div>
      )}
    </div>
  );
}