import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import CategorySelector from "../../components/CategorySelector";
import FiltersBar from "../../components/FiltersBar";
import ProjectCard from "../../components/ProjectCard";
import ProjectDetails from "../../components/ProjectDetails";
import { DOMAIN_OPTIONS } from "../../data/domains";
import { requestService } from "../../services/requestService";
import { splitRequestMetadata } from "../../utils/requestDomains";
import { format } from "../../utils/format";
import "./FreelancerDashboard.css";

const CATEGORIES = DOMAIN_OPTIONS;

const normalizeCategories = (request) => {
  return splitRequestMetadata(request).domains;
};

const BUDGET_OPTIONS = [
  { value: "any", label: "Tout budget" },
  { value: "100-500", label: "100 DT – 500 DT" },
  { value: "500-2000", label: "500 DT – 2000 DT" },
  { value: "2000-5000", label: "2000 DT – 5000 DT" },
  { value: "5000-15000", label: "5000 DT – 15000 DT" },
  { value: "15000+", label: "15000 DT+" },
];

const TYPE_OPTIONS = [
  { value: "any", label: "Tous les projets" },
  { value: "negotiable", label: "Négociable" },
  { value: "non-negotiable", label: "Non négociable" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Plus récents" },
  { value: "budget", label: "Budget le plus élevé" },
  { value: "deadline", label: "Date limite" },
];

const BUDGET_RANGES = {
  any: [0, Infinity],
  "100-500": [100, 500],
  "500-2000": [500, 2000],
  "2000-5000": [2000, 5000],
  "5000-15000": [5000, 15000],
  "15000+": [15000, Infinity],
};

const toUiProject = (request) => ({
  ...(() => {
    const metadata = splitRequestMetadata(request);
    return {
      tags: metadata.domains,
      competencies: metadata.competencies,
      categories: metadata.domains,
      requirements:
        metadata.competencies.length
          ? metadata.competencies.map((skill) => `Compétence recherchée: ${skill}`)
          : ["Livrables documentés", "Communication claire", "Respect des délais"],
      profile: [
        metadata.domains.length
          ? `Domaines demandés: ${metadata.domains.join(", ")}`
          : "Domaines à confirmer avec le client",
        request.negotiable ? "Capacité à proposer un budget et un délai" : "Capacité à respecter le brief fixé",
        "Approche professionnelle et livrables propres",
      ],
    };
  })(),
  id: request.id,
  requestId: request.id,
  title: request.title,
  type: request.negotiable ? "Négociable" : "Non négociable",
  description: request.description,
  budget: Number(request.budget),
  currency: "DT",
  deadline: request.deadline,
  posted: request.postedAt ?? request.createdAt ?? new Date().toISOString().slice(0, 10),
  client: request.clientName ?? "Client privé",
});

const OfferPanel = ({ project, onSendOffer, onAccept }) => {
  const [price, setPrice] = useState(project ? project.budget : "");
  const [deadline, setDeadline] = useState(project ? project.deadline : "");
  const [cover, setCover] = useState("");
  const [mode, setMode] = useState(
    project && project.type === "Négociable" ? "send" : "accept"
  ); // "send" | "accept"

  useEffect(() => {
    setPrice(project ? project.budget : "");
    setDeadline(project ? project.deadline : "");
    setCover("");
    setMode(project && project.type === "Négociable" ? "send" : "accept");
  }, [project]);

  if (!project) return null;
  const isNegotiable = project.type === "Négociable";
  const typeStyle = isNegotiable
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : "bg-rose-50 text-rose-600 border-rose-100";

  const handleSend = (e) => {
    e.preventDefault();
    onSendOffer?.({ price, deadline, cover, project });
  };

  const handleAccept = (e) => {
    e.preventDefault();
    onAccept?.({ project, price: project.budget, deadline: project.deadline });
  };

  return (
    <div className="glass-card p-6 space-y-6 h-fit">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Offre freelance
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-slate-900">Choisissez votre action</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full border font-semibold ${typeStyle}`}>
              {project.type}
            </span>
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => isNegotiable && setMode("send")}
              disabled={!isNegotiable}
              className={`px-4 py-2 text-sm font-semibold transition ${
                mode === "send"
                  ? "bg-primary-500 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              } ${isNegotiable ? "" : "opacity-50 cursor-not-allowed"}`}
            >
              Envoyer une offre
            </button>
            <button
              type="button"
              onClick={() => setMode("accept")}
              className={`px-4 py-2 text-sm font-semibold transition ${
                mode === "accept"
                  ? "bg-primary-100 text-primary-700"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Accepter l'offre
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Budget : {format(project.budget)} {project.currency ?? "DT"} · Date limite : {format(project.deadline, "date")}
        </p>
      </div>

      {mode === "send" && isNegotiable && (
        <form className="space-y-4" onSubmit={handleSend}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Votre prix</label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Votre date limite proposée</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Lettre de motivation</label>
            <textarea
              rows={5}
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              className="input"
              placeholder="Expliquez votre approche et pourquoi vous êtes le bon freelance..."
            />
          </div>

          <button type="submit" className="button-primary w-full">
            Envoyer une offre
          </button>
        </form>
      )}

      {mode === "accept" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 space-y-2">
            <p className="flex items-center justify-between">
              <span>Budget</span>
              <span className="font-semibold">
                {format(project.budget)} {project.currency ?? "DT"}
              </span>
            </p>
            <p className="flex items-center justify-between">
              <span>Date limite</span>
              <span className="font-semibold">{format(project.deadline, "date")}</span>
            </p>
          </div>
          <button type="button" onClick={handleAccept} className="button-primary w-full">
            Accepter l'offre du client
          </button>
        </div>
      )}
    </div>
  );
};

const FreelancerDashboard = forwardRef((_, ref) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [budgetFilter, setBudgetFilter] = useState("any");
  const [typeFilter, setTypeFilter] = useState("any");
  const [sortBy, setSortBy] = useState("newest");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // list | details
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      setIsLoading(true);
      setNotice("");

      try {
        const rows = await requestService.listOpen();
        if (!isMounted) {
          return;
        }

        const normalizedRows = Array.isArray(rows) ? rows.map(toUiProject) : [];
        setProjects(normalizedRows);
        if (!normalizedRows.length) {
          setNotice("Aucune demande client disponible pour le moment.");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProjects([]);
        setNotice(error.message || "Impossible de charger les projets réels pour le moment.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const [minBudget, maxBudget] = BUDGET_RANGES[budgetFilter] ?? BUDGET_RANGES.any;

    return projects.filter((project) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => project.categories.includes(cat));

      const matchesBudget = project.budget >= minBudget && project.budget <= maxBudget;

      const matchesType =
        typeFilter === "any" ||
        (typeFilter === "negotiable" && project.type === "Négociable") ||
        (typeFilter === "non-negotiable" && project.type === "Non négociable");

      return matchesCategory && matchesBudget && matchesType;
    }).sort((a, b) => {
      if (sortBy === "budget") return b.budget - a.budget;
      if (sortBy === "deadline") return new Date(a.deadline) - new Date(b.deadline);
      return new Date(b.posted) - new Date(a.posted); // newest
    });
  }, [projects, selectedCategories, budgetFilter, typeFilter, sortBy]);

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setSelectedProjectId(undefined);
      return;
    }
    const stillVisible = filteredProjects.find((p) => p.id === selectedProjectId);
    if (!stillVisible) {
      setSelectedProjectId(filteredProjects[0].id);
    }
  }, [filteredProjects, selectedProjectId]);

  const selectedProject =
    filteredProjects.find((p) => p.id === selectedProjectId) ?? filteredProjects[0];

  const dashboardMetrics = useMemo(() => {
    const urgentProjects = filteredProjects.filter((project) => {
      const diff = new Date(project.deadline) - new Date();
      return diff <= 1000 * 60 * 60 * 24 * 45;
    }).length;
    const averageBudget =
      filteredProjects.length > 0
        ? Math.round(
            filteredProjects.reduce((sum, project) => sum + project.budget, 0) /
              filteredProjects.length
          )
        : 0;
    const negotiableProjects = filteredProjects.filter(
      (project) => project.type === "Négociable"
    ).length;

    return [
      {
        label: "Opportunites",
        value: filteredProjects.length,
        hint: "projets visibles",
      },
      {
        label: "Budget moyen",
        value: `${format(averageBudget)} DT`,
        hint: "sur la selection",
      },
      {
        label: "Negociables",
        value: negotiableProjects,
        hint: `${urgentProjects} echeances proches`,
      },
    ];
  }, [filteredProjects]);

  const openDetails = (id) => {
    setSelectedProjectId(id);
    setViewMode("details");
  };

  const backToList = () => setViewMode("list");

  useImperativeHandle(ref, () => ({
    goDashboard: () => {
      setViewMode("list");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  }));

  const handleOffer = async (payload) => {
    try {
      const project = payload?.project;
      if (!project?.requestId) {
        throw new Error("Demande invalide.");
      }

      await requestService.createProposal({
        requestId: project.requestId,
        proposedPrice: payload.price,
        proposedDeadline: payload.deadline,
        coverLetter: payload.cover,
      });

      alert("Proposition envoyée au client.");
    } catch (error) {
      alert(error.message || "Impossible d'envoyer la proposition.");
    }
  };

  const handleAccept = async (payload) => {
    try {
      const project = payload?.project;
      if (!project?.requestId) {
        throw new Error("Demande invalide.");
      }

      await requestService.createProposal({
        requestId: project.requestId,
        coverLetter: "J'accepte les conditions du client et je suis disponible pour commencer rapidement.",
      });

      alert("Votre accord a été envoyé au client.");
    } catch (error) {
      alert(error.message || "Impossible d'accepter cette demande.");
    }
  };

  if (viewMode === "details" && selectedProject) {
    return (
      <div className="layout-shell py-10 freelancer-dashboard-page">
        <div className="content-area space-y-8">
          <div className="freelancer-dashboard-detail-hero">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary-700 uppercase tracking-wide">
                  Détail du projet
                </p>
                <p className="text-lg text-slate-700 max-w-2xl">
                  Consultez le brief, vérifiez les exigences et envoyez une offre adaptée.
                </p>
              </div>
              <button onClick={backToList} className="button-primary text-base px-5 py-3 shadow-soft">
                ← Retour aux projets
              </button>
            </div>
          </div>

          <div className="section-grid items-start">
            <ProjectDetails project={selectedProject} />
            <div className="md:sticky md:top-6">
              <OfferPanel
                project={selectedProject}
                onSendOffer={handleOffer}
                onAccept={handleAccept}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-shell py-10 freelancer-dashboard-page">
      <div className="content-area space-y-6">
        <section className="freelancer-dashboard-hero">
          <div className="freelancer-dashboard-hero-grid">
            <div className="freelancer-dashboard-copy">
              <span className="freelancer-dashboard-eyebrow">Tableau de bord</span>
              <h1>Projets a cibler selon votre expertise</h1>
              <p>
                Parcourez les projets qui correspondent a votre expertise. Filtrez par categorie,
                budget, type et date limite depuis votre page dashboard dediee.
              </p>
            </div>

            <div className="freelancer-dashboard-metrics">
              {dashboardMetrics.map((metric) => (
                <div key={metric.label} className="freelancer-dashboard-metric-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.hint}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CategorySelector
          categories={CATEGORIES}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />

        <FiltersBar
          budgetOptions={BUDGET_OPTIONS}
          sortOptions={SORT_OPTIONS}
          typeOptions={TYPE_OPTIONS}
          budgetValue={budgetFilter}
          sortValue={sortBy}
          typeValue={typeFilter}
          onBudgetChange={setBudgetFilter}
          onSortChange={setSortBy}
          onTypeChange={setTypeFilter}
        />

        {notice && (
          <div className="glass-card p-4 text-sm text-slate-600">{notice}</div>
        )}

        <div className="grid gap-5 grid-cols-1">
          {isLoading && (
            <div className="glass-card p-6 text-slate-600 freelancer-dashboard-empty">
              Chargement des demandes correspondant a votre profil...
            </div>
          )}
          {!isLoading && filteredProjects.length === 0 && (
            <div className="glass-card p-6 text-slate-600 freelancer-dashboard-empty">
              Aucun projet ne correspond à ces filtres pour l'instant.
            </div>
          )}
          {!isLoading &&
            filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onView={() => openDetails(project.id)} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default FreelancerDashboard;
