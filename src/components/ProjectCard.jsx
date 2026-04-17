import { format } from "../utils/format";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const toAbsoluteMediaUrl = (value) => {
  const input = String(value || "").trim();
  if (!input) {
    return "";
  }

  if (input.startsWith("data:") || input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  if (input.startsWith("/")) {
    return `${apiOrigin}${input}`;
  }

  return `${apiOrigin}/${input}`;
};

const getInitials = (name) =>
  String(name || "Client")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

const ProjectCard = ({ project, onView }) => {
  const isNegotiable = project.type === "Négociable";
  const typeLabel = isNegotiable ? "Négociable" : "Non négociable";
  const typeStyle = isNegotiable
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : "bg-rose-50 text-rose-600 border-rose-100";
  const currency = project.currency ?? "DT";

  // Ensure client data is available
  const clientName = String(project.client || "").trim() || "Client inconnu";
  const clientAvatar = toAbsoluteMediaUrl(project.clientAvatarUrl);
  const initials = getInitials(clientName);

  return (
    <article className="glass-card p-7 flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-transparent p-4 -mx-7 -mt-7 mb-1 rounded-t-lg">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {clientAvatar ? (
            <div
              className="flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              style={{ width: "44px", height: "44px" }}
            >
              <img
                src={clientAvatar}
                alt={clientName}
                className="block object-cover"
                style={{ width: "44px", height: "44px", minWidth: "44px", maxWidth: "44px", minHeight: "44px", maxHeight: "44px" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) {
                    fallback.classList.remove("hidden");
                    fallback.classList.add("flex");
                  }
                }}
              />
              <div className="hidden items-center justify-center bg-slate-900 text-sm font-semibold text-white" style={{ width: "44px", height: "44px" }}>
                {initials}
              </div>
            </div>
          ) : (
            <div className="flex flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white shadow-sm" style={{ width: "44px", height: "44px" }}>
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <p className="font-semibold text-base text-slate-900 truncate">{clientName}</p>
            <p className="text-sm text-slate-500">Posté {format(project.posted, "relative")}</p>
          </div>
        </div>

        <button
          onClick={onView}
          className="button-primary text-sm px-4 py-2 whitespace-nowrap self-start"
        >
          Voir les détails
        </button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-2xl font-semibold text-slate-900">{project.title}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${typeStyle}`}>
              {typeLabel}
            </span>
          </div>
        </div>
      </div>

      <p className="text-lg text-slate-600 leading-relaxed">{project.description}</p>

      {Array.isArray(project.tags) && project.tags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domaines</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(project.competencies) && project.competencies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compétences</p>
          <div className="flex flex-wrap gap-2">
            {project.competencies.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-base text-slate-500 pt-2 border-t border-slate-100">
        <span className="font-semibold text-slate-700">
          {format(project.budget)} {currency} budget
        </span>
        <span>Date limite : {format(project.deadline, "date")}</span>
      </div>
    </article>
  );
};

export default ProjectCard;
