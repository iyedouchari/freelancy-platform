import { useEffect, useMemo, useState } from "react";
import { requestService } from "../../services/requestService";
import { format } from "../../utils/format";
import { showAppFeedback } from "../../utils/appFeedback";
import "./FreelancerProposals.css";

const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    badgeLabel: "En attente",
    tone: "pending",
  },
  accepted: {
    label: "Acceptees",
    badgeLabel: "Acceptee",
    tone: "accepted",
  },
  refused: {
    label: "Refusees",
    badgeLabel: "Refusee",
    tone: "refused",
  },
};

const TAB_ORDER = ["pending", "accepted", "refused"];

const normalizeStatusKey = (status) => {
  const value = String(status || "").toLowerCase();

  if (value.includes("accep") || value.includes("accept")) {
    return "accepted";
  }

  if (value.includes("refus") || value.includes("reject")) {
    return "refused";
  }

  return "pending";
};

function SummaryCard({ label, value, accent = "default" }) {
  return (
    <div className={`proposals-summary-card proposals-summary-card-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProposalCard({ proposal, statusKey }) {
  const statusMeta = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
  const requestTitle = proposal.requestTitle || `Demande #${proposal.requestId}`;
  const proposedPrice = Number(proposal.proposedPrice || 0);
  const sentLabel = proposal.createdAt ? format(proposal.createdAt, "relative") : "date inconnue";
  const proposedDeadlineLabel = proposal.proposedDeadline
    ? format(proposal.proposedDeadline, "date")
    : "a confirmer";

  return (
    <article className="freelancer-proposal-card">
      <header className="freelancer-proposal-card-head">
        <div className="freelancer-proposal-card-title-wrap">
          <h3>{requestTitle}</h3>
          <p>{proposal.clientName || "Client"}</p>
        </div>
        <span className={`freelancer-proposal-status is-${statusMeta.tone}`}>{statusMeta.badgeLabel}</span>
      </header>

      <div className="freelancer-proposal-meta-grid">
        <div>
          <span>Prix propose</span>
          <strong>{format(proposedPrice)} DT</strong>
        </div>
        <div>
          <span>Date limite proposee</span>
          <strong>{proposedDeadlineLabel}</strong>
        </div>
        <div>
          <span>Envoyee</span>
          <strong>{sentLabel}</strong>
        </div>
      </div>

      {proposal.coverLetter && (
        <p className="freelancer-proposal-cover">{proposal.coverLetter}</p>
      )}
    </article>
  );
}

export default function FreelancerProposals({ onBack }) {
  const [proposals, setProposals] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProposals = async () => {
      setIsLoading(true);
      setNotice("");

      try {
        const rows = await requestService.listMyProposals();
        if (!isMounted) {
          return;
        }

        const normalizedRows = Array.isArray(rows) ? rows : [];
        setProposals(normalizedRows);

        if (!normalizedRows.length) {
          setNotice("Vous n'avez pas encore envoye de proposition.");
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error?.message || "Impossible de charger vos propositions.";
        setProposals([]);
        setNotice(message);
        showAppFeedback({
          tone: "error",
          title: "Chargement impossible",
          message,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProposals();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedProposals = useMemo(() => {
    return proposals.reduce(
      (accumulator, proposal) => {
        const statusKey = normalizeStatusKey(proposal.status);
        accumulator[statusKey].push(proposal);
        return accumulator;
      },
      { accepted: [], refused: [], pending: [] },
    );
  }, [proposals]);

  const totalCount = proposals.length;
  const acceptedCount = groupedProposals.accepted.length;
  const refusedCount = groupedProposals.refused.length;
  const pendingCount = groupedProposals.pending.length;
  const visibleProposals = groupedProposals[activeTab] || [];

  return (
    <div className="proposals-page-container freelancer-proposals-page">
      <section className="proposals-header">
        <div>
          {onBack && (
            <button type="button" onClick={onBack} className="freelancer-proposals-back-btn">
              Retour au tableau de bord
            </button>
          )}
          <h1>Mes propositions envoyees</h1>
          <p>
            Organisez rapidement vos propositions par statut pour suivre ce qui a ete
            accepte, refuse, ou reste en attente.
          </p>
        </div>

        <div className="proposals-summary-grid">
          <SummaryCard label="Acceptees" value={acceptedCount} accent="accepted" />
          <SummaryCard label="Refusees" value={refusedCount} accent="refused" />
          <SummaryCard label="En attente" value={pendingCount} accent="pending" />
          <SummaryCard label="Total" value={totalCount} accent="default" />
        </div>
      </section>

      <section className="proposals-tabs-wrapper">
        <div className="proposals-tabs">
          {TAB_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className={`proposals-tab-btn${activeTab === key ? " active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {STATUS_CONFIG[key].label} ({groupedProposals[key].length})
            </button>
          ))}
        </div>
      </section>

      <section className="proposals-section">
        {notice && !isLoading && <div className="proposals-notice">{notice}</div>}

        <div className="proposals-list">
          {isLoading ? (
            <div className="proposals-empty-state">
              <div className="proposals-empty-icon">...</div>
              <p>Chargement des propositions...</p>
            </div>
          ) : visibleProposals.length === 0 ? (
            <div className="proposals-empty-state">
              <div className="proposals-empty-icon">Aucun</div>
              <p>Aucune proposition dans cette categorie.</p>
            </div>
          ) : (
            visibleProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                statusKey={normalizeStatusKey(proposal.status)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
