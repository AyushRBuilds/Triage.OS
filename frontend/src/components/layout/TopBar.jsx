import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, X, AlertTriangle, Clock, CheckCircle, PenLine, LogOut } from 'lucide-react';
import FloatingNotes from './FloatingNotes';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToShiftSwaps, confirmShiftSwapTransfer } from '../../api/services';
import { toast } from '../Toast';
import { patients } from '../../data/mockData';
import './TopBar.css';

const NOTIFICATIONS = [
  { id: 1, type: 'critical', text: 'Mr. Arjun Reddy — SpO2 dropped to 88%', time: '2 min ago' },
  { id: 2, type: 'stat', text: 'STAT: Meropenem 1g IV due for Bed 9', time: '5 min ago' },
  { id: 3, type: 'info', text: 'Shift swap request from Deepak Nair', time: '15 min ago' },
];

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [transferConfirm, setTransferConfirm] = useState(null);
  const notesRef = useRef(null);
  const [dismissedNotifs, setDismissedNotifs] = useState([]);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const visibleNotifs = NOTIFICATIONS.filter((n) => !dismissedNotifs.includes(n.id));

  // Close dropdowns on outside click only
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (notesRef.current && !notesRef.current.contains(e.target)) setShowNotes(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for shift swap acceptances
  useEffect(() => {
    if (!user || !user.id) return;
    
    const sub = subscribeToShiftSwaps((payload) => {
      if (payload.eventType === 'UPDATE' && payload.new.status.startsWith('accepted')) {
        const parts = payload.new.status.split('|');
        const responderName = parts[1] || 'A colleague';
        const responderId = parts[2];
        if (payload.new.requestor_id === user.id) {
          // Instead of instantly transferring, ask for confirmation
          setTransferConfirm({
            requestId: payload.new.id,
            responderName,
            responderId
          });
          toast.success(`${responderName} accepted your shift request! Confirm to transfer patients.`, { duration: 6000 });
        }
      }
    });

    return () => sub.close();
  }, [user]);

  const handleConfirmTransfer = async () => {
    if (!transferConfirm) return;
    try {
      await confirmShiftSwapTransfer(transferConfirm.requestId, transferConfirm.responderId);
      toast.success(`Patients successfully transferred to ${transferConfirm.responderName}!`);
      setTransferConfirm(null);
    } catch (err) {
      toast.error('Failed to transfer patients.');
    }
  };

  // Search results
  const searchResults = searchQuery.trim().length > 0
    ? patients.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSelect = (patient) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(`/patients?patient=${patient.id}`);
  };

  const roleName = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

  const getNotifIcon = (type) => {
    if (type === 'critical') return <AlertTriangle size={13} />;
    if (type === 'stat') return <Clock size={13} />;
    return <CheckCircle size={13} />;
  };

  return (
    <header className="topbar" id="topbar">
      {/* Greeting */}
      <div className="topbar-greeting">
        <h2>Hello, {user?.name === 'Hospital Admin' ? 'Administrator' : (user?.name?.split(' ')[0] || 'User')}! <span className="wave">👋</span></h2>
      </div>

      {/* Search */}
      <div className="topbar-search" ref={searchRef}>
        <Search size={16} className="topbar-search-icon" />
        <input
          type="text"
          className="input input-pill topbar-search-input"
          placeholder="Search patients, tasks, SOAP notes..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
          onFocus={() => searchQuery.trim() && setShowResults(true)}
          id="global-search"
        />
        {showResults && searchResults.length > 0 && (
          <div className="topbar-search-dropdown card animate-fade-in">
            <span className="text-label" style={{ padding: '8px 12px', display: 'block' }}>
              Patients ({searchResults.length})
            </span>
            {searchResults.map((p) => (
              <button
                key={p.id}
                className="topbar-search-item"
                onClick={() => handleSearchSelect(p)}
              >
                <div className="topbar-search-avatar" style={{
                  background: p.risk === 'P1' ? 'var(--risk-p1)' : 'var(--green-primary)'
                }}>
                  {p.initials}
                </div>
                <div className="topbar-search-info">
                  <span className="topbar-search-name">{p.name}</span>
                  <span className="topbar-search-meta">{p.bed} · {p.ward}</span>
                </div>
                <span className={`badge badge-${p.risk.toLowerCase()}`}>{p.risk}</span>
              </button>
            ))}
          </div>
        )}
        {showResults && searchQuery.trim() && searchResults.length === 0 && (
          <div className="topbar-search-dropdown card animate-fade-in">
            <div className="topbar-search-empty">No results found</div>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="topbar-right">
        {/* Notes button */}
        <div className="topbar-notif-wrapper" ref={notesRef}>
          <button
            className="topbar-bell"
            id="notes-btn"
            onClick={() => setShowNotes(!showNotes)}
            title="Quick Notes"
          >
            <PenLine size={20} strokeWidth={1.8} />
          </button>
          {showNotes && <FloatingNotes isInline onClose={() => setShowNotes(false)} />}
        </div>

        {/* Notification bell — click-only, no auto-open */}
        <div className="topbar-notif-wrapper" ref={notifRef}>
          <button
            className="topbar-bell"
            id="notifications-btn"
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={20} strokeWidth={1.8} />
            {visibleNotifs.length > 0 && (
              <span className="topbar-bell-badge">{visibleNotifs.length}</span>
            )}
          </button>

          {/* Notification dropdown — only on click */}
          {showNotifs && (
            <div className="topbar-notif-dropdown card animate-fade-in">
              <div className="topbar-notif-header">
                <span className="topbar-notif-title">Notifications</span>
                {visibleNotifs.length > 0 && (
                  <button
                    className="topbar-notif-clear"
                    onClick={() => setDismissedNotifs(NOTIFICATIONS.map((n) => n.id))}
                  >
                    Clear all
                  </button>
                )}
              </div>
              {visibleNotifs.length > 0 ? (
                <div className="topbar-notif-list">
                  {visibleNotifs.map((n) => (
                    <div key={n.id} className={`topbar-notif-item topbar-notif-${n.type}`}>
                      <div className={`topbar-notif-icon topbar-icon-${n.type}`}>
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="topbar-notif-content">
                        <span className="topbar-notif-text">{n.text}</span>
                        <span className="topbar-notif-time">{n.time}</span>
                      </div>
                      <button
                        className="topbar-notif-dismiss"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissedNotifs((prev) => [...prev, n.id]);
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="topbar-notif-empty">
                  <Bell size={24} style={{ opacity: 0.2 }} />
                  <span>All caught up!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div className="topbar-profile-wrapper" ref={profileRef}>
          <button
            className="topbar-avatar"
            onClick={() => setShowProfile(!showProfile)}
            id="user-avatar"
          >
            <div className="topbar-avatar-circle">{user?.initials || 'U'}</div>
            <div className="topbar-avatar-info">
              <span className="topbar-avatar-name">{user?.name || 'User'}</span>
              <span className="topbar-avatar-role">{roleName}</span>
            </div>
            <ChevronDown size={14} className="topbar-chevron" />
          </button>

          {showProfile && (
            <div className="topbar-profile-menu card animate-fade-in">
              <button className="topbar-profile-item" onClick={() => { navigate('/settings'); setShowProfile(false); }}>
                <User size={14} /> Profile & Settings
              </button>
              <button className="topbar-profile-item" onClick={() => { logout(); navigate('/login'); setShowProfile(false); }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Confirmation Modal */}
      {transferConfirm && (
        <div className="kanban-modal-backdrop" onClick={() => setTransferConfirm(null)}>
          <div className="kanban-modal card animate-slide-up" onClick={(e) => e.stopPropagation()} style={{maxWidth: 400}}>
            <h4 className="text-card-title" style={{ textAlign: 'center' }}>Confirm Patient Transfer</h4>
            <p className="text-body" style={{ textAlign: 'center', marginBottom: 20 }}>
              <strong>{transferConfirm.responderName}</strong> has accepted your shift request.<br/>
              Do you want to confirm and transfer your assigned patients to them now?
            </p>
            <div className="kanban-form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setTransferConfirm(null)}>Not Now</button>
              <button className="btn btn-primary" onClick={handleConfirmTransfer}>
                <CheckCircle size={14} /> Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
