import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import VoiceAssistant from './components/layout/FloatingChat';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import NurseDashboard from './components/dashboards/NurseDashboard';
import DoctorDashboard from './components/dashboards/DoctorDashboard';
import AdminDashboardPage from './components/dashboards/AdminDashboardPage';

import SOAPNoteViewer from './components/SOAPNoteViewer';
import KanbanBoard from './components/KanbanBoard';
import ShiftSwapPanel from './components/ShiftSwapPanel';
import AdminDashboard from './components/AdminDashboard';
import SettingsPage from './components/SettingsPage';
import NurseChat from './components/NurseChat';
import PatientDashboard from './components/PatientDashboard';
import ReportsPage from './components/ReportsPage';
import WardOverview from './components/WardOverview';
import SharedReportView from './components/SharedReportView';
import { ToastContainer } from './components/Toast';

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-content">
          {children}
        </div>
        <ToastContainer />
      </div>
      <VoiceAssistant />
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();

  // Show nothing or a global loader while restoring session from localStorage
  if (loading) return null;

  // Landing page doesn't use shell and is public
  if (location.pathname === '/') {
    return !isAuthenticated ? <LandingPage /> : <Navigate to={
      user?.role === 'doctor' ? '/doctor/dashboard' :
      user?.role === 'admin' ? '/admin/dashboard' :
      '/nurse/dashboard'
    } replace />;
  }

  // Login page is public
  if (location.pathname === '/login') {
    return !isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />;
  }

  // Shared Report view is public and standalone
  if (location.pathname.startsWith('/share/report/')) {
    return (
      <>
        <Routes>
          <Route path="/share/report/:patientId" element={<SharedReportView />} />
        </Routes>
        <ToastContainer />
      </>
    );
  }

  // All other routes are protected
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Routes>
        {/* Role dashboards */}
        <Route path="/nurse/dashboard" element={<NurseDashboard />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/* Feature pages */}

        <Route path="/soap-notes" element={<SOAPNoteViewer />} />
        <Route path="/tasks" element={<KanbanBoard />} />
        <Route path="/chat" element={<NurseChat />} />
        <Route path="/shift-swap" element={<ShiftSwapPanel />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/ward-overview" element={
          user?.role === 'admin' ? <WardOverview /> : <Navigate to="/" />
        } />

        {/* Admin specific */}
        <Route path="/admin/patients" element={<AdminDashboard />} />
        <Route path="/admin/staff" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={
          (user?.role === 'admin' || user?.role === 'doctor') ? <ReportsPage /> : <Navigate to="/" />
        } />
        <Route path="/patients" element={<PatientDashboard />} />

        {/* Fallback — go to role dashboard */}
        <Route path="*" element={
          <Navigate to={
            user?.role === 'doctor' ? '/doctor/dashboard' :
            user?.role === 'admin' ? '/admin/dashboard' :
            '/nurse/dashboard'
          } replace />
        } />
      </Routes>
    </AppShell>
  );
}
