import StatsCard from "./StatsCard";
import FeedbackCard from "./FeedbackCard";

const sampleFeedback = {
  client: "Emma Rodriguez",
  title: "CEO – FinFlow",
  comment:
    "David delivered outstanding work. His AI expertise helped us automate our hiring workflow and improve candidate screening dramatically.",
  stars: 5,
  date: "il y a 2 jours",
};

const FreelancerProfile = ({ onBack }) => {
  return (
    <div className="layout-shell py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-sky-50 opacity-70 pointer-events-none" />
      <div className="content-area space-y-6 relative">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-semibold"
        >
          ← Retour aux projets
        </button>

        {/* Profile header */}
        <div className="glass-card p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 shadow-soft">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-indigo-400 grid place-items-center text-white text-3xl font-semibold shadow-glow">
                DC
              </div>
              <span className="absolute -right-1 bottom-2 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-semibold text-slate-900">David Carter</p>
              <p className="text-lg text-slate-600">Senior AI Engineer</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                  Disponible
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                  Remote / NYC
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-card px-5 py-4 text-center">
              <p className="text-xs font-semibold text-slate-500 tracking-wide">TOTAL RÉPUTATION</p>
              <p className="text-3xl font-bold text-slate-900">3 280 pts</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="button-ghost">Éditer le profil</button>
              <button className="button-primary">Partager le profil</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard label="Avis" value="142" delta="+12%" accent="indigo" />
          <StatsCard label="Note moyenne" value="4.8" delta="+0.1" accent="indigo" />
          <StatsCard label="Taux de réussite" value="97%" delta="+2%" accent="green" />
        </div>

        {/* Feedback */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold text-slate-900">Avis récents</p>
            <button className="text-sm text-primary-700 font-semibold">Tout voir</button>
          </div>
          <FeedbackCard feedback={sampleFeedback} />
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;
