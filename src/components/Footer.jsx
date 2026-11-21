import React from "react";
import "../styles/landing.css";

const Footer = () => {
  return (
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
          <span>© {new Date().getFullYear()} Freelancy. Tous droits réservés.</span>
          <div className="landing-footer-bottom-links">
            <a href="#privacy">Confidentialité</a>
            <span>•</span>
            <a href="#terms">Conditions d'utilisation</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
