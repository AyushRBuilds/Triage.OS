import React from 'react';
import { Bed, Users, Activity, Settings, Bell, Search, Map } from 'lucide-react';
import './WardOverview.css';

export default function WardOverview() {
  const rooms = [
    {
      id: '101',
      beds: [
        { id: '101-A', status: 'available', text: 'Available' },
        { id: '101-B', status: 'occupied', patient: 'Rahul Verma', priority: 'P3' },
        { id: '101-C', status: 'critical', patient: 'Amit Shah', priority: 'P1' },
        { id: '101-D', status: 'occupied', patient: 'Neha Patel', priority: 'P2' },
      ],
    },
    {
      id: '102',
      beds: [
        { id: '102-A', status: 'occupied', patient: 'Vikram Singh', priority: 'P2' },
        { id: '102-B', status: 'available', text: 'Available' },
        { id: '102-C', status: 'occupied', patient: 'Sneha Reddy', priority: 'P3' },
        { id: '102-D', status: 'maintenance', text: 'Maintenance' },
      ],
    },
    {
      id: '103',
      beds: [
        { id: '103-A', status: 'critical', patient: 'John Doe', priority: 'P1' },
        { id: '103-B', status: 'occupied', patient: 'Priya Mehta', priority: 'P2' },
        { id: '103-C', status: 'available', text: 'Available' },
        { id: '103-D', status: 'occupied', patient: 'Arjun Nair', priority: 'P3' },
      ],
    },
    {
      id: '104',
      beds: [
        { id: '104-A', status: 'available', text: 'Available' },
        { id: '104-B', status: 'occupied', patient: 'Karan Malhotra', priority: 'P3' },
        { id: '104-C', status: 'available', text: 'Available' },
        { id: '104-D', status: 'available', text: 'Available' },
      ],
    },
  ];

  const recentAdmissions = [
    { name: 'Amit Shah', bed: '101-C', priority: 'P1', time: '10:30 AM', color: 'var(--sick-red)' },
    { name: 'Neha Patel', bed: '101-D', priority: 'P2', time: '09:15 AM', color: 'var(--amber-alert)' },
    { name: 'Vikram Singh', bed: '102-A', priority: 'P2', time: '08:45 AM', color: 'var(--amber-alert)' },
  ];

  return (
    <div className="ward-overview-container">
      <div className="ward-header">
        <div>
          <h1 className="ward-title">Ward Overview</h1>
          <div className="ward-breadcrumbs">
            <span>Home</span> <span className="separator">&gt;</span> <span>Ward Overview</span>
          </div>
        </div>
        <div className="ward-header-actions">
          <div className="notification-icon">
            <Bell size={20} />
            <span className="badge">3</span>
          </div>
          <div className="search-box">
            <input type="text" placeholder="Search patient, bed, room..." />
            <Search size={18} />
          </div>
        </div>
      </div>

      <div className="ward-metrics-row">
        <div className="metric-card">
          <div className="metric-icon-bg bg-blue">
            <Bed size={24} className="metric-icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Ward Name</span>
            <span className="metric-value">ICU - A</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-green">
            <Bed size={24} className="metric-icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Beds</span>
            <span className="metric-value">20</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-yellow">
            <Users size={24} className="metric-icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Occupied</span>
            <span className="metric-value">14</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-red">
            <Activity size={24} className="metric-icon" />
          </div>
          <div className="metric-info">
            <span className="metric-label">Critical Patients</span>
            <span className="metric-value">4</span>
          </div>
        </div>
      </div>

      <div className="ward-main-layout">
        <div className="ward-map-section">
          <div className="ward-section-header">
            <h2>Ward Map</h2>
            <div className="ward-legend">
              <span className="legend-item"><span className="dot available"></span> Available</span>
              <span className="legend-item"><span className="dot occupied"></span> Occupied</span>
              <span className="legend-item"><span className="dot critical"></span> Critical</span>
              <span className="legend-item"><span className="dot maintenance"></span> Maintenance</span>
            </div>
          </div>

          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-container">
                <h3 className="room-title">Room {room.id}</h3>
                <div className="beds-grid">
                  {room.beds.map((bed) => (
                    <div key={bed.id} className={`bed-card status-${bed.status}`}>
                      <div className="bed-id">{bed.id}</div>
                      {bed.patient ? (
                        <>
                          <div className="bed-patient">{bed.patient}</div>
                          <div className="bed-priority">{bed.priority}</div>
                        </>
                      ) : (
                        <div className="bed-text">{bed.text}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ward-sidebar-section">
          <div className="ward-details-card">
            <h2>Ward Details</h2>
            <ul className="details-list">
              <li><span>Ward</span> <strong>ICU - A</strong></li>
              <li><span>Floor</span> <strong>1st Floor</strong></li>
              <li><span>Total Rooms</span> <strong>4</strong></li>
              <li><span>Total Beds</span> <strong>20</strong></li>
              <li><span>Occupied Beds</span> <strong>14</strong></li>
              <li><span>Available Beds</span> <strong>4</strong></li>
              <li><span>Maintenance</span> <strong>2</strong></li>
              <li><span>Critical Patients</span> <strong>4</strong></li>
            </ul>
          </div>

          <div className="recent-admissions-card">
            <div className="card-header">
              <h2>Recent Admissions</h2>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="admissions-list">
              {recentAdmissions.map((adm, idx) => (
                <div key={idx} className="admission-item">
                  <div className="admission-avatar">
                   <Users size={16} />
                  </div>
                  <div className="admission-info">
                    <div className="adm-name">{adm.name}</div>
                    <div className="adm-bed">Bed {adm.bed}</div>
                  </div>
                  <div className="admission-status">
                    <div className="adm-priority">
                      <span className="priority-dot" style={{ backgroundColor: adm.color }}></span> {adm.priority}
                    </div>
                    <div className="adm-time">{adm.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
