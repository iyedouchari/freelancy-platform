import { Link } from "react-router-dom";
import "../../styles/landing.css";

function resetSessionForLogin() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("app_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("client_entry_page");
  localStorage.removeItem("freelancer_active_page");
  localStorage.removeItem("freelancer_selected_deal_id");
  localStorage.removeItem("client_active_page");
  localStorage.removeItem("client_selected_deal_id");
}

const Landing = () => (
  <div>
    {/* ─── Navbar ─── */}
    <nav className="landing-navbar">
      <div className="landing-navbar-inner">
        <Link to="/" className="landing-logo">
          <img src="/brand-logo.png" alt="Freelancy logo" className="landing-brand-logo" />
        </Link>
        <ul className="landing-nav-links">
          <li><a href="#hero">Accueil</a></li>
          <li><a href="#how">Comment ça marche</a></li>
          <li><a href="#trust">Caractéristiques</a></li>
        </ul>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn-login" onClick={resetSessionForLogin}>Se connecter</Link>
          <Link to="/register" className="btn-signup">S'inscrire</Link>
        </div>
      </div>
    </nav>

    {/* ─── Hero ─── */}
    <section className="hero-section" id="hero">
      <div className="hero-inner">
        <div>
          <h1 className="hero-title">
            Trouvez les<br />
            meilleurs <span>freelancers</span><br />
            pour vos projets
          </h1>
          <p className="hero-subtitle">
            Connectez-vous avec des professionnels de haut niveau, négociez
            en toute sécurité et finalisez vos projets plus rapidement grâce à
            notre système de paiement garanti.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn-primary">Démarrer votre projet</Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          {/* Ambient luminous glow blobs */}
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />

          {/* Central Main Showcase Card */}
          <div className="hero-showcase-card">
            <div className="hsc-header">
              <div className="hsc-live-pill">
                <span className="hsc-live-pulse" />
                <span className="hsc-live-text">Mission en cours</span>
              </div>
              <span className="hsc-tech-tag">React &amp; Node.js</span>
            </div>

            <div className="hsc-body">
              <div className="hsc-project-header">
                <h3 className="hsc-project-title">Refonte Plateforme SaaS &amp; Mobile</h3>
                <span className="hsc-budget-val">2 850 DT</span>
              </div>

              <div className="hsc-talent-row">
                <div className="hsc-avatar-wrap">
                  <img
                    src="/avatars/amira.jpg"
                    alt="Amira K."
                    className="hsc-avatar-img"
                  />
                  <span className="hsc-online-dot" />
                </div>
                <div className="hsc-talent-info">
                  <div className="hsc-talent-name-row">
                    <span className="hsc-talent-name">Amira K.</span>
                    <span className="hsc-verified-pro" title="Freelance Certifié">
                      <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                      <span>Pro Vérifié</span>
                    </span>
                  </div>
                  <p className="hsc-talent-subtitle">
                    Développeuse Fullstack • <strong className="hsc-star">★ 4.9</strong> <span className="hsc-reviews">(46 avis)</span>
                  </p>
                </div>
              </div>

              <div className="hsc-progress-wrap">
                <div className="hsc-progress-meta">
                  <span className="hsc-meta-title">Avancement du projet</span>
                  <span className="hsc-meta-stage">Étape 2 sur 3 • <strong>70%</strong></span>
                </div>
                <div className="hsc-progress-track">
                  <div className="hsc-progress-bar" style={{ width: "70%" }} />
                </div>
              </div>

              <div className="hsc-footer-row">
                <div className="hsc-escrow-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Escrow Garanti</span>
                </div>
                <span className="hsc-time-left">Livraison dans 4 jours</span>
              </div>
            </div>
          </div>

          {/* Floating Card 1: Paiement Sécurisé Garanti */}
          <div className="floating-card fc-payment">
            <div className="fc-icon fc-icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="fc-content">
              <div className="fc-top-line">
                <span className="fc-title">Paiement 100% Sécurisé</span>
                <span className="fc-pill fc-pill-green">
                  <span className="fc-pill-dot" />
                  Dépôt Actif
                </span>
              </div>
              <div className="fc-amount">2 450 DT protégés</div>
              <div className="fc-sub">Fonds garantis sous séquestre</div>
            </div>
          </div>

          {/* Floating Card 2: Nouvelle Proposition (Modern, replacing Mahdi Braiek) */}
          <div className="floating-card fc-proposal">
            <div className="fc-avatar-container">
              <img
                src="/avatars/sami.jpg"
                alt="Sami K."
                className="fc-avatar-img"
              />
              <span className="fc-avatar-pulse-dot" />
            </div>
            <div className="fc-content">
              <div className="fc-top-line">
                <span className="fc-title">Nouvelle proposition reçue</span>
                <span className="fc-pill fc-pill-blue">Top Match 98%</span>
              </div>
              <div className="fc-author">Sami K. • Expert UI/UX &amp; React</div>
              <div className="fc-deal-info">
                <span className="fc-deal-price">1 400 DT</span>
                <span className="fc-deal-sep">•</span>
                <span className="fc-deal-time">5 jours</span>
                <span className="fc-deal-sep">•</span>
                <span className="fc-rating-pill">★ 5.0</span>
              </div>
            </div>
          </div>

          {/* Floating Card 3: Livrable Validé & Déblocage instantané */}
          <div className="floating-card fc-delivered">
            <div className="fc-avatar-container">
              <img
                src="/avatars/client.jpg"
                alt="Client vérifié"
                className="fc-avatar-img"
              />
              <span className="fc-avatar-badge-star" title="Note 5.0">★</span>
            </div>
            <div className="fc-content">
              <div className="fc-top-line">
                <span className="fc-title">Livrable validé avec succès</span>
                <span className="fc-stars">★★★★★ 5.0</span>
              </div>
              <div className="fc-quote">« Travail d'exception, communication parfaite ! »</div>
              <div className="fc-release-badge">
                <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                </svg>
                <span>Fonds débloqués instantanément</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ─── Comment ça marche ─── */}
    <section className="how-section" id="how">
      <div className="how-inner">
        <h2 className="section-title">Comment ça marche</h2>
        <p className="section-sub">
          Notre processus simple assure le succès du début à la fin, avec la
          sécurité intégrée à chaque étape.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">Publiez un projet</div>
            <div className="step-desc">
              Décrivez vos besoins, votre budget et votre délai facilement.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">Examinez les propositions</div>
            <div className="step-desc">
              Recevez des offres de freelancers de qualité et négociez.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">Paiement sécurisé</div>
            <div className="step-desc">
              Financez le projet en toute sécurité via nos dépôts.
            </div>
          </div>
          <div className="step-card">
            <div className="step-num">Obtenez votre travail</div>
            <div className="step-desc">
              Approuvez la livraison finale et libérez les fonds.
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ─── Conçu pour la confiance ─── */}
    <section className="trust-section" id="trust">
      <div className="trust-inner">
        <h2 className="section-title">Conçu pour la confiance</h2>
        <p className="section-sub">
          Tout ce dont vous avez besoin pour gérer vos projets freelance en toute
          sécurité et efficacité au même endroit.
        </p>
        <div className="trust-grid">
          <div className="trust-card">
            <div className="trust-card-header">
              <div className="trust-card-title">Négociation intelligente</div>
            </div>
            <p className="trust-card-desc">
              Vous avez trouvé le partenaire idéal mais le budget ne correspond
              pas ? Utilisez notre interface de négociation sécurisée intégrée
              pour discuter des termes, ajuster les étendues et établir un
              terrain d'entente avant de vous engager sur tout paiement.
            </p>
            <ul className="trust-points">
              <li>Proposez des budgets alternatifs</li>
              <li>Communication chiffrée</li>
              <li>Confirmation des conditions en un clic</li>
            </ul>
          </div>
          <div className="trust-card">
            <div className="trust-card-header">

              <div className="trust-card-title">Portefeuille d'escrow</div>
            </div>
            <p className="trust-card-desc">
              Vos fonds sont toujours protégés. Les clients déposent une
              première étape pour démarrer le projet, et le reste est sécurisé
              dans notre système d'escrow jusqu'à ce que la livraison finale
              soit examinée et approuvée.
            </p>
            <ul className="trust-points">
              <li>Paiements de freelance garantis</li>
              <li>Libérations par étape</li>
              <li>Résolution de différends intégrée</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* ─── Footer ─── */}
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <div className="landing-logo" style={{ color: "#fff" }}>
            <img src="/brand-logo.png" alt="Freelancy logo" className="landing-brand-logo" />
          </div>
          <p>La place de marché élégante pour freelances et clients exigeants.</p>
        </div>
        <div>
          <h4>Pour les clients</h4>
          <ul>
            <li>Découvrir des freelances</li>
            <li>Publier un projet</li>
            <li>Choisir un budget</li>
            <li>Garantir la qualité</li>
          </ul>
        </div>
        <div>
          <h4>Pour les freelances</h4>
          <ul>
            <li>Trouver des missions</li>
            <li>Soigner son profil</li>
            <li>Envoyer des offres</li>
            <li>Conclure en sécurité</li>
          </ul>
        </div>
        <div>
          <h4>Entreprise</h4>
          <ul>
            <li>À propos</li>
            <li>Contact</li>
            <li>Confidentialité</li>
            <li>Conditions</li>
          </ul>
        </div>
      </div>
      <div className="landing-footer-bottom">
        <div className="landing-footer-bottom-inner">
          <span>© 2026 Freelancy. Tous droits réservés.</span>
          <span>Démo — navigation limitée</span>
        </div>
      </div>
    </footer>
  </div>
);

export default Landing;
