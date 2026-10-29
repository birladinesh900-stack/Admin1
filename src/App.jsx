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
  Check,
  CheckCheck,
  Clock,
  Timer,
  Search,
  ArrowUpDown,
} from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://backend1-tawny.vercel.app/api');

export default function App() {
  const [activeTab, setActiveTab] = useState('pins'); // pins, overview, monitor, broadcast, db
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [theme, setTheme] = useState('light');
  const [notification, setNotification] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Live Chat Feed States
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'active' | 'seen' | 'unseen' | 'expired'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [nowTick, setNowTick] = useState(Date.now());

  // Secret PIN Management States
  const [pins, setPins] = useState({ user1Pin: '2021', user2Pin: '2022' });
  const [editUser1Pin, setEditUser1Pin] = useState('2021');
  const [editUser2Pin, setEditUser2Pin] = useState('2022');
  const [isSavingPins, setIsSavingPins] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Live ticker for second-by-second countdown in Timer column
  useEffect(() => {
    const ticker = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

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
          const incoming = msgsData.data || [];
          setMessages(incoming);

          // Update session messages accumulator so admin can still review ephemeral history
          setSessionMessages((prev) => {
            const map = new Map();
            prev.forEach((m) => {
              const k = m._id || (m.createdAt + '_' + m.text);
              map.set(k, { ...m });
            });
            const incomingKeys = new Set();
            incoming.forEach((m) => {
              const k = m._id || (m.createdAt + '_' + m.text);
              incomingKeys.add(k);
              map.set(k, { ...m, inDb: true });
            });
            for (const [k, v] of map.entries()) {
              if (!incomingKeys.has(k)) {
                map.set(k, { ...v, inDb: false, isPurged: true });
              }
            }
            return Array.from(map.values());
          });
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
    const interval = setInterval(fetchData, 2000);
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
    if (!window.confirm('Delete all messages in database and clear admin feed?')) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/messages`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Chat history cleared.');
        setMessages([]);
        setSessionMessages([]);
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
        {activeTab === 'monitor' && (() => {
          const allFeedItems = sessionMessages.length > 0 ? sessionMessages : messages;

          const counts = {
            all: allFeedItems.length,
            active: allFeedItems.filter((m) => !m.isPurged).length,
            seen: allFeedItems.filter((m) => !!m.readAt).length,
            unseen: allFeedItems.filter((m) => !m.readAt).length,
            expired: allFeedItems.filter(
              (m) => m.isPurged || (m.deleteAt && new Date(m.deleteAt).getTime() <= nowTick)
            ).length,
          };

          const filteredFeedMessages = allFeedItems
            .filter((msg) => {
              if (feedFilter === 'active' && msg.isPurged) return false;
              if (feedFilter === 'seen' && !msg.readAt) return false;
              if (feedFilter === 'unseen' && msg.readAt) return false;
              if (
                feedFilter === 'expired' &&
                !msg.isPurged &&
                (!msg.deleteAt || new Date(msg.deleteAt).getTime() > nowTick)
              ) {
                return false;
              }

              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const textMatch = msg.text?.toLowerCase().includes(q);
                const senderMatch = msg.senderId?.toLowerCase().includes(q);
                const receiverMatch = msg.receiverId?.toLowerCase().includes(q);
                if (!textMatch && !senderMatch && !receiverMatch) return false;
              }
              return true;
            })
            .sort((a, b) => {
              const tA = new Date(a.createdAt || 0).getTime();
              const tB = new Date(b.createdAt || 0).getTime();
              return sortOrder === 'desc' ? tB - tA : tA - tB;
            });

          return (
            <div className="glass-panel">
              {/* Header with Telemetry Stats & Actions */}
              <div className="panel-header">
                <div className="panel-title">
                  <MessageSquare size={20} color="#2563eb" />
                  Live Chat Feed
                  <div className="live-status-pill">
                    <span className="pulse-dot" />
                    <span>Auto-sync (2s)</span>
                  </div>
                </div>

                <div className="panel-actions">
                  <button
                    onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="btn-toolbar"
                    title="Toggle Sort Order"
                  >
                    <ArrowUpDown size={14} />
                    <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                  </button>

                  <button
                    onClick={handleClearMessages}
                    className="btn-clear-chat"
                    title="Clear All Messages in DB & Feed"
                  >
                    <Trash2 size={14} />
                    <span>Clear Chat History</span>
                  </button>
                </div>
              </div>

              {/* Feed Controls: Search & Category Filters */}
              <div className="feed-controls-bar">
                <div className="search-input-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search messages, user, text..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="feed-filter-chips">
                  <button
                    className={`filter-chip ${feedFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setFeedFilter('all')}
                  >
                    All Messages <span className="chip-count">{counts.all}</span>
                  </button>
                  <button
                    className={`filter-chip ${feedFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setFeedFilter('active')}
                  >
                    Active in DB <span className="chip-count">{counts.active}</span>
                  </button>
                  <button
                    className={`filter-chip ${feedFilter === 'seen' ? 'active' : ''}`}
                    onClick={() => setFeedFilter('seen')}
                  >
                    Seen <span className="chip-count">{counts.seen}</span>
                  </button>
                  <button
                    className={`filter-chip ${feedFilter === 'unseen' ? 'active' : ''}`}
                    onClick={() => setFeedFilter('unseen')}
                  >
                    Unread <span className="chip-count">{counts.unseen}</span>
                  </button>
                  <button
                    className={`filter-chip ${feedFilter === 'expired' ? 'active' : ''}`}
                    onClick={() => setFeedFilter('expired')}
                  >
                    Expired <span className="chip-count">{counts.expired}</span>
                  </button>
                </div>
              </div>

              {/* 7-Column Live Chat Feed Table */}
              <div className="table-responsive">
                <table className="live-feed-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 130 }}>Timestamp</th>
                      <th style={{ minWidth: 110 }}>Sender</th>
                      <th style={{ minWidth: 110 }}>Receiver</th>
                      <th style={{ minWidth: 240 }}>Message</th>
                      <th style={{ minWidth: 120 }}>Send</th>
                      <th style={{ minWidth: 125 }}>Seen</th>
                      <th style={{ minWidth: 145 }}>Timer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedMessages.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: 'center',
                            padding: '48px 20px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <MessageSquare
                            size={32}
                            style={{ opacity: 0.3, marginBottom: 8, display: 'inline-block' }}
                          />
                          <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>
                            No messages match your current filter.
                          </p>
                          <p style={{ fontSize: 12, marginTop: 4 }}>
                            {searchQuery
                              ? 'Try clearing your search query.'
                              : 'Waiting for messages between User 1 and User 2.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredFeedMessages.map((msg, i) => {
                        const isAdmin = msg.senderId === 'admin';
                        const isU1 = msg.senderId === 'user_1';
                        const isU2 = msg.senderId === 'user_2';

                        const recIsU1 = msg.receiverId === 'user_1';
                        const recIsU2 = msg.receiverId === 'user_2';

                        // Timer logic
                        let timerInfo = {
                          type: 'waiting',
                          label: '15s (On Seen)',
                          sub: 'Starts on view',
                        };

                        if (isAdmin) {
                          timerInfo = {
                            type: 'permanent',
                            label: '∞ Permanent',
                            sub: 'Admin Broadcast',
                          };
                        } else if (msg.deleteAt) {
                          const remainingMs = new Date(msg.deleteAt).getTime() - nowTick;
                          const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
                          const pct = Math.min(100, Math.max(0, (remainingSec / 15) * 100));

                          if (remainingSec > 0) {
                            if (remainingSec <= 5) {
                              timerInfo = {
                                type: 'urgent',
                                label: `${remainingSec}s left`,
                                sub: 'Self-destructing',
                                pct,
                              };
                            } else {
                              timerInfo = {
                                type: 'active',
                                label: `${remainingSec}s left`,
                                sub: 'Disappearing timer',
                                pct,
                              };
                            }
                          } else {
                            timerInfo = {
                              type: 'expired',
                              label: '💥 Expired (0s)',
                              sub: 'Purged from DB',
                              pct: 0,
                            };
                          }
                        } else if (msg.isPurged) {
                          timerInfo = {
                            type: 'expired',
                            label: '💥 Expired',
                            sub: 'Deleted from DB',
                            pct: 0,
                          };
                        }

                        return (
                          <tr
                            key={msg._id || i}
                            className={msg.isPurged ? 'row-expired' : ''}
                          >
                            {/* 1. Timestamp */}
                            <td className="cell-timestamp">
                              <div className="time-primary">
                                {msg.createdAt
                                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })
                                  : 'Just now'}
                              </div>
                              <div className="time-secondary">
                                {msg.createdAt
                                  ? new Date(msg.createdAt).toLocaleDateString([], {
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : ''}
                              </div>
                            </td>

                            {/* 2. Sender */}
                            <td>
                              {isU1 && (
                                <span className="user-badge-pill pill-user1">
                                  <span className="user-dot">U1</span>
                                  <span>User 1</span>
                                </span>
                              )}
                              {isU2 && (
                                <span className="user-badge-pill pill-user2">
                                  <span className="user-dot">U2</span>
                                  <span>User 2</span>
                                </span>
                              )}
                              {isAdmin && (
                                <span className="user-badge-pill pill-admin">
                                  <Shield size={12} />
                                  <span>Admin</span>
                                </span>
                              )}
                              {!isU1 && !isU2 && !isAdmin && (
                                <span className="user-badge-pill">
                                  <span>{msg.senderName || msg.senderId}</span>
                                </span>
                              )}
                            </td>

                            {/* 3. Receiver */}
                            <td>
                              {recIsU1 && (
                                <span className="user-badge-pill pill-user1 subtle">
                                  <span className="user-dot">U1</span>
                                  <span>User 1</span>
                                </span>
                              )}
                              {recIsU2 && (
                                <span className="user-badge-pill pill-user2 subtle">
                                  <span className="user-dot">U2</span>
                                  <span>User 2</span>
                                </span>
                              )}
                              {!recIsU1 && !recIsU2 && (
                                <span className="user-badge-pill subtle">
                                  <span>
                                    {msg.receiverName || msg.receiverId || 'Both Users'}
                                  </span>
                                </span>
                              )}
                            </td>

                            {/* 4. Message */}
                            <td className="cell-message">
                              <div
                                className={`feed-msg-box ${isAdmin ? 'admin-post' : ''}`}
                              >
                                {isAdmin && (
                                  <span className="feed-admin-tag">
                                    <Radio size={11} /> Broadcast
                                  </span>
                                )}
                                <span className="feed-msg-text">{msg.text}</span>
                              </div>
                            </td>

                            {/* 5. Send */}
                            <td>
                              <div className="feed-status-cell">
                                <span className="chip-badge chip-sent">
                                  <Check size={12} />
                                  <span>Sent</span>
                                </span>
                                <span className="chip-subtext">
                                  {msg.createdAt
                                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })
                                    : 'Delivered'}
                                </span>
                              </div>
                            </td>

                            {/* 6. Seen */}
                            <td>
                              {msg.readAt ? (
                                <div className="feed-status-cell">
                                  <span className="chip-badge chip-seen">
                                    <CheckCheck size={13} />
                                    <span>Seen</span>
                                  </span>
                                  <span className="chip-subtext">
                                    {new Date(msg.readAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    })}
                                  </span>
                                </div>
                              ) : (
                                <div className="feed-status-cell">
                                  <span className="chip-badge chip-unseen">
                                    <Clock size={12} />
                                    <span>Unread</span>
                                  </span>
                                  <span className="chip-subtext text-muted">
                                    Waiting
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* 7. Timer */}
                            <td>
                              <div className="feed-status-cell">
                                <span
                                  className={`chip-badge chip-timer-${timerInfo.type}`}
                                >
                                  {timerInfo.type === 'urgent' && (
                                    <Timer size={13} className="spin-gentle" />
                                  )}
                                  {timerInfo.type === 'active' && <Timer size={13} />}
                                  {timerInfo.type === 'waiting' && <Clock size={12} />}
                                  <span>{timerInfo.label}</span>
                                </span>
                                {timerInfo.pct !== undefined && timerInfo.pct > 0 && (
                                  <div className="timer-track">
                                    <div
                                      className={`timer-track-bar ${
                                        timerInfo.type === 'urgent' ? 'urgent' : ''
                                      }`}
                                      style={{ width: `${timerInfo.pct}%` }}
                                    />
                                  </div>
                                )}
                                <span
                                  className={`chip-subtext ${
                                    timerInfo.type === 'expired'
                                      ? 'danger'
                                      : timerInfo.type === 'urgent'
                                      ? 'warning'
                                      : 'text-muted'
                                  }`}
                                >
                                  {timerInfo.sub}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

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
