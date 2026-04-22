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
  const [activeTab, setActiveTab] = useState('patients');

  // Live vitals
  const { patients, isConnected } = useSimulatedVitals(rawPatients);

  useEffect(() => {
    async function loadData() {
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
      if (pts.length > 0) setSelectedPatient(pts[0]);
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

  const tabs = [
    { key: 'patients', label: 'Patients' },
    { key: 'soap', label: 'SOAP Notes' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'ai', label: 'AI Chat' },
  ];

  return (
    <div className="dashboard" id="nurse-dashboard">
      <div className="dashboard-left">
        {/* Tab navigation */}
        <div className="tab-group">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-pill ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
              <div key={task.id} className={`task-mini-card ${task.priority === 'STAT' ? 'card-dark' : 'card'}`}>
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
        {currentPatient && (
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
          </>
        )}
      </div>
    </div>
  );
}
