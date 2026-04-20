import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Predefined dummy users
const USERS = [
  { email: 'nurse@test.com', password: '1234', name: 'Priya Mehta', role: 'nurse', initials: 'PM', ward: 'ICU Ward 3' },
  { email: 'doctor@test.com', password: '1234', name: 'Dr. Anil Singh', role: 'doctor', initials: 'AS', ward: 'ICU Ward 3' },
  { email: 'admin@test.com', password: '1234', name: 'Kavita Rao', role: 'admin', initials: 'KR', ward: 'Hospital Admin' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('triage_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('triage_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('triage_user');
    }
  }, [user]);

  const login = (email, password) => {
    const found = USERS.find(
      (u) => u.email === email.toLowerCase() && u.password === password
    );
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return { success: true, user: userData };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
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
