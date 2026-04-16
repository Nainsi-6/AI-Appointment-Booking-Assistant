import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../api';
import './ChatInterface.css';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      text: 'Hello! 👋 I can help you book an appointment. Just tell me when and with whom you\'d like to schedule.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await sendMessage(input);

      if (response.success) {
        const assistantMessage = {
          id: messages.length + 2,
          type: 'assistant',
          text: response.message,
          data: response.extractedData,
          appointmentId: response.appointmentId,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.error || 'Failed to process request');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Make sure the server is running.');
      const errorMessage = {
        id: messages.length + 2,
        type: 'error',
        text: `Error: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map(msg => (
          <div key={msg.id} className={`message message-${msg.type}`}>
            <div className="message-avatar">
              {msg.type === 'user' ? '👤' : msg.type === 'error' ? '⚠️' : '🤖'}
            </div>
            <div className="message-content">
              <p className="message-text">{msg.text}</p>
              {msg.data && msg.type === 'assistant' && (
                <div className="message-data">
                  <details>
                    <summary>📋 Extracted Details</summary>
                    <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                  </details>
                  {msg.appointmentId && (
                    <div className="appointment-id">
                      ✅ Appointment ID: <code>{msg.appointmentId}</code>
                    </div>
                  )}
                </div>
              )}
              <span className="message-time">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message message-loading">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        {error && <div className="input-error">{error}</div>}
        <div className="input-wrapper">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me when you'd like to book an appointment... (e.g., 'Book a meeting tomorrow at 2pm')"
            disabled={loading}
            className="message-input"
            rows="3"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="send-button"
          >
            {loading ? '⏳' : '📤'} Send
          </button>
        </div>
      </div>

      <div className="example-prompts">
        <p>💡 Try saying things like:</p>
        <ul>
          <li>"Book a meeting tomorrow at 3pm"</li>
          <li>"Schedule call on Monday at 10am for John"</li>
          <li>"I want to book next Friday at 2:30pm"</li>
        </ul>
      </div>
    </div>
  );
}
