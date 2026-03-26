import { useEffect, useMemo, useState } from "react";
import { format } from "../../utils/format";
import ClientCreateRequest from "./ClientCreateRequest";
import "./ClientRequests.css";

export default function ClientRequests({
  requests,
  onCreateRequest,
  onUpdateRequest,
  onAcceptProposal,
  onViewFreelancerProfile,
}) {
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(requests[0]?.id ?? null);
  const [isEditing, setIsEditing] = useState(false);
  const [showFreelancers, setShowFreelancers] = useState(false);
  const [notice, setNotice] = useState("");

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      if (!query) {
        return true;
      }

      return (
        request.title.toLowerCase().includes(query) ||
        request.category.toLowerCase().includes(query) ||
        request.skills.some((skill) => skill.toLowerCase().includes(query))
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

  const selectedRequest =
    requests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0] ?? null;

  const stats = useMemo(
    () => ({
      total: requests.length,
      withProposals: requests.filter((request) => request.proposals.length > 0).length,
      withoutProposals: requests.filter((request) => request.proposals.length === 0).length,
    }),
    [requests]
  );

  const handleCreateRequest = (payload) => {
    const createdRequest = onCreateRequest?.(payload);
    if (!createdRequest) {
      return;
    }

    setShowCreateForm(false);
    setSelectedRequestId(createdRequest.id);
    setNotice("La demande a ete creee. Elle reste modifiable tant qu'aucun accord n'est accepte.");
  };

  const handleUpdateRequest = (payload) => {
    if (!selectedRequest) {
      return;
    }

    const updatedRequest = onUpdateRequest?.(selectedRequest.id, payload);
    if (!updatedRequest) {
      return;
    }

    setIsEditing(false);
    setNotice("La demande a ete mise a jour avec succes.");
  };

  const handleAcceptProposal = (proposal) => {
    if (!selectedRequest) {
      return;
    }

    onAcceptProposal?.(selectedRequest.id, proposal.id);
  };

  return (
    <div className="client-requests-page">
      <div className="client-requests-shell">
        <header className="client-requests-header">
          <div className="client-requests-copy">
            <span className="client-requests-eyebrow">Demandes client</span>
            <h1>Creer et piloter uniquement les demandes encore en attente d'acceptation</h1>
            <p>
              Cette page regroupe vos demandes ouvertes. Vous pouvez les modifier tant qu'un
              freelance n'a pas ete retenu, consulter les profils proposes et choisir la bonne
              collaboration au bon moment.
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
              <small>freelancers deja interesses</small>
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
            onClick={() => setShowCreateForm((current) => !current)}
          >
            {showCreateForm ? "Fermer la creation" : "Creer une nouvelle demande"}
          </button>
        </div>

        {notice && <div className="client-requests-notice">{notice}</div>}

        {showCreateForm && (
          <div className="client-requests-create-panel">
            <ClientCreateRequest
              onCreateRequest={handleCreateRequest}
              onCancel={() => setShowCreateForm(false)}
              submitLabel="Publier la demande"
              note="Votre projet sera ajoute a la liste des demandes en attente."
            />
          </div>
        )}

        <div className="client-requests-layout">
          <section className="client-requests-list">
            {filteredRequests.length === 0 ? (
              <div className="client-requests-empty">
                <strong>Aucune demande correspondante</strong>
                <p>Essayez une autre recherche ou publiez une nouvelle demande.</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <button
                  type="button"
                  key={request.id}
                  className={`client-request-card ${
                    selectedRequestId === request.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="client-request-card-top">
                    <span className="client-request-status">En attente</span>
                    <span className="client-request-posted">{format(request.postedAt, "relative")}</span>
                  </div>
                  <h2>{request.title}</h2>
                  <p>{request.description}</p>
                  <div className="client-request-card-meta">
                    <span>{request.category}</span>
                    <strong>{format(request.budget)} DT</strong>
                    <span>{request.proposals.length} proposition(s)</span>
                  </div>
                </button>
              ))
            )}
          </section>

          <aside className="client-request-details">
            {selectedRequest ? (
              <>
                <div className="client-request-detail-card">
                  <div className="client-request-detail-top">
                    <div>
                      <span className="client-request-detail-eyebrow">Demande en attente</span>
                      <h2>{selectedRequest.title}</h2>
                    </div>
                    <span className="client-request-status">En attente</span>
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
                      <span>Categorie</span>
                      <strong>{selectedRequest.category}</strong>
                    </div>
                    <div>
                      <span>Propositions</span>
                      <strong>{selectedRequest.proposals.length}</strong>
                    </div>
                  </div>

                  <div className="client-request-skills-block">
                    <span>Competences demandees</span>
                    <div className="client-request-skills">
                      {selectedRequest.skills.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>
                  </div>

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
                        ? "Masquer les freelancers proposes"
                        : "Voir les freelancers proposes"}
                    </button>
                  </div>

                  <div className="client-request-modifiable-note">
                    Cette demande reste modifiable tant qu'aucun freelance n'est accepte.
                  </div>
                </div>

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
                      <span className="client-request-detail-eyebrow">Freelancers proposes</span>
                      <h3>Profils interesses par cette demande</h3>
                    </div>
                    <span className="client-request-proposals-count">
                      {selectedRequest.proposals.length} profil
                      {selectedRequest.proposals.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {!showFreelancers ? (
                    <div className="client-request-proposals-closed">
                      <p>
                        Utilisez le bouton ci-dessus pour afficher les freelancers qui ont propose
                        de collaborer sur ce projet.
                      </p>
                    </div>
                  ) : selectedRequest.proposals.length === 0 ? (
                    <div className="client-request-proposals-empty">
                      Aucun freelance ne s'est encore positionne sur cette demande.
                    </div>
                  ) : (
                    <div className="client-request-proposals-list">
                      {selectedRequest.proposals.map((proposal) => (
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

                          <p className="client-request-proposal-summary">{proposal.summary}</p>

                          <div className="client-request-proposal-meta">
                            <span>Offre {format(proposal.rate)} DT</span>
                            <span>Livraison {proposal.deliveryDays} jours</span>
                          </div>

                          <div className="client-request-proposal-actions">
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => onViewFreelancerProfile?.(proposal.freelancerId)}
                            >
                              Voir le profil et ajouter un feedback
                            </button>
                            <button
                              type="button"
                              className="primary"
                              onClick={() => handleAcceptProposal(proposal)}
                            >
                              Accepter ce freelance
                            </button>
                          </div>
                        </article>
                      ))}
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
