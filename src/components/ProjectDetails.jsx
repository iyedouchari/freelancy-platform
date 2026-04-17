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
    .map((item) => item.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);

const ProjectDetails = ({ project }) => {
  if (!project) return null;

  const isNegotiable = project.type === "Négociable";
  const typeLabel = isNegotiable ? "Négociable" : "Non négociable";
  const typeStyle = isNegotiable
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : "bg-rose-50 text-rose-600 border-rose-100";
  const requirements = project.requirements ?? [
    "Livrables documentés",
    "Tests automatisés",
    "Performance mesurable",
  ];
  const profile = project.profile ?? [
    "3+ années d'expérience sur la stack indiquée",
    "Habitué aux environnements produit",
    "Capable de communiquer clairement en français",
  ];
  const currency = project.currency ?? "DT";
  const clientName = String(project.client || "").trim() || "Client privé";
  const clientAvatar = toAbsoluteMediaUrl(project.clientAvatarUrl);
  const clientInitials = getInitials(clientName);

  return (
    <div className="glass-card p-8 space-y-7 h-fit">
      <div className="space-y-3">
        <h2 className="text-4xl font-semibold text-slate-900">{project.title}</h2>
        <div className="flex flex-wrap gap-2">
          <span className={`tag ${typeStyle} border`}>
            {typeLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">
            {format(project.budget)} {currency} budget
          </span>
          <span>Date limite : {format(project.deadline, "date")}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Description du projet</h3>
        <p className="text-slate-700 leading-relaxed text-lg">{project.description}</p>
      </div>

      <div className="space-y-3">
        {Array.isArray(project.categories) && project.categories.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Domaines
            </h4>
            <div className="flex flex-wrap gap-2">
              {project.categories.map((domain) => (
                <span key={domain} className="tag">
                  {domain}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {Array.isArray(project.competencies) && project.competencies.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Competences
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.competencies.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Exigences</h4>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          {requirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Profil recherché
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-700">
          {profile.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <p className="card-section-title">Budget</p>
          <p className="text-lg font-semibold text-slate-900">
            {format(project.budget)} {currency}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="card-section-title">Date limite</p>
          <p className="text-lg font-semibold text-slate-900">{format(project.deadline, "date")}</p>
        </div>
        <div className="glass-card p-4">
          <p className="card-section-title">Client</p>
          <div className="flex items-center gap-3">
            {clientAvatar ? (
              <img
                src={clientAvatar}
                alt={clientName}
                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-sm bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) {
                    fallback.classList.remove("hidden");
                    fallback.classList.add("flex");
                  }
                }}
              />
            ) : null}
            <div className={`${clientAvatar ? "hidden" : "flex"} w-10 h-10 rounded-lg bg-slate-900 items-center justify-center text-white font-semibold text-sm shadow-sm`}>
              {clientInitials}
            </div>
            <p className="text-lg font-semibold text-slate-900">{clientName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
