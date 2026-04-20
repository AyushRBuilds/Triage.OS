import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Clock, CheckCircle, AlertTriangle, Users, ChevronRight, Activity, X, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats, getScheduleData, getTasks, getPatients } from '../../api/services';
import ScheduleCard from '../ui/ScheduleCard';
import './RoleDashboard.css';

export default function NurseDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPatients: 0, p1Count: 0, statMeds: 0, onShift: 0 });
  const [schedule, setSchedule] = useState({ days: [] });
  const [recentTasks, setRecentTasks] = useState([]);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function load() {
      const [st, sched, tks, pts] = await Promise.all([
        getDashboardStats(),
        getScheduleData(),
        getTasks(),
        getPatients(),
      ]);
      setStats(st);
      setSchedule(sched);
      setRecentTasks(tks.filter((t) => t.status !== 'done').slice(0, 3));
      setPatients(pts);
    }
    load();
  }, []);

  const notifications = [
    { id: 1, type: 'critical', text: 'Mr. Arjun Reddy (Bed 9) — SpO2 dropped to 88%', time: '2 min ago' },
    { id: 2, type: 'stat', text: 'STAT: Meropenem 1g IV due for Bed 9', time: '5 min ago' },
    { id: 3, type: 'info', text: 'Shift swap request from Deepak Nair', time: '15 min ago' },
    { id: 4, type: 'info', text: 'SOAP note saved for Mr. Raj Sharma', time: '32 min ago' },
    { id: 5, type: 'warning', text: 'Mr. Suresh Kumar — temperature rising (38.8°C)', time: '45 min ago' },
  ];
  const [dismissedNotifs, setDismissedNotifs] = useState([]);
  const visibleNotifs = notifications.filter((n) => !dismissedNotifs.includes(n.id));

  const criticalCount = patients.filter((p) => p.risk === 'P1' || p.risk === 'P2').length;
  const stableCount = patients.filter((p) => p.risk === 'P4' || p.risk === 'P5').length;
  const recentlyUpdated = patients.slice(0, 3);

  return (
    <div className="role-dashboard" id="nurse-dashboard">
      <div className="rd-grid rd-grid-responsive">
        {/* Profile card */}
        <div className="rd-profile-card card">
          <div className="rd-profile-header">
            <div className="rd-profile-avatar">{user?.initials || 'PM'}</div>
            <div className="rd-profile-info">
              <h3 className="rd-profile-name">{user?.name || 'Nurse'}</h3>
              <span className="text-body">{user?.ward || 'ICU Ward 3'}</span>
              <span className="badge badge-available" style={{ marginTop: 4 }}>On Shift</span>
            </div>
          </div>
          <div className="rd-profile-stats">
            <div className="rd-pstat">
              <span className="rd-pstat-num">{stats.totalPatients}</span>
              <span className="text-label">Patients</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num" style={{ color: 'var(--risk-p1)' }}>{stats.p1Count}</span>
              <span className="text-label">Critical</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num" style={{ color: 'var(--risk-p2)' }}>{stats.statMeds}</span>
              <span className="text-label">STAT Meds</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num">{stats.onShift}</span>
              <span className="text-label">On Shift</span>
            </div>
          </div>
        </div>

        {/* Schedule — always visible and highlighted */}
        <div className="rd-schedule-area rd-schedule-highlight">
          <ScheduleCard schedule={schedule} />
        </div>

        {/* Patient Overview Section */}
        <div className="rd-patient-overview card">
          <div className="rd-section-header">
            <Activity size={16} />
            <h3 className="text-card-title">Patient Overview</h3>
            <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'auto' }} onClick={() => navigate('/patients')}>
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="rd-overview-grid">
            <div className="rd-overview-stat">
              <div className="rd-overview-icon" style={{ background: 'var(--green-light)', color: 'var(--green-text)' }}>
                <Users size={18} />
              </div>
              <div className="rd-overview-detail">
                <span className="rd-overview-num">{patients.length}</span>
                <span className="text-label">Total Patients</span>
              </div>
            </div>
            <div className="rd-overview-stat">
              <div className="rd-overview-icon" style={{ background: '#FEF2F2', color: 'var(--risk-p1)' }}>
                <AlertTriangle size={18} />
              </div>
              <div className="rd-overview-detail">
                <span className="rd-overview-num" style={{ color: 'var(--risk-p1)' }}>{criticalCount}</span>
                <span className="text-label">Critical (P1/P2)</span>
              </div>
            </div>
            <div className="rd-overview-stat">
              <div className="rd-overview-icon" style={{ background: 'var(--green-light)', color: 'var(--green-primary)' }}>
                <Heart size={18} />
              </div>
              <div className="rd-overview-detail">
                <span className="rd-overview-num" style={{ color: 'var(--green-primary)' }}>{stableCount}</span>
                <span className="text-label">Stable (P4/P5)</span>
              </div>
            </div>
          </div>
          {/* Recently updated */}
          <div style={{ marginTop: 16 }}>
            <span className="text-label" style={{ marginBottom: 8, display: 'block' }}>Recently Updated</span>
            {recentlyUpdated.map((p) => (
              <div key={p.id} className="rd-task-item" style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients`)}>
                <div className="rd-overview-dot" style={{ background: p.risk === 'P1' ? 'var(--risk-p1)' : p.risk === 'P2' ? 'var(--risk-p2)' : 'var(--green-primary)' }}>
                  {p.initials}
                </div>
                <div className="rd-task-info">
                  <span className="rd-task-title">{p.name}</span>
                  <span className="text-timestamp">{p.bed} · Updated {p.lastUpdated}</span>
                </div>
                <span className={`badge badge-${p.risk.toLowerCase()}`}>{p.risk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="rd-notifications card">
          <div className="rd-section-header">
            <Bell size={16} />
            <h3 className="text-card-title">Notifications</h3>
            <span className="badge badge-p1" style={{ marginLeft: 'auto' }}>{visibleNotifs.length}</span>
          </div>
          <div className="rd-notif-list">
            {visibleNotifs.map((n) => (
              <div key={n.id} className={`rd-notif rd-notif-${n.type} rd-notif-dismissable`}>
                <div className="rd-notif-icon">
                  {n.type === 'critical' && <AlertTriangle size={14} />}
                  {n.type === 'stat' && <Clock size={14} />}
                  {n.type === 'warning' && <AlertTriangle size={14} />}
                  {n.type === 'info' && <CheckCircle size={14} />}
                </div>
                <div className="rd-notif-content">
                  <span className="rd-notif-text">{n.text}</span>
                  <span className="rd-notif-time">{n.time}</span>
                </div>
                <button className="rd-notif-dismiss" onClick={() => setDismissedNotifs((prev) => [...prev, n.id])}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {visibleNotifs.length === 0 && (
              <p className="text-body" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>All caught up!</p>
            )}
          </div>
        </div>

        {/* Upcoming tasks preview */}
        <div className="rd-tasks-preview card">
          <div className="rd-section-header">
            <CheckCircle size={16} />
            <h3 className="text-card-title">Upcoming Tasks</h3>
            <span className="badge badge-p4">{recentTasks.length}</span>
          </div>
          <div className="rd-task-list">
            {recentTasks.map((t) => (
              <div key={t.id} className="rd-task-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                <div className={`badge ${t.priority === 'STAT' ? 'badge-stat' : t.priority === 'Urgent' ? 'badge-urgent' : 'badge-routine'}`}>
                  {t.priority}
                </div>
                <div className="rd-task-info">
                  <span className="rd-task-title">{t.title}</span>
                  <span className="text-timestamp">{t.patientName} · {t.createdAt}</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
