import { useState, useEffect } from 'react';
import { ArrowLeftRight, Users, Clock, Check, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { getShiftSwapRequests, respondToShiftSwap, confirmShiftSwapTransfer, getNurses } from '../api/services';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { toast } from './Toast';
import './ShiftSwapPanel.css';

export default function ShiftSwapPanel() {
  const { user } = useAuth();
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

  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function load() {
      const [r, n, p] = await Promise.all([getShiftSwapRequests(), getNurses(), import('../api/services').then(m => m.getPatients())]);
      setRequests(r);
      setNurses(n);
      setPatients(p);
    }
    load();
  }, []);

  const handleRespond = async (requestId, action) => {
    // action from UI is 'accept' | 'decline', DB expects 'accepted' | 'rejected'
    const dbAction = action === 'accept' ? 'accepted' : 'rejected';
    await respondToShiftSwap(requestId, dbAction, user?.id, user?.name);
    
    // We update local state to match the DB format
    const newStatus = dbAction === 'accepted' ? `accepted|${user?.name}|${user?.id}` : 'rejected';
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );
    if (action === 'accept') {
      toast.success('Shift accepted! Awaiting confirmation from requestor to transfer patients.');
    } else {
      toast.info('Shift swap declined.');
    }
  };

  const handleConfirmTransferLocal = async (requestId, responderId) => {
    try {
      await confirmShiftSwapTransfer(requestId, responderId);
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: 'finalized' } : r))
      );
      toast.success('Patients successfully transferred!');
    } catch (err) {
      toast.error('Failed to transfer patients.');
    }
  };

  const handleDelete = async (requestId) => {
    const { error } = await supabase
      .from('shift_swap_requests')
      .delete()
      .eq('id', requestId);
    if (error) {
      console.error('Delete failed:', error.message);
      toast.error('Could not delete request. Check Supabase RLS policies.');
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setDeleteConfirm(null);
    toast.success('Swap request deleted successfully.');
  };

  const handleSubmitRequest = async () => {
    if (!formData.colleagueId || !formData.date || !formData.reason) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('shift_swap_requests')
        .insert([{
          requestor_id: user.id,
          target_shift_date: formData.date,
          target_shift_type: formData.shiftType,
          reason: formData.colleagueId ? `Requested for Colleague: ${formData.reason}` : formData.reason,
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
      toast.success('Swap request submitted successfully.');
    } catch (err) {
      console.error('Failed to submit request:', err.message);
      toast.error('Could not submit request.');
    } finally {
      setSaving(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status.startsWith('accepted'));
  const resolvedRequests = requests.filter((r) => r.status === 'finalized' || r.status === 'rejected');

  return (
    <div className="shift-page" id="shift-swap-page">
      <div className="shift-header">
        <div>
          <h3 className="text-section-title">Patient Handover Requests</h3>
          <p className="text-body" style={{ marginTop: 4 }}>Manage incoming patient handover requests from your colleagues</p>
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
              This will permanently remove this handover request from the database.
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
              <h4 className="text-card-title">Send Handover Request</h4>
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

      {/* Two Column Layout */}
      <div className="shift-content-layout">
        
        {/* Left Column: Requests */}
        <div className="shift-main-col">
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
                    {req.outgoing && req.status.startsWith('accepted') && (
                      <div className="shift-card-actions" style={{ marginTop: 12 }}>
                        <div className="text-body" style={{flex: 1, color: 'var(--green-primary)'}}>
                          Accepted by {req.status.split('|')[1] || 'Colleague'}
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => handleConfirmTransferLocal(req.id, req.status.split('|')[2])}>
                          <Check size={14} /> Confirm Transfer
                        </button>
                      </div>
                    )}
                    {!req.outgoing && req.status === 'pending' && (
                      <div className="shift-card-actions">
                        <button className="btn btn-ghost btn-sm shift-decline-btn" onClick={() => handleRespond(req.id, 'decline')}>
                          <X size={14} /> Decline
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleRespond(req.id, 'accept')}>
                          <Check size={14} /> Accept Shift
                        </button>
                      </div>
                    )}
                    {!req.outgoing && req.status.startsWith('accepted') && (
                      <div className="shift-card-actions">
                        <span className="badge badge-available">Awaiting Confirmation</span>
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
                      <span className={`badge ${req.status === 'finalized' ? 'badge-available' : 'badge-p1'}`}>
                        {req.status === 'finalized' ? 'Transferred' : 'Rejected'}
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
              <p className="text-body">No handover requests</p>
            </div>
          )}
        </div>

        {/* Right Column: Shared Patients Section */}
        <div className="shift-side-col">
          <div className="shift-section">
            <h4 className="text-label" style={{ marginBottom: 12 }}>Shared Patients Overview</h4>
            <div className="shift-cards">
              {(() => {
                const myPatients = patients.filter(p => p.assignedNurses?.some(n => n.id === user?.id) || p.assignedNurse === user?.name);
                const shared = myPatients.filter(p => p.assignedNurses && p.assignedNurses.length > 1);
                if (myPatients.length === 0) return <div className="card" style={{padding: 24, textAlign: 'center'}}><p className="text-body">You have no assigned patients.</p></div>;
                if (shared.length === 0) return <div className="card" style={{padding: 24, textAlign: 'center'}}><p className="text-body">None of your patients are currently shared.</p></div>;
                
                return shared.map(p => (
                  <div key={p.id} className="shift-card card animate-fade-in" style={{ padding: '16px' }}>
                    <div className="shift-card-top" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 12, marginBottom: 12 }}>
                      <div className="shift-card-info">
                        <span className="shift-card-name">{p.name}</span>
                        <span className="shift-card-role text-body">Bed {p.bed} · {p.ward}</span>
                      </div>
                      <span className={`badge badge-${p.risk.toLowerCase()}`}>{p.risk}</span>
                    </div>
                    <div className="text-label" style={{ marginBottom: 8 }}>Co-Assigned Nurses</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {p.assignedNurses.filter(n => n.id !== user?.id && n.name !== user?.name).map((n, i) => (
                        <div key={i} className="badge badge-p5" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}>
                          <Users size={12} /> {n.name}
                          {n.isTemporary && <span style={{ color: 'var(--green-primary)' }}>(Swapped)</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}