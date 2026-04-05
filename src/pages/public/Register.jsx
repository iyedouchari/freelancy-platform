import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DOMAIN_OPTIONS } from "../../data/domains";
import { authService } from "../../services/authService";
import "../../styles/landing.css";

const CATEGORIES = DOMAIN_OPTIONS;

const Onboarding = ({ onComplete }) => {
  const [selectedFields, setSelectedFields] = useState([]);
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const imageInputRef = useRef(null);

  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
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
    if (selectedFields.length === 0) return alert("Choisissez au moins un domaine.");
    if (!bio.trim()) return alert("Veuillez ajouter une bio.");
    onComplete({ fields: selectedFields, bio, profileImage });
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <div className="auth-branding-logo-icon" style={{ width: 48, height: 48, fontSize: 17 }}>Fy</div>
            <span>Freelancy</span>
          </div>
          <div className="onboarding-progress">
            <div className="onboarding-progress-bar">
              <div
                className="onboarding-progress-fill"
                style={{ width: selectedFields.length > 0 && bio.trim() ? "100%" : selectedFields.length > 0 ? "60%" : "20%" }}
              />
            </div>
            <span className="onboarding-progress-text">
              {selectedFields.length > 0 && bio.trim() ? "Prêt !" : "Complétez votre profil"}
            </span>
          </div>
        </div>

        <div className="onboarding-content">
          <h1 className="onboarding-title">
            Bienvenue ! 🎉 <br />
            <span>Personnalisez votre profil</span>
          </h1>
          <p className="onboarding-subtitle">
            Choisissez vos domaines d'expertise et ajoutez une bio pour que les clients puissent vous trouver facilement.
          </p>

          <form onSubmit={handleSubmit} className="onboarding-form">
            {/* Profile Image Upload */}
            <div className="onboarding-section">
              <h2 className="onboarding-section-title">
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
                    {profileImage ? "Photo importée" : "Photo optionnelle"}
                  </span>
                  <div className="profile-image-info">
                    <h3>Choisissez votre photo de profil</h3>
                    <p>Une photo claire rend votre inscription plus professionnelle et inspire confiance aux clients.</p>
                  </div>
                  <div className="profile-image-actions">
                    <button type="button" className="profile-image-trigger" onClick={openImagePicker}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      {profileImage ? "Changer la photo" : "Choisir une photo"}
                    </button>
                    {profileImage && (
                      <button type="button" className="profile-image-remove" onClick={removeImage}>
                        Supprimer
                      </button>
                    )}
                  </div>
                  <input
                    ref={imageInputRef}
                    id="onboarding-image-input"
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
            <div className="onboarding-section">
              <h2 className="onboarding-section-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Vos domaines d'expertise
                <span className="onboarding-counter">{selectedFields.length} sélectionné{selectedFields.length !== 1 ? "s" : ""}</span>
              </h2>
              <div className="onboarding-fields-grid">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`onboarding-field-btn ${selectedFields.includes(cat) ? "active" : ""}`}
                    onClick={() => toggleField(cat)}
                  >
                    {selectedFields.includes(cat) && <span className="onboarding-field-check">✓</span>}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-section">
              <h2 className="onboarding-section-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Votre bio professionnelle
              </h2>
              <textarea
                className="onboarding-bio"
                rows={5}
                placeholder="Décrivez votre expérience, vos compétences et ce que vous pouvez apporter aux clients..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <div className="onboarding-bio-hint">
                {bio.length}/500 caractères
              </div>
            </div>

            <button
              type="submit"
              className="onboarding-submit"
              disabled={selectedFields.length === 0 || !bio.trim()}
            >
              <span>Commencer à explorer</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const RegistrationSuccess = ({ title, message, onLogin }) => (
  <div className="auth-page">
    <div className="auth-branding">
      <div className="auth-branding-content">
        <Link to="/" className="auth-branding-logo">
          <div className="auth-branding-logo-icon">Fy</div>
          <span>Freelancy</span>
        </Link>
        <h2 className="auth-branding-title">
          Votre inscription est <span>bien enregistree</span>
        </h2>
        <p className="auth-branding-desc">
          Le compte a ete cree avec succes. Vous pouvez maintenant revenir a la connexion pour
          acceder a la plateforme.
        </p>
      </div>
      <div className="auth-branding-shapes">
        <div className="auth-shape auth-shape-1" />
        <div className="auth-shape auth-shape-2" />
        <div className="auth-shape auth-shape-3" />
      </div>
    </div>

    <div className="auth-form-side">
      <div className="auth-form-container auth-success-card">
        <div className="auth-success-check">✓</div>
        <div className="auth-form-header">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{message}</p>
        </div>

        <div className="auth-success-actions">
          <button type="button" className="auth-submit" onClick={onLogin}>
            <span>Aller a la connexion</span>
          </button>
          <p className="auth-footer-link">
            <Link to="/">Retour a l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Register = () => {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return alert("Veuillez choisir votre rôle.");
    if (password !== confirmPassword) return alert("Les mots de passe ne correspondent pas.");
    if (password.length < 10) return alert("Le mot de passe doit contenir au moins 10 caracteres.");
    if (!acceptTerms) return alert("Veuillez accepter les conditions d'utilisation.");

    setErrorMessage("");
    setIsSubmitting(true);

    const normalizedName = name.trim();
    const normalizedCompany = company.trim();
    const normalizedTitle = title.trim();
    const normalizedLocation = location.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    try {
      await authService.register({
        name: normalizedName,
        company: normalizedCompany,
        title: normalizedTitle,
        location: normalizedLocation,
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        role,
      });

      localStorage.removeItem("app_role");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("client_entry_page");

      if (role === "freelancer") {
        setShowOnboarding(true);
      } else {
        localStorage.setItem("client_name", normalizedName);
        localStorage.setItem("client_company", normalizedCompany);
        localStorage.setItem("client_role_title", normalizedTitle);
        localStorage.setItem("client_location", normalizedLocation);
        localStorage.setItem("client_email", normalizedEmail);
        localStorage.setItem("client_phone", normalizedPhone);
        setRegistrationSuccess({
          title: "Inscription client reussie",
          message:
            "Votre compte client a ete cree avec succes. Connectez-vous quand vous etes pret a publier vos demandes.",
        });
      }
    } catch (error) {
      setErrorMessage(error.message || "Echec de l'inscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardingComplete = (data) => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    localStorage.removeItem("app_role");
    localStorage.setItem("freelancer_fields", JSON.stringify(data.fields));
    localStorage.setItem("freelancer_bio", data.bio);
    localStorage.setItem("freelancer_name", normalizedName);
    localStorage.setItem("freelancer_title", title.trim());
    localStorage.setItem("freelancer_location", location.trim());
    localStorage.setItem("freelancer_email", normalizedEmail);
    localStorage.setItem("freelancer_phone", phone.trim());
    localStorage.removeItem("client_entry_page");
    if (data.profileImage) {
      localStorage.setItem("freelancer_image", data.profileImage);
    }
    setShowOnboarding(false);
    setRegistrationSuccess({
      title: "Inscription freelance réussie",
      message:
        "Votre profil freelance est prêt. Connectez-vous pour commencer à explorer les projets.",
    });
  };

  if (registrationSuccess) {
    return (
      <RegistrationSuccess
        title={registrationSuccess.title}
        message={registrationSuccess.message}
        onLogin={() => navigate("/login")}
      />
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="auth-page">
      {/* Left side — branding panel */}
      <div className="auth-branding">
        <div className="auth-branding-content">
          <Link to="/" className="auth-branding-logo">
            <div className="auth-branding-logo-icon">Fy</div>
            <span>Freelancy</span>
          </Link>
          <h2 className="auth-branding-title">
            Rejoignez la communauté <span>Freelancy</span>
          </h2>
          <p className="auth-branding-desc">
            Créez votre compte gratuitement et commencez à collaborer avec des milliers de professionnels et d'entreprises du monde entier.
          </p>
          <div className="auth-branding-stats">
            <div className="auth-stat">
              <div className="auth-stat-value">10K+</div>
              <div className="auth-stat-label">Freelances actifs</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-value">5K+</div>
              <div className="auth-stat-label">Projets livrés</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat-value">98%</div>
              <div className="auth-stat-label">Satisfaction</div>
            </div>
          </div>
        </div>
        <div className="auth-branding-shapes">
          <div className="auth-shape auth-shape-1" />
          <div className="auth-shape auth-shape-2" />
          <div className="auth-shape auth-shape-3" />
        </div>
      </div>

      {/* Right side — form */}
      <div className="auth-form-side">
        <div className="auth-form-container auth-form-container-register">
          <div className="auth-form-header">
            <h1 className="auth-title">Créer un compte</h1>
            <p className="auth-subtitle">Remplissez le formulaire pour commencer votre aventure</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Role selection */}
            <div className="auth-field">
              <label className="auth-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                Je suis un :
              </label>
              <div className="role-cards">
                <div
                  className={`role-card ${role === "freelancer" ? "active" : ""}`}
                  onClick={() => setRole("freelancer")}
                >
                  <div className="role-card-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                      <line x1="12" y1="12" x2="12" y2="12.01" />
                    </svg>
                  </div>
                  <div className="role-card-title">Freelance</div>
                  <div className="role-card-desc">Je propose mes services et mon expertise</div>
                  {role === "freelancer" && <div className="role-card-check">✓</div>}
                </div>
                <div
                  className={`role-card ${role === "client" ? "active" : ""}`}
                  onClick={() => setRole("client")}
                >
                  <div className="role-card-icon-wrap">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div className="role-card-title">Client</div>
                  <div className="role-card-desc">Je cherche un freelance pour mon projet</div>
                  {role === "client" && <div className="role-card-check">✓</div>}
                </div>
              </div>
            </div>

            <div className="auth-fields-row">
              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  Nom complet
                </label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Votre nom et prénom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7h18" />
                    <path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                  </svg>
                  Entreprise
                </label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Nom de l'entreprise"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-fields-row">
              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  Fonction
                </label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Ex: Product Owner"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  Localisation
                </label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Ville, Pays"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-fields-row">
              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.87 19.87 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.87 19.87 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Téléphone
                </label>
                <input
                  className="auth-input"
                  type="tel"
                  placeholder="+216 XX XXX XXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Adresse email
                </label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-fields-row">
              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Mot de passe
                </label>
                <div className="auth-input-wrapper">
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Créez un mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Confirmer le mot de passe
                </label>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <label className="auth-terms">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span>
                J'accepte les <a href="#">conditions d'utilisation</a> et la{" "}
                <a href="#">politique de confidentialité</a>
              </span>
            </label>

            {errorMessage && (
              <p style={{ color: "#d14343", fontSize: "14px", margin: "0 0 8px" }}>{errorMessage}</p>
            )}

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? "Creation..." : "Créer mon compte"}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          <p className="auth-footer-link">
            Vous avez déjà un compte?{" "}
            <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
