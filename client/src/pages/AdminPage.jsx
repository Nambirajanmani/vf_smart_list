import { useState, useEffect, useCallback } from 'react';
import Navbar         from '../components/Navbar.jsx';
import AdminItemRow   from '../components/AdminItemRow.jsx';
import AddItemModal   from '../components/AddItemModal.jsx';
import { loginAdmin, verifyToken, fetchAllItems, fetchStats, createItem } from '../api/api.js';
import './AdminPage.css';

/* ─────────────────────────────────────────────
   LOGIN FORM
───────────────────────────────────────────── */
function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await loginAdmin(username, password);
      localStorage.setItem('vf_admin_token', data.token);
      onLogin(data.username);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <div className="login-box glass-card slide-down">
        <div className="login-icon">🔐</div>
        <h1 className="login-title">Admin <span className="text-accent">Login</span></h1>
        <p className="login-sub">Sign in to manage your VF Smart List</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              id="admin-username"
              className="input"
              type="text"
              placeholder="admin"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="admin-password"
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button
            id="admin-login-btn"
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>
        </form>

        <p className="login-hint">Default: admin / admin123</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADMIN DASHBOARD
───────────────────────────────────────────── */
export default function AdminPage() {
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [adminName,   setAdminName]   = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [items,       setItems]       = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('all');
  const [showModal,   setShowModal]   = useState(false);

  /* ── Auth check on mount ── */
  useEffect(() => {
    const token = localStorage.getItem('vf_admin_token');
    if (!token) { setCheckingAuth(false); return; }
    verifyToken()
      .then(data => { setIsLoggedIn(true); setAdminName(data.admin.username); })
      .catch(() => { localStorage.removeItem('vf_admin_token'); })
      .finally(() => setCheckingAuth(false));
  }, []);

  /* ── Load items + stats ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCat !== 'all') params.category = filterCat;
      if (search)               params.search   = search;
      const [itemsData, statsData] = await Promise.all([
        fetchAllItems(params),
        fetchStats(),
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filterCat, search]);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  /* ── Handlers ── */
  const handleLogin = (username) => { setIsLoggedIn(true); setAdminName(username); };

  const handleLogout = () => {
    localStorage.removeItem('vf_admin_token');
    setIsLoggedIn(false);
    setAdminName('');
    setItems([]);
    setStats(null);
  };

  const handleAddItem = async (data) => {
    await createItem(data);
    await loadData();
    setShowModal(false);
  };

  /* ── Render ── */
  if (checkingAuth) return (
    <div className="auth-checking">
      <div className="spinner" />
    </div>
  );

  if (!isLoggedIn) return <LoginForm onLogin={handleLogin} />;

  return (
    <div className="admin-page">
      <Navbar />

      <div className="page-container admin-container">

        {/* ── Header ── */}
        <div className="admin-header">
          <div>
            <h1>Admin <span className="text-accent">Dashboard</span></h1>
            <p className="admin-subtitle">Welcome back, <strong>{adminName}</strong> 👋</p>
          </div>
          <div className="admin-header-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              ➕ Add Item
            </button>
            <button className="btn btn-ghost" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card glass-card">
              <div className="stat-icon">📦</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon">🥦</div>
              <div className="stat-value text-accent">{stats.vegetables}</div>
              <div className="stat-label">Vegetables</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon">🍎</div>
              <div className="stat-value" style={{color:'var(--fruit-accent)'}}>{stats.fruits}</div>
              <div className="stat-label">Fruits</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon">👁️</div>
              <div className="stat-value" style={{color:'var(--success)'}}>{stats.active}</div>
              <div className="stat-label">Visible</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon">🙈</div>
              <div className="stat-value" style={{color:'var(--danger)'}}>{stats.hidden}</div>
              <div className="stat-label">Hidden</div>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="admin-filters">
          <div className="tabs">
            {['all','vegetable','fruit'].map(cat => (
              <button
                key={cat}
                className={`tab-btn ${filterCat === cat ? 'tab-btn--active' : ''}`}
                onClick={() => setFilterCat(cat)}
              >
                {cat === 'all' ? '📦 All' : cat === 'vegetable' ? '🥦 Vegetables' : '🍎 Fruits'}
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="table-wrapper glass-card">
          {loading ? (
            <div className="state-center">
              <div className="spinner" />
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-items">No items found.</td>
                  </tr>
                ) : items.map(item => (
                  <AdminItemRow
                    key={item.id}
                    item={item}
                    onRefresh={loadData}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="items-count text-muted">
          Showing {items.length} item{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Add Item Modal ── */}
      {showModal && (
        <AddItemModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddItem}
        />
      )}
    </div>
  );
}
