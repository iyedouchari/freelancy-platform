import { format } from "../../utils/format";
import "./ClientDashboard.css";

function parseDealTotal(value) {
  return Number(String(value).replace(/\s/g, "").replace(",", ".")) || 0;
}

export default function ClientDashboard({
  deals,
  pendingRequestsCount,
  onOpenRequests,
  onOpenWorkspace,
}) {
  const activeDeals = deals.filter((deal) => deal.daysLeft !== null);
  const completedDeals = deals.filter((deal) => deal.daysLeft === null);
  const featuredDeal = activeDeals[0] ?? completedDeals[0] ?? null;
  const committedBudget = deals.reduce((sum, deal) => sum + parseDealTotal(deal.total), 0);

  return (
    <div className="client-dashboard-page">
      <div className="client-dashboard-shell">
        <section className="client-dashboard-hero">
          <div className="client-dashboard-copy">
            <span className="client-dashboard-eyebrow">Tableau de bord client</span>
            <h1>Suivez uniquement les collaborations deja acceptees et passees en execution</h1>
            <p>
              Ce dashboard regroupe les deals valides par vous et par les freelancers. Les
              demandes encore en attente restent gerees a part dans la page demandes.
            </p>

            <div className="client-dashboard-hero-actions">
              <button type="button" className="secondary" onClick={onOpenRequests}>
                Voir mes demandes en attente
              </button>
              {featuredDeal && (
                <button type="button" className="primary" onClick={() => onOpenWorkspace?.(featuredDeal)}>
                  Ouvrir le workspace actif
                </button>
              )}
            </div>
          </div>

          <div className="client-dashboard-stat-grid">
            <div className="client-dashboard-stat-card">
              <span>Deals en cours</span>
              <strong>{activeDeals.length}</strong>
              <small>collaborations deja lancees</small>
            </div>
            <div className="client-dashboard-stat-card">
              <span>Deals termines</span>
              <strong>{completedDeals.length}</strong>
              <small>missions finalisees</small>
            </div>
            <div className="client-dashboard-stat-card">
              <span>Budget engage</span>
              <strong>{format(committedBudget)} DT</strong>
              <small>sur les deals acceptes</small>
            </div>
            <div className="client-dashboard-stat-card accent">
              <span>Demandes en attente</span>
              <strong>{pendingRequestsCount}</strong>
              <small>encore modifiables avant acceptation</small>
            </div>
          </div>
        </section>

        <section className="client-dashboard-panel">
          <div className="client-dashboard-panel-head">
            <div>
              <span className="client-dashboard-panel-eyebrow">Collaborations en cours</span>
              <h2>Deals acceptes deja au travail</h2>
            </div>
            <button type="button" onClick={onOpenRequests}>
              Gerer les demandes en attente
            </button>
          </div>

          {activeDeals.length === 0 ? (
            <div className="client-dashboard-empty">
              <strong>Aucun deal en cours</strong>
              <p>Des qu'une demande est acceptee par un freelance, elle apparaitra ici.</p>
            </div>
          ) : (
            <div className="client-dashboard-deal-list">
              {activeDeals.map((deal) => (
                <article key={deal.id} className="client-dashboard-deal-card">
                  <div className="client-dashboard-deal-copy">
                    <div className="client-dashboard-deal-topline">
                      <span>{deal.freelancer}</span>
                      <strong>{deal.status}</strong>
                    </div>
                    <h3>{deal.title}</h3>
                    <p>{deal.progressLabel}</p>
                  </div>

                  <div className="client-dashboard-deal-meta">
                    <div>
                      <span>Montant</span>
                      <strong>{deal.total} DT</strong>
                    </div>
                    <div>
                      <span>Echeance</span>
                      <strong>{deal.deadline}</strong>
                    </div>
                    <button type="button" onClick={() => onOpenWorkspace?.(deal)}>
                      Ouvrir l'espace de travail
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="client-dashboard-panel">
          <div className="client-dashboard-panel-head">
            <div>
              <span className="client-dashboard-panel-eyebrow">Historique</span>
              <h2>Deals termines et deja livres</h2>
            </div>
          </div>

          {completedDeals.length === 0 ? (
            <div className="client-dashboard-empty">
              <strong>Aucun deal termine</strong>
              <p>Les missions finalisees apparaitront ici pour consultation.</p>
            </div>
          ) : (
            <div className="client-dashboard-completed-grid">
              {completedDeals.map((deal) => (
                <article key={deal.id} className="client-dashboard-completed-card">
                  <div>
                    <span>{deal.freelancer}</span>
                    <h3>{deal.title}</h3>
                    <p>{deal.progressLabel}</p>
                  </div>
                  <div className="client-dashboard-completed-meta">
                    <strong>{deal.total} DT</strong>
                    <small>{deal.deadline}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
