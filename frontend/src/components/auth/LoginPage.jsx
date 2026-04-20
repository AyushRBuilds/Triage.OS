import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const result = login(email, password);
    setIsLoading(false);

    if (result.success) {
      const dashboardMap = {
        nurse: '/nurse/dashboard',
        doctor: '/doctor/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(dashboardMap[result.user.role] || '/');
    } else {
      setError(result.error);
    }
  };

  const quickLogin = (preset) => {
    setEmail(preset.email);
    setPassword(preset.password);
  };

  return (
    <div className="login-page" id="login-page">
      <div className="login-bg">
        <div className="login-dot-grid" />
        <div className="login-glow" />
      </div>

      <div className="login-container">
        {/* Left — Branding */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <path d="M16 6v20M6 16h20" stroke="#8FD14F" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="login-title">
            triage<span className="login-title-accent">.os</span>
          </h1>
          <p className="login-subtitle">The nervous system of the ward.</p>
          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-dot" />
              Real-time patient vitals monitoring
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              AI-powered SOAP note generation
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              Smart task & shift management
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="login-form-panel">
          <div className="login-form-container card">
            <h2 className="login-form-title">Sign In</h2>
            <p className="text-body" style={{ marginBottom: 24 }}>
              Enter your credentials to access the ward
            </p>

            {error && (
              <div className="login-error animate-fade-in">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label className="text-label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="nurse@test.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  id="login-email"
                />
              </div>

              <div className="login-field">
                <label className="text-label">Password</label>
                <div className="login-password-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    id="login-password"
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
                id="login-submit"
              >
                {isLoading ? (
                  <span className="login-spinner" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Quick login */}
            <div className="login-quick">
              <span className="text-label">Quick Login</span>
              <div className="login-quick-btns">
                <button
                  type="button"
                  className="login-quick-btn"
                  onClick={() => quickLogin({ email: 'nurse@test.com', password: '1234' })}
                >
                  👩‍⚕️ Nurse
                </button>
                <button
                  type="button"
                  className="login-quick-btn"
                  onClick={() => quickLogin({ email: 'doctor@test.com', password: '1234' })}
                >
                  🩺 Doctor
                </button>
                <button
                  type="button"
                  className="login-quick-btn"
                  onClick={() => quickLogin({ email: 'admin@test.com', password: '1234' })}
                >
                  🛡️ Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
