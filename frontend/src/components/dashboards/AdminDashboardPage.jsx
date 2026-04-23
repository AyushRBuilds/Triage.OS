import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, UserCheck, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { getPatients, getNurses, getDashboardStats } from '../../api/services';
import { getRiskBadgeClass } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';

import './RoleDashboard.css';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, p1Count: 0, statMeds: 0, onShift: 0 });

  useEffect(() => {
    async function load() {
      const [p, n, st] = await Promise.all([
        getPatients(), getNurses(), getDashboardStats()
      ]);
      setPatients(p);
      setNurses(n);
      setStats(st);
    }
    load();
  }, []);

  return (
    <div className="role-dashboard" id="admin-dashboard-page">
      <div className="rd-grid">
        {/* Profile */}
        <div className="rd-profile-card card" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Decorative background circle */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: '50%', background: 'var(--green-light)', opacity: 0.5 }} />
          
          <div className="rd-profile-header" style={{ position: 'relative', zIndex: 1, paddingBottom: 24, borderBottom: '1px solid var(--border-default)', marginBottom: 24 }}>
            <div className="rd-profile-avatar" style={{ background: 'var(--green-primary)', color: 'white', width: 64, height: 64, fontSize: 24, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
              {user?.initials || 'AD'}
            </div>
            <div className="rd-profile-info" style={{ marginLeft: 16 }}>
              <h3 className="rd-profile-name" style={{ color: 'var(--text-main)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
                {user?.name === 'Hospital Admin' ? 'System Administrator' : (user?.name || 'Administrator')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>{user?.ward || 'All Wards'}</span>
                <span className="badge badge-p3" style={{ background: 'var(--green-light)', color: 'var(--green-text)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>Admin User</span>
              </div>
            </div>
          </div>
          <div className="rd-profile-stats" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <div className="rd-pstat" style={{ alignItems: 'center' }}>
              <span className="rd-pstat-num" style={{ color: 'var(--text-main)', fontSize: 28, fontWeight: 800 }}>{stats.totalPatients}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Patients</span>
            </div>
            <div className="rd-pstat" style={{ alignItems: 'center' }}>
              <span className="rd-pstat-num" style={{ color: 'var(--text-main)', fontSize: 28, fontWeight: 800 }}>{nurses.length}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Staff</span>
            </div>
            <div className="rd-pstat" style={{ alignItems: 'center' }}>
              <span className="rd-pstat-num" style={{ color: 'var(--risk-p1)', fontSize: 28, fontWeight: 800 }}>{stats.p1Count}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>Critical</span>
            </div>
            <div className="rd-pstat" style={{ alignItems: 'center' }}>
              <span className="rd-pstat-num" style={{ color: 'var(--text-main)', fontSize: 28, fontWeight: 800 }}>{stats.onShift}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 }}>On Duty</span>
            </div>
          </div>
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
