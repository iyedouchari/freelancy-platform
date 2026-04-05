import { useRef, useState } from "react";
import FeedbackCard from "../../components/FeedbackCard";
import StatsCard from "../../components/StatsCard";
import { DOMAIN_OPTIONS } from "../../data/domains";
import "./FreelancerProfile.css";

const sampleFeedback = {
  client: "Emma Rodriguez",
  title: "CEO - FinFlow",
  comment:
    "David delivered outstanding work. His AI expertise helped us automate our hiring workflow and improve candidate screening dramatically.",
  stars: 5,
  date: "il y a 2 jours",
};

const ALL_FIELDS = DOMAIN_OPTIONS;

const DEFAULT_STATS = {
  freelancer: [
    { label: "Avis", value: "142", delta: "+12%", accent: "indigo" },
    { label: "Note moyenne", value: "4.8", delta: "+0.1", accent: "indigo" },
    { label: "Taux de reussite", value: "97%", delta: "+2%", accent: "green" },
  ],
  client: [
    { label: "Demandes", value: "0", delta: "Actif", accent: "indigo" },
    { label: "Accords en cours", value: "0", delta: "En suivi", accent: "indigo" },
    { label: "Accords terminés", value: "0", delta: "Historique", accent: "green" },
  ],
};

function readProfile(variant) {
  if (variant === "client") {
    return {
      name: localStorage.getItem("client_name") || "Iyed",
      company: localStorage.getItem("client_company") || "Iyed Studio",
      title: localStorage.getItem("client_role_title") || "Product Owner",
      location: localStorage.getItem("client_location") || "Lagos / Remote",
      email: localStorage.getItem("client_email") || "iyed@gmail.com",
      phone: localStorage.getItem("client_phone") || "+234 800 000 0000",
      bio:
        localStorage.getItem("client_bio") ||
        "Je pilote des projets digitaux avec une attention forte sur la clarte du besoin, la qualite d'execution et le suivi avec les freelancers engages.",
      fields: JSON.parse(
        localStorage.getItem("client_sectors") ||
          '["Développement Web","UI/UX Design","Marketing digital"]'
      ),
      profileImage: localStorage.getItem("client_image") || null,
    };
  }

  return {
    name: localStorage.getItem("freelancer_name") || "David Carter",
    company: "",
    title: localStorage.getItem("freelancer_title") || "Senior AI Engineer",
    location: localStorage.getItem("freelancer_location") || "Remote / Tunis",
    bio:
      localStorage.getItem("freelancer_bio") ||
      "Ingenieur IA passionne avec plus de 5 ans d'experience dans le developpement de solutions d'intelligence artificielle. Specialise en NLP, computer vision et automatisation intelligente. J'aide les entreprises a transformer leurs processus metier grace a l'IA.",
    email: localStorage.getItem("freelancer_email") || "david.carter@email.com",
    phone: localStorage.getItem("freelancer_phone") || "+216 XX XXX XXX",
    fields: JSON.parse(
      localStorage.getItem("freelancer_fields") ||
        '["Intelligence Artificielle & Machine Learning", "Développement Web", "Data Science"]'
    ),
    profileImage: localStorage.getItem("freelancer_image") || null,
  };
}

function persistProfile(variant, profile) {
  const prefix = variant === "client" ? "client" : "freelancer";
  localStorage.setItem(`${prefix}_name`, profile.name);
  localStorage.setItem(`${prefix}_bio`, profile.bio);
  localStorage.setItem(`${prefix}_email`, profile.email);
  localStorage.setItem(`${prefix}_phone`, profile.phone);
  localStorage.setItem(`${prefix}_location`, profile.location);
  localStorage.setItem(`${prefix}_fields`, JSON.stringify(profile.fields));

  if (variant === "client") {
    localStorage.setItem("client_company", profile.company || "");
    localStorage.setItem("client_role_title", profile.title);
    localStorage.setItem("client_sectors", JSON.stringify(profile.fields));
  } else {
    localStorage.setItem("freelancer_title", profile.title);
  }

  if (profile.profileImage) {
    localStorage.setItem(`${prefix}_image`, profile.profileImage);
  } else {
    localStorage.removeItem(`${prefix}_image`);
  }
}

