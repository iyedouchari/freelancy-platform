import { useEffect, useMemo, useRef, useState } from "react";
import FeedbackCard from "../../components/FeedbackCard";
import { DOMAIN_OPTIONS } from "../../data/domains";
import { requestService } from "../../services/requestService";
import { userService } from "../../services/userService";
import { showAppFeedback } from "../../utils/appFeedback";
import "./FreelancerProfile.css";

const sampleFeedback = {
  client: "Emma Rodriguez",
  title: "CEO - FinFlow",
  comment:
    "David delivered outstanding work. His AI expertise helped us automate our hiring workflow and improve candidate screening dramatically.",
  stars: 5,
  date: "il y a 2 jours",
};

const DEFAULT_STATS = [
  { label: "Avis", value: "142" },
  { label: "Note moyenne", value: "4.8 / 5" },
  { label: "Taux de reussite", value: "97%" },
];

// ── Helpers localStorage keyed par userId ──────────────────────────────────

const localKey = (userId, field) => `freelancer_${userId}_${field}`;

const readLocalProfile = (userId) => ({
  bio: localStorage.getItem(localKey(userId, "bio")) || "",
  fields: JSON.parse(localStorage.getItem(localKey(userId, "fields")) || "[]"),
  profileImage: localStorage.getItem(localKey(userId, "image")) || null,
});

const persistLocalProfile = (userId, profile) => {
  localStorage.setItem(localKey(userId, "bio"), profile.bio || "");
  localStorage.setItem(localKey(userId, "fields"), JSON.stringify(profile.fields || []));
  if (profile.profileImage) {
    localStorage.setItem(localKey(userId, "image"), profile.profileImage);
  } else {
    localStorage.removeItem(localKey(userId, "image"));
  }
};

const persistSessionProfile = (userId, profile) => {
  localStorage.setItem(localKey(userId, "name"), profile.name || "");
  localStorage.setItem(localKey(userId, "title"), profile.title || "");
  localStorage.setItem(localKey(userId, "location"), profile.location || "");
  localStorage.setItem(localKey(userId, "email"), profile.email || "");
  localStorage.setItem(localKey(userId, "phone"), profile.phone || "");
};

// ── EditProfile ─────────────────────────────────────────────────────────────

