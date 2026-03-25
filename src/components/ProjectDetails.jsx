import { format } from "../utils/format";

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
  const currency = project.currency ?? "$";

  return (
    <div className="glass-card p-8 space-y-7 h-fit">
      <div className="space-y-3">
        <h2 className="text-4xl font-semibold text-slate-900">{project.title}</h2>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
          <span className={`tag ${typeStyle} border`}>
            {typeLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">
            {currency}
            {format(project.budget)} budget
          </span>
          <span>Date limite : {format(project.deadline, "date")}</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Description du projet</h3>
        <p className="text-slate-700 leading-relaxed text-lg">{project.description}</p>
      </div>

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
            {currency}
            {format(project.budget)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="card-section-title">Date limite</p>
          <p className="text-lg font-semibold text-slate-900">{format(project.deadline, "date")}</p>
        </div>
        <div className="glass-card p-4">
          <p className="card-section-title">Client</p>
          <p className="text-lg font-semibold text-slate-900">{project.client ?? "Client privé"}</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
