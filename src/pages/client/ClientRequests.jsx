import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "../../utils/format";
import { splitRequestMetadata } from "../../utils/requestDomains";
import ClientCreateRequest from "./ClientCreateRequest";
import "./ClientRequests.css";

function getRequestTypeMeta(request) {
  return request.negotiable
    ? {
        label: "Négociable",
        tone: "is-negotiable",
      }
    : {
        label: "Non négociable",
        tone: "is-fixed",
      };
}

function normalizeDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function getProposalStatusMeta(status) {
  if (status === "Refusee" || status === "rejected") {
    return { label: "Refusee", tone: "is-refused" };
  }

  if (status === "Acceptee" || status === "accepted") {
    return { label: "Acceptee", tone: "is-accepted" };
  }

  return { label: "En attente", tone: "is-pending" };
}

function getProposalComparison(request, proposal) {
  if (!request.negotiable) {
    return {
      label: "Comme la demande",
      tone: "is-fixed",
      description: "Le freelance suit votre demande.",
    };
  }

  const samePrice = Number(proposal.rate) === Number(request.budget);
  const sameDeadline =
    normalizeDate(proposal.proposedDeadline ?? request.deadline) === normalizeDate(request.deadline);

  if (samePrice && sameDeadline) {
    return {
      label: "Comme votre demande",
      tone: "is-match",
      description: "Prix et date identiques a votre demande.",
    };
  }

  return {
    label: "Contre-offre",
    tone: "is-warning",
    description: "Le freelance propose un prix ou une date différents.",
  };
}

