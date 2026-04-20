import { Heart, Wind, Activity, ArrowRight } from 'lucide-react';
import { getRiskColor, getRiskBadgeClass, getVitalStatus } from '../data/mockData';
import { useAnimatedValue } from '../hooks/useSimulatedVitals';
import './PatientCard.css';

function AnimatedVital({ value, type, icon: Icon, label }) {
  const { displayValue, isUpdating } = useAnimatedValue(value);
  const status = getVitalStatus(type, displayValue);
  const statusColor = {
    normal: 'var(--status-normal)',
    warning: 'var(--status-warning)',
    critical: 'var(--status-critical)',
  }[status];

  return (
    <span className="pc-vital" style={{ color: statusColor }}>
      <Icon size={12} />
      <span className={`pc-vital-value ${isUpdating ? 'value-updating' : ''}`}>
        {typeof displayValue === 'number' ? displayValue : displayValue}
      </span>
      <span className="pc-vital-label">{label}</span>
    </span>
  );
}

export default function PatientCard({ patient, onClick }) {
  const riskColor = getRiskColor(patient.risk);
  const riskClass = getRiskBadgeClass(patient.risk);

  return (
    <div
      className="patient-card card"
      style={{ borderLeft: `3px solid ${riskColor}` }}
      onClick={() => onClick?.(patient)}
      id={`patient-${patient.id}`}
    >
      <div className="pc-top">
        <div className="pc-avatar" style={{ background: patient.risk === 'P1' ? 'var(--risk-p1)' : 'var(--green-primary)' }}>
          {patient.initials}
        </div>
        <div className="pc-info">
          <span className="pc-name">{patient.name}</span>
          <span className="pc-bed text-mono">{patient.bed} · {patient.ward}</span>
        </div>
        <div className="pc-badges">
          <span className={`badge ${riskClass}`}>{patient.risk}</span>
          {patient.medications?.some((m) => m.urgency === 'STAT') && (
            <span className="badge badge-stat">STAT</span>
          )}
        </div>
      </div>

      <div className="pc-vitals">
        <AnimatedVital value={patient.vitals.hr} type="hr" icon={Heart} label="bpm" />
        <AnimatedVital value={patient.vitals.spo2} type="spo2" icon={Wind} label="%" />
        <span className="pc-vital" style={{ color: getVitalStatus('bpSys', patient.vitals.bpSys) === 'normal' ? 'var(--status-normal)' : getVitalStatus('bpSys', patient.vitals.bpSys) === 'warning' ? 'var(--status-warning)' : 'var(--status-critical)' }}>
          <Activity size={12} />
          <span className="pc-vital-value">{patient.vitals.bpSys}/{patient.vitals.bpDia}</span>
          <span className="pc-vital-label">mmHg</span>
        </span>
      </div>

      <div className="pc-footer">
        <span className="text-timestamp">Last updated {patient.lastUpdated}</span>
        <button className="pc-view-btn">
          View Details <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}