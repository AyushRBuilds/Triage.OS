import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './ui.css';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip card">
        <p className="text-card-title">{label}</p>
        <p className="chart-tooltip-value">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
}

function CustomDot({ cx, cy, payload, index }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#8FD14F"
      stroke="#fff"
      strokeWidth={2}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(143, 209, 79, 0.4))' }}
    />
  );
}

export default function TriageChart({ data }) {
  const latestScore = data.length > 0 ? data[data.length - 1].score : 0;

  return (
    <div className="triage-chart card">
      <div className="triage-chart-header">
        <div>
          <span className="text-label">Triage Score</span>
          <div className="triage-chart-score">
            <span className="text-hero" style={{ fontSize: '32px', color: 'var(--green-primary)' }}>
              {latestScore.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="triage-chart-meta">
          <span className="badge badge-available">
            <span className="status-dot normal" style={{ marginRight: 4 }} />
            No Critical Cases
          </span>
        </div>
      </div>

      <div className="triage-chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="triageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8FD14F" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8FD14F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="none"
              vertical={false}
              stroke="rgba(0,0,0,0.06)"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#A0ADA0' }}
            />
            <YAxis
              domain={[50, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#A0ADA0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#8FD14F"
              strokeWidth={2.5}
              fill="url(#triageGradient)"
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: '#8FD14F', stroke: '#fff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
