import './ui.css';

export default function StatCard({ label, value, subtext, color, icon: Icon }) {
  return (
    <div className="stat-card card">
      <div className="stat-card-header">
        <span className="text-label">{label}</span>
        {Icon && <Icon size={16} className="stat-card-icon" />}
      </div>
      <div className="stat-card-value" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </div>
      <div className="stat-card-subtext text-body">{subtext}</div>
    </div>
  );
}
