import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Clipboard } from 'lucide-react';
import { getChatHistory, sendChatMessage } from '../api/services';
import './NurseChat.css';

export default function NurseChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function load() {
      const history = await getChatHistory();
      setMessages(history);
    }
    load();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestions = messages.filter((m) => m.role === 'suggestion');
  const chatMessages = messages.filter((m) => m.role !== 'suggestion');
  const showSuggestions = chatMessages.length === 0;

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMsg = {
      id: `C${Date.now()}`,
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await sendChatMessage(messageText);
    setIsTyping(false);
    setMessages((prev) => [...prev, response]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-page" id="nurse-chat-page">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <h3 className="text-section-title">NurseChat</h3>
          <span className="chat-live-status">
            <span className="pulse-dot" /> Live — connected to ward data
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-area">
        {/* Suggestions when empty */}
        {showSuggestions && (
          <div className="chat-suggestions animate-fade-in">
            <div className="chat-suggestions-icon">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <path d="M16 6v20M6 16h20" stroke="#8FD14F" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
            <h4>What can I help with?</h4>
            <p className="text-body">Ask me anything about your patients, medications, or ward data.</p>
            <div className="chat-suggestion-chips">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  className="chat-suggestion-chip"
                  onClick={() => handleSend(s.text)}
                >
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'} animate-fade-in`}
          >
            {msg.role === 'assistant' && (
              <div className="chat-ai-avatar">
                <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                  <path d="M16 6v20M6 16h20" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
              <p className="chat-msg-text" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              {msg.source && (
                <div className="chat-source">
                  <Clipboard size={10} /> Based on {msg.source}
                </div>
              )}
            </div>
            {msg.timestamp && (
              <span className="chat-msg-time text-timestamp">{msg.timestamp}</span>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-msg chat-msg-ai animate-fade-in">
            <div className="chat-ai-avatar">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M16 6v20M6 16h20" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <div className="chat-bubble chat-bubble-ai">
              <div className="chat-typing">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="chat-input-area">
        <button className="chat-mic-btn" id="chat-mic-btn">
          <Mic size={18} />
        </button>
        <input
          type="text"
          className="input input-pill chat-input"
          placeholder="Ask about patients, meds, vitals..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          id="chat-input"
        />
        <button
          className="chat-send-btn"
          onClick={() => handleSend()}
          disabled={!input.trim()}
          id="chat-send-btn"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}