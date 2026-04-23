import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('triage_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = (userData) => {
    // Save to localStorage so it persists across reloads
    localStorage.setItem('triage_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('triage_user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const nu = { ...prev, ...updatedData };
      localStorage.setItem('triage_user', JSON.stringify(nu));
      return nu;
    });
  };

  const switchRole = (role) => {
    const roleDefaults = {
      nurse: { name: 'Ward Nurse', initials: 'WN', ward: 'ICU Ward 3' },
      doctor: { name: 'Dr. Sharma', initials: 'DS', ward: 'ICU Ward 3' },
      admin: { name: 'Admin User', initials: 'AU', ward: 'Hospital Admin' },
    };
    updateUser({ role, ...(roleDefaults[role] || {}) });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, switchRole, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
