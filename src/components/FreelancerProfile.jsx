import { useRef, useState } from "react";
import StatsCard from "./StatsCard";
import FeedbackCard from "./FeedbackCard";

const sampleFeedback = {
  client: "Emma Rodriguez",
  title: "CEO – FinFlow",
  comment:
    "David delivered outstanding work. His AI expertise helped us automate our hiring workflow and improve candidate screening dramatically.",
  stars: 5,
  date: "il y a 2 jours",
};

const EditProfile = ({ profile, onSave, onCancel }) => {
  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title);
  const [location, setLocation] = useState(profile.location);
  const [bio, setBio] = useState(profile.bio);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [fields, setFields] = useState(profile.fields || []);
  const [profileImage, setProfileImage] = useState(profile.profileImage || null);
  const imageInputRef = useRef(null);

  const ALL_FIELDS = [
    "Développement Web", "Développement Mobile", "UI/UX Design",
    "IA & Machine Learning", "Cloud & DevOps", "Data Science",
    "Jeu vidéo", "E-commerce", "Marketing Digital",
    "Rédaction & Contenu", "Traduction", "Vidéo & Animation",
  ];

  const toggleField = (f) => {
    setFields((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Veuillez choisir une image de moins de 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const removeImage = () => {
    setProfileImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, title, location, bio, email, phone, fields, profileImage });
  };

  return (
    <div className="edit-profile-page">
      <div className="edit-profile-header">
        <h1>Modifier le profil</h1>
        <p>Mettez à jour vos informations personnelles et professionnelles</p>
      </div>

      <form onSubmit={handleSubmit} className="edit-profile-form">
        {/* Profile Image */}
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
            <div className={`profile-image-preview ${profileImage ? "has-image" : ""}`}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
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
              <span className={`profile-image-badge ${profileImage ? "is-active" : ""}`}>
                {profileImage ? "Photo actuelle" : "Photo optionnelle"}
              </span>
              <div className="profile-image-info">
                <h3>Choisissez une nouvelle photo</h3>
                <p>Gardez un profil net et professionnel avec une image facilement reconnaissable.</p>
              </div>
              <div className="profile-image-actions">
                <button type="button" className="profile-image-trigger" onClick={openImagePicker}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {profileImage ? "Modifier la photo" : "Choisir une photo"}
                </button>
                {profileImage && (
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
                <span className={`profile-image-spec ${profileImage ? "is-active" : ""}`}>
                  {profileImage ? "Aperçu prêt" : "Aucune photo sélectionnée"}
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
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
            </div>
            <div className="edit-profile-field">
              <label>Titre professionnel</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Senior Developer" />
            </div>
            <div className="edit-profile-field">
              <label>Localisation</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ville, Pays" />
            </div>
            <div className="edit-profile-field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
            </div>
            <div className="edit-profile-field">
              <label>Téléphone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216 XX XXX XXX" />
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
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Décrivez votre expérience..."
          />
        </div>

        <div className="edit-profile-section">
          <h2>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Domaines d'expertise
          </h2>
          <div className="edit-profile-fields-grid">
            {ALL_FIELDS.map((f) => (
              <button
                key={f}
                type="button"
                className={`edit-profile-field-btn ${fields.includes(f) ? "active" : ""}`}
                onClick={() => toggleField(f)}
              >
                {fields.includes(f) && <span className="edit-field-check">✓</span>}
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="edit-profile-actions">
          <button type="button" className="edit-profile-cancel" onClick={onCancel}>Annuler</button>
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
};

const FreelancerProfile = ({ onBack }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [profile, setProfile] = useState({
    name: localStorage.getItem("freelancer_name") || "David Carter",
    title: "Senior AI Engineer",
    location: "Remote / Tunis",
    bio: localStorage.getItem("freelancer_bio") || "Ingénieur IA passionné avec plus de 5 ans d'expérience dans le développement de solutions d'intelligence artificielle. Spécialisé en NLP, computer vision et automatisation intelligente. J'aide les entreprises à transformer leurs processus métier grâce à l'IA.",
    email: "david.carter@email.com",
    phone: "+216 XX XXX XXX",
    fields: JSON.parse(localStorage.getItem("freelancer_fields") || '["IA & Machine Learning", "Développement Web", "Data Science"]'),
    profileImage: localStorage.getItem("freelancer_image") || null,
  });

  const handleSave = (updatedProfile) => {
    setProfile(updatedProfile);
    localStorage.setItem("freelancer_name", updatedProfile.name);
    localStorage.setItem("freelancer_bio", updatedProfile.bio);
    localStorage.setItem("freelancer_fields", JSON.stringify(updatedProfile.fields));
    if (updatedProfile.profileImage) {
      localStorage.setItem("freelancer_image", updatedProfile.profileImage);
    } else {
      localStorage.removeItem("freelancer_image");
    }
    setShowEdit(false);
  };

  if (showEdit) {
    return (
      <div className="layout-shell">
        <div className="content-area-wide">
          <EditProfile profile={profile} onSave={handleSave} onCancel={() => setShowEdit(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="layout-shell">
      <div className="content-area-wide profile-page">
        <button onClick={onBack} className="profile-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Retour aux projets
        </button>

        {/* Profile header */}
        <div className="profile-header-card">
          <div className="profile-header-bg" />
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {profile.profileImage ? (
                  <img src={profile.profileImage} alt={profile.name} className="profile-avatar-img" />
                ) : (
                  profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                )}
              </div>
              <span className="profile-online-dot" />
            </div>
            <div className="profile-header-info">
              <h1 className="profile-name">{profile.name}</h1>
              <p className="profile-title">{profile.title}</p>
              <div className="profile-tags-row">
                <span className="profile-tag profile-tag-green">Disponible</span>
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
                <span className="profile-reputation-label">TOTAL RÉPUTATION</span>
                <span className="profile-reputation-value">3 280 pts</span>
              </div>
              <button className="profile-edit-btn" onClick={() => setShowEdit(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Éditer le profil
              </button>
              <button className="profile-share-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Partager
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid">
          <StatsCard label="Avis" value="142" delta="+12%" accent="indigo" />
          <StatsCard label="Note moyenne" value="4.8" delta="+0.1" accent="indigo" />
          <StatsCard label="Taux de réussite" value="97%" delta="+2%" accent="green" />
        </div>

        {/* Bio section */}
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

        {/* Fields/Expertise section */}
        <div className="profile-section-card">
          <h2 className="profile-section-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Domaines d'expertise
          </h2>
          <div className="profile-fields-wrap">
            {profile.fields.map((f) => (
              <span key={f} className="profile-field-tag">{f}</span>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="profile-section-card">
          <div className="profile-section-header">
            <h2 className="profile-section-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Avis récents
            </h2>
            <button className="profile-see-all-btn">Tout voir</button>
          </div>
          <FeedbackCard feedback={sampleFeedback} />
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfile;
