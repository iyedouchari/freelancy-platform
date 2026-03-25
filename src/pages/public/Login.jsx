import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/landing.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/app");
  };

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

      {/* Right side — form */}
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

            <div className="auth-options">
              <label className="auth-remember">
                <input type="checkbox" />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            <button type="submit" className="auth-submit">
              <span>Se connecter</span>
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
