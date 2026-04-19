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

const ProposalsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5h16v10H7l-3 3V5z" />
    <path d="M8 9h8" />
    <path d="M8 12h5" />
  </svg>
);

const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3z" />
    <path d="M3 7V6a2 2 0 0 1 2-2h12" />
    <circle cx="17" cy="12" r="1" />
  </svg>
);

const defaultNavItems = [
  { key: "dashboard", label: "Tableau de bord", icon: <DashboardIcon />, actionProp: "onDashboard" },
  { key: "proposals", label: "Propositions", icon: <ProposalsIcon />, actionProp: "onRequests" },
  { key: "deals", label: "Accords", icon: <DealsIcon />, actionProp: "onDeals" },
  { key: "wallet", label: "Portefeuille", icon: <WalletIcon />, actionProp: "onWallet" },
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
    localStorage.removeItem("token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("app_role");
    localStorage.removeItem("client_entry_page");
    localStorage.removeItem("freelancer_active_page");
    localStorage.removeItem("freelancer_selected_deal_id");
    localStorage.removeItem("client_active_page");
    localStorage.removeItem("client_selected_deal_id");
    navigate("/");
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar-inner">
        <div className="app-navbar-brand" onClick={onDashboard}>
          <img src="/brand-logo.png" alt={brandSubtitle} className="app-navbar-brand-logo" />
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
