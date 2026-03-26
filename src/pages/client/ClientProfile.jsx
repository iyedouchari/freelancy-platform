import { useRef, useState } from "react";
import { clientRequestCategories } from "../../data/clientData";
import "./ClientProfile.css";

function readClientProfile() {
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
    sectors: JSON.parse(
      localStorage.getItem("client_sectors") ||
        '["Developpement Web","UI/UX Design","Marketing Digital"]'
    ),
    profileImage: localStorage.getItem("client_image") || null,
  };
}

function EditClientProfile({ profile, onSave, onCancel }) {
  const [draft, setDraft] = useState(profile);
  const imageInputRef = useRef(null);

  const toggleSector = (sector) => {
    setDraft((current) => ({
      ...current,
      sectors: current.sectors.includes(sector)
        ? current.sectors.filter((item) => item !== sector)
        : [...current.sectors, sector],
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
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

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <div className="client-profile-edit">
      <div className="client-profile-edit-head">
        <h1>Modifier le profil client</h1>
        <p>Gardez vos informations a jour pour mieux cadrer les collaborations.</p>
      </div>

      <form className="client-profile-edit-form" onSubmit={handleSubmit}>
        <section className="client-profile-panel">
          <h2>Photo et informations publiques</h2>
          <div className="client-profile-image-row">
            <div className="client-profile-avatar large">
              {draft.profileImage ? (
                <img src={draft.profileImage} alt={draft.name} />
              ) : (
                draft.name
                  .split(" ")
                  .map((item) => item[0])
                  .join("")
                  .slice(0, 2)
              )}
            </div>
            <div className="client-profile-image-actions">
              <button type="button" onClick={() => imageInputRef.current?.click()}>
                Choisir une photo
              </button>
              {draft.profileImage && (
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setDraft((current) => ({ ...current, profileImage: null }))}
                >
                  Supprimer
                </button>
              )}
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

        <section className="client-profile-panel">
          <h2>Coordonnees</h2>
          <div className="client-profile-form-grid">
            <label>
              <span>Nom complet</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              <span>Entreprise</span>
              <input
                value={draft.company}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, company: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Fonction</span>
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Localisation</span>
              <input
                value={draft.location}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, location: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Telephone</span>
              <input
                value={draft.phone}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
          </div>
        </section>

        <section className="client-profile-panel">
          <h2>Presentation</h2>
          <label className="client-profile-textarea-field">
            <span>Bio</span>
            <textarea
              rows={6}
              value={draft.bio}
              onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
            />
          </label>
        </section>

        <section className="client-profile-panel">
          <h2>Secteurs suivis</h2>
          <div className="client-profile-sector-grid">
            {clientRequestCategories.map((sector) => (
              <button
                key={sector}
                type="button"
                className={`client-profile-sector-btn ${
                  draft.sectors.includes(sector) ? "active" : ""
                }`}
                onClick={() => toggleSector(sector)}
              >
                {sector}
              </button>
            ))}
          </div>
        </section>

        <div className="client-profile-edit-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit">Enregistrer le profil</button>
        </div>
      </form>
    </div>
  );
}

export default function ClientProfile({
  requestsCount,
  activeDealsCount,
  completedDealsCount,
  onBack,
}) {
  const [profile, setProfile] = useState(readClientProfile);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (nextProfile) => {
    setProfile(nextProfile);
    localStorage.setItem("client_name", nextProfile.name);
    localStorage.setItem("client_company", nextProfile.company);
    localStorage.setItem("client_role_title", nextProfile.title);
    localStorage.setItem("client_location", nextProfile.location);
    localStorage.setItem("client_email", nextProfile.email);
    localStorage.setItem("client_phone", nextProfile.phone);
    localStorage.setItem("client_bio", nextProfile.bio);
    localStorage.setItem("client_sectors", JSON.stringify(nextProfile.sectors));
    if (nextProfile.profileImage) {
      localStorage.setItem("client_image", nextProfile.profileImage);
    } else {
      localStorage.removeItem("client_image");
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="client-profile-shell">
        <div className="client-profile-content">
          <EditClientProfile
            profile={profile}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="client-profile-shell">
      <div className="client-profile-content">
        <button type="button" className="client-profile-back-btn" onClick={onBack}>
          Retour au tableau de bord
        </button>

        <section className="client-profile-hero">
          <div className="client-profile-avatar">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt={profile.name} />
            ) : (
              profile.name
                .split(" ")
                .map((item) => item[0])
                .join("")
                .slice(0, 2)
            )}
          </div>

          <div className="client-profile-hero-copy">
            <span className="client-profile-eyebrow">Profil client</span>
            <h1>{profile.name}</h1>
            <p>
              {profile.title} - {profile.company}
            </p>
            <div className="client-profile-tags">
              <span>{profile.location}</span>
              <span>{profile.email}</span>
            </div>
          </div>

          <div className="client-profile-hero-actions">
            <button type="button" onClick={() => setIsEditing(true)}>
              Modifier le profil
            </button>
          </div>
        </section>

        <section className="client-profile-stats">
          <article>
            <span>Demandes en attente</span>
            <strong>{requestsCount}</strong>
          </article>
          <article>
            <span>Deals en cours</span>
            <strong>{activeDealsCount}</strong>
          </article>
          <article>
            <span>Deals termines</span>
            <strong>{completedDealsCount}</strong>
          </article>
        </section>

        <section className="client-profile-panel">
          <h2>A propos</h2>
          <p>{profile.bio}</p>
        </section>

        <section className="client-profile-panel">
          <h2>Secteurs et besoins habituels</h2>
          <div className="client-profile-fields">
            {profile.sectors.map((sector) => (
              <span key={sector}>{sector}</span>
            ))}
          </div>
        </section>

        <section className="client-profile-panel">
          <h2>Coordonnees</h2>
          <div className="client-profile-contact-grid">
            <div>
              <span>Entreprise</span>
              <strong>{profile.company}</strong>
            </div>
            <div>
              <span>Fonction</span>
              <strong>{profile.title}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>
            <div>
              <span>Telephone</span>
              <strong>{profile.phone}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