function EditProfile({ profile, onSave, onCancel, variant }) {
  const [draft, setDraft] = useState(profile);
  const isClient = variant === "client";
  const imageInputRef = useRef(null);

  const toggleField = (field) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.includes(field)
        ? current.fields.filter((item) => item !== field)
        : [...current.fields, field],
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Veuillez choisir une image de moins de 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () =>
      setDraft((current) => ({
        ...current,
        profileImage: reader.result,
      }));
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeImage = () => {
    setDraft((current) => ({ ...current, profileImage: null }));
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-header">
        <h1>Modifier le profil</h1>
        <p>Mettez a jour vos informations personnelles et professionnelles</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="edit-profile-section">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Photo de profil <span className="section-optional-label">(optionnel)</span>
          </h2>

          <div className="profile-image-upload">
            <div className={`profile-image-preview ${draft.profileImage ? "has-image" : ""}`}>
              {draft.profileImage ? (
                <img src={draft.profileImage} alt="Profile" />
              ) : (
                <div className="profile-image-placeholder">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>Ajoutez votre portrait</span>
                </div>
              )}
            </div>

            <div className="profile-image-controls">
              <span className={`profile-image-badge ${draft.profileImage ? "is-active" : ""}`}>
                {draft.profileImage ? "Photo actuelle" : "Photo optionnelle"}
              </span>
              <div className="profile-image-info">
                <h3>Choisissez une nouvelle photo</h3>
                <p>Gardez un profil net et professionnel avec une image facilement reconnaissable.</p>
              </div>
              <div className="profile-image-actions">
                <button
                  type="button"
                  className="profile-image-trigger"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {draft.profileImage ? "Modifier la photo" : "Choisir une photo"}
                </button>
                {draft.profileImage && (
                  <button type="button" className="profile-image-remove" onClick={removeImage}>
                    Supprimer
                  </button>
                )}
              </div>
              <input
                ref={imageInputRef}
                id="edit-image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
              />
              <div className="profile-image-specs">
                <span className={`profile-image-spec ${draft.profileImage ? "is-active" : ""}`}>
                  {draft.profileImage ? "Apercu pret" : "Aucune photo selectionnee"}
                </span>
                <span className="profile-image-spec">JPG, PNG ou GIF</span>
                <span className="profile-image-spec">Max 5 MB</span>
              </div>
            </div>
          </div>
        </div>

        <div className="edit-profile-section">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Informations personnelles
          </h2>
          <div className="edit-profile-grid">
            <div className="edit-profile-field">
              <label>Nom complet</label>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Votre nom"
              />
            </div>
            {isClient && (
              <div className="edit-profile-field">
                <label>Entreprise</label>
                <input
                  type="text"
                  value={draft.company || ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, company: event.target.value }))
                  }
                  placeholder="Nom de l'entreprise"
                />
              </div>
            )}
            <div className="edit-profile-field">
              <label>{isClient ? "Fonction" : "Titre professionnel"}</label>
              <input
                type="text"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder={isClient ? "Ex: Product Owner" : "Ex: Senior Developer"}
              />
            </div>
            <div className="edit-profile-field">
              <label>Localisation</label>
              <input
                type="text"
                value={draft.location}
                onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))}
                placeholder="Ville, Pays"
              />
            </div>
            <div className="edit-profile-field">
              <label>Email</label>
              <input
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="votre@email.com"
              />
            </div>
            <div className="edit-profile-field">
              <label>Telephone</label>
              <input
                type="tel"
                value={draft.phone}
                onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+216 XX XXX XXX"
              />
            </div>
          </div>
        </div>

        <div className="edit-profile-section">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Bio professionnelle
          </h2>
          <textarea
            className="edit-profile-bio"
            rows={5}
            value={draft.bio}
            onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Decrivez votre experience..."
          />
        </div>

        <div className="edit-profile-section">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {isClient ? "Secteurs et besoins" : "Domaines d'expertise"}
          </h2>
          <div className="edit-profile-fields-grid">
            {ALL_FIELDS.map((field) => (
              <button
                key={field}
                type="button"
                className={`edit-profile-field-btn ${draft.fields.includes(field) ? "active" : ""}`}
                onClick={() => toggleField(field)}
              >
                {draft.fields.includes(field) && <span className="edit-field-check">✓</span>}
                {field}
              </button>
            ))}
          </div>
        </div>

        <div className="edit-profile-actions">
          <button type="button" className="edit-profile-cancel" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="edit-profile-save">
            Sauvegarder les modifications
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function FreelancerProfile({ onBack, variant = "freelancer", stats }) {
  const [showEdit, setShowEdit] = useState(false);
  const isClient = variant === "client";
  const [profile, setProfile] = useState(() => readProfile(variant));
  const resolvedStats = stats?.length ? stats : DEFAULT_STATS[variant] || DEFAULT_STATS.freelancer;

  const handleSave = (updatedProfile) => {
    setProfile(updatedProfile);
    persistProfile(variant, updatedProfile);
    setShowEdit(false);
  };

 const handleShareProfile = async () => {
  const profileSlug = profile.name.toLowerCase().replace(/\s+/g, "-");
  const profileUrl = `${window.location.origin}/profile/${profileSlug}`;

  try {
    await navigator.clipboard.writeText(profileUrl);
    alert(`✓ Lien copié !\n${profileUrl}`);
  } catch {
    alert(`Lien : ${profileUrl}`);
  }
};

  if (showEdit) {
    return (
      <div className="freelancer-profile-shell">
        <div className="freelancer-profile-content">
          <EditProfile
            profile={profile}
            onSave={handleSave}
            onCancel={() => setShowEdit(false)}
            variant={variant}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="freelancer-profile-shell">
      <div className="freelancer-profile-content profile-page">
        <button onClick={onBack} className="profile-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Retour au tableau de bord
        </button>

        <div className="profile-header-card">
          <div className="profile-header-bg" />
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="profile-avatar-img" />
                ) : (
                  profile.name
                    .split(" ")
                    .map((item) => item[0])
                    .join("")
                    .slice(0, 2)
                )}
              </div>
              <span className="profile-online-dot" />
            </div>

            <div className="profile-header-info">
              <h1 className="profile-name">{profile.name}</h1>
              <p className="profile-title">
                {isClient && profile.company ? `${profile.title} - ${profile.company}` : profile.title}
              </p>
              <div className="profile-tags-row">
                <span className="profile-tag profile-tag-green">
                  {isClient ? "Compte client" : "Disponible"}
                </span>
                <span className="profile-tag profile-tag-gray">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {profile.location}
                </span>
              </div>
            </div>

            <div className="profile-header-actions">
              <div className="profile-reputation-card">
                <span className="profile-reputation-label">
                  {isClient ? "ACTIVITE CLIENT" : "TOTAL REPUTATION"}
                </span>
                <span className="profile-reputation-value">{isClient ? "Actif" : "3 280 pts"}</span>
              </div>
              <button type="button" className="profile-edit-btn" onClick={() => setShowEdit(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Editer le profil
              </button>
              <button type="button" className="profile-share-btn" onClick={handleShareProfile}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Partager
              </button>
            </div>
          </div>
        </div>

        <div className="profile-stats-grid">
          {resolvedStats.map((item) => (
            <StatsCard
              key={item.label}
              label={item.label}
              value={item.value}
              delta={item.delta}
              accent={item.accent}
            />
          ))}
        </div>

        <div className="profile-section-card">
          <h2 className="profile-section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            À propos
          </h2>
          <p className="profile-bio-text">{profile.bio}</p>
        </div>

        <div className="profile-section-card">
          <h2 className="profile-section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {isClient ? "Secteurs et besoins" : "Domaines d'expertise"}
          </h2>
          <div className="profile-fields-wrap">
            {profile.fields.map((field) => (
              <span key={field} className="profile-field-tag">
                {field}
              </span>
            ))}
          </div>
        </div>

        <div className="profile-section-card">
          <h2 className="profile-section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Informations de contact
          </h2>
          <div className="profile-contact-info">
            <div className="profile-contact-item">
              <span className="profile-contact-label">Email</span>
              <a href={`mailto:${profile.email}`} className="profile-contact-value">
                {profile.email}
              </a>
            </div>
            <div className="profile-contact-item">
              <span className="profile-contact-label">Téléphone</span>
              <a href={`tel:${profile.phone}`} className="profile-contact-value">
                {profile.phone}
              </a>
            </div>
            <div className="profile-contact-item">
              <span className="profile-contact-label">Localisation</span>
              <span className="profile-contact-value">{profile.location}</span>
            </div>
          </div>
        </div>

        <div className="profile-section-card">
          <div className="profile-section-header">
            <h2 className="profile-section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Avis recents
            </h2>
            <button type="button" className="profile-see-all-btn">
              Tout voir
            </button>
          </div>
          <FeedbackCard feedback={sampleFeedback} />
        </div>
      </div>
    </div>
  );
}
