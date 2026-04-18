import { useEffect, useMemo, useState } from "react";
import { clientRequestCategories } from "../../data/clientData";
import { DOMAIN_COMPETENCIES } from "../../data/domainCompetencies";
import { splitRequestMetadata } from "../../utils/requestDomains";
import "./ClientCreateRequest.css";

function buildFormState(initialValues) {
  const metadata = splitRequestMetadata(initialValues);
  const fallbackSelectedDomains = metadata.domains;

  return {
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    selectedDomains:
      fallbackSelectedDomains.length > 0 ? fallbackSelectedDomains : [],
    selectedSkills: metadata.competencies,
    budget: initialValues?.budget ? String(initialValues.budget) : "",
    deadline: initialValues?.deadline ?? "",
    negotiable: initialValues?.negotiable ?? true,
  };
}

export default function ClientCreateRequest({
  onCreateRequest,
  onCancel,
  initialValues = null,
  eyebrow = "Nouvelle demande",
  title = "Publier un projet clair et exploitable",
  submitLabel = "Publier la demande",
  note = "La demande apparaitra immediatement dans la liste des projets client.",
}) {
  const [form, setForm] = useState(() => buildFormState(initialValues));

  useEffect(() => {
    setForm(buildFormState(initialValues));
  }, [initialValues]);

  const canSubmit = useMemo(() => {
    return (
      Boolean(form.title.trim()) &&
      Boolean(form.description.trim()) &&
      form.selectedDomains.length > 0 &&
      Number(form.budget) > 0 &&
      Boolean(form.deadline) &&
      form.negotiable !== null
    );
  }, [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    await onCreateRequest?.({
      title: form.title,
      description: form.description,
      category: form.selectedDomains[0],
      domains: form.selectedDomains,
      budget: form.budget,
      deadline: form.deadline,
      skills: form.selectedSkills,
      negotiable: form.negotiable,
    });
  };

  const toggleDomain = (domain) => {
    setForm((current) => {
      const exists = current.selectedDomains.includes(domain);
      const nextSelectedDomains = exists
        ? current.selectedDomains.filter((item) => item !== domain)
        : [...current.selectedDomains, domain];
      const nextAllowedSkills = nextSelectedDomains.flatMap(
        (selectedDomain) => DOMAIN_COMPETENCIES[selectedDomain] ?? [],
      );

      return {
        ...current,
        selectedDomains: nextSelectedDomains,
        selectedSkills: current.selectedSkills.filter((skill) => nextAllowedSkills.includes(skill)),
      };
    });
  };

  const toggleSkill = (skill) => {
    setForm((current) => ({
      ...current,
      selectedSkills: current.selectedSkills.includes(skill)
        ? current.selectedSkills.filter((item) => item !== skill)
        : [...current.selectedSkills, skill],
    }));
  };

  const selectedDomainsCount = form.selectedDomains.length;
  const selectedSkillsCount = form.selectedSkills.length;

  return (
    <form className="client-create-request" onSubmit={handleSubmit}>
      <div className="client-create-request-head">
        <div>
          <span className="client-create-request-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {onCancel && (
          <button type="button" className="client-create-request-close" onClick={onCancel}>
            Fermer
          </button>
        )}
      </div>

      <div className="client-create-request-grid">
        <label className="client-create-request-field client-create-request-field-wide">
          <span>Titre du projet</span>
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ex: Refonte d'un espace client B2B"
          />
        </label>

        <label className="client-create-request-field client-create-request-field-wide">
          <span>Description</span>
          <textarea
            rows={6}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Decrivez le contexte, les livrables attendus et le niveau de qualite souhaite."
          />
        </label>

        <div className="client-create-request-field client-create-request-field-wide">
          <span>Domaines de travail</span>
          <div className="client-create-request-domain-shell">
            <div className="client-create-request-domain-summary">
              <div>
                <strong>{selectedDomainsCount}</strong>
                <span>domaine{selectedDomainsCount !== 1 ? "s" : ""} sélectionné{selectedDomainsCount !== 1 ? "s" : ""}</span>
              </div>
              <div>
                <strong>{selectedSkillsCount}</strong>
                <span>compétence{selectedSkillsCount !== 1 ? "s" : ""} choisie{selectedSkillsCount !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="client-create-request-domain-grid">
              {clientRequestCategories.map((domain) => {
                const active = form.selectedDomains.includes(domain);

                return (
                  <button
                    key={domain}
                    type="button"
                    className={`client-create-request-domain-card ${active ? "active" : ""}`}
                    onClick={() => toggleDomain(domain)}
                  >
                    <span className="client-create-request-domain-icon">{active ? "☑" : "+"}</span>
                    <span className="client-create-request-domain-name">{domain}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <small className="client-create-request-helper">
            Choisissez un ou plusieurs domaines. Les compétences s’ouvrent juste en dessous pour chaque domaine choisi.
          </small>
        </div>

        {form.selectedDomains.map((domain) => (
          <div key={domain} className="client-create-request-field client-create-request-field-wide">
            <div className="client-create-request-domain-header">
              <span>Compétences pour {domain}</span>
              <small>{(DOMAIN_COMPETENCIES[domain] ?? []).length} options</small>
            </div>
            <div className="client-create-request-competency-panel">
              <div className="client-create-request-skills">
                {(DOMAIN_COMPETENCIES[domain] ?? []).map((skill) => {
                  const active = form.selectedSkills.includes(skill);
                  return (
                    <button
                      key={`${domain}-${skill}`}
                      type="button"
                      className={`client-create-request-chip ${active ? "active" : ""}`}
                      onClick={() => toggleSkill(skill)}
                    >
                      {active ? "☑ " : "+ "}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        <label className="client-create-request-field">
          <span>Budget (DT)</span>
          <input
            type="number"
            min="100"
            value={form.budget}
            onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
            placeholder="4500"
          />
        </label>

        <label className="client-create-request-field">
          <span>Date limite</span>
          <input
            type="date"
            value={form.deadline}
            onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
          />
        </label>

        <div className="client-create-request-field">
          <span>Budget négociable</span>
          <div className="client-create-request-toggle-group">
            <button
              type="button"
              className={`client-create-request-toggle ${form.negotiable === true ? "active-yes" : ""}`}
              onClick={() => setForm((c) => ({ ...c, negotiable: true }))}
            >
              ☑ Négociable
            </button>
            <button
              type="button"
              className={`client-create-request-toggle ${form.negotiable === false ? "active-no" : ""}`}
              onClick={() => setForm((c) => ({ ...c, negotiable: false }))}
            >
              ✕ Non négociable
            </button>
          </div>
        </div>
      </div>

      <div className="client-create-request-actions">
        <div className="client-create-request-note">{note}</div>
        <button type="submit" className="client-create-request-submit" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
