import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Activity,
  Mic,
  CheckSquare,
  ArrowLeftRight,
  Settings,
  Users,
  ClipboardList,
  BarChart3,
  Map,
  LogOut,
} from 'lucide-react';
import './Sidebar.css';

const roleNavItems = {
  nurse: [
    { to: '/nurse/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },

    { to: '/soap-notes', icon: Mic, label: 'SOAP Notes' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/shift-swap', icon: ArrowLeftRight, label: 'Shift Swap' },
  ],
  doctor: [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },

    { to: '/soap-notes', icon: Mic, label: 'SOAP Notes' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/ward-overview', icon: Map, label: 'Ward Overview' },
    { to: '/admin/staff', icon: ClipboardList, label: 'Staff' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'nurse';
  const navItems = roleNavItems[role] || roleNavItems.nurse;

  return (
    <aside className="sidebar" id="sidebar-nav">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
        <span style={{ fontWeight: 900, letterSpacing: '-1px', fontSize: '18px', color: 'white' }}>
          t<span style={{ color: 'var(--green-primary)' }}>.os</span>
        </span>
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
        <button
          className="sidebar-item"
          title="Sign Out"
          onClick={() => { logout(); navigate('/login'); }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', padding: 0 }}
        >
          <LogOut size={22} strokeWidth={1.8} />
        </button>
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
      </div>
    </aside>
  );
}
