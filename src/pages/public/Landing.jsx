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
          <div className="landing-logo-icon">Fy</div>
          <span className="landing-logo-text">Freelancy</span>
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
        <div className="hero-visual">
          <div className="hero-blob" />
          <div className="floating-card">
            <div className="fc-icon fc-icon-green">✓</div>
            <div>
              <div className="fc-title">Paiement sécurisé</div>
              <div className="fc-sub">Dépôt actif</div>
            </div>
          </div>
          <div className="floating-card">
            <div className="fc-icon fc-icon-blue">MB</div>
            <div>
              <div className="fc-title">Nouvelle proposition</div>
              <div className="fc-sub">De Mandi B.</div>
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
            <div className="step-icon">📋</div>
            <div className="step-num">1. Publiez un projet</div>
            <div className="step-desc">
              Décrivez vos besoins, votre budget et votre délai facilement.
            </div>
          </div>
          <div className="step-card">
            <div className="step-icon">👥</div>
            <div className="step-num">2. Examinez les propositions</div>
            <div className="step-desc">
              Recevez des offres de freelancers de qualité et négociez.
            </div>
          </div>
          <div className="step-card">
            <div className="step-icon">🔒</div>
            <div className="step-num">3. Paiement sécurisé</div>
            <div className="step-desc">
              Financez le projet en toute sécurité via nos dépôts.
            </div>
          </div>
          <div className="step-card">
            <div className="step-icon">✅</div>
            <div className="step-num">4. Obtenez votre travail</div>
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
              <div className="trust-card-icon">💎</div>
              <div className="trust-card-title">Négociation intelligente</div>
            </div>
            <p className="trust-card-desc">
              Vous avez trouvé le partenaire idéal mais le budget ne correspond
              pas ? Utilisez notre interface de négociation sécurisée intégrée
              pour discuter des termes, ajuster les étendues et établir un
              terrain d'entente avant de vous engager sur tout paiement.
            </p>
            <ul className="trust-points">
              <li><span className="trust-check">✓</span> Proposez des budgets alternatifs</li>
              <li><span className="trust-check">✓</span> Communication chiffrée</li>
              <li><span className="trust-check">✓</span> Confirmation des conditions en un clic</li>
            </ul>
          </div>
          <div className="trust-card">
            <div className="trust-card-header">
              <div className="trust-card-icon">🔐</div>
              <div className="trust-card-title">Portefeuille d'escrow</div>
            </div>
            <p className="trust-card-desc">
              Vos fonds sont toujours protégés. Les clients déposent une
              première étape pour démarrer le projet, et le reste est sécurisé
              dans notre système d'escrow jusqu'à ce que la livraison finale
              soit examinée et approuvée.
            </p>
            <ul className="trust-points">
              <li><span className="trust-check">✓</span> Paiements de freelance garantis</li>
              <li><span className="trust-check">✓</span> Libérations par étape</li>
              <li><span className="trust-check">✓</span> Résolution de différends intégrée</li>
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
            <div className="landing-logo-icon">Fy</div>
            <span className="landing-logo-text" style={{ color: "#fff" }}>Freelancy</span>
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
