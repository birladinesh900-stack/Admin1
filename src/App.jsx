import React, { useState, useEffect } from 'react';
import './App.css';
import {
  MessageSquare,
  Users,
  UserCheck,
  Database,
  Radio,
  Send,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, monitor, broadcast, db
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [theme, setTheme] = useState('light');
  const [notification, setNotification] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch all chat telemetry
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Health
      try {
        const healthRes = await fetch(`${API_BASE_URL}/health`);
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealth(healthData);
        }
      } catch (e) {
        setHealth({ status: 'OFFLINE', database: { status: 'Disconnected' } });
      }

      // 2. Stats
      try {
        const statsRes = await fetch(`${API_BASE_URL}/stats`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
      } catch (e) {
        console.log(e);
      }

      // 3. The 2 Users
      try {
        const usersRes = await fetch(`${API_BASE_URL}/users`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.data || []);
        }
      } catch (e) {
        console.log(e);
      }

      // 4. Messages Feed
      try {
        const msgsRes = await fetch(`${API_BASE_URL}/messages`);
        if (msgsRes.ok) {
          const msgsData = await msgsRes.json();
          setMessages(msgsData.data || []);
        }
      } catch (e) {
        console.log(e);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Handle Admin Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsSendingBroadcast(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcastText.trim() }),
      });

      if (res.ok) {
        showNotification('📢 Admin Announcement sent to Dinesh & Priya!');
        setBroadcastText('');
        fetchData();
      }
    } catch (err) {
      showNotification('Failed to send broadcast');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Handle Clear Messages
  const handleClearMessages = async () => {
    if (!window.confirm('Delete all messages in MongoDB Atlas?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/messages`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Chat history cleared.');
        setMessages([]);
        fetchData();
      }
    } catch (e) {
      showNotification('Failed to clear messages');
    }
  };

  const isServerOnline = health && health.status === 'OK';
  const isDbOnline = health?.database?.status === 'Connected';

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: 'rgba(37, 99, 235, 0.95)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 10,
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <Radio size={18} />
          {notification}
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon" style={{ overflow: 'hidden', padding: 2, background: '#eff6ff' }}>
            <img src="/rabbit.png" alt="Rabbit Mascot" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
          </div>
          <div className="brand-text">
            <h2>Chat Admin</h2>
            <p>2 Users Direct Console</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Users size={18} />
            Users (2)
          </button>
          <button
            className={`nav-item ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            <MessageSquare size={18} />
            Live Chat Feed
          </button>
          <button
            className={`nav-item ${activeTab === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcast')}
          >
            <Radio size={18} />
            Admin Broadcast
          </button>
          <button
            className={`nav-item ${activeTab === 'db' ? 'active' : ''}`}
            onClick={() => setActiveTab('db')}
          >
            <Database size={18} />
            MongoDB Atlas
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="stack-pill">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`pulse-dot ${isServerOnline ? '' : 'offline'}`} />
              {isServerOnline ? 'Backend Online' : 'Backend Offline'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>:5000</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-wrapper">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>
              {activeTab === 'overview' && '2 Users Chat Overview'}
              {activeTab === 'monitor' && 'Dinesh ↔ Priya Chat Monitor'}
              {activeTab === 'broadcast' && 'Send Announcement to Both Users'}
              {activeTab === 'db' && 'MongoDB Atlas Cluster Telemetry'}
            </h1>
            <p>MERN Architecture • 2 Human Users (No Bots) • Real-time Cloud Sync</p>
          </div>

          <div className="topbar-right">
            <div className={`health-badge ${isServerOnline ? '' : 'offline'}`}>
              {isServerOnline ? <CheckCircle size={14} /> : <XCircle size={14} />}
              <span>{isServerOnline ? 'API Operational' : 'API Offline'}</span>
            </div>

            <div className={`health-badge ${isDbOnline ? '' : 'offline'}`} style={{
              background: isDbOnline ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: isDbOnline ? 'rgba(22, 163, 74, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              color: isDbOnline ? '#15803d' : '#d97706',
            }}>
              <Database size={14} />
              <span>Atlas: {health?.database?.status || 'Offline'}</span>
            </div>

            <button
              className="btn-icon"
              title="Refresh Telemetry"
              onClick={fetchData}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
            </button>

            <button
              className="btn-icon"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'White'} Theme`}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{ fontSize: 16 }}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span>Total Users</span>
                  <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div className="stat-value">2</div>
                <div className="stat-trend trend-up">
                  <UserCheck size={13} />
                  <span>Dinesh Birla & Priya Sharma</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span>Total Messages</span>
                  <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                    <MessageSquare size={18} />
                  </div>
                </div>
                <div className="stat-value">{stats?.totalMessages ?? messages.length}</div>
                <div className="stat-trend trend-up">
                  <Activity size={13} />
                  <span>Stored in MongoDB Atlas</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span>Chat Conversation</span>
                  <div className="stat-icon" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: 20, paddingTop: 4 }}>1:1 Direct</div>
                <div className="stat-trend trend-neutral">
                  <span>Human-to-Human</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span>Database State</span>
                  <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <Database size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: 18, paddingTop: 6, color: isDbOnline ? '#16a34a' : '#d97706' }}>
                  {health?.database?.status || 'Offline'}
                </div>
                <div className="stat-trend">
                  <span style={{ color: 'var(--text-muted)' }}>mern_app @ Atlas</span>
                </div>
              </div>
            </div>

            {/* The 2 Users Section */}
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Users size={20} color="#2563eb" />
                  Configured Chat Users (Exactly 2 Users)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {users.map((u) => (
                  <div
                    key={u.userId}
                    style={{
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: 18,
                      display: 'flex',
                      gap: 14,
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={u.avatar}
                      alt={u.name}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        border: '2px solid #2563eb',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</span>
                        <span className="role-badge role-user" style={{ fontSize: 10 }}>
                          USER
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontWeight: '600' }}>● Online</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Live Chat Monitor Tab */}
        {activeTab === 'monitor' && (
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <MessageSquare size={20} color="#2563eb" />
                Live Conversation (Dinesh ↔ Priya) — {messages.length} messages
              </div>
              <button
                onClick={handleClearMessages}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <Trash2 size={14} />
                Clear Chat History
              </button>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No messages yet between Dinesh and Priya.
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg, i) => (
                      <tr key={msg._id || i}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Just now'}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{msg.senderName}</span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)' }}>{msg.receiverName || msg.receiverId}</span>
                        </td>
                        <td style={{ maxWidth: 400, wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                          {msg.text}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Broadcast Tab */}
        {activeTab === 'broadcast' && (
          <div className="glass-panel" style={{ maxWidth: 650 }}>
            <div className="panel-title" style={{ marginBottom: 14 }}>
              <Radio size={20} color="#ec4899" />
              Send Announcement to Both Users
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              This will send an announcement directly into the chat of Dinesh Birla & Priya Sharma.
            </p>

            <form onSubmit={handleSendBroadcast}>
              <div className="form-group">
                <label>Announcement Text</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Welcome Dinesh and Priya! The direct chat is live."
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSendingBroadcast || !broadcastText.trim()}
                >
                  <Send size={15} />
                  <span>{isSendingBroadcast ? 'Sending...' : 'Send to Both Users'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Database & Atlas Telemetry Tab */}
        {activeTab === 'db' && (
          <div className="glass-panel">
            <div className="panel-title" style={{ marginBottom: 20 }}>
              <Database size={20} color="#16a34a" />
              MongoDB Atlas Telemetry
            </div>

            <div className="system-cards">
              <div className="sys-card">
                <div className="sys-title">Cluster Host</div>
                <div className="sys-value" style={{ fontSize: 12 }}>cluster0.eqagfxb.mongodb.net</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  AWS Frankfurt Cloud
                </p>
              </div>

              <div className="sys-card">
                <div className="sys-title">Database Name</div>
                <div className="sys-value">mern_app</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Collections: users, messages
                </p>
              </div>

              <div className="sys-card">
                <div className="sys-title">Connection Status</div>
                <div className="sys-value" style={{ color: isDbOnline ? '#16a34a' : '#d97706' }}>
                  {health?.database?.status || 'Offline'}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Mongoose Driver v9 Connected
                </p>
              </div>

              <div className="sys-card">
                <div className="sys-title">Active Users</div>
                <div className="sys-value">2 Users Only</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Dinesh Birla & Priya Sharma
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
