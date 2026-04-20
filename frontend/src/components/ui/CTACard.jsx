import { MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ui.css';

export default function CTACard() {
  const navigate = useNavigate();

  return (
    <div className="cta-card" onClick={() => navigate('/chat')}>
      {/* Organic blob shapes */}
      <div className="cta-blob blob-1" />
      <div className="cta-blob blob-2" />
      <div className="cta-blob blob-3" />
      <div className="cta-blob blob-4" />

      <div className="cta-content">
        <MessageCircle size={28} strokeWidth={1.8} />
        <h3 className="cta-title">Ask NurseChat</h3>
        <p className="cta-desc">Get instant answers from live patient data</p>
        <button className="btn btn-on-dark btn-sm cta-btn">
          Ask Now <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
