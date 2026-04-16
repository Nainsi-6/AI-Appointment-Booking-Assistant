import { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [serverStatus, setServerStatus] = useState('connecting');

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          setServerStatus('connected');
        } else {
          setServerStatus('error');
        }
      } catch {
        setServerStatus('error');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>AI Appointment Booking Assistant</h1>
          <div className="status-indicator">
            <span className={`status-dot ${serverStatus}`}></span>
            <span className="status-text">
              {serverStatus === 'connected' ? 'Connected' : 
               serverStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </span>
          </div>
        </div>
        
        <nav className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            Admin Panel
          </button>
        </nav>
      </header>

      <main className="app-content">
        {serverStatus === 'error' && (
          <div className="error-banner">
            Server connection error. Please ensure the backend is running on port 5000.
          </div>
        )}
        
        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
