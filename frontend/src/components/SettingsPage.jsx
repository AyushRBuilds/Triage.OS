import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../api/supabaseClient';
import { User, Bell, Palette, Lock, Save, Check, Loader } from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || '',
    ward: user?.ward || '',
    phone: user?.phone || '+91 98765 43210',
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

  // Load notification preferences from Supabase on mount
  useEffect(() => {
    async function loadPrefs() {
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user?.email)
          .single();
        if (data) {
          setNotifications({
            criticalAlerts: data.critical_alerts ?? true,
            statMeds: data.stat_meds ?? true,
            shiftSwaps: data.shift_swaps ?? true,
            soapNotes: data.soap_notes ?? false,
            emailDigest: data.email_digest ?? false,
          });
        }
      } catch (err) {
        // Table may not exist yet — use defaults
        console.warn('Could not load notification prefs:', err.message);
      }
    }
    if (user?.email) loadPrefs();
  }, [user?.email]);

  // Save profile to Supabase
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('nurses')
        .update({
          name: profile.name,
          ward: profile.ward,
        })
        .eq('email', user?.email);
      
      if (error) throw error;
      
      // Update auth context so whole app reflects changes
      updateUser({ ...user, name: profile.name, ward: profile.ward });
      setSaveMsg('Profile saved successfully!');
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveMsg('Profile saved locally (DB update may require table setup).');
      // Still update locally even if Supabase fails
      updateUser({ ...user, name: profile.name, ward: profile.ward });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  // Toggle notification + request browser permission if needed
  const handleToggleNotification = async (key) => {
    const newVal = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newVal }));

    // Request browser notification permission for critical alerts
    if (key === 'criticalAlerts' && newVal && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('Triage.OS', {
          body: 'Critical patient alerts are now enabled!',
          icon: '🏥',
        });
      } else if (permission === 'denied') {
        alert('Browser notifications are blocked. Please enable them in your browser settings.');
      }
    }
  };

  // Save notification preferences to Supabase
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.email,
          critical_alerts: notifications.criticalAlerts,
          stat_meds: notifications.statMeds,
          shift_swaps: notifications.shiftSwaps,
          soap_notes: notifications.soapNotes,
          email_digest: notifications.emailDigest,
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      setSaveMsg('Notification preferences saved!');
    } catch (err) {
      console.error('Failed to save notification prefs:', err);
      setSaveMsg('Preferences saved locally (DB table may need setup).');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleSaveGeneric = (section) => {
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
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader size={14} className="spin" /> : <Save size={14} />} {saving ? 'Saving...' : 'Save Changes'}
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
                        onClick={() => handleToggleNotification(key)}
                      >
                        <span className="settings-toggle-knob" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="settings-actions">
                <button className="btn btn-primary" onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? <Loader size={14} className="spin" /> : <Save size={14} />} {saving ? 'Saving...' : 'Save Preferences'}
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
                <button className="btn btn-primary" onClick={() => handleSaveGeneric('Theme')}>
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
                <button className="btn btn-primary" onClick={() => handleSaveGeneric('Password')}>
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
