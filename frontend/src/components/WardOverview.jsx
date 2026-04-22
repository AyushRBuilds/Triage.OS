import React, { useState, useMemo } from 'react';
import {
  Bed, Users, Activity, AlertTriangle, Wrench, Search, UserPlus, LogOut as Discharge,
  X, ChevronDown, Clock, MapPin, Heart, Filter
} from 'lucide-react';
import './WardOverview.css';

const INITIAL_ROOMS = [
  {
    id: '101',
    beds: [
      { id: '101-A', status: 'available' },
      { id: '101-B', status: 'occupied', patient: 'Rahul Verma', priority: 'P3', admittedAt: '08:30 AM' },
      { id: '101-C', status: 'critical', patient: 'Amit Shah', priority: 'P1', admittedAt: '10:30 AM' },
      { id: '101-D', status: 'occupied', patient: 'Neha Patel', priority: 'P2', admittedAt: '09:15 AM' },
    ],
  },
  {
    id: '102',
    beds: [
      { id: '102-A', status: 'occupied', patient: 'Vikram Singh', priority: 'P2', admittedAt: '08:45 AM' },
      { id: '102-B', status: 'available' },
      { id: '102-C', status: 'occupied', patient: 'Sneha Reddy', priority: 'P3', admittedAt: '11:00 AM' },
      { id: '102-D', status: 'maintenance' },
    ],
  },
  {
    id: '103',
    beds: [
      { id: '103-A', status: 'critical', patient: 'John Doe', priority: 'P1', admittedAt: '07:15 AM' },
      { id: '103-B', status: 'occupied', patient: 'Priya Mehta', priority: 'P2', admittedAt: '06:30 AM' },
      { id: '103-C', status: 'available' },
      { id: '103-D', status: 'occupied', patient: 'Arjun Nair', priority: 'P3', admittedAt: '12:00 PM' },
    ],
  },
  {
    id: '104',
    beds: [
      { id: '104-A', status: 'available' },
      { id: '104-B', status: 'occupied', patient: 'Karan Malhotra', priority: 'P3', admittedAt: '01:30 PM' },
      { id: '104-C', status: 'available' },
      { id: '104-D', status: 'available' },
    ],
  },
];

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'var(--green-primary)', bg: 'var(--green-light)', icon: Bed },
  occupied: { label: 'Occupied', color: 'var(--risk-p3)', bg: '#FFFBEB', icon: Users },
  critical: { label: 'Critical', color: 'var(--risk-p1)', bg: '#FEF2F2', icon: Activity },
  maintenance: { label: 'Maintenance', color: 'var(--text-muted)', bg: 'var(--bg-input)', icon: Wrench },
};

const PRIORITY_CONFIG = {
  P1: { label: 'Critical', badge: 'badge-p1' },
  P2: { label: 'Urgent', badge: 'badge-p2' },
  P3: { label: 'Standard', badge: 'badge-p3' },
};

