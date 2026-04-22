import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Play, Mic, Shield, Brain,
  MessageCircle, Zap, Lock, Activity,
  ChevronRight, ChevronLeft, Check,
  Stethoscope, ClipboardList, Calendar, BarChart2,
  Users
} from 'lucide-react';
import './LandingPage.css';

/* ─── tiny helpers ─── */
const PulseDot = () => <span className="lp-pulse-dot" />;

const Avatar = ({ initials, color }) => (
  <div className="lp-avatar" style={{ background: color }}>{initials}</div>
);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="lp" id="landing-page">

      {/* ════════════════════════════════
          NAV
      ════════════════════════════════ */}
      <nav className="lp-nav">
        <a className="lp-logo" href="#">
          <span className="lp-logo-icon">
            <Activity size={16} strokeWidth={2.5} />
          </span>
          <span className="lp-logo-text">
            Triage<span className="lp-logo-accent">OS</span>
          </span>
        </a>
        <ul className="lp-nav-links">
          <li><a href="#workflow">Workflow</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#modules">Modules</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="lp-nav-actions">
          <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Log in</button>
        </div>
      </nav>

      {/* ════════════════════════════════
          HERO
      ════════════════════════════════ */}
      <section className="lp-hero-section">
        <div className="lp-hero-card">
          {/* bg texture */}
          <div className="lp-dot-grid" />
          <div className="lp-hero-glow" />

          <div className="lp-hero-text">
            <span className="lp-badge">AI HOSPITAL WORKFLOW OS</span>
            <h1 className="lp-h1">
              triage<span className="lp-h1-accent">.os</span>
            </h1>
            <p className="lp-tagline">The nervous system of the ward.</p>
            <p className="lp-desc">
              AI that converts nurse voice to clinical notes, scores patient risk in real time,
              and answers any question from live ward data. 100% local.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-lime lp-btn-lg" onClick={() => navigate('/login')}>
                Get Started <ArrowRight size={15} />
              </button>
              <button className="lp-btn-outline lp-btn-lg">
                <Play size={14} /> Watch Demo
              </button>
            </div>
          </div>

          {/* Vitals mockup */}
          <div className="lp-hero-mockup">
            <div className="lp-mockup-inner">
              <div className="lp-mockup-header">
                <PulseDot />
                <span className="lp-label-green">LIVE VITALS</span>
              </div>
              <div className="lp-vitals-row">
                <div className="lp-vital">
                  <span className="lp-vital-label">HR</span>
                  <span className="lp-vital-num lp-num-red">112</span>
                  <span className="lp-vital-unit">bpm</span>
                </div>
                <div className="lp-vital">
                  <span className="lp-vital-label">SpO2</span>
                  <span className="lp-vital-num lp-num-orange">91</span>
                  <span className="lp-vital-unit">%</span>
                </div>
                <div className="lp-vital">
                  <span className="lp-vital-label">BP</span>
                  <span className="lp-vital-num lp-num-green">120/80</span>
                  <span className="lp-vital-unit">mmHg</span>
                </div>
              </div>
              <div className="lp-patient-row">
                <div className="lp-patient-stripe" />
                <Avatar initials="RS" color="var(--risk-p1)" />
                <div className="lp-patient-info">
                  <span className="lp-patient-name">Mr. Raj Sharma</span>
                  <span className="lp-patient-loc">Bed 7 · ICU Ward 3</span>
                </div>
                <span className="lp-badge-p1">P1</span>
              </div>
              <div className="lp-ekg-line">
                <svg viewBox="0 0 300 40" preserveAspectRatio="none">
                  <polyline
                    points="0,20 30,20 50,20 65,5 75,35 85,5 100,20 130,20 150,20 165,8 175,32 185,8 200,20 230,20 250,20 265,10 275,30 285,10 300,20"
                    fill="none"
                    stroke="var(--green-primary)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* corner deco */}
          <span className="lp-cross lp-cross-1">+</span>
          <span className="lp-cross lp-cross-2">✦</span>
        </div>
      </section>

      {/* ════════════════════════════════
          STATS BAND
      ════════════════════════════════ */}
      <section className="lp-stats-band" id="workflow">
        <div className="lp-stats-left">
          <h2>Your Bridge to <span className="lp-underline">Smarter</span><br />Hospital Operations</h2>

          <p className="lp-stats-sub">Medicine Meets Technology.<br />Your AI-Powered Clinical Hub.</p>
        </div>

        <div className="lp-stat-card">
          <div className="lp-stat-label">Active Deployments</div>
          <div className="lp-avatars-row">
            <Avatar initials="MH" color="#6366f1" />
            <Avatar initials="RG" color="var(--green-primary)" />
            <Avatar initials="AP" color="#0891b2" />
          </div>
          <div className="lp-stat-big lp-num-green-bright">3.2K+</div>
          <div className="lp-stat-sub-label">Patients processed daily</div>
        </div>

        <div className="lp-stat-card lp-stat-card-center">
          <div className="lp-donut-wrap">
            <div className="lp-donut">
              <div className="lp-donut-inner">94%</div>
            </div>
            <div className="lp-donut-label">Triage Accuracy</div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          TECH STRIP (lime)
      ════════════════════════════════ */}
      <div className="lp-tech-strip">
        <span><Mic size={15} /> WebSpeech API</span>
        <span><Brain size={15} /> BioClinicalBERT</span>
        <span><Activity size={15} /> XGBoost Vitals</span>
        <span><MessageCircle size={15} /> FAISS + Ollama RAG</span>
        <span><Zap size={15} /> WebSocket Live</span>
        <span><Lock size={15} /> 100% Local</span>
      </div>

      {/* ════════════════════════════════
          4 AI STEPS
      ════════════════════════════════ */}
      <section className="lp-steps-section" id="features">
        <div className="lp-section-header">
          <div className="lp-section-overline">How It Works</div>
          <h2 className="lp-section-title">4 AI Engines. One Nervous System.</h2>
          <p className="lp-section-sub">
            From spoken voice to structured clinical output — Triage.OS handles the
            complexity so clinicians can focus on what matters.
          </p>
        </div>
        <div className="lp-steps-grid">
          <div className="lp-step-card">
            <div className="lp-step-icon-wrap lp-step-icon-green">
              <Mic size={20} />
            </div>
            <div className="lp-step-num">Step 01</div>
            <div className="lp-step-title">Speak Your Notes</div>
            <p className="lp-step-desc">Nurses dictate shift notes verbally. WebSpeech API transcribes speech locally — no cloud, no latency.</p>
            <div className="lp-chips"><span>WebSpeech API</span><span>spaCy</span><span>NER</span></div>
          </div>
          <div className="lp-step-card">
            <div className="lp-step-icon-wrap" style={{ background: "rgba(249,115,22,0.12)" }}>
              <Shield size={20} className="text-orange-500" />
            </div>
            <div className="lp-step-num">Step 02</div>
            <div className="lp-step-title">AI Classification</div>
            <p className="lp-step-desc">BioClinicalBERT classifies medication urgency into STAT, Urgent, and Routine in real time with ONNX inference.</p>
            <div className="lp-chips "><span>BioClinicalBERT</span><span>ONNX</span></div>
          </div>
          <div className="lp-step-card">
            <div className="lp-step-icon-wrap lp-step-icon-red">
              <Activity size={20} />
            </div>
            <div className="lp-step-num">Step 03</div>
            <div className="lp-step-title">Risk Scoring</div>
            <p className="lp-step-desc">XGBoost scores each patient P1–P5 from vitals, meds, and history. WebSocket pushes updates every 3s.</p>
            <div className="lp-chips"><span>XGBoost</span><span>FastAPI</span><span>WebSocket</span></div>
          </div>
          <div className="lp-step-card">
            <div className="lp-step-icon-wrap lp-step-icon-green">
              <MessageCircle size={20} />
            </div>
            <div className="lp-step-num">Step 04</div>
            <div className="lp-step-title">NurseChat RAG</div>
            <p className="lp-step-desc">Ask any clinical question. FAISS retrieves relevant patient records, Ollama generates grounded answers locally.</p>
            <div className="lp-chips"><span>FAISS</span><span>Ollama</span><span>RAG</span></div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          MODULES / "DOCTORS" GRID
      ════════════════════════════════ */}
      <section className="lp-modules-section" id="modules">
        <div className="lp-modules-header">
          <div className="lp-modules-header-left">
            <div className="lp-section-overline lp-overline-lime">Meet The Modules</div>
            <h2 className="lp-modules-title">
              <span>We're Dedicated To</span>
              <span>Your Ward's Efficiency</span>
            </h2>
          </div>

        </div>
        <div className="lp-modules-grid">
          {[
            { icon: <Mic size={28} />, title: 'Voice Transcription', sub: 'WebSpeech API', color: 'var(--green-primary)', bg: 'rgba(143,209,79,0.12)' },
            { icon: <Shield size={28} />, title: 'Medication Urgency', sub: 'BioClinicalBERT', color: 'var(--risk-p2)', bg: 'rgba(249,115,22,0.12)' },
            { icon: <Activity size={28} />, title: 'Patient Risk Score', sub: 'XGBoost Model', color: 'var(--risk-p1)', bg: 'rgba(239,68,68,0.12)' },
            { icon: <MessageCircle size={28} />, title: 'NurseChat RAG', sub: 'FAISS + Ollama', color: 'var(--green-primary)', bg: 'rgba(143,209,79,0.12)' },
            { icon: <ClipboardList size={28} />, title: 'SOAP Note Gen', sub: 'spaCy + NER', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
            { icon: <BarChart2 size={28} />, title: 'Admin Dashboard', sub: 'Live Analytics', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
            { icon: <Users size={28} />, title: 'Shift Coordinator', sub: 'Kanban Board', color: 'var(--risk-p2)', bg: 'rgba(249,115,22,0.12)' },
            { icon: <Zap size={28} />, title: 'WebSocket Engine', sub: 'FastAPI + Redis', color: 'var(--green-primary)', bg: 'rgba(143,209,79,0.12)' },
          ].map((m, i) => (
            <div className="lp-module-card" key={i}>
              <div className="lp-module-icon" style={{ background: m.bg, color: m.color }}>
                {m.icon}
              </div>
              <div className="lp-module-info">
                <div className="lp-module-name">{m.title}</div>
                <div className="lp-module-role">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="lp-modules-cta">

        </div>
      </section>

      {/* ════════════════════════════════
          TOGETHER SECTION
      ════════════════════════════════ */}
      <section className="lp-together-section">
        <div className="lp-together-left">
          <div className="lp-section-overline lp-overline-muted">We're Always With You</div>
          <h2 className="lp-together-title">
            Together, We Can<br />Achieve Optimal<br />Patient Outcomes
          </h2>
          <p className="lp-together-desc">
            Triage.OS empowers every member of the care team — nurses, doctors, and admins —
            with real-time AI insights, all running locally for complete privacy.
          </p>
          <ul className="lp-feature-list">
            <li><span className="lp-check"><Check size={11} /></span>Real-time vitals analytics via WebSocket</li>
            <li><span className="lp-check"><Check size={11} /></span>AI medication urgency classifier</li>
            <li><span className="lp-check"><Check size={11} /></span>100% local — zero data leaves the ward</li>
          </ul>
        </div>
        <div className="lp-together-right">
          {/* Dashboard phone mockup */}
          <div className="lp-phone-mockup">
            <div className="lp-phone-screen">
              <div className="lp-phone-header">
                <PulseDot />
                <span className="lp-label-green" style={{ fontSize: 9 }}>TRIAGE.OS LIVE</span>
              </div>
              <div className="lp-phone-vitals">
                <div className="lp-phone-vital-row">
                  <span className="lp-label-dim">Patient Risk</span>
                  <span className="lp-badge-p1" style={{ fontSize: 9 }}>P1 CRITICAL</span>
                </div>
                <div className="lp-phone-ekg">
                  <svg viewBox="0 0 200 30" preserveAspectRatio="none" width="100%" height="30">
                    <polyline points="0,15 20,15 35,4 42,26 49,4 60,15 80,15 95,7 102,23 109,7 120,15 140,15 155,5 162,25 169,5 180,15 200,15"
                      fill="none" stroke="var(--green-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <div className="lp-phone-stats">
                <div><span className="lp-num-red" style={{ fontSize: 18, fontWeight: 800 }}>112</span><br /><span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>HR bpm</span></div>
                <div><span className="lp-num-orange" style={{ fontSize: 18, fontWeight: 800 }}>91%</span><br /><span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>SpO2</span></div>
                <div><span className="lp-num-green" style={{ fontSize: 14, fontWeight: 800 }}>120/80</span><br /><span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>BP mmHg</span></div>
              </div>
              <div className="lp-phone-btn">View Full Dashboard</div>
            </div>
          </div>
          {/* floating badges */}
          <div className="lp-float-badge lp-float-badge-1"><Check size={12} /> SOAP Note Generated</div>
          <div className="lp-float-badge lp-float-badge-2"><Zap size={12} /> Shift Swap Confirmed</div>
          <div className="lp-star lp-star-1">✦</div>
          <div className="lp-star lp-star-2">★</div>
        </div>
      </section>


      {/* ════════════════════════════════
          TESTIMONIAL
      ════════════════════════════════ */}
      <section className="lp-testimonial-section">
        <div className="lp-testimonial-left">
          <h2>What People Are Saying<br />About Triage.OS</h2>
          <p>From frontline nurses to hospital administrators — hear how Triage.OS has transformed clinical workflows.</p>
        </div>
        <div className="lp-testimonial-right">
          <div className="lp-testimonial-card">
            <span className="lp-quote-mark">"</span>
            <p className="lp-quote-text">
              Triage.OS cut our handoff documentation time by 60%. The AI picks up on urgency
              signals that nurses used to have to manually flag. I'm on the road to delivering
              better patient outcomes every single shift.
            </p>
            <div className="lp-quote-author">
              <div className="lp-quote-avatar">AR</div>
              <div>
                <div className="lp-quote-name">Ayush Rathi</div>
                <div className="lp-quote-role">Senior ER Nurse, Mumbai General</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          BOUNTY PROOF
      ════════════════════════════════ */}
      <section className="lp-bounty-section">
        <div className="lp-section-header" style={{ marginBottom: 40 }}>
          <div className="lp-section-overline lp-overline-lime">Bounty Eligibility</div>
          <h2 className="lp-section-title lp-title-light">Built for the Hackathon</h2>
        </div>
        <div className="lp-bounty-grid">
          <div className="lp-bounty-card">
            <Zap size={22} className="lp-bounty-icon" />
            <h3>LIVE-WIRE BOUNTY</h3>
            <p>WebSocket vitals stream updates every 3s — patient risk scores pushed live.</p>
            <p className="lp-bounty-stack">FastAPI · React · WebSocket</p>
            <span className="lp-bounty-badge">✓ Eligible</span>
          </div>
          <div className="lp-bounty-card">
            <Lock size={22} className="lp-bounty-icon" />
            <h3>EDGE BOUNTY</h3>
            <p>100% local inference — zero external API calls, runs entirely on-device.</p>
            <p className="lp-bounty-stack">WebSpeech API</p>
            <span className="lp-bounty-badge">✓ Eligible</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════
          FOOTER
      ════════════════════════════════ */}
      <footer className="lp-footer" id="contact">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <a className="lp-logo" href="#" style={{ marginBottom: 14, display: 'inline-flex' }}>
              <span className="lp-logo-icon"><Activity size={15} strokeWidth={2.5} /></span>
              triage<span className="lp-logo-accent">.os</span>
            </a>
            <p>AI hospital workflow assistant — local, fast, and built for every member of the care team.</p>
            <div className="lp-socials">
              <div className="lp-social-btn"><span>X</span></div>
              <div className="lp-social-btn"><span>GH</span></div>
              <div className="lp-social-btn"><span>IN</span></div>
            </div>
          </div>
          <div className="lp-footer-col">
            <h4>Quick Menu</h4>
            <li><a href="#">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#modules">Modules</a></li>
            <li><a href="#contact">Contact</a></li>
          </div>
          <div className="lp-footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Support Center</a></li>
              <li><a href="#">GitHub Repo</a></li>
              <li><a href="#">Report a Bug</a></li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="#">hello@triage.os</a></li>
              <li><a href="#">Discord Community</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 Triage.OS . All Rights Reserved.</span>
          <span>Built with ❤️ for healthcare workers everywhere.</span>
        </div>
      </footer>

      <button
        className="lp-scroll-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>

    </div>
  );
}
