import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Activity,
  Mic,
  CheckSquare,
  ArrowLeftRight,
  Shield,
  Settings,
  LogOut,
  Users,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import './Sidebar.css';

const roleNavItems = {
  nurse: [
    { to: '/nurse/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/vitals', icon: Activity, label: 'Vitals' },
    { to: '/soap-notes', icon: Mic, label: 'SOAP Notes' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/shift-swap', icon: ArrowLeftRight, label: 'Shift Swap' },
  ],
  doctor: [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/vitals', icon: Activity, label: 'Vitals' },
    { to: '/soap-notes', icon: Mic, label: 'SOAP Notes' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/shift-swap', icon: ArrowLeftRight, label: 'Shift Swap' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/admin/staff', icon: ClipboardList, label: 'Staff' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const role = user?.role || 'nurse';
  const navItems = roleNavItems[role] || roleNavItems.nurse;

  return (
    <aside className="sidebar" id="sidebar-nav">
      {/* Logo */}
      <div className="sidebar-logo">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <path d="M16 6v20M6 16h20" stroke="#8FD14F" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Role badge */}
      <div className="sidebar-role-badge">
        {role.charAt(0).toUpperCase()}
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''}`
            }
            title={item.label}
          >
            <span className="sidebar-indicator" />
            <item.icon size={22} strokeWidth={1.8} />
          </NavLink>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? 'active' : ''}`
          }
          title="Settings"
        >
          <span className="sidebar-indicator" />
          <Settings size={22} strokeWidth={1.8} />
        </NavLink>
        <button className="sidebar-item sidebar-logout" title="Logout" onClick={logout}>
          <span className="sidebar-indicator" />
          <LogOut size={22} strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
