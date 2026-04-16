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

const readLocalProfile = () => ({
  bio:
    localStorage.getItem("freelancer_bio") ||
    "Freelancer serieux, organise et attentif a la qualite des livrables.",
  fields: JSON.parse(localStorage.getItem("freelancer_fields") || "[]"),
  profileImage: localStorage.getItem("freelancer_image") || null,
});

const persistLocalProfile = (profile) => {
  localStorage.setItem("freelancer_bio", profile.bio || "");
  localStorage.setItem("freelancer_fields", JSON.stringify(profile.fields || []));

  if (profile.profileImage) {
    localStorage.setItem("freelancer_image", profile.profileImage);
  } else {
    localStorage.removeItem("freelancer_image");
  }
};

const persistSessionProfile = (profile) => {
  localStorage.setItem("freelancer_name", profile.name || "");
  localStorage.setItem("freelancer_title", profile.title || "");
  localStorage.setItem("freelancer_location", profile.location || "");
  localStorage.setItem("freelancer_email", profile.email || "");
  localStorage.setItem("freelancer_phone", profile.phone || "");
};

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
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            <span>Titre</span>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={draft.email}
              onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            <span>Telephone</span>
            <input
              type="text"
              value={draft.phone}
              onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>
          <label>
            <span>Localisation</span>
            <input
              type="text"
              value={draft.location}
              onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
            />
          </label>
          <label>
            <span>Mot de passe actuel</span>
            <input
              type="password"
              value={draft.currentPassword || ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, currentPassword: event.target.value }))
              }
              placeholder="Laisser vide si inchangé"
            />
          </label>
          <label>
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              value={draft.newPassword || ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, newPassword: event.target.value }))
              }
              placeholder="Optionnel"
            />
          </label>
          <label>
            <span>Confirmation</span>
            <input
              type="password"
              value={draft.confirmPassword || ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              placeholder="Confirmer seulement si tu changes le mot de passe"
            />
          </label>
        </div>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Presentation</h2>
          <p>Un texte court, simple et clair.</p>
        </div>

        <label className="profile-textarea-field">
          <span>Bio</span>
          <textarea
            rows={5}
            value={draft.bio}
            onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
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
              {draft.profileImage ? (
                <button
                  type="button"
                  className="profile-image-remove"
                  onClick={() => setDraft((current) => ({ ...current, profileImage: null }))}
                >
                  Supprimer
                </button>
              ) : null}
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
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

export default function FreelancerProfile({ onBack }) {
  const localProfile = useMemo(() => readLocalProfile(), []);
  const [profile, setProfile] = useState({
    name: localStorage.getItem("freelancer_name") || "Freelancer",
    title: localStorage.getItem("freelancer_title") || "Freelance",
    email: localStorage.getItem("freelancer_email") || "",
    phone: localStorage.getItem("freelancer_phone") || "",
    location: localStorage.getItem("freelancer_location") || "",
    bio: localProfile.bio,
    fields: localProfile.fields,
    profileImage: localProfile.profileImage,
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

        const mergedProfile = {
          name: user.name || localStorage.getItem("freelancer_name") || "Freelancer",
          title: user.title || localStorage.getItem("freelancer_title") || "Freelance",
          email: user.email || localStorage.getItem("freelancer_email") || "",
          phone: user.telephone || user.phone || localStorage.getItem("freelancer_phone") || "",
          location: user.location || localStorage.getItem("freelancer_location") || "",
          bio: user.bio || localProfile.bio,
          fields: Array.isArray(domains) && domains.length ? domains : localProfile.fields,
          profileImage: localProfile.profileImage,
        };

        setProfile(mergedProfile);
        persistSessionProfile(mergedProfile);
        persistLocalProfile(mergedProfile);
      } catch (_error) {
        // Keep local fallback if API is unavailable.
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [localProfile.bio, localProfile.fields, localProfile.profileImage]);

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
        bio: draft.bio,
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
        bio: draft.bio,
        fields: draft.fields,
        profileImage: draft.profileImage,
      };

      setProfile(nextProfile);
      persistSessionProfile(nextProfile);
      persistLocalProfile(nextProfile);
      await requestService.syncFreelancerDomains(draft.fields).catch(() => []);
      setShowEdit(false);
      setFeedback("Profil mis a jour.");
      showAppFeedback({
        tone: "success",
        title: "Profil mis a jour",
        message: "Les informations principales ont ete enregistrees.",
      });
    } catch (error) {
      setFeedback(error.message || "Impossible de mettre a jour le profil.");
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
          {feedback ? <div className="profile-feedback">{feedback}</div> : null}
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

        {feedback ? <div className="profile-feedback">{feedback}</div> : null}

        <section className="profile-simple-hero">
          <div className="profile-simple-main">
            <div className="profile-simple-avatar">
              {profile.profileImage ? <img src={profile.profileImage} alt={profile.name} className="profile-avatar-img" /> : initials}
            </div>
            <div>
              <h1>{profile.name}</h1>
              <p>{profile.title || "Freelancer"}</p>
              <div className="profile-simple-pills">
                <span>{profile.location || "Localisation non definie"}</span>
                <span>{profile.email || "Email non defini"}</span>
              </div>
            </div>
          </div>
          <button type="button" className="profile-primary-btn" onClick={() => setShowEdit(true)} disabled={isLoading}>
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
              <h2>A propos</h2>
            </div>
            <p className="profile-bio-text">{isLoading ? "Chargement..." : profile.bio || "-"}</p>
          </section>

          <section className="profile-panel">
            <div className="profile-panel-head">
              <h2>Coordonnees</h2>
            </div>
            <div className="profile-contact-list">
              <div>
                <span>Email</span>
                <strong>{profile.email || "-"}</strong>
              </div>
              <div>
                <span>Telephone</span>
                <strong>{profile.phone || "-"}</strong>
              </div>
              <div>
                <span>Localisation</span>
                <strong>{profile.location || "-"}</strong>
              </div>
            </div>
          </section>
        </div>

        <section className="profile-panel">
          <div className="profile-panel-head">
            <h2>Domaines</h2>
          </div>
          <div className="profile-fields-wrap">
            {(profile.fields || []).length ? (
              profile.fields.map((field) => (
                <span key={field} className="profile-field-tag">
                  {field}
                </span>
              ))
            ) : (
              <span className="profile-empty-text">Aucun domaine selectionne.</span>
            )}
          </div>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-head">
            <h2>Avis recents</h2>
          </div>
          <FeedbackCard feedback={sampleFeedback} />
        </section>
      </div>
    </div>
  );
}
