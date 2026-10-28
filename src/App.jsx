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
  Key,
  Shield,
  Save,
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend1-tawny.vercel.app/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('pins'); // pins, overview, monitor, broadcast, db
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [theme, setTheme] = useState('light');
  const [notification, setNotification] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Secret PIN Management States
  const [pins, setPins] = useState({ user1Pin: '2021', user2Pin: '2022' });
  const [editUser1Pin, setEditUser1Pin] = useState('2021');
  const [editUser2Pin, setEditUser2Pin] = useState('2022');
  const [isSavingPins, setIsSavingPins] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch all chat telemetry & PINs
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

      // 3. Secret PINs
      try {
        const pinsRes = await fetch(`${API_BASE_URL}/pins`);
        if (pinsRes.ok) {
          const pinsData = await pinsRes.json();
          if (pinsData.data) {
            setPins(pinsData.data);
            setEditUser1Pin((prev) => (prev ? prev : pinsData.data.user1Pin));
            setEditUser2Pin((prev) => (prev ? prev : pinsData.data.user2Pin));
          }
        }
      } catch (e) {
        console.log(e);
      }

      // 4. The 2 Users
      try {
        const usersRes = await fetch(`${API_BASE_URL}/users`);
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.data || []);
        }
      } catch (e) {
        console.log(e);
      }

      // 5. Messages Feed
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

  // Handle Save Secret PINs
  const handleSavePins = async (e) => {
    e.preventDefault();
    if (!editUser1Pin.trim() || !editUser2Pin.trim()) {
      showNotification('Please enter PINs for both User 1 and User 2');
      return;
    }

    setIsSavingPins(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/pins`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1Pin: editUser1Pin.trim(),
          user2Pin: editUser2Pin.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPins(json.data);
        showNotification('🔐 Secret PINs updated successfully in Database!');
        fetchData();
      } else {
        showNotification('Failed to update PINs');
      }
    } catch (err) {
      showNotification('Error updating PINs: ' + err.message);
    } finally {
      setIsSavingPins(false);
    }
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
        showNotification('📢 Admin Announcement sent to both users!');
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
    if (!window.confirm('Delete all messages in database?')) {
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
        <div
          style={{
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
          }}
        >
          <Radio size={18} />
          {notification}
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div
            className="brand-icon"
            style={{ overflow: 'hidden', padding: 2, background: '#eff6ff' }}
          >
            <img
              src="/rabbit.png"
              alt="Rabbit Mascot"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 10,
                objectFit: 'cover',
              }}
            />
          </div>
          <div className="brand-text">
            <h2>Chat Admin</h2>
            <p>Direct Console</p>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'pins' ? 'active' : ''}`}
            onClick={() => setActiveTab('pins')}
          >
            <Key size={18} />
            Secret PINs
          </button>
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>Vercel</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-wrapper">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1>
              {activeTab === 'pins' && 'Secret PINs Management'}
              {activeTab === 'overview' && '2 Users Direct Overview'}
              {activeTab === 'monitor' && 'Live Conversation Feed'}
              {activeTab === 'broadcast' && 'Send Announcement to Both Users'}
              {activeTab === 'db' && 'MongoDB Atlas Cluster Telemetry'}
            </h1>
            <p>MERN Architecture • Anonymous 2-User Chat • Secret PIN Authentication</p>
          </div>

          <div className="topbar-right">
            <div className={`health-badge ${isServerOnline ? '' : 'offline'}`}>
              {isServerOnline ? <CheckCircle size={14} /> : <XCircle size={14} />}
              <span>{isServerOnline ? 'API Operational' : 'API Offline'}</span>
            </div>

            <div
              className={`health-badge ${isDbOnline ? '' : 'offline'}`}
              style={{
                background: isDbOnline
                  ? 'rgba(22, 163, 74, 0.1)'
                  : 'rgba(245, 158, 11, 0.1)',
                borderColor: isDbOnline
                  ? 'rgba(22, 163, 74, 0.3)'
                  : 'rgba(245, 158, 11, 0.3)',
                color: isDbOnline ? '#15803d' : '#d97706',
              }}
            >
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

        {/* Secret PINs Tab */}
        {activeTab === 'pins' && (
          <div className="glass-panel" style={{ maxWidth: 680 }}>
            <div className="panel-title" style={{ marginBottom: 10 }}>
              <Key size={22} color="#2563eb" />
              Manage App Secret PINs
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              Users enter their secret code into the minimal box on the mobile app.
              Entering <strong>User 1's PIN</strong> logs in as User 1; entering <strong>User 2's PIN</strong> logs in as User 2.
              You can change either PIN anytime below:
            </p>

            <form onSubmit={handleSavePins}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* User 1 PIN Card */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1.5px solid #bfdbfe',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Shield size={18} color="#2563eb" />
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#1e40af' }}>
                      User 1 Secret PIN
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter Code (Default: 2021)</label>
                    <input
                      type="text"
                      required
                      value={editUser1Pin}
                      onChange={(e) => setEditUser1Pin(e.target.value)}
                      placeholder="2021"
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        letterSpacing: 4,
                        textAlign: 'center',
                        height: 48,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                    Active in DB: <code>{pins.user1Pin || '2021'}</code>
                  </div>
                </div>

                {/* User 2 PIN Card */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1.5px solid #bbf7d0',
                    borderRadius: 'var(--radius-md)',
                    padding: 20,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Shield size={18} color="#16a34a" />
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>
                      User 2 Secret PIN
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter Code (Default: 2022)</label>
                    <input
                      type="text"
                      required
                      value={editUser2Pin}
                      onChange={(e) => setEditUser2Pin(e.target.value)}
                      placeholder="2022"
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        letterSpacing: 4,
                        textAlign: 'center',
                        height: 48,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>
                    Active in DB: <code>{pins.user2Pin || '2022'}</code>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSavingPins}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', fontSize: 14 }}
                >
                  <Save size={16} />
                  <span>{isSavingPins ? 'Saving to Database...' : 'Save & Update PINs'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

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
                  <span>User 1 & User 2 (Anonymous)</span>
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
                  <span>Authentication</span>
                  <div className="stat-icon" style={{ background: '#fdf4ff', color: '#c026d3' }}>
                    <Key size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: 18, paddingTop: 4 }}>Secret PIN</div>
                <div className="stat-trend trend-neutral">
                  <span>PIN 1: {pins.user1Pin} • PIN 2: {pins.user2Pin}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span>Database State</span>
                  <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                    <Database size={18} />
                  </div>
                </div>
                <div
                  className="stat-value"
                  style={{ fontSize: 18, paddingTop: 6, color: isDbOnline ? '#16a34a' : '#d97706' }}
                >
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
                  Configured Chat Users (2 Anonymous Users)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div
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
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      fontWeight: 800,
                    }}
                  >
                    U1
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>User 1</span>
                      <span className="role-badge role-user" style={{ fontSize: 10 }}>
                        PIN: {pins.user1Pin}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>user1@mernchat.com</div>
                    <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontWeight: '600' }}>● Online</div>
                  </div>
                </div>

                <div
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
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#16a34a',
                      fontWeight: 800,
                    }}
                  >
                    U2
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>User 2</span>
                      <span className="role-badge role-user" style={{ fontSize: 10 }}>
                        PIN: {pins.user2Pin}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>user2@mernchat.com</div>
                    <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontWeight: '600' }}>● Online</div>
                  </div>
                </div>
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
                Live Conversation Feed — {messages.length} messages
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
                        No messages yet between User 1 and User 2.
                      </td>
                    </tr>
                  ) : (
                    messages.map((msg, i) => (
                      <tr key={msg._id || i}>
                        <td style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : 'Just now'}
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {msg.senderId === 'user_1'
                              ? 'User 1'
                              : msg.senderId === 'user_2'
                              ? 'User 2'
                              : 'Admin'}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {msg.receiverId === 'user_1'
                              ? 'User 1'
                              : msg.receiverId === 'user_2'
                              ? 'User 2'
                              : msg.receiverId}
                          </span>
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
              This will send an announcement directly into the direct chat between User 1 and User 2.
            </p>

            <form onSubmit={handleSendBroadcast}>
              <div className="form-group">
                <label>Announcement Text</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. System update scheduled at 10 PM."
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
                <div className="sys-value">2 Anonymous Users</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  User 1 (PIN: {pins.user1Pin}) & User 2 (PIN: {pins.user2Pin})
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
