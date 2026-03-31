import { useEffect, useMemo, useState } from "react";
import { clientRequestCategories, clientSkillSuggestions } from "../../data/clientData";
import "./ClientCreateRequest.css";

function buildFormState(initialValues) {
  return {
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    category: initialValues?.category ?? clientRequestCategories[0],
    budget: initialValues?.budget ? String(initialValues.budget) : "",
    deadline: initialValues?.deadline ?? "",
    skillsInput: "",
    skills: initialValues?.skills ?? [],
    negotiable: initialValues?.negotiable ?? null,
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
      form.title.trim() &&
      form.description.trim() &&
      form.category &&
      form.budget &&
      form.deadline &&
      form.skills.length > 0 &&
      form.negotiable !== null
    );
  }, [form]);

  const addSkill = (value) => {
    const normalized = value.trim();
    if (!normalized || form.skills.includes(normalized)) {
      return;
    }

    setForm((current) => ({
      ...current,
      skills: [...current.skills, normalized],
      skillsInput: "",
    }));
  };

  const removeSkill = (skill) => {
    setForm((current) => ({
      ...current,
      skills: current.skills.filter((item) => item !== skill),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onCreateRequest?.({
      title: form.title,
      description: form.description,
      category: form.category,
      budget: form.budget,
      deadline: form.deadline,
      skills: form.skills,
      negotiable: form.negotiable,
    });
  };

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

        <label className="client-create-request-field">
          <span>Categorie</span>
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          >
            {clientRequestCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

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
              ✓ Négociable
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

        <div className="client-create-request-field client-create-request-field-wide">
          <span>Competences attendues</span>
          <div className="client-create-request-skill-entry">
            <input
              type="text"
              value={form.skillsInput}
              onChange={(event) =>
                setForm((current) => ({ ...current, skillsInput: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === ",") {
                  event.preventDefault();
                  addSkill(form.skillsInput);
                }
              }}
              placeholder="Ajoutez une competence et validez"
            />
            <button type="button" onClick={() => addSkill(form.skillsInput)}>
              Ajouter
            </button>
          </div>

          <div className="client-create-request-suggestions">
            {clientSkillSuggestions.map((skill) => (
              <button
                key={skill}
                type="button"
                className={`client-create-request-chip ${
                  form.skills.includes(skill) ? "active" : ""
                }`}
                onClick={() => addSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>

          {form.skills.length > 0 && (
            <div className="client-create-request-skills">
              {form.skills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className="client-create-request-skill"
                  onClick={() => removeSkill(skill)}
                >
                  {skill}
                  <span>x</span>
                </button>
              ))}
            </div>
          )}
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