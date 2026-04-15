import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import "../../styles/landing.css";

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
        throw new Error("Réponse de connexion invalide.");
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
        localStorage.setItem("suspension_reason", user.suspensionReason || "Violation des règles de la plateforme.");
        localStorage.setItem("suspended_until", user.suspendedUntil || "");

        navigate("/blocked-access");
        return;
      }

      if (!token || !role) {
        throw new Error("Réponse de connexion invalide.");
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
      localStorage.removeItem("client_entry_page");
      navigate("/app");
    } catch (error) {
      setErrorMessage(error.message || "Email ou mot de passe incorrect.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-branding">
        <div className="auth-branding-content">
          <Link to="/" className="auth-branding-logo">
            <div className="auth-branding-logo-icon">Fy</div>
            <span>Freelancy</span>
          </Link>
          <h2 className="auth-branding-title">
            Bienvenue sur votre <span>plateforme freelance</span>
          </h2>
          <p className="auth-branding-desc">
            Connectez-vous pour accéder à votre espace de travail, gérer vos projets et collaborer avec des professionnels de haut niveau.
          </p>
          <div className="auth-branding-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <div>
                <div className="auth-feature-title">Paiement sécurisé</div>
                <div className="auth-feature-desc">Système d'escrow intégré</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <div>
                <div className="auth-feature-title">Livraison rapide</div>
                <div className="auth-feature-desc">Suivi en temps réel</div>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🏆</div>
              <div>
                <div className="auth-feature-title">Talents vérifiés</div>
                <div className="auth-feature-desc">Professionnels certifiés</div>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-branding-shapes">
          <div className="auth-shape auth-shape-1" />
          <div className="auth-shape auth-shape-2" />
          <div className="auth-shape auth-shape-3" />
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h1 className="auth-title">Connexion</h1>
            <p className="auth-subtitle">Entrez vos identifiants pour accéder à votre compte</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Entrez votre mot de passe"
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

            {errorMessage && (
              <p style={{ color: "#d14343", fontSize: "14px", margin: "0 0 8px" }}>{errorMessage}</p>
            )}

            <div className="auth-options">
              <label className="auth-remember">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              <span>{isSubmitting ? "Connexion..." : "Se connecter"}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>

          <p className="auth-footer-link">
            Vous n'avez pas de compte?{" "}
            <Link to="/register">S'inscrire gratuitement</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
