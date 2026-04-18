import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "./src/services/authService";
import "./src/styles/landing.css";
import "./src/styles/login.css";

function formatFreelancerName(email) {
  const username = email.split("@")[0] || "freelancer";
  return username.charAt(0).toUpperCase() + username.slice(1);
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await authService.login({
        email: normalizedEmail,
        password,
      });

      const user = result?.user;
      const token = result?.token;
      const role = user?.role;

      if (!user) {
        throw new Error("Reponse de connexion invalide.");
      }

      if (user.isSuspended) {
        localStorage.removeItem("token");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("app_role");
        localStorage.removeItem("user_id");
        localStorage.removeItem("client_entry_page");

        localStorage.setItem("is_suspended", "true");
        localStorage.setItem("suspension_reason", user.suspensionReason || "Violation des regles de la plateforme.");
        localStorage.setItem("suspended_until", user.suspendedUntil || "");

        navigate("/blocked-access");
        return;
      }

      if (!token || !role) {
        throw new Error("Reponse de connexion invalide.");
      }

      localStorage.removeItem("is_suspended");
      localStorage.removeItem("suspension_reason");
      localStorage.removeItem("suspended_until");
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      sessionStorage.removeItem("token");
      localStorage.setItem("auth_token", token);
      localStorage.setItem("app_role", role);
      localStorage.setItem("user_id", String(user.id ?? user.userId ?? ""));

      if (role === "client") {
        localStorage.setItem("client_name", user.name || "Client");
        localStorage.setItem("client_company", user.company || "");
        localStorage.setItem("client_role_title", user.title || "Product Owner");
        localStorage.setItem("client_location", user.location || "Remote");
        localStorage.setItem("client_email", user.email || normalizedEmail);
        localStorage.setItem("client_phone", user.phone || "");
        if (user.avatarUrl) {
          localStorage.setItem("client_image", user.avatarUrl);
        } else {
          localStorage.removeItem("client_image");
        }
        localStorage.setItem("client_entry_page", "workspace");
        navigate("/client");
        return;
      }

      if (role === "admin") {
        localStorage.removeItem("client_entry_page");
        navigate("/admin");
        return;
      }

      localStorage.setItem("freelancer_name", user.name || formatFreelancerName(normalizedEmail));
      localStorage.setItem("freelancer_title", user.title || "Freelance");
      localStorage.setItem("freelancer_location", user.location || "Remote");
      localStorage.setItem("freelancer_email", user.email || normalizedEmail);
      localStorage.setItem("freelancer_phone", user.phone || "");
      if (user.avatarUrl) {
        localStorage.setItem("freelancer_image", user.avatarUrl);
      } else {
        localStorage.removeItem("freelancer_image");
      }
      localStorage.removeItem("client_entry_page");
      navigate("/app");
    } catch (error) {
      setErrorMessage(error.message || "Email ou mot de passe incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-branding">
        <div className="login-aurora" />
        <div className="login-grid-pattern" />
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-orb login-orb-4" />

        <div className="login-particles" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="login-particle" />
          ))}
        </div>

        <div className="login-connection-lines" aria-hidden="true">
          <div className="login-connection-line" />
          <div className="login-connection-line" />
          <div className="login-connection-line" />
        </div>

        <div className="login-branding-content">
          <Link to="/" className="login-brand-logo">
            <div className="login-brand-logo-icon">Fy</div>
            <span>Freelancy</span>
          </Link>

          <h2 className="login-brand-headline">
            Bienvenue sur votre <span className="login-gradient-text">plateforme freelance</span>
          </h2>

          <p className="login-brand-description">
            Connectez-vous pour acceder a votre espace de travail, gerer vos projets et collaborer avec des professionnels de haut niveau.
          </p>

          <div className="login-features">
            <div className="login-feature-card">
              <div className="login-feature-icon icon-shield">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="login-feature-info">
                <div className="login-feature-label">Paiement securise</div>
                <div className="login-feature-sublabel">Systeme d'escrow integre pour chaque transaction</div>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon icon-bolt">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="login-feature-info">
                <div className="login-feature-label">Livraison rapide</div>
                <div className="login-feature-sublabel">Suivi en temps reel de chaque etape du projet</div>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon icon-star">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="login-feature-info">
                <div className="login-feature-label">Talents verifies</div>
                <div className="login-feature-sublabel">Professionnels certifies et evalues par la communaute</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-form-card">
            <div className="login-form-header">
              <div className="login-welcome-badge">
                <span className="login-welcome-badge-dot" />
                Espace membre
              </div>
              <h1 className="login-form-title">Connexion</h1>
              <p className="login-form-subtitle">Entrez vos identifiants pour acceder a votre compte</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label className="login-label" htmlFor="login-email-input">Adresse email</label>
                <input
                  id="login-email-input"
                  className="login-input"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="login-password-input">Mot de passe</label>
                <div className="login-input-wrap">
                  <input
                    id="login-password-input"
                    className="login-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="login-error">
                  <span className="login-error-icon">!</span>
                  {errorMessage}
                </div>
              )}

              <div className="login-options">
                <label className="login-remember">
                  <span className="login-checkbox-custom">
                    <input type="checkbox" />
                    <span className="login-checkbox-visual" />
                  </span>
                  <span>Se souvenir de moi</span>
                </label>
              </div>

              <button type="submit" className="login-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="login-spinner" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <span>Se connecter</span>
                )}
              </button>
            </form>
          </div>

          <div className="login-footer-area">
            <p className="login-footer-link">
              Vous n'avez pas de compte ? <Link to="/register">S'inscrire gratuitement</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
