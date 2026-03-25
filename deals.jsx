import { useState } from "react";
import { Link } from "react-router-dom"; // <-- Ajouter cet import

import "./deals.css";

const deals = [
  {
    id: 1,
    title: "Création d'un Site E-commerce React",
    client: "Tech Solutions Inc.",
    status: "En Cours",
    statusType: "progress",
    description:
      "Développement d'une plateforme e-commerce complète avec React.js, incluant la gestion des produits, le panier d'achat, le système de paiement en ligne et un tableau de bord administrateur responsive.",
    location: "Tunis, Tunisie",
    total: "14 800",
    remaining: "13 320",
    deadline: "18 mars 2026",
    daysLeft: 0,
    urgent: true,
  },
  {
    id: 2,
    title: "Rédaction de Contenu pour Blog Tech",
    client: "Digital Media Co.",
    status: "Soumis",
    statusType: "submitted",
    description:
      "Création de 20 articles de blog optimisés SEO sur les thèmes de l'intelligence artificielle, du cloud computing et des nouvelles technologies. Livraison hebdomadaire de 4 à 5 articles.",
    location: "Sfax, Tunisie",
    total: "3 700",
    remaining: "3 330",
    deadline: "10 mars 2026",
    daysLeft: 5,
    urgent: false,
  },
  {
    id: 3,
    title: "Conception d'Interface Mobile iOS/Android",
    client: "StartApp Ventures",
    status: "En Révision",
    statusType: "review",
    description:
      "Design UX/UI complet d'une application mobile multiplateforme (iOS & Android) incluant les maquettes, le prototypage interactif Figma, le système de design et la documentation des composants.",
    location: "Sousse, Tunisie",
    total: "10 800",
    remaining: "6 480",
    deadline: "2 avr. 2026",
    daysLeft: 9,
    urgent: false,
  },
];

const completedDeals = [
  {
    id: 4,
    title: "Refonte du Site Vitrine",
    client: "Agence Pixel",
    status: "Complété",
    statusType: "done",
    description:
      "Refonte complète du site vitrine avec une nouvelle identité visuelle, animations CSS avancées et optimisation des performances pour atteindre un score Lighthouse supérieur à 95.",
    location: "Tunis, Tunisie",
    total: "5 200",
    remaining: "0",
    deadline: "1 jan. 2026",
    daysLeft: null,
    urgent: false,
  },
  {
    id: 5,
    title: "Application de Gestion RH",
    client: "Innov Corp",
    status: "Complété",
    statusType: "done",
    description:
      "Développement d'une application web de gestion des ressources humaines incluant suivi des congés, fiches de paie et tableau de bord analytique pour les managers.",
    location: "Bizerte, Tunisie",
    total: "8 900",
    remaining: "0",
    deadline: "15 fév. 2026",
    daysLeft: null,
    urgent: false,
  },
];

const PinIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

function DealCard({ deal }) {
  return (
    <div className="fh-deal-card">
      <div className="fh-deal-card-top">
        <div>
          <div className="fh-deal-title">{deal.title}</div>
          <div className="fh-deal-client">{deal.client}</div>
          <span className={`fh-badge fh-badge-${deal.statusType}`}>{deal.status}</span>
        </div>
         <Link className="fh-btn-solid" to="/App.jsx">
          Ouvrir l'Espace de Travail
        </Link>
      </div>

      <div className="fh-deal-description">{deal.description}</div>

      <div className="fh-deal-location">
        <PinIcon />
        {deal.location}
      </div>

      <div className="fh-deal-stats">
        <div>
          <div className="fh-stat-label">Montant Total</div>
          <div className="fh-stat-value">
            <span className="fh-stat-currency">DT </span>
            {deal.total}
          </div>
        </div>
        <div>
          <div className="fh-stat-label">Solde Restant</div>
          <div className="fh-stat-value fh-green">
            <span className="fh-stat-currency">DT </span>
            {deal.remaining}
          </div>
        </div>
        <div>
          <div className="fh-stat-label">Echange</div>
          <div className="fh-stat-date">📅 {deal.deadline}</div>
        </div>
      </div>

      {deal.daysLeft !== null && (
        <div className="fh-deal-footer">
          <div className={`fh-days-pill${deal.urgent ? " urgent" : ""}`}>
            <ClockIcon />
            {deal.daysLeft} jour{deal.daysLeft !== 1 ? "s" : ""} restant{deal.daysLeft !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Deals() {
  const [tab, setTab] = useState("active");
  const currentDeals = tab === "active" ? deals : completedDeals;

  return (
    <div className="fh-page">
      <nav className="fh-nav">
        <span className="fh-logo">FreelanceHub</span>
        <ul className="fh-nav-links">
          <li><a href="#">Parcourir les Talents</a></li>
          <li><a href="#">Catégories</a></li>
          <li><a href="#">Comment ça Marche</a></li>
          <li><a href="#">Tableau de Bord</a></li>
        </ul>
        <div className="fh-nav-actions">
          <button className="fh-btn-outline">🔍</button>
          <button className="fh-btn-outline">Connexion</button>
          <button className="fh-btn-solid">Publier une Offre</button>
        </div>
      </nav>

      <div className="fh-hero">
        <div>
          <h1>Mes Contrats</h1>
          <p>Gérez vos projets actifs et complétés</p>
        </div>
        <div className="fh-hero-actions">
          <button className="fh-btn-outline">Trouver Plus de Travail</button>
          <button className="fh-btn-solid">Voir le Portefeuille</button>
        </div>
      </div>

      <div className="fh-tabs-wrapper">
        <div className="fh-tabs">
          <button
            className={`fh-tab-btn${tab === "active" ? " active" : ""}`}
            onClick={() => setTab("active")}
          >
            Contrats Actifs (3)
          </button>
          <button
            className={`fh-tab-btn${tab === "completed" ? " active" : ""}`}
            onClick={() => setTab("completed")}
          >
            Complétés (2)
          </button>
        </div>
      </div>

      <div className="fh-cards">
        {currentDeals.length === 0 ? (
          <div className="fh-empty">
            <div className="fh-empty-icon">✅</div>
            <p className="fh-empty-title">Aucun contrat trouvé</p>
          </div>
        ) : (
          currentDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>
    </div>
  );
}
