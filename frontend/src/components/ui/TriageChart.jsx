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
<<<<<<< HEAD
    const value = payload[0].value;
    let riskLevel = 'Routine';
    let riskColor = 'var(--green-primary)';

    if (value > 90) { riskLevel = 'P1 Critical'; riskColor = '#ef4444'; }
    else if (value > 80) { riskLevel = 'P2 Urgent'; riskColor = '#f97316'; }
    else if (value > 70) { riskLevel = 'P3 High'; riskColor = '#eab308'; }
    else if (value > 60) { riskLevel = 'P4 Medium'; riskColor = '#8FD14F'; }
    else if (value > 50) { riskLevel = 'P5 Low'; riskColor = '#22c55e'; }
    else { riskLevel = 'P6 Stable'; riskColor = '#10b981'; }

    return (
      <div className="chart-tooltip card" style={{ borderColor: riskColor }}>
        <p className="text-card-title">{label}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <p className="chart-tooltip-value" style={{ color: riskColor }}>{value}%</p>
          <span style={{ fontSize: '10px', fontWeight: 600, color: riskColor, textTransform: 'uppercase' }}>{riskLevel}</span>
        </div>
=======
    return (
      <div className="chart-tooltip card">
        <p className="text-card-title">{label}</p>
        <p className="chart-tooltip-value">{payload[0].value}%</p>
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
      </div>
    );
  }
  return null;
}

<<<<<<< HEAD
function CustomDot({ cx, cy, payload }) {
    const value = payload.score;
    let riskColor = '#8FD14F';
    if (value > 90) riskColor = '#ef4444';
    else if (value > 80) riskColor = '#f97316';
    else if (value > 70) riskColor = '#eab308';

    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={riskColor}
        stroke="#fff"
        strokeWidth={2}
        style={{ filter: `drop-shadow(0 2px 4px ${riskColor}66)` }}
      />
    );
=======
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
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
}

export default function TriageChart({ data }) {
  const latestScore = data.length > 0 ? data[data.length - 1].score : 0;
<<<<<<< HEAD
  
  let riskLevel = 'Normal';
  let riskColor = 'var(--green-primary)';
  let riskClass = 'normal';

  if (latestScore > 90) { riskLevel = 'P1 Critical'; riskColor = '#ef4444'; riskClass = 'critical'; }
  else if (latestScore > 80) { riskLevel = 'P2 Urgent'; riskColor = '#f97316'; riskClass = 'urgent'; }
  else if (latestScore > 70) { riskLevel = 'P3 High'; riskColor = '#eab308'; riskClass = 'high'; }
=======
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457

  return (
    <div className="triage-chart card">
      <div className="triage-chart-header">
        <div>
          <span className="text-label">Triage Score</span>
          <div className="triage-chart-score">
<<<<<<< HEAD
            <span className="text-hero" style={{ fontSize: '32px', color: riskColor }}>
=======
            <span className="text-hero" style={{ fontSize: '32px', color: 'var(--green-primary)' }}>
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
              {latestScore.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="triage-chart-meta">
<<<<<<< HEAD
          <span className="badge" style={{ borderColor: riskColor, color: riskColor, background: `${riskColor}11` }}>
            <span className={`status-dot ${riskClass}`} style={{ marginRight: 4, background: riskColor }} />
            {riskLevel}
=======
          <span className="badge badge-available">
            <span className="status-dot normal" style={{ marginRight: 4 }} />
            No Critical Cases
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
          </span>
        </div>
      </div>

      <div className="triage-chart-container">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="triageGradient" x1="0" y1="0" x2="0" y2="1">
<<<<<<< HEAD
                <stop offset="0%" stopColor={riskColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={riskColor} stopOpacity={0} />
=======
                <stop offset="0%" stopColor="#8FD14F" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8FD14F" stopOpacity={0} />
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
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
<<<<<<< HEAD
              stroke={riskColor}
              strokeWidth={2.5}
              fill="url(#triageGradient)"
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: riskColor, stroke: '#fff', strokeWidth: 3 }}
=======
              stroke="#8FD14F"
              strokeWidth={2.5}
              fill="url(#triageGradient)"
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: '#8FD14F', stroke: '#fff', strokeWidth: 3 }}
>>>>>>> 8a87fa11abdc5fd0880da3f1ad9e18864d4c2457
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
