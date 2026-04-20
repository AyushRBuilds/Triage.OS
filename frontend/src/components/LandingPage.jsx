import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Mic, Shield, Brain, MessageCircle, Zap, Lock, Activity } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing" id="landing-page">
      {/* Section 1 — Hero */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="landing-dot-grid" />
          <div className="landing-glow" />
        </div>
        <div className="landing-hero-content">
          <div className="landing-hero-left">
            <span className="landing-overline badge badge-available">AI HOSPITAL WORKFLOW OS</span>
            <h1 className="landing-h1">
              triage<span className="landing-h1-accent">.os</span>
            </h1>
            <p className="landing-tagline">The nervous system of the ward.</p>
            <p className="landing-desc">
              AI that converts nurse voice to clinical notes, scores patient risk in real time,
              and answers any question from live ward data. 100% local.
            </p>
            <div className="landing-ctas">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                Enter Dashboard <ArrowRight size={16} />
              </button>
              <button className="btn btn-secondary btn-lg">
                <Play size={16} /> Watch Demo
              </button>
            </div>
          </div>
          <div className="landing-hero-right">
            {/* Mini dashboard mockup */}
            <div className="landing-mockup card">
              <div className="landing-mockup-header">
                <span className="pulse-dot" />
                <span className="text-label" style={{ color: 'var(--green-text)' }}>LIVE VITALS</span>
              </div>
              <div className="landing-mockup-vitals">
                <div className="landing-vital-mini">
                  <span className="text-label">HR</span>
                  <span className="landing-vital-num" style={{ color: 'var(--status-critical)' }}>112</span>
                  <span className="text-unit">bpm</span>
                </div>
                <div className="landing-vital-mini">
                  <span className="text-label">SpO2</span>
                  <span className="landing-vital-num" style={{ color: 'var(--status-warning)' }}>91</span>
                  <span className="text-unit">%</span>
                </div>
                <div className="landing-vital-mini">
                  <span className="text-label">BP</span>
                  <span className="landing-vital-num" style={{ color: 'var(--status-normal)' }}>120/80</span>
                  <span className="text-unit">mmHg</span>
                </div>
              </div>
              <div className="landing-mockup-patient">
                <div style={{ borderLeft: '3px solid var(--risk-p1)', paddingLeft: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--risk-p1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>RS</div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Mr. Raj Sharma</span>
                    <span className="text-timestamp" style={{ display: 'block' }}>Bed 7 · ICU Ward 3</span>
                  </div>
                  <span className="badge badge-p1" style={{ marginLeft: 'auto' }}>P1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 — Problem Stats */}
      <section className="landing-stats-section">
        <div className="landing-stats-grid">
          <div className="landing-stat animate-slide-up">
            <span className="landing-stat-num">67%</span>
            <span className="landing-stat-label">of nursing time is administrative</span>
          </div>
          <div className="landing-stat animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="landing-stat-num">4.3 hrs</span>
            <span className="landing-stat-label">lost to documentation per shift</span>
          </div>
          <div className="landing-stat animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="landing-stat-num">1 in 5</span>
            <span className="landing-stat-label">handoffs miss critical info</span>
          </div>
        </div>
      </section>

      {/* Section 3 — AI Engines */}
      <section className="landing-features-section">
        <h2 className="landing-section-title">Four AI systems. One nervous system.</h2>
        <div className="landing-features-grid">
          <div className="landing-feature-card card">
            <div className="landing-feature-stripe" style={{ background: 'var(--green-primary)' }} />
            <Mic size={36} style={{ color: 'var(--green-primary)' }} />
            <h3>Voice → SOAP Notes</h3>
            <p className="text-body">Speak naturally. Whisper transcribes, spaCy extracts entities, and structured SOAP notes appear in seconds.</p>
            <div className="landing-tech-chips">
              <span className="landing-chip">Whisper</span>
              <span className="landing-chip">spaCy</span>
              <span className="landing-chip">NER</span>
            </div>
          </div>
          <div className="landing-feature-card card">
            <div className="landing-feature-stripe" style={{ background: 'var(--risk-p2)' }} />
            <Shield size={36} style={{ color: 'var(--risk-p2)' }} />
            <h3>Medication Urgency</h3>
            <p className="text-body">BioClinicalBERT classifies medication urgency into STAT, Urgent, and Routine in real time.</p>
            <div className="landing-tech-chips">
              <span className="landing-chip">BioClinicalBERT</span>
              <span className="landing-chip">ONNX</span>
            </div>
          </div>
          <div className="landing-feature-card card">
            <div className="landing-feature-stripe" style={{ background: 'var(--risk-p1)' }} />
            <Activity size={36} style={{ color: 'var(--risk-p1)' }} />
            <h3>Patient Risk Scoring</h3>
            <p className="text-body">Real-time P1-P5 classification from vitals, meds, and history. WebSocket updates every 3 seconds.</p>
            <div className="landing-tech-chips">
              <span className="landing-chip">XGBoost</span>
              <span className="landing-chip">WebSocket</span>
              <span className="landing-chip">FastAPI</span>
            </div>
          </div>
          <div className="landing-feature-card card">
            <div className="landing-feature-stripe" style={{ background: 'var(--green-primary)' }} />
            <MessageCircle size={36} style={{ color: 'var(--green-primary)' }} />
            <h3>NurseChat RAG</h3>
            <p className="text-body">Ask any question. FAISS retrieves relevant patient data, Ollama generates grounded clinical answers.</p>
            <div className="landing-tech-chips">
              <span className="landing-chip">FAISS</span>
              <span className="landing-chip">Ollama</span>
              <span className="landing-chip">RAG</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 — Dashboard Preview (Dark) */}
      <section className="landing-preview-section">
        <h2 className="landing-section-title" style={{ color: '#fff' }}>This is the ward, live.</h2>
        <p className="landing-preview-sub">Every number updates every 3 seconds.</p>
        <div className="landing-browser-chrome">
          <div className="landing-browser-dots">
            <span /><span /><span />
          </div>
          <div className="landing-browser-url">triage.os/dashboard</div>
        </div>
        <div className="landing-preview-callouts">
          <div className="landing-callout" style={{ left: '10%', top: '20%' }}>
            <span className="landing-callout-num">1</span>
            <span>Live vitals WebSocket</span>
          </div>
          <div className="landing-callout" style={{ right: '15%', top: '30%' }}>
            <span className="landing-callout-num">2</span>
            <span>AI risk score (P1/P2)</span>
          </div>
          <div className="landing-callout" style={{ left: '20%', bottom: '20%' }}>
            <span className="landing-callout-num">3</span>
            <span>SOAP note generation</span>
          </div>
          <div className="landing-callout" style={{ right: '10%', bottom: '15%' }}>
            <span className="landing-callout-num">4</span>
            <span>NurseChat RAG</span>
          </div>
        </div>
      </section>

      {/* Section 5 — Bounty Proof */}
      <section className="landing-bounty-section">
        <div className="landing-bounty-grid">
          <div className="landing-bounty-card card-dark">
            <Zap size={24} style={{ color: 'var(--green-primary)' }} />
            <h3>LIVE-WIRE BOUNTY</h3>
            <p>WebSocket vitals stream updates every 3s</p>
            <p className="text-timestamp" style={{ color: 'var(--text-on-dark-muted)' }}>FastAPI · React · WebSocket</p>
            <span className="landing-bounty-check">✓ Eligible</span>
          </div>
          <div className="landing-bounty-card card-dark">
            <Lock size={24} style={{ color: 'var(--green-primary)' }} />
            <h3>EDGE BOUNTY</h3>
            <p>100% local inference — zero external API calls</p>
            <p className="text-timestamp" style={{ color: 'var(--text-on-dark-muted)' }}>Whisper · FAISS · Ollama</p>
            <span className="landing-bounty-check">✓ Eligible</span>
          </div>
        </div>
      </section>

      {/* Section 6 — Final CTA */}
      <section className="landing-final-cta">
        <div className="cta-blob blob-1" />
        <div className="cta-blob blob-2" />
        <div className="cta-blob blob-3" />
        <div className="cta-blob blob-4" />
        <div className="landing-final-content">
          <h2 className="landing-final-title">
            triage<span style={{ color: 'var(--green-dark)' }}>.os</span>
          </h2>
          <p className="landing-final-sub">The ward doesn't wait.</p>
          <button className="btn btn-on-dark btn-lg" onClick={() => navigate('/dashboard')}>
            Enter Dashboard <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
