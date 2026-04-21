import { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, RefreshCw, Trash2 } from 'lucide-react';
import { getPatients, getNurses, deletePatient } from '../api/services';
import { getRiskBadgeClass } from '../data/mockData';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const [p, n] = await Promise.all([getPatients(), getNurses()]);
      setPatients(p);
      setNurses(n);
    }
    load();
  }, []);

  const filtered = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.risk === riskFilter;
    const matchesWard = wardFilter === 'all' || p.ward === wardFilter;
    return matchesSearch && matchesRisk && matchesWard;
  });

  const getNurseByName = (name) => nurses.find((n) => n.name === name);

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return;
    try {
      await deletePatient(patientId);
      setPatients((prev) => prev.filter((p) => p.id !== patientId));
    } catch (err) {
      console.error('Failed to delete patient:', err);
      alert('Could not delete patient. Check Supabase RLS policies.');
    }
  };

  return (
    <div className="admin-page" id="admin-dashboard-page">
      <div className="admin-header">
        <h3 className="text-section-title">Admin Dashboard</h3>
        <button className="btn btn-primary btn-sm">
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
              <th>Assigned Nurse</th>
              <th>Load</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((patient) => {
              const nurse = getNurseByName(patient.assignedNurse);
              const loadPct = nurse ? (nurse.patientCount / nurse.maxCapacity) * 100 : 0;
              const loadText = nurse ? `${nurse.patientCount}/${nurse.maxCapacity}` : '-';

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
                        <span className="admin-patient-sub text-timestamp">{patient.diagnosis?.split(',')[0]}</span>
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
                    <span className="admin-nurse-name">{patient.assignedNurse}</span>
                  </td>
                  <td>
                    <div className="admin-load-bar-wrapper">
                      <div className="admin-load-bar">
                        <div
                          className="admin-load-fill"
                          style={{
                            width: `${loadPct}%`,
                            background: loadPct > 75 ? 'var(--risk-p2)' : 'var(--green-primary)',
                          }}
                        />
                      </div>
                      <span className="admin-load-text text-timestamp">{loadText}</span>
                    </div>
                  </td>
                  <td>
                    <div className="admin-action-group">
                      <button className="admin-reassign-btn">
                        <RefreshCw size={12} /> Reassign
                      </button>
                      <button className="admin-delete-btn" onClick={() => handleDeletePatient(patient.id)}>
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
    </div>
  );
}