import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, CheckSquare, Activity, ChevronRight, AlertTriangle } from 'lucide-react';
import { getPatients, getTasks, getSoapNotes } from '../../api/services';
import { getRiskBadgeClass } from '../../data/mockData';
import './RoleDashboard.css';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [soapNotes, setSoapNotes] = useState([]);

  useEffect(() => {
    async function load() {
      const [p, t, s] = await Promise.all([getPatients(), getTasks(), getSoapNotes()]);
      setPatients(p);
      setTasks(t);
      setSoapNotes(s);
    }
    load();
  }, []);

  const criticalPatients = patients.filter((p) => p.risk === 'P1' || p.risk === 'P2');
  const pendingTasks = tasks.filter((t) => t.status !== 'done');

  return (
    <div className="role-dashboard" id="doctor-dashboard">
      <div className="rd-grid">
        {/* Profile card */}
        <div className="rd-profile-card card">
          <div className="rd-profile-header">
            <div className="rd-profile-avatar" style={{ background: '#3B82F6' }}>{user?.initials || 'AS'}</div>
            <div className="rd-profile-info">
              <h3 className="rd-profile-name">{user?.name || 'Doctor'}</h3>
              <span className="text-body">{user?.ward || 'ICU Ward 3'}</span>
              <span className="badge badge-p4" style={{ marginTop: 4 }}>On Duty</span>
            </div>
          </div>
          <div className="rd-profile-stats">
            <div className="rd-pstat">
              <span className="rd-pstat-num">{patients.length}</span>
              <span className="text-label">Total Pts</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num" style={{ color: 'var(--risk-p1)' }}>{criticalPatients.length}</span>
              <span className="text-label">Critical</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num">{pendingTasks.length}</span>
              <span className="text-label">Tasks</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num">{soapNotes.length}</span>
              <span className="text-label">Notes</span>
            </div>
          </div>
        </div>

        {/* Critical patients */}
        <div className="rd-notifications card">
          <div className="rd-section-header">
            <AlertTriangle size={16} style={{ color: 'var(--risk-p1)' }} />
            <h3 className="text-card-title">Critical & High Risk Patients</h3>
          </div>
          <div className="rd-notif-list">
            {criticalPatients.map((p) => (
              <div key={p.id} className="rd-notif rd-notif-critical" style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients?patient=${p.id}`)}>
                <div className="rd-notif-icon">
                  <Activity size={14} />
                </div>
                <div className="rd-notif-content">
                  <span className="rd-notif-text">{p.name} — {p.bed}</span>
                  <span className="rd-notif-time">HR {p.vitals.hr} · SpO2 {p.vitals.spo2}% · BP {p.vitals.bpSys}/{p.vitals.bpDia}</span>
                </div>
                <span className={`badge ${getRiskBadgeClass(p.risk)}`}>{p.risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All patients compact */}
        <div className="rd-tasks-preview card">
          <div className="rd-section-header">
            <Users size={16} />
            <h3 className="text-card-title">All Patients</h3>
            <span className="badge badge-p4">{patients.length}</span>
          </div>
          <div className="rd-task-list">
            {patients.slice(0, 5).map((p) => (
              <div key={p.id} className="rd-task-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/soap-notes?patient=${p.id}`)}>
                <span className={`badge ${getRiskBadgeClass(p.risk)}`}>{p.risk}</span>
                <div className="rd-task-info">
                  <span className="rd-task-title">{p.name}</span>
                  <span className="text-timestamp">{p.bed} · {p.diagnosis?.split(',')[0]}</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent SOAP notes */}
        <div className="rd-tasks-preview card">
          <div className="rd-section-header">
            <FileText size={16} />
            <h3 className="text-card-title">Recent SOAP Notes</h3>
          </div>
          <div className="rd-task-list">
            {soapNotes.map((n) => (
              <div key={n.id} className="rd-task-item">
                <div className="badge badge-available"><FileText size={10} /> Note</div>
                <div className="rd-task-info">
                  <span className="rd-task-title">{n.patientName}</span>
                  <span className="text-timestamp">{n.timestamp} · {n.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
