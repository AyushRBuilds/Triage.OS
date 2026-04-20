import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Sun, Moon } from 'lucide-react';
import './ui.css';

export default function ScheduleCard({ schedule }) {
  const [offset, setOffset] = useState(0);
  const maxDays = schedule?.days?.length || 0;
  const visibleCount = 7;

  const handlePrev = () => setOffset((prev) => Math.max(0, prev - 1));
  const handleNext = () => setOffset((prev) => Math.min(maxDays - visibleCount, prev + 1));

  const visibleDays = schedule?.days?.slice(offset, offset + visibleCount) || [];

  // Determine current shift info
  const now = new Date();
  const hour = now.getHours();
  const isDay = hour >= 8 && hour < 20;
  const shiftLabel = isDay ? 'Day Shift' : 'Night Shift';
  const shiftTime = isDay ? '8:00 AM – 8:00 PM' : '8:00 PM – 8:00 AM';

  return (
    <div className="schedule-card card-dark">
      <div className="schedule-header">
        <div className="schedule-header-left">
          <span className="schedule-title">Your Shift Schedule</span>
          <div className="schedule-shift-info">
            {isDay ? <Sun size={12} /> : <Moon size={12} />}
            <span>{shiftLabel}</span>
            <span className="schedule-shift-divider">·</span>
            <Clock size={11} />
            <span>{shiftTime}</span>
          </div>
        </div>
        <div className="schedule-arrows">
          <button className="schedule-arrow-btn" onClick={handlePrev} disabled={offset === 0}>
            <ChevronLeft size={16} />
          </button>
          <button className="schedule-arrow-btn" onClick={handleNext} disabled={offset >= maxDays - visibleCount}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="schedule-days">
        {visibleDays.map((d, i) => (
          <div key={i} className={`schedule-day ${d.active ? 'active' : ''}`}>
            <span className="schedule-day-name">{d.day}</span>
            <span className="schedule-day-date">{d.date}</span>
            {d.tasks > 0 && <span className="schedule-day-tasks">{d.tasks} tasks</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
