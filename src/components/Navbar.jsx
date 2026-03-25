import { useNavigate } from "react-router-dom";

const Navbar = ({ onProfile, onDashboard, onDeals, activePage }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar-inner">
        <div className="app-navbar-brand" onClick={onDashboard}>
          <div className="app-navbar-logo">Fy</div>
          <div className="app-navbar-brand-text">
            <span className="app-navbar-brand-sub">Freelancy</span>
            <span className="app-navbar-brand-main">Espace Freelance</span>
          </div>
        </div>

        <nav className="app-navbar-nav">
          <button
            className={`app-nav-btn ${activePage === "dashboard" ? "active" : ""}`}
            onClick={onDashboard}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Tableau de bord
          </button>
          <button
            className={`app-nav-btn ${activePage === "deals" ? "active" : ""}`}
            onClick={onDeals}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Accords
          </button>
        </nav>

        <div className="app-navbar-actions">
          <button
            className={`app-nav-profile-btn ${activePage === "profile" ? "active" : ""}`}
            onClick={onProfile}
          >
            <div className="app-nav-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            Profil
          </button>
          <button className="app-nav-logout-btn" onClick={handleLogout} title="Déconnexion">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