export default function ClientRequests({
  requests,
  isLoading = false,
  errorMessage = "",
  onCreateRequest,
  onUpdateRequest,
  onAcceptProposal,
  onRejectProposal,
  onViewFreelancerProfile,
}) {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(requests[0]?.id ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFreelancers, setShowFreelancers] = useState(false);
  const [notice, setNotice] = useState("");
  const createPanelRef = useRef(null);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      if (!query) {
        return true;
      }

      return (
        request.title.toLowerCase().includes(query) ||
        request.category.toLowerCase().includes(query) ||
        splitRequestMetadata(request).domains.some((domain) => domain.toLowerCase().includes(query)) ||
        splitRequestMetadata(request).competencies.some((skill) => skill.toLowerCase().includes(query))
      );
    });
  }, [requests, search]);

  useEffect(() => {
    if (filteredRequests.length === 0) {
      setSelectedRequestId(null);
      return;
    }

    const stillVisible = filteredRequests.some((request) => request.id === selectedRequestId);
    if (!stillVisible) {
      setSelectedRequestId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedRequestId]);

  useEffect(() => {
    setIsEditing(false);
    setShowFreelancers(false);
  }, [selectedRequestId]);

  useEffect(() => {
    if (!showCreateForm) {
      return;
    }

    createPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showCreateForm]);

  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0] ?? null;

  const stats = useMemo(
    () => ({
      total: requests.length,
      withProposals: requests.filter((request) => request.proposals.length > 0).length,
      withoutProposals: requests.filter((request) => request.proposals.length === 0).length,
    }),
    [requests],
  );

  const handleCreateRequest = async (payload) => {
    try {
      const createdRequest = await onCreateRequest?.(payload);
      if (!createdRequest) {
        return;
      }

      setShowCreateForm(false);
      setSelectedRequestId(createdRequest.id);
      setNotice("La demande a été creee. Elle reste modifiable tant qu'aucun accord n'est accepte.");
    } catch (error) {
      setNotice(error.message || "Impossible de creer la demande.");
    }
  };

  const handleUpdateRequest = async (payload) => {
    if (!selectedRequest) {
      return;
    }

    try {
      const updatedRequest = await onUpdateRequest?.(selectedRequest.id, payload);
      if (!updatedRequest) {
        return;
      }

      setIsEditing(false);
      setNotice("La demande a été mise a jour avec succes.");
    } catch (error) {
      setNotice(error.message || "Impossible de mettre a jour la demande.");
    }
  };

  const handleAcceptProposal = async (proposal) => {
    if (!selectedRequest) {
      return;
    }

    try {
      const createdDeal = await onAcceptProposal?.(selectedRequest.id, proposal.id);
      if (!createdDeal) {
        return;
      }

      setNotice("La proposition a été acceptee.");
    } catch (error) {
      setNotice(error.message || "Impossible d'accepter la proposition.");
    }
  };

  const handleRejectProposal = async (proposal) => {
    if (!selectedRequest) {
      return;
    }

    try {
      const updatedProposal = await onRejectProposal?.(selectedRequest.id, proposal.id);
      if (!updatedProposal) {
        return;
      }

      setNotice("La proposition du freelance a été refusée.");
    } catch (error) {
      setNotice(error.message || "Impossible de refuser la proposition.");
    }
  };

  return (
    <div className="client-requests-page">
      <div className="client-requests-shell">
        <header className="client-requests-header">
          <div className="client-requests-copy">
            <span className="client-requests-eyebrow">Demandes client</span>
            <h1>Comparez vite les propositions et decidez simplement</h1>
            <p>
              L'interface montre clairement les demandes negociables et non negociables, ainsi que
              les propositions envoyees exactement comme votre demande ou en contre-offre.
            </p>
          </div>

          <div className="client-requests-stat-grid">
            <div className="client-requests-stat-card">
              <span>Demandes en attente</span>
              <strong>{stats.total}</strong>
              <small>encore modifiables</small>
            </div>
            <div className="client-requests-stat-card">
              <span>Avec propositions</span>
              <strong>{stats.withProposals}</strong>
              <small>freelances déjà intéressés</small>
            </div>
            <div className="client-requests-stat-card">
              <span>Sans proposition</span>
              <strong>{stats.withoutProposals}</strong>
              <small>en attente de reponse</small>
            </div>
          </div>
        </header>

        <div className="client-requests-toolbar">
          <label className="client-requests-search">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une demande, categorie ou competence"
            />
          </label>

          <button
            type="button"
            className={`client-requests-create-btn ${showCreateForm ? "active" : ""}`}
            onClick={() => {
              setNotice("");
              setShowCreateForm((current) => !current);
            }}
          >
            {showCreateForm ? "Fermer la creation" : "Creer une nouvelle demande"}
          </button>
        </div>

        {(notice || errorMessage) && (
          <div className="client-requests-notice">{errorMessage || notice}</div>
        )}

        {showCreateForm && (
          <div className="client-requests-create-panel" ref={createPanelRef}>
            <ClientCreateRequest
              onCreateRequest={handleCreateRequest}
              onCancel={() => setShowCreateForm(false)}
              submitLabel="Publier la demande"
              note="Remplissez le minimum utile pour publier: titre, description, categorie, budget et date. Les competences sont optionnelles."
            />
          </div>
        )}

        <div className="client-requests-layout">
          <section className="client-requests-list">
            {isLoading ? (
              <div className="client-requests-empty">
                <strong>Chargement des demandes</strong>
                <p>Nous recuperons vos demandes et propositions en cours.</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="client-requests-empty">
                <strong>Aucune demande correspondante</strong>
                <p>Essayez une autre recherche ou publiez une nouvelle demande.</p>
              </div>
            ) : (
              filteredRequests.map((request) => {
                const metadata = splitRequestMetadata(request);
                const typeMeta = getRequestTypeMeta(request);

                return (
                  <button
                    type="button"
                    key={request.id}
                    className={`client-request-card ${selectedRequestId === request.id ? "active" : ""}`}
                    onClick={() => setSelectedRequestId(request.id)}
                  >
                    <div className="client-request-card-top">
                      <span className="client-request-posted">{format(request.postedAt, "relative")}</span>
                    </div>

                    <div className="client-request-title-row">
                      <h2>{request.title}</h2>
                      <div className="client-request-badge-row client-request-badge-row-inline">
                        <span className="client-request-status">En attente</span>
                        <span className={`client-request-type-badge ${typeMeta.tone}`}>
                          {typeMeta.label}
                        </span>
                      </div>
                    </div>
                    <p>{request.description}</p>

                    <div className="client-request-card-meta">
                      <span>{metadata.domains.length} domaine(s)</span>
                      <strong>Budget: {format(request.budget)} DT</strong>
                      <span>{request.proposals.length} proposition(s)</span>
                    </div>

                    <div className="client-request-card-sections">
                      <div className="client-request-card-section">
                        <strong>Domaines</strong>
                        <div className="client-request-skills">
                          {metadata.domains.map((domain) => (
                            <span key={domain}>{domain}</span>
                          ))}
                        </div>
                      </div>

                      {metadata.competencies.length > 0 && (
                        <div className="client-request-card-section">
                          <strong>Compétences</strong>
                          <div className="client-request-skills">
                            {metadata.competencies.map((skill) => (
                              <span key={skill}>{skill}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </section>

          <aside className="client-request-details">
            {selectedRequest ? (
              <>
                {(() => {
                  const selectedMetadata = splitRequestMetadata(selectedRequest);
                  return (
                    <>
                <div className="client-request-detail-card">
                  <div className="client-request-detail-top">
                    <div>
                      <span className="client-request-detail-eyebrow">Demande en attente</span>
                      <div className="client-request-title-row client-request-title-row-detail">
                        <h2>{selectedRequest.title}</h2>
                        <div className="client-request-badge-row client-request-badge-row-inline">
                          <span className="client-request-status">En attente</span>
                          <span
                            className={`client-request-type-badge ${
                              getRequestTypeMeta(selectedRequest).tone
                            }`}
                          >
                            {getRequestTypeMeta(selectedRequest).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="client-request-detail-description">{selectedRequest.description}</p>

                  <div className="client-request-detail-grid">
                    <div>
                      <span>Budget</span>
                      <strong>{format(selectedRequest.budget)} DT</strong>
                    </div>
                    <div>
                      <span>Date limite</span>
                      <strong>{format(selectedRequest.deadline, "date")}</strong>
                    </div>
                    <div>
                      <span>Domaines</span>
                      <strong>{selectedMetadata.domains.length}</strong>
                    </div>
                    <div>
                      <span>Propositions</span>
                      <strong>{selectedRequest.proposals.length}</strong>
                    </div>
                  </div>

                  <div className="client-request-skills-block">
                    <span>Domaines demandés</span>
                    <div className="client-request-skills">
                      {selectedMetadata.domains.map((domain) => (
                        <span key={domain}>{domain}</span>
                      ))}
                    </div>
                  </div>

                  {selectedMetadata.competencies.length > 0 && (
                  <div className="client-request-skills-block">
                    <span>Compétences demandées</span>
                    <div className="client-request-skills">
                      {selectedMetadata.competencies.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  )}

                  <div className="client-request-detail-actions">
                    <button type="button" onClick={() => setIsEditing((current) => !current)}>
                      {isEditing ? "Fermer la modification" : "Modifier cette demande"}
                    </button>
                    <button
                      type="button"
                      className="primary"
                      onClick={() => setShowFreelancers((current) => !current)}
                    >
                      {showFreelancers
                        ? "Masquer les freelances proposés"
                        : "Voir les freelances proposés"}
                    </button>
                  </div>

                  <div className="client-request-modifiable-note">
                    Cette demande reste modifiable tant qu'aucun accord n'est valide.
                  </div>
                </div>
                    </>
                  );
                })()}

                {isEditing && (
                  <div className="client-request-detail-card">
                    <ClientCreateRequest
                      onCreateRequest={handleUpdateRequest}
                      onCancel={() => setIsEditing(false)}
                      initialValues={selectedRequest}
                      eyebrow="Modification"
                      title="Ajuster la demande avant acceptation"
                      submitLabel="Enregistrer les modifications"
                      note="Les changements seront visibles tant que la demande reste en attente."
                    />
                  </div>
                )}

                <div className="client-request-detail-card">
                  <div className="client-request-proposals-head">
                    <div>
                      <span className="client-request-detail-eyebrow">Freelances proposés</span>
                      <h3>Comprendre chaque proposition avant de choisir</h3>
                    </div>
                    <span className="client-request-proposals-count">
                      {selectedRequest.proposals.length} profil
                      {selectedRequest.proposals.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {!showFreelancers ? (
                    <div className="client-request-proposals-closed">
                      <p>
                        Ouvrez cette section pour comparer chaque proposition, voir le profil du
                        freelance et ajouter un avis si besoin.
                      </p>
                    </div>
                  ) : selectedRequest.proposals.length === 0 ? (
                    <div className="client-request-proposals-empty">
                      Aucun freelance ne s'est encore positionné sur cette demande.
                    </div>
                  ) : (
                    <div className="client-request-proposals-list">
                      {selectedRequest.proposals.map((proposal) => {
                        const proposalStatus = getProposalStatusMeta(proposal.status);
                        const comparison = getProposalComparison(selectedRequest, proposal);
                        const isPending =
                          proposal.status === "En attente" || proposal.status === "pending";

                        return (
                          <article key={proposal.id} className="client-request-proposal">
                            <div className="client-request-proposal-top">
                              <div>
                                <h4>{proposal.freelancerName}</h4>
                                <p>{proposal.title}</p>
                              </div>
                              <div className="client-request-proposal-rating">
                                {proposal.rating.toFixed(1)}
                              </div>
                            </div>

                            <div className="client-request-proposal-flag-row">
                              <span
                                className={`client-request-proposal-kind ${comparison.tone}`}
                              >
                                {comparison.label}
                              </span>
                              <span
                                className={`client-request-proposal-status ${proposalStatus.tone}`}
                              >
                                {proposalStatus.label}
                              </span>
                            </div>

                            <p className="client-request-proposal-summary">{proposal.summary}</p>
                            <p className="client-request-proposal-note">{comparison.description}</p>

                            <div className="client-request-proposal-term-grid">
                              <div className="client-request-proposal-term-card">
                                <span>Votre demande</span>
                                <strong>{format(selectedRequest.budget)} DT</strong>
                                <small>{format(selectedRequest.deadline, "date")}</small>
                              </div>
                              <div className="client-request-proposal-term-card">
                                <span>Proposition du freelance</span>
                                <strong>{format(proposal.rate)} DT</strong>
                                <small>{format(proposal.proposedDeadline, "date")}</small>
                              </div>
                            </div>

                            <div className="client-request-proposal-meta">
                              <span>Livraison estimee {proposal.deliveryDays} jours</span>
                            </div>

                            <div className="client-request-proposal-actions">
                              <button
                                type="button"
                                className="ghost"
                                onClick={() => onViewFreelancerProfile?.(proposal.freelancerId)}
                              >
                                Voir le profil et ajouter un avis
                              </button>
                            </div>

                            {isPending && (
                              <div className="client-request-proposal-decision-row">
                                <button
                                  type="button"
                                  className="ghost danger"
                                  onClick={() => handleRejectProposal(proposal)}
                                >
                                  Refuser
                                </button>
                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() => handleAcceptProposal(proposal)}
                                >
                                  Accepter
                                </button>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="client-requests-empty">
                <strong>Aucune demande selectionnee</strong>
                <p>Choisissez un projet a gauche pour afficher ses details.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
