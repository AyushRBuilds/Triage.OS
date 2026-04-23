import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../api/supabaseClient';
import { User, Lock, Mail, Activity, ArrowRight, ChevronLeft } from 'lucide-react';
import { toast } from './Toast';
import './LoginPage.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'signup') {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [location.search]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Mock sign up by inserting into nurses table
        const { data, error } = await supabase.from('nurses').insert([{
          name: formData.name,
          email: formData.email,
          role: 'Staff Nurse',
          initials: formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'UN'
        }]).select().single();
        
        if (error) throw error;
        
        login({
          id: data.id,
          uid: data.id,
          email: data.email,
          name: data.name,
          role: 'nurse',
          initials: data.initials,
          ward: data.ward || 'General Ward'
        });
        toast.success('Account created successfully!');
        navigate('/nurse/dashboard');
      } else {
        // Mock sign in by querying nurses table by email
        const { data, error } = await supabase.from('nurses').select('*').eq('email', formData.email).single();
        
        if (error || !data) {
          throw new Error('User not found. Try the demo accounts!');
        }
        
        login({
          id: data.id,
          uid: data.id,
          email: data.email,
          name: data.name,
          role: 'nurse',
          initials: data.initials,
          ward: data.ward
        });
        toast.success(`Welcome back, ${data.name}!`);
        navigate('/nurse/dashboard');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (roleType, emailOverride = null) => {
    setLoading(true);
    try {
      if (roleType === 'nurse' && emailOverride) {
        const { data, error } = await supabase.from('nurses').select('*').eq('email', emailOverride).single();
        if (data) {
          login({
            id: data.id,
            uid: data.id,
            email: data.email,
            name: data.name,
            role: 'nurse',
            initials: data.initials,
            ward: data.ward
          });
          toast.success(`Logged in as Demo ${data.name}`);
          navigate('/nurse/dashboard');
        } else {
          toast.error('Demo nurse not found in database.');
        }
      } else if (roleType === 'admin') {
        login({
          id: 'admin-demo', uid: 'admin-demo', email: 'admin@triage.os',
          name: 'Hospital Admin', role: 'admin', initials: 'AD', ward: 'All Wards'
        });
        toast.success('Logged in as Admin');
        navigate('/admin/dashboard');
      } else if (roleType === 'doctor') {
        login({
          id: 'doctor-demo', uid: 'doctor-demo', email: 'doctor@triage.os',
          name: 'Dr. Sharma', role: 'doctor', initials: 'DS', ward: 'ICU Ward 3'
        });
        toast.success('Logged in as Doctor');
        navigate('/doctor/dashboard');
      }
    } catch (e) {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <button 
        onClick={() => navigate('/')} 
        className="btn btn-ghost" 
        style={{ position: 'absolute', top: 32, left: 32, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', zIndex: 10 }}
      >
        <ChevronLeft size={20} />
        Back to Home
      </button>
      <div className="login-container card animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <h2 style={{ fontWeight: 900, letterSpacing: '-1px', fontSize: '32px' }}>triage<span style={{ color: 'var(--green-primary)' }}>.os</span></h2>
          </div>
          <p className="text-body">{isSignUp ? 'Create your account' : 'Sign in to your account'}</p>
        </div>

        <form onSubmit={handleAuth} className="login-form">
          {isSignUp && (
            <div className="login-field">
              <label>Full Name</label>
              <div className="login-input-wrap">
                <User size={18} />
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <div className="login-field">
            <label>Email Address</label>
            <div className="login-input-wrap">
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="email@triage.os" 
                required 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="login-field">
            <label>Password</label>
            <div className="login-input-wrap">
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="login-toggle">
          <span className="text-body">
            {isSignUp ? 'Already have an account?' : 'Need an account?'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <div className="login-divider">
          <span>or use demo accounts</span>
        </div>

        <div className="demo-accounts">
          <button className="demo-btn nurse1" onClick={() => loginAsDemo('nurse', 'priya@triage.os')}>
            <div className="demo-avatar">PM</div>
            <div className="demo-info">
              <span>Nurse 1</span>
              <small>Priya Mehta</small>
            </div>
          </button>

          <button className="demo-btn nurse2" onClick={() => loginAsDemo('nurse', 'kavita@triage.os')}>
            <div className="demo-avatar" style={{background: 'var(--risk-p2)'}}>KR</div>
            <div className="demo-info">
              <span>Nurse 2</span>
              <small>Kavita Rao</small>
            </div>
          </button>

          <button className="demo-btn admin" onClick={() => loginAsDemo('admin')}>
            <div className="demo-avatar" style={{background: 'var(--text-main)'}}>AD</div>
            <div className="demo-info">
              <span>Admin</span>
              <small>Full Access</small>
            </div>
          </button>

          <button className="demo-btn doctor" onClick={() => loginAsDemo('doctor')}>
            <div className="demo-avatar" style={{background: '#3B82F6'}}>DR</div>
            <div className="demo-info">
              <span>Doctor</span>
              <small>Dr. Sharma</small>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
