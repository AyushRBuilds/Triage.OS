import { useAnimatedValue } from '../../hooks/useSimulatedVitals';
import { getVitalStatus } from '../../data/mockData';
import './ui.css';

const statusColors = {
  normal: 'var(--status-normal)',
  warning: 'var(--status-warning)',
  critical: 'var(--status-critical)',
};

const statusLabels = {
  normal: 'Normal',
  warning: 'Elevated',
  critical: 'Critical',
};

export default function VitalMiniCard({ label, value, unit, type, sparklineData = [] }) {
  const { displayValue, isUpdating } = useAnimatedValue(value);
  const status = getVitalStatus(type, displayValue);
  const color = statusColors[status];

  // Generate simple sparkline path
  const sparklinePath = () => {
    if (sparklineData.length < 2) return '';
    const width = 120;
    const height = 36;
    const step = width / (sparklineData.length - 1);
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;

    const points = sparklineData.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    });

    return `M${points.join(' L')}`;
  };

  return (
    <div className="vital-mini-card card">
      <span className="text-label">{label}</span>
      <div className="vital-mini-value-row">
        <span
          className={`vital-mini-value ${isUpdating ? 'value-updating' : ''}`}
          style={{ color }}
        >
          {typeof displayValue === 'number' ? displayValue : displayValue}
        </span>
        <span className="text-unit">{unit}</span>
      </div>

      {/* Sparkline */}
      {sparklineData.length > 1 && (
        <svg className="vital-sparkline" viewBox={`0 0 120 36`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={sparklinePath() + ` L120,36 L0,36 Z`}
            fill={`url(#grad-${type})`}
          />
          <path
            d={sparklinePath()}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      <div className="vital-mini-status">
        <span className={`status-dot ${status}`} />
        <span className="text-timestamp" style={{ color }}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}
