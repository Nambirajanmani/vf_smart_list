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
          <Link to="/" className={`nav-link ${!isAdmin ? 'active' : ''}`}>🏪 Market</Link>

          {!isAdmin && (
            user ? (
              <div className="user-nav-group">
                <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenHistory} title="View my saved shopping history">
                  📜 My History
                </button>

                <div className="user-badge" title={`Logged in as ${user.username}`}>
                  👤 {user.username}
                </div>

                <button type="button" className="btn btn-ghost btn-sm text-muted" onClick={onLogout} title="Log out">
                  🚪 Logout
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-primary btn-sm user-login-btn" onClick={onOpenAuth}>
                👤 User Login
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

