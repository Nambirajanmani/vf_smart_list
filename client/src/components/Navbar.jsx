import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
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
          <Link to="/"      className={`nav-link ${!isAdmin ? 'active' : ''}`}>🏪 Market</Link>
          <Link to="/admin" className={`nav-link ${isAdmin  ? 'active' : ''}`}>⚙️ Admin</Link>
        </div>
      </div>
    </nav>
  );
}
