import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserCheck, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { getPatients, getNurses, getDashboardStats } from '../../api/services';
import { getRiskBadgeClass } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import ScheduleCard from '../ui/ScheduleCard';
import { getScheduleData } from '../../api/services';
import './RoleDashboard.css';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, p1Count: 0, statMeds: 0, onShift: 0 });
  const [schedule, setSchedule] = useState({ days: [] });

  useEffect(() => {
    async function load() {
      const [p, n, st, sched] = await Promise.all([
        getPatients(), getNurses(), getDashboardStats(), getScheduleData()
      ]);
      setPatients(p);
      setNurses(n);
      setStats(st);
      setSchedule(sched);
    }
    load();
  }, []);

  return (
    <div className="role-dashboard" id="admin-dashboard-page">
      <div className="rd-grid">
        {/* Profile */}
        <div className="rd-profile-card card">
          <div className="rd-profile-header">
            <div className="rd-profile-avatar" style={{ background: '#F59E0B' }}>{user?.initials || 'KR'}</div>
            <div className="rd-profile-info">
              <h3 className="rd-profile-name">{user?.name || 'Admin'}</h3>
              <span className="text-body">{user?.ward || 'Hospital Admin'}</span>
              <span className="badge badge-p3" style={{ marginTop: 4 }}>Administrator</span>
            </div>
          </div>
          <div className="rd-profile-stats">
            <div className="rd-pstat">
              <span className="rd-pstat-num">{stats.totalPatients}</span>
              <span className="text-label">Patients</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num">{nurses.length}</span>
              <span className="text-label">Staff</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num" style={{ color: 'var(--risk-p1)' }}>{stats.p1Count}</span>
              <span className="text-label">Critical</span>
            </div>
            <div className="rd-pstat">
              <span className="rd-pstat-num">{stats.onShift}</span>
              <span className="text-label">On Duty</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rd-schedule-area">
          <ScheduleCard schedule={schedule} />
        </div>

        {/* Staff overview */}
        <div className="rd-notifications card">
          <div className="rd-section-header">
            <UserCheck size={16} />
            <h3 className="text-card-title">Staff Overview</h3>
          </div>
          <div className="rd-notif-list">
            {nurses.map((n) => {
              const loadPct = (n.patientCount / n.maxCapacity) * 100;
              return (
                <div key={n.id} className="rd-notif rd-notif-info">
                  <div className="rd-notif-icon" style={{ background: 'var(--green-light)', color: 'var(--green-text)' }}>
                    {n.initials}
                  </div>
                  <div className="rd-notif-content">
                    <span className="rd-notif-text">{n.name} — {n.role}</span>
                    <span className="rd-notif-time">{n.ward} · {n.shift} shift · {n.patientCount}/{n.maxCapacity} patients</span>
                  </div>
                  <div style={{ width: 60, height: 6, borderRadius: 100, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${loadPct}%`, height: '100%', borderRadius: 100, background: loadPct > 75 ? 'var(--risk-p2)' : 'var(--green-primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ward stats */}
        <div className="rd-tasks-preview card">
          <div className="rd-section-header">
            <BarChart3 size={16} />
            <h3 className="text-card-title">Patient Risk Distribution</h3>
          </div>
          <div className="rd-risk-bars">
            {['P1', 'P2', 'P3', 'P4', 'P5'].map((risk) => {
              const count = patients.filter((p) => p.risk === risk).length;
              const pct = patients.length > 0 ? (count / patients.length) * 100 : 0;
              return (
                <div key={risk} className="rd-risk-row">
                  <span className={`badge ${getRiskBadgeClass(risk)}`}>{risk}</span>
                  <div className="rd-risk-bar-track">
                    <div
                      className="rd-risk-bar-fill"
                      style={{ width: `${pct}%`, background: `var(--risk-${risk.toLowerCase()})` }}
                    />
                  </div>
                  <span className="rd-risk-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
