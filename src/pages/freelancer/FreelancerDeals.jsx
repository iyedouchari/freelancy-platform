import { useMemo, useState } from "react";
import "./FreelancerDeals.css";

const PinIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

function SummaryCard({ label, value, accent = "default" }) {
  return (
    <div className={`deals-summary-card deals-summary-card-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DealCard({ deal, onOpenWorkspace }) {
  return (
    <div className="fh-deal-card">
      <div className="fh-deal-card-top">
        <div>
          <div className="fh-deal-title">{deal.title}</div>
          <div className="fh-deal-client">{deal.client}</div>
          <span className={`fh-badge fh-badge-${deal.statusType}`}>{deal.status}</span>
        </div>
        <button className="fh-btn-solid" onClick={() => onOpenWorkspace?.(deal.id)}>
          Ouvrir l'espace de travail
        </button>
      </div>

      <div className="fh-deal-description">{deal.description}</div>

      {deal.location && (
        <div className="fh-deal-location">
          <PinIcon />
          {deal.location}
        </div>
      )}

      <div className="fh-deal-stats">
        <div>
          <div className="fh-stat-label">Montant total</div>
          <div className="fh-stat-value">
            <span className="fh-stat-currency">DT </span>
            {deal.total}
          </div>
        </div>
        <div>
          <div className="fh-stat-label">Solde restant</div>
          <div className="fh-stat-value fh-green">
            <span className="fh-stat-currency">DT </span>
            {deal.remaining}
          </div>
        </div>
        <div>
          <div className="fh-stat-label">Echeance</div>
          <div className="fh-stat-date">{deal.deadline}</div>
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

export default function FreelancerDeals({ deals = [], onBack, onOpenWorkspace, isLoading = false }) {
  const [tab, setTab] = useState("active");
  const activeDeals = useMemo(() => deals.filter((deal) => deal.daysLeft !== null), [deals]);
  const completedDeals = useMemo(() => deals.filter((deal) => deal.daysLeft === null), [deals]);
  const tabConfig = {
    active: {
      label: `Accords en cours (${activeDeals.length})`,
      title: "Accords en cours",
      subtitle:
        "Suivez vos accords acceptés par le client et ouvrez leur espace de travail sans quitter l'espace freelance.",
      items: activeDeals,
    },
    completed: {
      label: `Terminés (${completedDeals.length})`,
      title: "Accords terminés",
      subtitle: "Retrouvez l'historique de vos accords finalisés.",
      items: completedDeals,
    },
  };
  const currentTab = tabConfig[tab];

  return (
    <div className="deals-container freelancer-deals-page">
      <div className="deals-header">
        <div>
          {onBack && (
            <button onClick={onBack} className="fh-btn-back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Retour au tableau de bord
            </button>
          )}
          <h1>Mes accords</h1>
          <p>{currentTab.subtitle}</p>
        </div>

        <div className="deals-summary-grid">
          <SummaryCard label="En cours" value={activeDeals.length} accent="primary" />
          <SummaryCard label="Terminés" value={completedDeals.length} />
          <SummaryCard label="Total" value={activeDeals.length + completedDeals.length} accent="soft" />
        </div>
      </div>

      <div className="deals-tabs-wrapper">
        <div className="deals-tabs">
          {Object.entries(tabConfig).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={`deals-tab-btn${tab === key ? " active" : ""}`}
              onClick={() => setTab(key)}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="deals-section">
        <div className="deals-section-heading">
          <h2>{currentTab.title}</h2>
          <span>{currentTab.items.length} accord{currentTab.items.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="deals-grid">
          {isLoading ? (
            <div className="fh-empty">
              <div className="fh-empty-icon">...</div>
              <p className="fh-empty-title">Chargement des accords réels</p>
            </div>
          ) : currentTab.items.length === 0 ? (
            <div className="fh-empty">
              <div className="fh-empty-icon">Aucun</div>
              <p className="fh-empty-title">Aucun accord à afficher</p>
            </div>
          ) : (
            currentTab.items.map((deal) => (
              <DealCard key={deal.id} deal={deal} onOpenWorkspace={onOpenWorkspace} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