export default function WardOverview() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeBed, setActiveBed] = useState(null); // for modal
  const [admitModal, setAdmitModal] = useState(null); // { roomId, bedId }
  const [admitForm, setAdmitForm] = useState({ name: '', priority: 'P3' });

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const all = rooms.flatMap((r) => r.beds);
    return {
      total: all.length,
      occupied: all.filter((b) => b.status === 'occupied').length,
      critical: all.filter((b) => b.status === 'critical').length,
      available: all.filter((b) => b.status === 'available').length,
      maintenance: all.filter((b) => b.status === 'maintenance').length,
    };
  }, [rooms]);

  const occupancyPercent = Math.round(((stats.occupied + stats.critical) / stats.total) * 100);

  // ── Filtered rooms ──
  const filteredRooms = useMemo(() => {
    return rooms.map((room) => ({
      ...room,
      beds: room.beds.filter((bed) => {
        const matchSearch =
          !search ||
          bed.id.toLowerCase().includes(search.toLowerCase()) ||
          (bed.patient && bed.patient.toLowerCase().includes(search.toLowerCase()));
        const matchFilter = filterStatus === 'all' || bed.status === filterStatus;
        return matchSearch && matchFilter;
      }),
    })).filter((room) => room.beds.length > 0);
  }, [rooms, search, filterStatus]);

  // ── Recent admissions (derived from data) ──
  const recentAdmissions = useMemo(() => {
    return rooms
      .flatMap((r) => r.beds)
      .filter((b) => b.patient && b.admittedAt)
      .sort((a, b) => {
        // Simple sort by time string
        return b.admittedAt.localeCompare(a.admittedAt);
      })
      .slice(0, 5);
  }, [rooms]);

  // ── CRUD Actions ──
  const handleDischarge = (roomId, bedId) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              beds: room.beds.map((bed) =>
                bed.id === bedId
                  ? { id: bed.id, status: 'available' }
                  : bed
              ),
            }
          : room
      )
    );
    setActiveBed(null);
  };

  const handleToggleMaintenance = (roomId, bedId, currentStatus) => {
    const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              beds: room.beds.map((bed) =>
                bed.id === bedId
                  ? { id: bed.id, status: newStatus }
                  : bed
              ),
            }
          : room
      )
    );
    setActiveBed(null);
  };

  const handleAdmit = () => {
    if (!admitForm.name.trim()) return;
    const { roomId, bedId } = admitModal;
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId
          ? {
              ...room,
              beds: room.beds.map((bed) =>
                bed.id === bedId
                  ? {
                      ...bed,
                      status: admitForm.priority === 'P1' ? 'critical' : 'occupied',
                      patient: admitForm.name,
                      priority: admitForm.priority,
                      admittedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    }
                  : bed
              ),
            }
          : room
      )
    );
    setAdmitModal(null);
    setAdmitForm({ name: '', priority: 'P3' });
  };

  // ── Bed Card Click ──
  const handleBedClick = (bed, roomId) => {
    if (bed.status === 'available') {
      setAdmitModal({ roomId, bedId: bed.id });
    } else {
      setActiveBed({ ...bed, roomId });
    }
  };

  return (
    <div className="wo-page">
      {/* ── Scrollable Content ── */}
      <div className="wo-scroll">
        {/* ── Header ── */}
        <div className="wo-header">
          <div>
            <h1 className="wo-title">Ward Overview</h1>
            <p className="wo-subtitle">ICU-A · 1st Floor · Real-time bed management</p>
          </div>
          <div className="wo-header-right">
            <div className="wo-search-wrap">
              <Search size={16} className="wo-search-icon" />
              <input
                className="input input-pill wo-search-input"
                type="text"
                placeholder="Search bed or patient…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="wo-filter-wrap">
              <Filter size={14} />
              <select
                className="wo-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Beds</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="critical">Critical</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="wo-metrics">
          <div className="wo-metric card animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="wo-metric-icon" style={{ background: 'var(--green-light)', color: 'var(--green-text)' }}>
              <Bed size={20} />
            </div>
            <div className="wo-metric-info">
              <span className="text-label">Total Beds</span>
              <span className="wo-metric-value">{stats.total}</span>
            </div>
          </div>

          <div className="wo-metric card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="wo-metric-icon" style={{ background: '#FFFBEB', color: 'var(--risk-p3)' }}>
              <Users size={20} />
            </div>
            <div className="wo-metric-info">
              <span className="text-label">Occupied</span>
              <span className="wo-metric-value">{stats.occupied}</span>
            </div>
            <div className="wo-metric-bar">
              <div className="wo-metric-fill" style={{ width: `${(stats.occupied / stats.total) * 100}%`, background: 'var(--risk-p3)' }} />
            </div>
          </div>

          <div className="wo-metric card animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="wo-metric-icon" style={{ background: '#FEF2F2', color: 'var(--risk-p1)' }}>
              <AlertTriangle size={20} />
            </div>
            <div className="wo-metric-info">
              <span className="text-label">Critical</span>
              <span className="wo-metric-value">{stats.critical}</span>
            </div>
            {stats.critical > 0 && <span className="wo-metric-pulse" />}
          </div>

          <div className="wo-metric card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="wo-metric-icon" style={{ background: 'var(--green-light)', color: 'var(--green-text)' }}>
              <Heart size={20} />
            </div>
            <div className="wo-metric-info">
              <span className="text-label">Available</span>
              <span className="wo-metric-value">{stats.available}</span>
            </div>
          </div>
        </div>

        {/* ── Occupancy Bar ── */}
        <div className="wo-occupancy card animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="wo-occ-header">
            <span className="text-label">Ward Occupancy</span>
            <span className="wo-occ-percent">{occupancyPercent}%</span>
          </div>
          <div className="wo-occ-bar">
            <div className="wo-occ-fill" style={{ width: `${occupancyPercent}%` }} />
          </div>
          <div className="wo-occ-legend">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <span key={key} className="wo-legend-item">
                <span className="wo-legend-dot" style={{ background: cfg.color }} />
                {cfg.label}
                <strong>
                  {key === 'available' ? stats.available
                    : key === 'occupied' ? stats.occupied
                    : key === 'critical' ? stats.critical
                    : stats.maintenance}
                </strong>
              </span>
            ))}
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div className="wo-body">
          {/* ── Bed Map ── */}
          <div className="wo-map">
            {filteredRooms.map((room, rIdx) => (
              <div key={room.id} className="wo-room animate-fade-in" style={{ animationDelay: `${0.3 + rIdx * 0.08}s` }}>
                <div className="wo-room-header">
                  <MapPin size={14} />
                  <span>Room {room.id}</span>
                  <span className="wo-room-count">
                    {room.beds.filter((b) => b.status === 'available').length} / {room.beds.length} open
                  </span>
                </div>
                <div className="wo-beds-grid">
                  {room.beds.map((bed) => {
                    const cfg = STATUS_CONFIG[bed.status];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={bed.id}
                        className={`wo-bed wo-bed--${bed.status}`}
                        onClick={() => handleBedClick(bed, room.id)}
                        title={bed.patient ? `${bed.patient} — ${bed.priority}` : cfg.label}
                      >
                        <div className="wo-bed-top">
                          <span className="wo-bed-id">{bed.id}</span>
                          <span className={`wo-bed-status-dot ${bed.status === 'critical' ? 'wo-bed-status-dot--critical' : ''}`} style={{ background: cfg.color }} />
                        </div>
                        <div className="wo-bed-icon" style={{ color: cfg.color }}>
                          <Icon size={18} />
                        </div>
                        {bed.patient ? (
                          <div className="wo-bed-details">
                            <span className="wo-bed-patient">{bed.patient}</span>
                            <span className={`badge badge-sm ${PRIORITY_CONFIG[bed.priority]?.badge}`}>
                              {bed.priority}
                            </span>
                          </div>
                        ) : (
                          <span className="wo-bed-label" style={{ color: cfg.color }}>{cfg.label}</span>
                        )}
                        {bed.status === 'available' && (
                          <span className="wo-bed-admit-hint">
                            <UserPlus size={12} /> Admit
                          </span>
                        )}

                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {filteredRooms.length === 0 && (
              <div className="wo-empty-state">
                <Search size={32} />
                <p>No beds match your search or filter.</p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="wo-sidebar">
            {/* Ward Details */}
            <div className="card wo-detail-card animate-fade-in" style={{ animationDelay: '0.35s' }}>
              <h3 className="text-card-title">Ward Details</h3>
              <div className="wo-detail-list">
                <div className="wo-detail-row"><span>Ward</span><strong>ICU - A</strong></div>
                <div className="wo-detail-row"><span>Floor</span><strong>1st Floor</strong></div>
                <div className="wo-detail-row"><span>Rooms</span><strong>{rooms.length}</strong></div>
                <div className="wo-detail-row"><span>Total Beds</span><strong>{stats.total}</strong></div>
                <div className="wo-detail-row"><span>Occupied</span><strong>{stats.occupied + stats.critical}</strong></div>
                <div className="wo-detail-row"><span>Available</span><strong className="wo-avail">{stats.available}</strong></div>
                <div className="wo-detail-row"><span>Maintenance</span><strong>{stats.maintenance}</strong></div>
              </div>
            </div>

            {/* Recent Admissions */}
            <div className="card wo-admissions-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="wo-admissions-header">
                <h3 className="text-card-title">Recent Admissions</h3>
                <Clock size={14} className="wo-admissions-clock" />
              </div>
              <div className="wo-admissions-list">
                {recentAdmissions.map((bed, idx) => (
                  <div key={bed.id || idx} className="wo-admission-item">
                    <div
                      className="wo-admission-avatar"
                      style={{
                        background: PRIORITY_CONFIG[bed.priority]?.badge === 'badge-p1' ? '#FEF2F2'
                          : PRIORITY_CONFIG[bed.priority]?.badge === 'badge-p2' ? '#FFF7ED' : '#FFFBEB',
                        color: bed.priority === 'P1' ? 'var(--risk-p1)'
                          : bed.priority === 'P2' ? 'var(--risk-p2)' : 'var(--risk-p3)',
                      }}
                    >
                      {bed.patient?.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="wo-admission-info">
                      <span className="wo-admission-name">{bed.patient}</span>
                      <span className="text-timestamp">Bed {bed.id} · {bed.admittedAt}</span>
                    </div>
                    <span className={`badge badge-sm ${PRIORITY_CONFIG[bed.priority]?.badge}`}>{bed.priority}</span>
                  </div>
                ))}
                {recentAdmissions.length === 0 && (
                  <p className="text-body" style={{ padding: '12px 0', textAlign: 'center' }}>No recent admissions</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bed Detail Modal ── */}
      {activeBed && (
        <div className="wo-modal-overlay" onClick={() => setActiveBed(null)}>
          <div className="wo-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="wo-modal-header">
              <h3>Bed {activeBed.id}</h3>
              <button className="btn-ghost btn-sm wo-modal-close" onClick={() => setActiveBed(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="wo-modal-body">
              {activeBed.patient && (
                <div className="wo-modal-patient-info">
                  <div className="wo-modal-avatar">
                    {activeBed.patient.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-card-title">{activeBed.patient}</div>
                    <span className={`badge ${PRIORITY_CONFIG[activeBed.priority]?.badge}`}>
                      {activeBed.priority} — {PRIORITY_CONFIG[activeBed.priority]?.label}
                    </span>
                  </div>
                </div>
              )}
              <div className="wo-modal-detail-row">
                <span className="text-label">Status</span>
                <span className={`badge ${activeBed.status === 'critical' ? 'badge-p1' : activeBed.status === 'maintenance' ? 'badge-p5' : 'badge-p3'}`}>
                  {STATUS_CONFIG[activeBed.status]?.label}
                </span>
              </div>
              {activeBed.admittedAt && (
                <div className="wo-modal-detail-row">
                  <span className="text-label">Admitted</span>
                  <span className="text-body">{activeBed.admittedAt}</span>
                </div>
              )}
            </div>
            <div className="wo-modal-actions">
              {(activeBed.status === 'occupied' || activeBed.status === 'critical') && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDischarge(activeBed.roomId, activeBed.id)}
                >
                  <Discharge size={14} />
                  Discharge Patient
                </button>
              )}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleToggleMaintenance(activeBed.roomId, activeBed.id, activeBed.status)}
              >
                <Wrench size={14} />
                {activeBed.status === 'maintenance' ? 'Clear Maintenance' : 'Mark Maintenance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admit Patient Modal ── */}
      {admitModal && (
        <div className="wo-modal-overlay" onClick={() => setAdmitModal(null)}>
          <div className="wo-modal card" onClick={(e) => e.stopPropagation()}>
            <div className="wo-modal-header">
              <h3>Admit Patient — Bed {admitModal.bedId}</h3>
              <button className="btn-ghost btn-sm wo-modal-close" onClick={() => setAdmitModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="wo-modal-body">
              <label className="wo-form-label text-label">Patient Name</label>
              <input
                className="input"
                placeholder="Enter patient name…"
                value={admitForm.name}
                onChange={(e) => setAdmitForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
              <label className="wo-form-label text-label" style={{ marginTop: 12 }}>Priority</label>
              <div className="wo-priority-picker">
                {['P1', 'P2', 'P3'].map((p) => (
                  <button
                    key={p}
                    className={`badge ${PRIORITY_CONFIG[p].badge} wo-priority-opt ${admitForm.priority === p ? 'active' : ''}`}
                    onClick={() => setAdmitForm((f) => ({ ...f, priority: p }))}
                  >
                    {p} — {PRIORITY_CONFIG[p].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="wo-modal-actions">
              <button className="btn btn-primary btn-sm" onClick={handleAdmit} disabled={!admitForm.name.trim()}>
                <UserPlus size={14} />
                Admit Patient
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdmitModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
