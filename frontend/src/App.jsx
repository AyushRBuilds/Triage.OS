import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import VoiceAssistant from './components/layout/FloatingChat';
import LoginPage from './components/auth/LoginPage';
import SignUpPage from './components/auth/SignUpPage';
import LandingPage from './components/LandingPage';
import NurseDashboard from './components/dashboards/NurseDashboard';
import DoctorDashboard from './components/dashboards/DoctorDashboard';
import AdminDashboardPage from './components/dashboards/AdminDashboardPage';
import VitalsPage from './components/VitalsPage';
import SOAPNoteViewer from './components/SOAPNoteViewer';
import KanbanBoard from './components/KanbanBoard';
import ShiftSwapPanel from './components/ShiftSwapPanel';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/SettingsPage';
import NurseChat from './components/NurseChat';
import PatientDashboard from './components/PatientDashboard';
import WardOverview from './components/WardOverview';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-content">
          {children}
        </div>
      </div>
      <VoiceAssistant />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Landing and login pages don't use shell
  if (location.pathname === '/') {
    return <LandingPage />;
  }
  if (location.pathname === '/login') {
    if (isAuthenticated) {
      const dashboardMap = { nurse: '/nurse/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' };
      return <Navigate to={dashboardMap[user?.role] || '/nurse/dashboard'} replace />;
    }
    return <LoginPage />;
  }
  if (location.pathname === '/signup') {
    if (isAuthenticated) {
      const dashboardMap = { nurse: '/nurse/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' };
      return <Navigate to={dashboardMap[user?.role] || '/nurse/dashboard'} replace />;
    }
    return <SignUpPage />;
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <Routes>
          {/* Role dashboards */}
          <Route path="/nurse/dashboard" element={<NurseDashboard />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

          {/* Feature pages */}
          <Route path="/vitals" element={<VitalsPage />} />
          <Route path="/soap-notes" element={<SOAPNoteViewer />} />
          <Route path="/tasks" element={<KanbanBoard />} />
          <Route path="/chat" element={<NurseChat />} />
          <Route path="/shift-swap" element={<ShiftSwapPanel />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/ward-overview" element={<WardOverview />} />

          {/* Admin specific */}
          <Route path="/admin/patients" element={<AdminDashboard />} />
          <Route path="/admin/staff" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminDashboardPage />} />
          <Route path="/patients" element={<PatientDashboard />} />

          {/* Fallback */}
          <Route path="*" element={
            <Navigate to={
              user?.role === 'doctor' ? '/doctor/dashboard' :
              user?.role === 'admin' ? '/admin/dashboard' :
              '/nurse/dashboard'
            } replace />
          } />
        </Routes>
      </AppShell>
    </ProtectedRoute>
  );
}
