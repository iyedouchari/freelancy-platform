import { format } from "../utils/format";

const ProjectCard = ({ project, onView }) => {
  const isNegotiable = project.type === "Négociable";
  const typeLabel = isNegotiable ? "Négociable" : "Non négociable";
  const typeStyle = isNegotiable
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : "bg-rose-50 text-rose-600 border-rose-100";
  const currency = project.currency ?? "DT";

  return (
    <article className="glass-card p-7 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-2xl font-semibold text-slate-900">{project.title}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${typeStyle}`}>
              {typeLabel}
            </span>
          </div>
        </div>

        <button
          onClick={onView}
          className="button-primary text-sm px-4 py-2 whitespace-nowrap self-start"
        >
          Voir les détails
        </button>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Competences</p>
          <div className="flex flex-wrap gap-2">
            {project.competencies.map((skill) => (
              <span key={skill} className="tag">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-base text-slate-500">
        <span className="font-semibold text-slate-700">
          {format(project.budget)} {currency} budget
        </span>
        <span>Date limite : {format(project.deadline, "date")}</span>
        <span className="text-indigo-600">Posté {format(project.posted, "relative")}</span>
      </div>
    </article>
  );
};

export default ProjectCard;
