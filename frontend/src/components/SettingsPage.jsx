import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, Palette, Lock, Save, Check } from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    ward: user?.ward || '',
    phone: '+91 98765 43210',
  });
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    statMeds: true,
    shiftSwaps: true,
    soapNotes: false,
    emailDigest: false,
  });
  const [theme, setTheme] = useState('light');
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [saveMsg, setSaveMsg] = useState('');

  const handleSave = (section) => {
    setSaveMsg(`${section} saved successfully!`);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="settings-page" id="settings-page">
      <h3 className="text-section-title" style={{ marginBottom: 20 }}>Settings</h3>

      {saveMsg && (
        <div className="settings-save-msg animate-fade-in">
          <Check size={14} /> {saveMsg}
        </div>
      )}

      <div className="settings-layout">
        {/* Sidebar tabs */}
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`settings-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="settings-content card">
          {activeTab === 'profile' && (
            <div className="settings-section animate-fade-in">
              <h4 className="text-card-title">Profile Details</h4>
              <p className="text-body" style={{ marginBottom: 20 }}>Manage your personal information</p>
              <div className="settings-form-grid">
                <div className="settings-field">
                  <label className="text-label">Full Name</label>
                  <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="settings-field">
                  <label className="text-label">Email</label>
                  <input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>
                <div className="settings-field">
                  <label className="text-label">Role</label>
                  <input className="input" value={profile.role} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="settings-field">
                  <label className="text-label">Ward</label>
                  <input className="input" value={profile.ward} onChange={(e) => setProfile({ ...profile, ward: e.target.value })} />
                </div>
                <div className="settings-field">
                  <label className="text-label">Phone</label>
                  <input className="input" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary" onClick={() => handleSave('Profile')}>
                  <Save size={14} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section animate-fade-in">
              <h4 className="text-card-title">Notification Preferences</h4>
              <p className="text-body" style={{ marginBottom: 20 }}>Choose which notifications you receive</p>
              <div className="settings-toggles">
                {Object.entries(notifications).map(([key, val]) => {
                  const labels = {
                    criticalAlerts: 'Critical Patient Alerts (P1/P2)',
                    statMeds: 'STAT Medication Reminders',
                    shiftSwaps: 'Shift Swap Requests',
                    soapNotes: 'SOAP Note Confirmations',
                    emailDigest: 'Daily Email Digest',
                  };
                  return (
                    <div key={key} className="settings-toggle-row">
                      <span className="settings-toggle-label">{labels[key]}</span>
                      <button
                        className={`settings-toggle ${val ? 'active' : ''}`}
                        onClick={() => setNotifications({ ...notifications, [key]: !val })}
                      >
                        <span className="settings-toggle-knob" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary" onClick={() => handleSave('Notifications')}>
                  <Save size={14} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section animate-fade-in">
              <h4 className="text-card-title">Appearance</h4>
              <p className="text-body" style={{ marginBottom: 20 }}>Customize the look and feel</p>
              <div className="settings-theme-options">
                <button
                  className={`settings-theme-card ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="settings-theme-preview settings-theme-light">
                    <div className="stp-sidebar" />
                    <div className="stp-main">
                      <div className="stp-bar" />
                      <div className="stp-cards"><div /><div /><div /></div>
                    </div>
                  </div>
                  <span>Light Mode</span>
                </button>
                <button
                  className={`settings-theme-card ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="settings-theme-preview settings-theme-dark">
                    <div className="stp-sidebar" />
                    <div className="stp-main">
                      <div className="stp-bar" />
                      <div className="stp-cards"><div /><div /><div /></div>
                    </div>
                  </div>
                  <span>Dark Mode</span>
                </button>
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary" onClick={() => handleSave('Theme')}>
                  <Save size={14} /> Apply Theme
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section animate-fade-in">
              <h4 className="text-card-title">Update Password</h4>
              <p className="text-body" style={{ marginBottom: 20 }}>Change your account password</p>
              <div className="settings-form-grid" style={{ maxWidth: 400 }}>
                <div className="settings-field">
                  <label className="text-label">Current Password</label>
                  <input className="input" type="password" placeholder="Enter current password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} />
                </div>
                <div className="settings-field">
                  <label className="text-label">New Password</label>
                  <input className="input" type="password" placeholder="Enter new password" value={passwords.newPw} onChange={(e) => setPasswords({ ...passwords, newPw: e.target.value })} />
                </div>
                <div className="settings-field">
                  <label className="text-label">Confirm New Password</label>
                  <input className="input" type="password" placeholder="Confirm new password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                </div>
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary" onClick={() => handleSave('Password')}>
                  <Lock size={14} /> Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
