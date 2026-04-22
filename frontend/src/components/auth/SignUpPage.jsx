import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle, User, Briefcase, Mail, Lock } from 'lucide-react';
import './LoginPage.css'; // Reuse login styles

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('nurse');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signup(email, password, role, name);
    setIsLoading(false);

    if (result.success) {
      const dashboardMap = {
        nurse: '/nurse/dashboard',
        doctor: '/doctor/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(dashboardMap[role] || '/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-page" id="signup-page">
      <div className="login-bg">
        <div className="login-dot-grid" />
        <div className="login-glow" />
      </div>

      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <path d="M16 6v20M6 16h20" stroke="#8FD14F" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="login-title">
            triage<span className="login-title-accent">.os</span>
          </h1>
          <p className="login-subtitle">Join the medical revolution.</p>
          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-dot" />
              Streamlined medical workflows
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              Collaborative patient care
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              Secure data management
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-container card">
            <h2 className="login-form-title">Create Account</h2>
            <p className="text-body" style={{ marginBottom: 24 }}>
              Register to access the triage platform
            </p>

            {error && (
              <div className="login-error animate-fade-in">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label className="text-label">Full Name</label>
                <div className="input-wrapper">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    className="input has-icon"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="text-label">Email</label>
                <div className="input-wrapper">
                  <Mail size={16} className="field-icon" />
                  <input
                    type="email"
                    className="input has-icon"
                    placeholder="email@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="text-label">Role</label>
                <div className="input-wrapper">
                  <Briefcase size={16} className="field-icon" />
                  <select 
                    className="input has-icon" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    style={{ appearance: 'none' }}
                  >
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="login-field">
                <label className="text-label">Password</label>
                <div className="login-password-wrapper">
                  <Lock size={16} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input has-icon"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`btn btn-primary login-submit ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="login-spinner" />
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>

            <div className="login-footer" style={{ marginTop: 24, textAlign: 'center' }}>
              <span className="text-secondary">Already have an account? </span>
              <Link to="/login" className="text-accent link" style={{ fontWeight: 600 }}>Sign In</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
