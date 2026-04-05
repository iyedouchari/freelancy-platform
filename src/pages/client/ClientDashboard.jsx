import { format } from "../../utils/format";
import "./ClientDashboard.css";

function parseDealTotal(value) {
  return Number(String(value).replace(/\s/g, "").replace(",", ".")) || 0;
}

export default function ClientDashboard({
  deals,
  pendingRequestsCount,
  onOpenWorkspace,
}) {
  const activeDeals = deals.filter((deal) => deal.daysLeft !== null);
  const completedDeals = deals.filter((deal) => deal.daysLeft === null);
  const committedBudget = deals.reduce((sum, deal) => sum + parseDealTotal(deal.total), 0);

  return (
    <div className="client-dashboard-page">
      <div className="client-dashboard-shell">
        <section className="client-dashboard-hero">
          <div className="client-dashboard-copy">
            <span className="client-dashboard-eyebrow">Tableau de bord client</span>
            <h1>Suivez uniquement les collaborations déjà acceptées et en cours d'exécution</h1>
            <p>
              Ce tableau de bord regroupe les accords validés par vous et par les freelances. Les
              demandes encore en attente restent gérées séparément dans la page des demandes.
            </p>
            <p className="client-dashboard-note">
              Les demandes en attente se gèrent depuis l'onglet Demandes. Les espaces de travail
              actifs restent accessibles directement dans la liste ci-dessous.
            </p>
          </div>

          <div className="client-dashboard-stat-grid">
            <div className="client-dashboard-stat-card">
              <span>Accords en cours</span>
              <strong>{activeDeals.length}</strong>
              <small>collaborations déjà lancées</small>
            </div>
            <div className="client-dashboard-stat-card">
              <span>Accords terminés</span>
              <strong>{completedDeals.length}</strong>
              <small>missions finalisées</small>
            </div>
            <div className="client-dashboard-stat-card">
              <span>Budget engagé</span>
              <strong>{format(committedBudget)} DT</strong>
              <small>sur les accords acceptés</small>
            </div>
            <div className="client-dashboard-stat-card accent">
              <span>Demandes en attente</span>
              <strong>{pendingRequestsCount}</strong>
              <small>encore modifiables avant validation</small>
            </div>
          </div>
        </section>

        <section className="client-dashboard-panel">
          <div className="client-dashboard-panel-head">
            <div>
              <span className="client-dashboard-panel-eyebrow">Collaborations en cours</span>
              <h2>Accords acceptés en cours d'exécution</h2>
            </div>
          </div>

          {activeDeals.length === 0 ? (
            <div className="client-dashboard-empty">
              <strong>Aucun accord en cours</strong>
              <p>Dès qu'une demande est acceptée par un freelance, elle apparaîtra ici.</p>
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
                      <span>Échéance</span>
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
              <h2>Accords terminés et déjà livrés</h2>
            </div>
          </div>

          {completedDeals.length === 0 ? (
            <div className="client-dashboard-empty">
              <strong>Aucun accord terminé</strong>
              <p>Les missions finalisées apparaîtront ici pour consultation.</p>
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
