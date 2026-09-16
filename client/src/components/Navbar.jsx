import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ user, onOpenAuth, onOpenHistory, onLogout }) {
  const location = useLocation();
  const isAdmin  = location.pathname === '/admin';

  return (
    <nav className="navbar">
      <div className="navbar-inner page-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">🥦</span>
          <span className="navbar-title">
            VF <span className="text-accent">Smart</span> List
          </span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${!isAdmin ? 'active' : ''}`} title="Market">
            <span>🏪</span>
            <span className="nav-link-label">Market</span>
          </Link>

          {!isAdmin && (
            user ? (
              <div className="user-nav-group">
                <button type="button" className="btn btn-ghost btn-sm nav-history-btn" onClick={onOpenHistory} title="View my saved shopping history">
                  <span>📜</span>
                  <span className="btn-label-mobile">History</span>
                </button>

                <div className="user-badge" title={`Logged in as ${user.username}`}>
                  <span className="user-badge-icon">👤</span>
                  <span className="user-badge-name">{user.username}</span>
                </div>

                <button type="button" className="btn btn-ghost btn-sm text-muted nav-logout-btn" onClick={onLogout} title="Log out">
                  <span>🚪</span>
                  <span className="btn-label-mobile">Logout</span>
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary btn-sm user-login-btn" onClick={onOpenAuth} title="User Login">
                <span>👤</span>
                <span className="btn-label-mobile">Login</span>
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

