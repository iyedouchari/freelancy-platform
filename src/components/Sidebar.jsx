const Sidebar = ({ page, onNavigate }) => {
  const menu = [
    { label: "Tableau de bord", key: "dashboard", actionable: true },
    { label: "Demandes de projet", key: "requests", actionable: true },
    { label: "Profil", key: "profile", actionable: true },
    { label: "Portefeuille", key: "wallet", actionable: true },
    { label: "Accords", key: "deals", actionable: true },
    { label: "Messages", key: "messages", actionable: false },
  ];

  return (
    <aside className="hidden lg:block">
      <div className="glass-card p-5 space-y-2 bg-white/90 text-base">
        {menu.map((item) => {
          const isActive = page === item.key;
          return (
            <button
              key={item.key}
              disabled={!item.actionable}
              onClick={() => item.actionable && onNavigate && onNavigate(item.key)}
              className={`w-full text-left px-3 py-2 rounded-xl font-medium transition ${
                isActive
                  ? "bg-primary-50 text-primary-700 border border-primary-100"
                  : "text-slate-600 hover:bg-slate-100"
              } ${item.actionable ? "" : "opacity-60 cursor-not-allowed"}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
