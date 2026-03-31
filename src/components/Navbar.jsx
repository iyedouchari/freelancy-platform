import { useNavigate } from "react-router-dom";

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const DealsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
);

const defaultNavItems = [
  { key: "dashboard", label: "Tableau de bord", icon: <DashboardIcon />, actionProp: "onDashboard" },
  { key: "deals", label: "Accords", icon: <DealsIcon />, actionProp: "onDeals" },
];

const Navbar = ({
  onProfile,
  onDashboard,
  onRequests,
  onWallet,
  onDeals,
  activePage,
  navItems = defaultNavItems,
  brandTitle = "Espace Freelance",
  brandSubtitle = "Freelancy",
  profileLabel = "Profil",
  showProfile = true,
}) => {
  const navigate = useNavigate();
  const handlers = { onDashboard, onRequests, onWallet, onDeals };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("app_role");
    localStorage.removeItem("client_entry_page");
    navigate("/");
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar-inner">
        <div className="app-navbar-brand" onClick={onDashboard}>
          <div className="app-navbar-logo">Fy</div>
          <div className="app-navbar-brand-text">
            <span className="app-navbar-brand-sub">{brandSubtitle}</span>
            <span className="app-navbar-brand-main">{brandTitle}</span>
          </div>
        </div>

        <nav className="app-navbar-nav">
          {navItems.map((item) => {
            const action = handlers[item.actionProp];

            if (!action) {
              return null;
            }

            return (
              <button
                key={item.key}
                className={`app-nav-btn ${activePage === item.key ? "active" : ""}`}
                onClick={action}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="app-navbar-actions">
          {showProfile && onProfile && (
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
              {profileLabel}
            </button>
          )}
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
