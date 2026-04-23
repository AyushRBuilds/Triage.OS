import { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, RefreshCw, Trash2, AlertTriangle, Users, X, Check } from 'lucide-react';
import { getPatients, getNurses, deletePatient, addPatient, allocateNurseToPatient, unallocateNurseFromPatient } from '../api/services';
import { getRiskBadgeClass } from '../data/mockData';
import { toast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [manageNursesPatient, setManageNursesPatient] = useState(null);
  
  // Add Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '', age: '', gender: 'M', bed: '', ward: 'General Ward 1', risk: 'P5', diagnosis: ''
  });

  const load = async () => {
    try {
      const [p, n] = await Promise.all([getPatients(), getNurses()]);
      setPatients(p);
      setNurses(n);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="admin-page" style={{ padding: 48, textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--risk-p2)', margin: '0 auto 16px' }} />
        <h2>Access Denied</h2>
        <p className="text-body" style={{ marginTop: 8 }}>You must be an administrator to access these settings.</p>
      </div>
    );
  }

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.risk === riskFilter;
    const matchesWard = wardFilter === 'all' || p.ward === wardFilter;
    return matchesSearch && matchesRisk && matchesWard;
  });

  const handleDeletePatient = async (patientId) => {
    try {
      await deletePatient(patientId);
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
      setDeleteConfirm(null);
      toast.success('Patient deleted successfully.');
    } catch (err) {
      console.error('Failed to delete patient:', err);
      toast.error('Could not delete patient. Check Supabase RLS policies.');
    }
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newPatient,
        initials: newPatient.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        age: parseInt(newPatient.age, 10),
      };
      await addPatient(payload);
      toast.success('Patient added successfully');
      setShowAddPatient(false);
      setNewPatient({ name: '', age: '', gender: 'M', bed: '', ward: 'General Ward 1', risk: 'P5', diagnosis: '' });
      load(); // reload list
    } catch (err) {
      console.error('Failed to add patient', err);
      toast.error('Failed to add patient.');
    }
  };

  const handleToggleNurse = async (nurseId, isAssigned) => {
    if (!manageNursesPatient) return;
    try {
      if (isAssigned) {
        await unallocateNurseFromPatient(manageNursesPatient.id, nurseId);
        toast.success('Nurse unallocated');
      } else {
        await allocateNurseToPatient(manageNursesPatient.id, nurseId, false);
        toast.success('Nurse allocated');
      }
      // Optimistically update
      setManageNursesPatient(prev => {
        if (!prev) return prev;
        const newAssigned = isAssigned 
          ? prev.assignedNurses.filter(n => n.id !== nurseId)
          : [...prev.assignedNurses, nurses.find(n => n.id === nurseId)];
        return { ...prev, assignedNurses: newAssigned };
      });
      load(); // refresh background list
    } catch (err) {
      console.error('Failed to toggle nurse assignment', err);
      toast.error('Failed to update assignment');
    }
  };

  return (
    <div className="admin-page" id="admin-dashboard-page">
      <div className="admin-header">
        <h3 className="text-section-title">Admin Dashboard</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddPatient(true)}>
          <Plus size={14} /> Add Patient
        </button>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={14} className="admin-search-icon" />
          <input
            type="text"
            className="input input-pill admin-search-input"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="admin-search"
          />
        </div>
        <div className="admin-filters">
          <select
            className="admin-filter-select"
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
          >
            <option value="all">All Wards</option>
            <option value="ICU Ward 3">ICU Ward 3</option>
            <option value="ICU Ward 2">ICU Ward 2</option>
            <option value="General Ward 1">General Ward 1</option>
          </select>
          <select
            className="admin-filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk</option>
            <option value="P1">P1 Critical</option>
            <option value="P2">P2 High</option>
            <option value="P3">P3 Moderate</option>
            <option value="P4">P4 Low</option>
            <option value="P5">P5 Stable</option>
          </select>
        </div>
      </div>

      {/* Data table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Bed</th>
              <th>Risk</th>
              <th>Assigned Nurses</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient) => {
              const nurseCount = patient.assignedNurses?.length || 0;
              return (
                <tr key={patient.id} className="admin-row">
                  <td>
                    <div className="admin-patient-cell">
                      <div
                        className="admin-patient-avatar"
                        style={{
                          background: patient.risk === 'P1' ? 'var(--risk-p1)' : 'var(--green-primary)',
                        }}
                      >
                        {patient.initials}
                      </div>
                      <div>
                        <span className="admin-patient-name">{patient.name}</span>
                        <span className="admin-patient-sub text-timestamp">{patient.diagnosis?.split(',')[0] || 'No Diagnosis'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-mono">{patient.bed}</span>
                  </td>
                  <td>
                    <span className={`badge ${getRiskBadgeClass(patient.risk)}`}>
                      {patient.risk}
                    </span>
                  </td>
                  <td>
                    <span className="admin-nurse-name">{nurseCount > 0 ? `${nurseCount} Nurse(s)` : 'Unassigned'}</span>
                  </td>
                  <td>
                    <div className="admin-action-group">
                      <button className="btn btn-ghost btn-sm" onClick={() => setManageNursesPatient(patient)}>
                        <Users size={14} /> Manage Nurses
                      </button>
                      <button className="admin-delete-btn" onClick={() => setDeleteConfirm(patient.id)}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="admin-empty">
            <p className="text-body">No patients match your filters</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {deleteConfirm && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setDeleteConfirm(null)}>
          <div className="card animate-fade-in" style={{width: 320, padding: 24, textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16}} onClick={(e) => e.stopPropagation()}>
            <div style={{marginBottom: 16, color: '#ef4444', display: 'flex', justifyContent: 'center'}}>
              <AlertTriangle size={48} />
            </div>
            <h3 style={{marginBottom: 8, fontSize: 18, fontWeight: 600, color: 'var(--text-main)'}}>Delete Patient?</h3>
            <p style={{marginBottom: 24, color: 'var(--text-muted)'}}>This action cannot be undone. All associated records (vitals, notes, tasks) will also be deleted.</p>
            <div style={{display: 'flex', gap: 12, justifyContent: 'center'}}>
              <button className="btn btn-ghost" style={{flex: 1}} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-primary" style={{flex: 1, background: '#ef4444', borderColor: '#ef4444', color: 'white'}} onClick={() => handleDeletePatient(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showAddPatient && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setShowAddPatient(false)}>
          <div className="card animate-fade-in" style={{width: 400, padding: 24, background: 'var(--bg-card)', borderRadius: 16}} onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <h3 style={{fontSize: 18, fontWeight: 600}}>Add New Patient</h3>
              <button className="btn btn-ghost btn-sm" style={{padding: 4}} onClick={() => setShowAddPatient(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddPatient} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              <div>
                <label className="text-label" style={{display: 'block', marginBottom: 8}}>Full Name</label>
                <input required className="input" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div style={{display: 'flex', gap: 16}}>
                <div style={{flex: 1}}>
                  <label className="text-label" style={{display: 'block', marginBottom: 8}}>Age</label>
                  <input required type="number" className="input" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})} />
                </div>
                <div style={{flex: 1}}>
                  <label className="text-label" style={{display: 'block', marginBottom: 8}}>Gender</label>
                  <select className="input" value={newPatient.gender} onChange={e => setNewPatient({...newPatient, gender: e.target.value})}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
              <div style={{display: 'flex', gap: 16}}>
                <div style={{flex: 1}}>
                  <label className="text-label" style={{display: 'block', marginBottom: 8}}>Ward</label>
                  <select className="input" value={newPatient.ward} onChange={e => setNewPatient({...newPatient, ward: e.target.value})}>
                    <option value="General Ward 1">General Ward 1</option>
                    <option value="ICU Ward 2">ICU Ward 2</option>
                    <option value="ICU Ward 3">ICU Ward 3</option>
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label className="text-label" style={{display: 'block', marginBottom: 8}}>Bed</label>
                  <input required className="input" value={newPatient.bed} onChange={e => setNewPatient({...newPatient, bed: e.target.value})} placeholder="e.g. B-12" />
                </div>
              </div>
              <div style={{display: 'flex', gap: 16}}>
                <div style={{flex: 1}}>
                  <label className="text-label" style={{display: 'block', marginBottom: 8}}>Risk Level</label>
                  <select className="input" value={newPatient.risk} onChange={e => setNewPatient({...newPatient, risk: e.target.value})}>
                    <option value="P1">P1 Critical</option>
                    <option value="P2">P2 High</option>
                    <option value="P3">P3 Moderate</option>
                    <option value="P4">P4 Low</option>
                    <option value="P5">P5 Stable</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-label" style={{display: 'block', marginBottom: 8}}>Diagnosis (Optional)</label>
                <input className="input" value={newPatient.diagnosis} onChange={e => setNewPatient({...newPatient, diagnosis: e.target.value})} placeholder="e.g. Pneumonia" />
              </div>
              <button type="submit" className="btn btn-primary" style={{marginTop: 8}}>Save Patient</button>
            </form>
          </div>
        </div>
      )}

      {manageNursesPatient && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}} onClick={() => setManageNursesPatient(null)}>
          <div className="card animate-fade-in" style={{width: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 24, background: 'var(--bg-card)', borderRadius: 16}} onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <div>
                <h3 style={{fontSize: 18, fontWeight: 600}}>Manage Nurses</h3>
                <p className="text-body" style={{fontSize: 13, marginTop: 4}}>For {manageNursesPatient.name}</p>
              </div>
              <button className="btn btn-ghost btn-sm" style={{padding: 4}} onClick={() => setManageNursesPatient(null)}><X size={20}/></button>
            </div>
            
            <div style={{overflowY: 'auto', flex: 1, paddingRight: 8}}>
              {nurses.map(nurse => {
                const isAssigned = manageNursesPatient.assignedNurses?.some(n => n.id === nurse.id);
                return (
                  <div key={nurse.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-main)', borderRadius: 12, marginBottom: 8}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                      <div style={{width: 32, height: 32, borderRadius: '50%', background: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12}}>
                        {nurse.initials}
                      </div>
                      <div>
                        <div style={{fontWeight: 500, fontSize: 14}}>{nurse.name}</div>
                        <div style={{fontSize: 12, color: 'var(--text-muted)'}}>{nurse.role} • {nurse.patientCount} patients assigned</div>
                      </div>
                    </div>
                    <button 
                      className={`btn btn-sm ${isAssigned ? 'btn-ghost' : 'btn-primary'}`} 
                      style={{padding: '6px 12px', ...(isAssigned ? {color: '#ef4444'} : {})}}
                      onClick={() => handleToggleNurse(nurse.id, isAssigned)}
                    >
                      {isAssigned ? 'Remove' : 'Assign'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            <button className="btn btn-primary" style={{marginTop: 20}} onClick={() => setManageNursesPatient(null)}>Done</button>
          </div>
        </div>
      )}

    </div>
  );
}