function EditProfile({ profile, onSave, onCancel, isSaving }) {
  const [draft, setDraft] = useState(profile);
  const imageInputRef = useRef(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const toggleField = (field) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.includes(field)
        ? current.fields.filter((item) => item !== field)
        : [...current.fields, field],
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDraft((current) => ({ ...current, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <form className="profile-edit-layout" onSubmit={handleSubmit}>
      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Informations principales</h2>
          <p>Les informations ci-dessous seront visibles dans ton profil. Les champs mot de passe sont optionnels.</p>
        </div>

        <div className="profile-form-grid">
          <label>
            <span>Nom complet</span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))}
            />
          </label>
          <label>
            <span>Titre</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft((c) => ({ ...c, email: e.target.value }))}
            />
          </label>
          <label>
            <span>Telephone</span>
            <input
              type="text"
              value={draft.phone}
              onChange={(e) => setDraft((c) => ({ ...c, phone: e.target.value }))}
            />
          </label>
          <label>
            <span>Localisation</span>
            <input
              type="text"
              value={draft.location}
              onChange={(e) => setDraft((c) => ({ ...c, location: e.target.value }))}
            />
          </label>
          <label>
            <span>Mot de passe actuel</span>
            <input
              type="password"
              value={draft.currentPassword || ""}
              onChange={(e) => setDraft((c) => ({ ...c, currentPassword: e.target.value }))}
              placeholder="Laisser vide si inchangé"
            />
          </label>
          <label>
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              value={draft.newPassword || ""}
              onChange={(e) => setDraft((c) => ({ ...c, newPassword: e.target.value }))}
              placeholder="Optionnel"
            />
          </label>
          <label>
            <span>Confirmation</span>
            <input
              type="password"
              value={draft.confirmPassword || ""}
              onChange={(e) => setDraft((c) => ({ ...c, confirmPassword: e.target.value }))}
              placeholder="Confirmer seulement si tu changes le mot de passe"
            />
          </label>
        </div>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Présentation</h2>
          <p>Un texte court, simple et clair qui décrit ton profil.</p>
        </div>

        <label className="profile-textarea-field">
          <span>Bio</span>
          <textarea
            rows={5}
            value={draft.bio}
            onChange={(e) => setDraft((c) => ({ ...c, bio: e.target.value }))}
            placeholder="Décris ton expérience, tes compétences et ce qui te distingue…"
          />
        </label>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Domaines</h2>
          <p>Choisis seulement ce qui te correspond vraiment.</p>
        </div>

        <div className="profile-domain-grid">
          {DOMAIN_OPTIONS.map((field) => (
            <button
              key={field}
              type="button"
              className={`profile-domain-chip${draft.fields.includes(field) ? " active" : ""}`}
              onClick={() => toggleField(field)}
            >
              {field}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Photo</h2>
          <p>Optionnelle.</p>
        </div>

        <div className="profile-image-upload">
          <div className={`profile-image-preview ${draft.profileImage ? "has-image" : ""}`}>
            {draft.profileImage ? (
              <img src={draft.profileImage} alt={draft.name} />
            ) : (
              <div className="profile-image-placeholder">
                <span>Aucune photo</span>
              </div>
            )}
          </div>
          <div className="profile-image-controls">
            <div className="profile-image-actions">
              <button type="button" className="profile-image-trigger" onClick={() => imageInputRef.current?.click()}>
                Choisir une image
              </button>
              {draft.profileImage && (
                <button
                  type="button"
                  className="profile-image-remove"
                  onClick={() => setDraft((c) => ({ ...c, profileImage: null }))}
                >
                  Supprimer
                </button>
              )}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
          </div>
        </div>
      </section>

      <div className="profile-edit-actions-row">
        <button type="button" className="profile-secondary-btn" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="profile-primary-btn" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

// ── FreelancerProfile ───────────────────────────────────────────────────────

export default function FreelancerProfile({ onBack }) {
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState({
    name: "Freelancer",
    title: "Freelance",
    email: "",
    phone: "",
    location: "",
    bio: "",
    fields: [],
    profileImage: null,
  });
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const [user, domains] = await Promise.all([
          userService.getMe(),
          requestService.getMyDomains().catch(() => []),
        ]);

        if (!isMounted || !user) return;

        // Utilise l'id de l'utilisateur comme clé localStorage
        const uid = user.id || user._id || user.email || "default";
        if (!isMounted) return;
        setUserId(uid);

        const local = readLocalProfile(uid);

        const mergedProfile = {
          name: user.name || localStorage.getItem(localKey(uid, "name")) || "Freelancer",
          title: user.title || localStorage.getItem(localKey(uid, "title")) || "Freelance",
          email: user.email || localStorage.getItem(localKey(uid, "email")) || "",
          phone: user.telephone || user.phone || localStorage.getItem(localKey(uid, "phone")) || "",
          location: user.location || localStorage.getItem(localKey(uid, "location")) || "",
          // La bio vient d'abord de l'API, puis du localStorage propre à cet utilisateur
          bio: user.bio || local.bio || "",
          fields: Array.isArray(domains) && domains.length ? domains : local.fields,
          profileImage: local.profileImage,
        };

        setProfile(mergedProfile);
        persistSessionProfile(uid, mergedProfile);
        persistLocalProfile(uid, mergedProfile);
      } catch (_error) {
        // Fallback silencieux — on garde l'état initial vide
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (draft) => {
    setFeedback("");

    const wantsPasswordChange = Boolean(
      String(draft.newPassword || "").trim() ||
      String(draft.currentPassword || "").trim() ||
      String(draft.confirmPassword || "").trim(),
    );

    if (wantsPasswordChange && !String(draft.newPassword || "").trim()) {
      setFeedback("Le nouveau mot de passe est vide. Laisse les 3 champs vides si tu ne veux rien changer.");
      return;
    }
    if (wantsPasswordChange && !String(draft.currentPassword || "").trim()) {
      setFeedback("Saisis le mot de passe actuel pour confirmer le changement.");
      return;
    }
    if (wantsPasswordChange && draft.newPassword !== draft.confirmPassword) {
      setFeedback("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    try {
      setIsSaving(true);

      const updatedUser = await userService.updateMe({
        name: draft.name,
        title: draft.title,
        email: draft.email,
        phone: draft.phone,
        telephone: draft.phone,
        location: draft.location,
        bio: draft.bio,          // ← bio envoyée à l'API
      });

      if (wantsPasswordChange) {
        await userService.changePassword({
          currentPassword: draft.currentPassword,
          newPassword: draft.newPassword,
        });
      }

      const nextProfile = {
        name: updatedUser.name || draft.name,
        title: updatedUser.title || draft.title,
        email: updatedUser.email || draft.email,
        phone: updatedUser.telephone || updatedUser.phone || draft.phone,
        location: updatedUser.location || draft.location,
        bio: updatedUser.bio ?? draft.bio,   // ← priorité à la réponse API
        fields: draft.fields,
        profileImage: draft.profileImage,
      };

      setProfile(nextProfile);
      if (userId) {
        persistSessionProfile(userId, nextProfile);
        persistLocalProfile(userId, nextProfile);
      }
      await requestService.syncFreelancerDomains(draft.fields).catch(() => []);
      setShowEdit(false);
      setFeedback("Profil mis à jour.");
      showAppFeedback({
        tone: "success",
        title: "Profil mis à jour",
        message: "Les informations ont été enregistrées.",
      });
    } catch (error) {
      setFeedback(error.message || "Impossible de mettre à jour le profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = profile.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (showEdit) {
    return (
      <div className="freelancer-profile-shell">
        <div className="freelancer-profile-content profile-page">
          <button onClick={() => setShowEdit(false)} className="profile-back-btn">
            Retour au profil
          </button>
          {feedback && <div className="profile-feedback">{feedback}</div>}
          <EditProfile profile={profile} onSave={handleSave} onCancel={() => setShowEdit(false)} isSaving={isSaving} />
        </div>
      </div>
    );
  }

  return (
    <div className="freelancer-profile-shell">
      <div className="freelancer-profile-content profile-page">
        <button onClick={onBack} className="profile-back-btn">
          Retour au tableau de bord
        </button>

        {feedback && <div className="profile-feedback">{feedback}</div>}

        <section className="profile-simple-hero">
          <div className="profile-simple-main">
            <div className="profile-simple-avatar">
              {profile.profileImage
                ? <img src={profile.profileImage} alt={profile.name} className="profile-avatar-img" />
                : initials}
            </div>
            <div>
              <h1>{profile.name}</h1>
              <p>{profile.title || "Freelancer"}</p>
              <div className="profile-simple-pills">
                <span>{profile.location || "Localisation non définie"}</span>
                <span>{profile.email || "Email non défini"}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="profile-primary-btn"
            onClick={() => setShowEdit(true)}
            disabled={isLoading}
          >
            Modifier le profil
          </button>
        </section>

        <section className="profile-simple-stats">
          {DEFAULT_STATS.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <div className="profile-simple-grid">
          <section className="profile-panel">
            <div className="profile-panel-head">
              <h2>À propos</h2>
            </div>
            <p className="profile-bio-text">
              {isLoading
                ? "Chargement..."
                : profile.bio || <em className="profile-empty-text">Aucune bio renseignée.</em>}
            </p>
          </section>

          <section className="profile-panel">
            <div className="profile-panel-head">
              <h2>Coordonnées</h2>
            </div>
            <div className="profile-contact-list">
              <div><span>Email</span><strong>{profile.email || "-"}</strong></div>
              <div><span>Téléphone</span><strong>{profile.phone || "-"}</strong></div>
              <div><span>Localisation</span><strong>{profile.location || "-"}</strong></div>
            </div>
          </section>
        </div>

        <section className="profile-panel" style={{ marginBottom: 24 }}>
          <div className="profile-panel-head">
            <h2>Domaines</h2>
          </div>
          <div className="profile-fields-wrap">
            {(profile.fields || []).length
              ? profile.fields.map((field) => (
                  <span key={field} className="profile-field-tag">{field}</span>
                ))
              : <span className="profile-empty-text">Aucun domaine sélectionné.</span>}
          </div>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-head">
            <h2>Avis récents</h2>
          </div>
          <FeedbackCard feedback={sampleFeedback} />
        </section>
      </div>
    </div>
  );
}
