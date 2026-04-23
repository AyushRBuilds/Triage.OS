import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Pill, UserCheck, MoreHorizontal, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats, getScheduleData, getTasks, getPatients } from '../../api/services';
import { useSimulatedVitals } from '../../hooks/useSimulatedVitals';
import StatCard from '../ui/StatCard';
import PatientCard from '../PatientCard';
import VitalMiniCard from '../ui/VitalMiniCard';
import ScheduleCard from '../ui/ScheduleCard';
import '../Dashboard.css';

export default function NurseDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [rawPatients, setRawPatients] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, p1Count: 0, statMeds: 0, onShift: 0 });
  const [schedule, setSchedule] = useState({ days: [] });
  const [activeTasks, setActiveTasks] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);


  // Live vitals
  const { patients, isConnected } = useSimulatedVitals(rawPatients);

  useEffect(() => {
    async function loadData() {
      try {
        const [pts, st, sched, tks] = await Promise.all([
          getPatients(),
          getDashboardStats(),
          getScheduleData(),
          getTasks(),
        ]);
        setRawPatients(pts);
        setStats(st);
        setSchedule(sched);
        setActiveTasks(tks.filter((t) => t.status !== 'done'));
        const assignedPts = pts.filter((p) => p.assignedNurses?.some((n) => n.id === user?.id) || p.assignedNurse === user?.name);
        if (assignedPts.length > 0) setSelectedPatient(assignedPts[0]);
        else setSelectedPatient(null);
      } catch (err) {
        console.error('Dashboard load error:', err);
        // Supabase error hint if the table doesn't exist
        if (err.message?.includes('patient_assignments')) {
          alert('Database Error: Please run the multiple nurses SQL migration in Supabase! The patient_assignments table is missing.');
        }
      }
    }
    loadData();
  }, []);

  const currentPatient = selectedPatient
    ? patients.find((p) => p.id === selectedPatient.id) || selectedPatient
    : null;

  // Generate sparkline data for selected patient (simulated history)
  const generateSparkline = (base, variance, count = 12) =>
    Array.from({ length: count }, (_, i) =>
      base + Math.round((Math.random() - 0.5) * variance * 2)
    );



  return (
    <div className="dashboard" id="nurse-dashboard">
      <div className="dashboard-left">


        {/* Stats row */}
        <div className="dashboard-stats">
          <StatCard label="TOTAL" value={stats.totalPatients} subtext="patients" icon={Users} />
          <StatCard label="P1 CRITICAL" value={stats.p1Count} subtext="need urgent attention" color="var(--risk-p1)" icon={AlertTriangle} />
          <StatCard label="STAT MEDS" value={stats.statMeds} subtext="pending" color="var(--risk-p2)" icon={Pill} />
          <StatCard label="ON SHIFT" value={stats.onShift} subtext="nurses" icon={UserCheck} />
        </div>

        {/* Patient overview header */}
        <div className="dashboard-section-header">
          <h3 className="text-card-title">Patient Overview</h3>
          {isConnected && (
            <span className="live-badge">
              <span className="pulse-dot" /> Live
            </span>
          )}
          <button className="more-btn"><MoreHorizontal size={18} /></button>
        </div>

        {/* Patient list */}
        <div className="dashboard-patient-list">
          {patients
            .filter((p) => p.assignedNurses?.some((n) => n.id === user?.id) || p.assignedNurse === user?.name)
            .sort((a, b) => {
              const order = { P1: 0, P2: 1, P3: 2, P4: 3, P5: 4 };
              return (order[a.risk] || 5) - (order[b.risk] || 5);
            })
            .map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={setSelectedPatient}
              />
            ))}
        </div>
      </div>

      <div className="dashboard-right">
        {/* Schedule card */}
        <ScheduleCard schedule={schedule} />

        {/* Active tasks */}
        <div className="dashboard-tasks-row">
          <div className="dashboard-section-header">
            <h3 className="text-card-title">Active Tasks</h3>
            <span className="badge badge-p4">{activeTasks.length}</span>
          </div>
          <div className="dashboard-tasks-scroll">
            {activeTasks.map((task) => (
              <div key={task.id} className="task-mini-card card">
                <div className="task-mini-top">
                  <span className={`badge ${task.priority === 'STAT' ? 'badge-stat' : task.priority === 'Urgent' ? 'badge-urgent' : 'badge-routine'}`}>
                    {task.priority}
                  </span>
                  <ChevronRight size={14} style={{ opacity: 0.5 }} />
                </div>
                <span className="task-mini-title">{task.title}</span>
                <span className="task-mini-meta">
                  <Clock size={10} /> {task.createdAt}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vitals mini cards for selected patient */}
        {currentPatient ? (
          <>
            <div className="dashboard-section-header">
              <h3 className="text-card-title">{currentPatient.name} — Vitals</h3>
            </div>
            <div className="dashboard-vitals-row">
              <VitalMiniCard
                label="HEART RATE"
                value={currentPatient.vitals.hr}
                unit="bpm"
                type="hr"
                sparklineData={generateSparkline(currentPatient.vitals.hr, 8)}
              />
              <VitalMiniCard
                label="SPO2"
                value={currentPatient.vitals.spo2}
                unit="%"
                type="spo2"
                sparklineData={generateSparkline(currentPatient.vitals.spo2, 3)}
              />
              <VitalMiniCard
                label="BLOOD PRESSURE"
                value={`${currentPatient.vitals.bpSys}/${currentPatient.vitals.bpDia}`}
                unit="mmHg"
                type="bpSys"
                sparklineData={generateSparkline(currentPatient.vitals.bpSys, 10)}
              />
            </div>

            {/* Clinical Insights added below vitals */}
            <div className="dashboard-patient-context animate-fade-in" style={{ marginTop: 24, padding: '20px 24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h4 className="text-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} style={{ color: 'var(--risk-p2)' }} /> Clinical Context & Insights
                </h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Primary Diagnosis</span>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{currentPatient.diagnosis || 'Pending Review'}</p>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: 16, borderRadius: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Patient Profile</span>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {currentPatient.age ? `${currentPatient.age} years old` : 'Unknown age'} • {currentPatient.weight ? `${currentPatient.weight} kg` : 'Unknown weight'}
                  </p>
                </div>
              </div>
              {currentPatient.risk === 'P1' && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>Critical Status: Requires continuous monitoring. STAT meds pending administration.</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card" style={{ marginTop: 24, padding: 48, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-default)' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p>You currently have no patients assigned to you.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>When a patient is assigned to your care, their vitals and clinical context will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
