const StatsCard = ({ label, value, delta, accent = "indigo" }) => {
  const accentColor =
    accent === "indigo"
      ? "text-primary-600 bg-primary-50 border-primary-100"
      : "text-emerald-600 bg-emerald-50 border-emerald-100";

  return (
    <div className="glass-card p-4 space-y-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
        {delta && <span className={`text-xs font-semibold ${accentColor} px-2 py-1 rounded-full`}>{delta}</span>}
      </div>
    </div>
  );
};

export default StatsCard;
