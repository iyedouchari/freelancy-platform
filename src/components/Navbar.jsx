const Navbar = ({ onProfile, onDashboard }) => {
  return (
    <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/85 border-b border-slate-200 shadow-soft">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-glow grid place-items-center text-white font-bold">
            Fy
          </div>
          <div>
            <p className="text-sm text-slate-500">Freelancy</p>
            <p className="text-lg font-semibold text-slate-900">Espace Freelance</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 text-sm">
          <button className="button-ghost" onClick={onDashboard}>
            Tableau de bord
          </button>
          <button className="button-ghost">Accords</button>
          <button className="button-ghost">Portefeuille</button>
          <button onClick={onProfile} className="button-primary">
            Profil
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
