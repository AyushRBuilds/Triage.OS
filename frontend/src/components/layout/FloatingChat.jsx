import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, VolumeX, Send, MessageCircle, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage } from '../../api/services';
import './FloatingChat.css';

// Voice command routes
const VOICE_ROUTES = {
  'dashboard': '/nurse/dashboard',
  'vitals': '/vitals',
  'tasks': '/tasks',
  'soap notes': '/soap-notes',
  'soap': '/soap-notes',
  'notes': '/soap-notes',
  'shift swap': '/shift-swap',
  'shifts': '/shift-swap',
  'settings': '/settings',
  'patients': '/patients',
  'chat': '/chat',
  'admin': '/admin/dashboard',
};

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage('system', 'Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      setTranscript(interimTranscript || finalTranscript);
      if (finalTranscript) {
        handleVoiceCommand(finalTranscript.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript('');
  };

  const speak = (text) => {
    if (!voiceEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/<[^>]*>/g, ''));
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, {
      id: `va-${Date.now()}-${Math.random()}`,
      role,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const handleVoiceCommand = async (command) => {
    addMessage('user', command);
    const lowerCmd = command.toLowerCase();

    // Check for navigation commands
    const navPrefix = ['go to', 'open', 'navigate to', 'show me', 'take me to'];
    for (const prefix of navPrefix) {
      if (lowerCmd.startsWith(prefix)) {
        const target = lowerCmd.replace(prefix, '').trim();
        const route = VOICE_ROUTES[target];
        if (route) {
          const msg = `Navigating to ${target}...`;
          addMessage('assistant', msg);
          speak(msg);
          setTimeout(() => navigate(route), 800);
          return;
        }
      }
    }

    // Direct route match
    for (const [key, route] of Object.entries(VOICE_ROUTES)) {
      if (lowerCmd === key) {
        const msg = `Opening ${key}...`;
        addMessage('assistant', msg);
        speak(msg);
        setTimeout(() => navigate(route), 800);
        return;
      }
    }

    // Fallback to chat
    const response = await sendChatMessage(command);
    addMessage('assistant', response.text);
    speak(response.text);
  };

  const handleTextSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;
    setInput('');
    await handleVoiceCommand(messageText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          className="floating-chat-btn va-btn"
          onClick={() => setIsOpen(true)}
          id="voice-assistant-btn"
        >
          <Mic size={24} />
          <span className="floating-chat-pulse" />
        </button>
      )}

      {/* Voice Assistant panel */}
      {isOpen && (
        <div className="floating-chat-panel va-panel animate-fade-in" id="voice-assistant-panel">
          {/* Header */}
          <div className="fc-header va-header">
            <div className="fc-header-left">
              <div className="fc-header-avatar va-avatar">
                <Mic size={14} />
              </div>
              <div>
                <span className="fc-header-title">Voice Assistant</span>
                <span className="fc-header-status">
                  {isListening ? (
                    <><span className="pulse-dot pulse-red" style={{ width: 6, height: 6 }} /> Listening...</>
                  ) : isSpeaking ? (
                    <><span className="pulse-dot" style={{ width: 6, height: 6 }} /> Speaking...</>
                  ) : (
                    <><span className="pulse-dot" style={{ width: 6, height: 6 }} /> Ready</>
                  )}
                </span>
              </div>
            </div>
            <div className="va-header-actions">
              <button
                className="va-toggle-btn"
                onClick={() => { setVoiceEnabled(!voiceEnabled); if (isSpeaking) stopSpeaking(); }}
                title={voiceEnabled ? 'Mute responses' : 'Unmute responses'}
              >
                {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>
              <button className="fc-close" onClick={() => { setIsOpen(false); stopListening(); stopSpeaking(); }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="fc-messages">
            {messages.length === 0 && (
              <div className="fc-welcome va-welcome">
                <div className="va-welcome-icon">
                  <Mic size={28} />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Voice Assistant</h4>
                <p className="text-body" style={{ marginBottom: 16 }}>
                  Tap the mic button or type a command. Try saying:
                </p>
                <div className="fc-suggestions">
                  <button className="fc-suggestion" onClick={() => handleTextSend('Who is highest risk?')}>
                    <MessageCircle size={11} /> "Who is highest risk?"
                  </button>
                  <button className="fc-suggestion" onClick={() => handleTextSend('go to vitals')}>
                    <Navigation size={11} /> "Go to vitals"
                  </button>
                  <button className="fc-suggestion" onClick={() => handleTextSend('STAT meds pending?')}>
                    <MessageCircle size={11} /> "STAT meds pending?"
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`fc-msg ${msg.role === 'user' ? 'fc-msg-user' : msg.role === 'system' ? 'fc-msg-system' : 'fc-msg-ai'}`}>
                <div className={`fc-bubble ${msg.role === 'user' ? 'fc-bubble-user' : msg.role === 'system' ? 'fc-bubble-system' : 'fc-bubble-ai'}`}>
                  <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Live transcript */}
          {isListening && transcript && (
            <div className="va-transcript">
              <span className="pulse-dot pulse-red" style={{ width: 6, height: 6 }} />
              <span>{transcript}</span>
            </div>
          )}

          {/* Input area with mic */}
          <div className="fc-input-area va-input-area">
            <button
              className={`va-mic-btn ${isListening ? 'va-mic-active' : ''}`}
              onClick={isListening ? stopListening : startListening}
              title={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              className="input input-pill fc-input"
              placeholder="Type or speak a command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="fc-send-btn"
              onClick={() => handleTextSend()}
              disabled={!input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
