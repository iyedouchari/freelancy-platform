import { useEffect, useMemo, useState } from "react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { adminService } from "../../services/adminService";
import "./AdminDashboard.css";

const adminNavItems = [
  { key: "overview", label: "Utilisateurs", actionProp: "onDashboard" },
  { key: "reports", label: "Signalements", actionProp: "onRequests" },
];

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const initialStats = {
  totalUsers: 0,
  bannedUsers: 0,
  totalReports: 0,
  openReports: 0,
};

const formatDurationDays = (value) => {
  const days = Number.parseInt(value, 10);
  if (Number.isNaN(days) || days <= 0) return "-";
  return `${days} jour${days > 1 ? "s" : ""}`;
};

const parsePositiveDaysOrDefault = (value, fallback = 7) => {
  const days = Number.parseInt(value, 10);
  if (Number.isNaN(days) || days <= 0) {
    return fallback;
  }

  return days;
};

const getReturnDateFromDuration = (durationDays) => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + parsePositiveDaysOrDefault(durationDays));
  return nextDate.toISOString();
};

const getReportStatusClassName = (status) => {
  if (status === "en_cours") return "is-en-cours";
  if (status === "ouvert") return "is-ouvert";
  if (status === "ferme") return "is-ferme";
  if (status === "refuse") return "is-refuse";
  return `is-${status}`;
};

const getReportStatusLabel = (status) => {
  if (status === "en_cours") return "En cours";
  if (status === "ouvert") return "Ouvert";
  if (status === "ferme") return "Ferme";
  if (status === "refuse") return "Refuse";
  return "En cours";
};

export default function AdminDashboard() {
  const [page, setPage] = useState("overview");
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchUserEmail, setSearchUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDurationDays, setBanDurationDays] = useState("7");
  const [isApplyingBan, setIsApplyingBan] = useState(false);
  const [reportBanReason, setReportBanReason] = useState("");
  const [reportBanDurationDays, setReportBanDurationDays] = useState("7");
  const [isApplyingReportBan, setIsApplyingReportBan] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState("tous");

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      bannedUsers: users.filter((user) => user.isSuspended).length,
      totalReports: reports.length,
      openReports: reports.filter((report) => report.status === "en_cours").length,
    }),
    [users, reports],
  );

  const filteredUsers = useMemo(() => {
    const trimmed = searchUserEmail.trim().toLowerCase();
    if (!trimmed) return users;
    return users.filter((user) => {
      const email = String(user.email || "").toLowerCase();
      const name = String(user.name || "").toLowerCase();
      return email.includes(trimmed) || name.includes(trimmed);
    });
  }, [searchUserEmail, users]);

  const filteredReports = useMemo(() => {
    if (reportStatusFilter === "tous") return reports;
    return reports.filter((report) => report.status === reportStatusFilter);
  }, [reportStatusFilter, reports]);

  const newReports = useMemo(
    () => reports.filter((report) => report.status === "en_cours"),
    [reports],
  );

  const trackedReports = useMemo(
    () => filteredReports.filter((report) => report.status !== "en_cours"),
    [filteredReports],
  );

  const reportMailPreviewDurationDays = useMemo(
    () => parsePositiveDaysOrDefault(reportBanDurationDays),
    [reportBanDurationDays],
  );

  const reportMailPreviewReturnDate = useMemo(
    () => getReturnDateFromDuration(reportMailPreviewDurationDays),
    [reportMailPreviewDurationDays],
  );

  const syncBanFormFromUser = (user) => {
    setBanReason("");
    setBanDurationDays(String(user?.suspensionDurationDays || 7));
  };

  const syncReportBanFormFromReport = (report) => {
    setReportBanReason("");
    setReportBanDurationDays(String(report?.banDurationDays || 7));
  };

  const loadAdminData = async ({ preserveSelection = false } = {}) => {
    if (preserveSelection) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage("");

    try {
      const [userRows, reportRows] = await Promise.all([
        adminService.listUsers(),
        adminService.listReports(),
      ]);

      const safeUsers = Array.isArray(userRows) ? userRows : [];
      const safeReports = Array.isArray(reportRows) ? reportRows : [];

      setUsers(safeUsers);
      setReports(safeReports);

      if (preserveSelection && selectedUser?.id) {
        const detailedUser = await adminService.getUserById(selectedUser.id);
        setSelectedUser(detailedUser);
      }

      if (preserveSelection && selectedReport?.id) {
        const detailedReport = await adminService.getReportById(selectedReport.id);
        setSelectedReport(detailedReport);
      }
    } catch (error) {
      setErrorMessage(error.message || "Impossible de charger les donnees admin.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadAdminData({ preserveSelection: true });
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [selectedUser?.id, selectedReport?.id]);

  const handleViewUser = async (userId) => {
    setNotice("");
    setErrorMessage("");

    try {
      const user = await adminService.getUserById(userId);
      setSelectedUser(user);
      syncBanFormFromUser(user);
      setPage("overview");
    } catch (error) {
      setErrorMessage(error.message || "Impossible de charger cet utilisateur.");
    }
  };

  const handleViewReport = async (reportId) => {
    setNotice("");
    setErrorMessage("");

    try {
      const report = await adminService.getReportById(reportId);
      setSelectedReport(report);
      syncReportBanFormFromReport(report);
      setPage("reports");
    } catch (error) {
      setErrorMessage(error.message || "Impossible de charger ce signal.");
    }
  };

  const closeReportModal = () => {
    setSelectedReport(null);
    setReportBanReason("");
    setReportBanDurationDays("7");
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setBanReason("");
    setBanDurationDays("7");
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const trimmed = searchUserEmail.trim().toLowerCase();
    if (!trimmed) return;

    setNotice("");
    setErrorMessage("");

    try {
      const exactEmailMatch = users.find(
        (user) => String(user.email || "").toLowerCase() === trimmed,
      );

      if (exactEmailMatch) {
        const user = await adminService.getUserById(exactEmailMatch.id);
        setSelectedUser(user);
        syncBanFormFromUser(user);
        setPage("overview");
        return;
      }

      const firstNameMatch = filteredUsers[0];
      if (firstNameMatch) {
        const user = await adminService.getUserById(firstNameMatch.id);
        setSelectedUser(user);
        syncBanFormFromUser(user);
        setPage("overview");
        return;
      }

      setErrorMessage("Aucun utilisateur trouve avec ce nom ou cet email.");
    } catch (error) {
      setErrorMessage(error.message || "Impossible de charger cet utilisateur.");
    }
  };

  const handleBanSubmit = async () => {
    if (!selectedUser) return;

    const trimmedBanReason = String(banReason || "").trim();

    setNotice("");
    setErrorMessage("");
    setIsApplyingBan(true);

    try {
      if (!selectedUser.isSuspended && !trimmedBanReason) {
        throw new Error("L'admin doit saisir une raison de ban.");
      }

      const updatedUser = selectedUser.isSuspended
        ? await adminService.unbanUser(selectedUser.id)
        : await adminService.banUser(selectedUser.id, {
            reason: trimmedBanReason,
            durationDays: banDurationDays,
          });

      setSelectedUser(updatedUser);
      syncBanFormFromUser(updatedUser);
      setNotice(
        selectedUser.isSuspended
          ? `L'utilisateur #${selectedUser.id} a ete debanni.`
          : `L'utilisateur #${selectedUser.id} a ete banni. Email envoye avec la date de retour et la duree.`,
      );

      await loadAdminData({ preserveSelection: true });
    } catch (error) {
      setErrorMessage(error.message || "Impossible de mettre a jour le ban.");
    } finally {
      setIsApplyingBan(false);
    }
  };

  const handleNotifyBannedUser = async () => {
    if (!selectedReport) return;
    setNotice("");
    setErrorMessage("");
    setIsSendingEmail(true);

    try {
      const updatedReport = await adminService.notifyBannedUser(selectedReport.id);
      setSelectedReport(updatedReport);
      setNotice("Email automatique envoye a la personne reportee avec la date de retour et la duree du ban.");
      await loadAdminData({ preserveSelection: true });
    } catch (error) {
      setErrorMessage(error.message || "Impossible d'envoyer l'email de suspension.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleBanReportedUser = async () => {
    if (!selectedReport) return;

    const trimmedReportBanReason = String(reportBanReason || "").trim();

    setNotice("");
    setErrorMessage("");
    setIsApplyingReportBan(true);

    try {
      if (!trimmedReportBanReason) {
        throw new Error("L'admin doit saisir une raison de ban.");
      }

      await adminService.banUser(selectedReport.reportedUserId, {
        reason: trimmedReportBanReason,
        durationDays: reportBanDurationDays,
      });

      const refreshedReport = await adminService.getReportById(selectedReport.id);
      setSelectedReport(refreshedReport);
      syncReportBanFormFromReport(refreshedReport);
      setNotice("L'utilisateur signale a ete banni.");
      await loadAdminData({ preserveSelection: true });
    } catch (error) {
      setErrorMessage(error.message || "Impossible de bannir l'utilisateur signale.");
    } finally {
      setIsApplyingReportBan(false);
    }
  };

  const handleNotifyReporter = async (outcome) => {
    if (!selectedReport) return;
    setNotice("");
    setErrorMessage("");
    setIsSendingEmail(true);

    try {
      const updatedReport = await adminService.notifyReporter(selectedReport.id, outcome);
      setSelectedReport(updatedReport);
      setNotice(
        outcome === "resolved"
          ? updatedReport?.reportedUserIsSuspended
            ? "Le reporteur a ete informe et le compte banni a recu son email automatique."
            : "Le reporteur a ete informe que le probleme a ete resolu."
          : "Le reporteur a ete informe qu'aucun probleme n'a ete retenu.",
      );
      await loadAdminData({ preserveSelection: true });
    } catch (error) {
      setErrorMessage(error.message || "Impossible d'envoyer l'email au reporteur.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleUpdateWorkflowStatus = async (reportId, nextStatus) => {
    setNotice("");
    setErrorMessage("");

    try {
      const updatedReport = await adminService.updateReportStatus(reportId, nextStatus);
      setSelectedReport((current) => (current?.id === updatedReport.id ? updatedReport : current));
      setNotice(
        nextStatus === "refuse"
          ? "Le signalement a ete refuse."
          : nextStatus === "ouvert"
            ? "Le signalement est maintenant ouvert."
            : "Le signalement a ete remis en cours.",
      );
      await loadAdminData({ preserveSelection: true });
    } catch (error) {
      setErrorMessage(error.message || "Impossible de mettre a jour le signalement.");
    }
  };

  const summary = isLoading ? initialStats : stats;

  return (
    <div className="app-shell admin-shell-root">
      <Navbar
        onDashboard={() => setPage("overview")}
        onRequests={() => setPage("reports")}
        activePage={page}
        navItems={adminNavItems}
        brandTitle="Admin Control"
        brandSubtitle="Freelancy"
        profileLabel="Admin"
        showProfile={false}
      />

      <main className="app-main admin-main">
        {errorMessage ? <div className="admin-feedback admin-feedback-top is-error">{errorMessage}</div> : null}

        {page === "overview" ? (
          <section className="admin-toolbar-card">
            <form className="admin-search-form" onSubmit={handleSearchSubmit}>
              <label>
                <span>Recherche d'un utilisateur par nom ou email</span>
                <input
                  type="text"
                  placeholder="Entrez le nom ou l'email de l'utilisateur"
                  value={searchUserEmail}
                  onChange={(event) => setSearchUserEmail(event.target.value)}
                />
              </label>
              <button type="submit">Rechercher</button>
            </form>
          </section>
        ) : null}

        {page === "overview" && (
          <section className="admin-layout admin-overview-layout">
            <div className="admin-panel admin-users-panel">
              <div className="admin-panel-head">
                <div>
                  <span className="admin-panel-eyebrow">Liste des utilisateurs </span>
                  
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Role</th>
                      <th>Email</th>
                      <th>Signalements</th>
                      <th>Etat</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="7" className="admin-empty-cell">Chargement...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan="7" className="admin-empty-cell">Aucun utilisateur trouve.</td></tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>#{user.id}</td>
                          <td>{user.name}</td>
                          <td><span className={`admin-role-badge is-${user.role}`}>{user.role}</span></td>
                          <td>{user.email}</td>
                          <td>{user.reportsReceived}</td>
                          <td>
                            <span className={`admin-status-badge ${user.isSuspended ? "is-banned" : "is-active"}`}>
                              {user.isSuspended ? "Banni" : "Actif"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button type="button" onClick={() => handleViewUser(user.id)}>
                                Voir les informations
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        )}

        {page === "reports" && (
          <section className="admin-layout admin-reports-layout">
            <div className="admin-panel admin-reports-panel">
              <div className="admin-panel-head">
                <div>
                  <span className="admin-panel-eyebrow">Nouveaux signalements</span>
                </div>
              </div>

              <div className="admin-reports-editorial-list">
                {isLoading ? (
                  <div className="admin-empty-state"><strong>Chargement...</strong></div>
                ) : newReports.length === 0 ? (
                  <div className="admin-empty-state">
                    <strong>Aucun nouveau signalement</strong>
                    <p>Les nouveaux signalements apparaitront ici.</p>
                  </div>
                ) : (
                  newReports.map((report) => (
                    <article key={report.id} className="admin-report-editorial-card admin-report-editorial-card-fresh">
                      <div className="admin-report-editorial-top">
                        <div>
                          <h1>{report.reason}</h1>
                        </div>
                        <span className={`admin-report-status ${getReportStatusClassName(report.status)}`}>{getReportStatusLabel(report.status)}</span>
                      </div>

                      <p className="admin-report-summary">
                        {report.details || "Aucun detail supplementaire partage par l'utilisateur."}
                      </p>

                      <div className="admin-report-people-grid">
                        <div>
                          <span>Signaleur</span>
                          <strong>{report.reporterName}</strong>
                          <small>{report.reporterEmail}</small>
                        </div>
                        <div>
                          <span>Personne signalée </span>
                          <strong>{report.reportedUserName}</strong>
                          <small>{report.reportedUserEmail}</small>
                        </div>
                      </div>

                      <div className="admin-report-editorial-footer">
                        <span>{formatDate(report.createdAt)}</span>
                        <div className="admin-report-footer-actions is-primary">
                          <button
                            type="button"
                            className="admin-mail-btn is-muted"
                            onClick={() => handleUpdateWorkflowStatus(report.id, "refuse")}
                          >
                            Rejeter
                          </button>
                          <button
                            type="button"
                            className="admin-mail-btn"
                            onClick={() => handleUpdateWorkflowStatus(report.id, "ouvert")}
                          >
                            Traiter
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>

              <div className="admin-panel-head admin-panel-head-secondary">
                <div>
                  <span className="admin-panel-eyebrow">Filtrage des signalements</span>
                </div>
                <label className="admin-report-filter">
                  <span>Filtrer</span>
                  <select
                    value={reportStatusFilter}
                    onChange={(event) => setReportStatusFilter(event.target.value)}
                  >
                    <option value="tous">Tous</option>
                    <option value="ouvert">Ouverts</option>
                    <option value="ferme">Fermes</option>
                    <option value="refuse">Refuses</option>
                  </select>
                </label>
              </div>

              <div className="admin-reports-editorial-list">
                {isLoading ? (
                  <div className="admin-empty-state"><strong>Chargement...</strong></div>
                ) : trackedReports.length === 0 ? (
                  <div className="admin-empty-state">
                    <strong>Aucun signalement</strong>
                    <p>Aucun signalement ne correspond au filtre selectionne.</p>
                  </div>
                ) : (
                  trackedReports.map((report) => (
                    <article key={report.id} className={`admin-report-editorial-card ${selectedReport?.id === report.id ? "is-selected" : ""}`}>
                      <div className="admin-report-editorial-top">
                        <div>
                          <h1>{report.reason}</h1>
                        </div>
                        <span className={`admin-report-status ${getReportStatusClassName(report.status)}`}>{getReportStatusLabel(report.status)}</span>
                      </div>

                      <p className="admin-report-summary">
                        {report.details || "Aucun detail supplementaire partage par l'utilisateur."}
                      </p>

                      <div className="admin-report-people-grid">
                        <div>
                          <span>Signaleur</span>
                          <strong>{report.reporterName}</strong>
                          <small>{report.reporterEmail}</small>
                        </div>
                        <div>
                          <span>Personne signalée </span>
                          <strong>{report.reportedUserName}</strong>
                          <small>{report.reportedUserEmail}</small>
                        </div>
                      </div>

                      <div className="admin-report-editorial-footer">
                        <span>{formatDate(report.createdAt)}</span>
                        <div className="admin-report-footer-actions">
                          {report.status === "ouvert" ? (
                            <>
                              <button type="button" onClick={() => handleViewReport(report.id)}>
                                Voir les details
                              </button>
                              <button
                                type="button"
                                className="admin-mail-btn is-muted"
                                onClick={() => handleUpdateWorkflowStatus(report.id, "refuse")}
                              >
                                Refuser le signal
                              </button>
                            </>
                          ) : null}
                          {report.status === "refuse" ? (
                            <button
                              type="button"
                              className="admin-mail-btn is-ghost"
                              onClick={() => handleUpdateWorkflowStatus(report.id, "en_cours")}
                            >
                              Remettre en cours
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

          </section>
        )}
      </main>

      {page === "reports" && selectedReport ? (
        <div className="admin-report-modal-backdrop" onClick={closeReportModal}>
          <div
            className="admin-report-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-report-modal-title"
          >
            <div className="admin-report-modal-head">
              <div>
                <h2 id="admin-report-modal-title">{selectedReport.reason}</h2>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeReportModal}>
                Fermer
              </button>
            </div>

            <div className="admin-report-detail-card admin-report-action-card">
              <div className="admin-report-detail-grid admin-report-detail-grid-compact">
                <div>
                  <span>Mail envoye</span>
                  <strong>{selectedReport.isReportedUserEmailSent ? "Oui" : "Non"}</strong>
                </div>
                <div>
                  <span>Date de retour actuelle</span>
                  <strong>{formatDate(reportMailPreviewReturnDate)}</strong>
                </div>
                <div>
                  <span>Duree email</span>
                  <strong>{formatDurationDays(reportMailPreviewDurationDays)}</strong>
                </div>
                <div>
                  <span>Personne signalee</span>
                  <strong>{selectedReport.reportedUserName}</strong>
                </div>
                
              </div>
              <div className="admin-report-detail-actions">
               
                <button
                  type="button"
                  className="admin-mail-btn is-danger"
                  onClick={handleNotifyBannedUser}
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? "Envoi..." : "Envoyer un mail a la personne signalée"}
                </button>
              </div>
              <div className="admin-ban-config">
                <label>
                  <span>Utilisateur a bannir</span>
                  <input type="text" value={selectedReport.reportedUserName || ""} disabled />
                </label>
                <label>
                  <span>Duree du ban (jours)</span>
                  <input
                    type="number"
                    min="1"
                    value={reportBanDurationDays}
                    onChange={(event) => setReportBanDurationDays(event.target.value)}
                    placeholder="7"
                  />
                </label>
                <label>
                  <span>Raison du ban</span>
                  <textarea
                    rows="4"
                    value={reportBanReason}
                    onChange={(event) => setReportBanReason(event.target.value)}
                    placeholder="Ecrivez la raison du ban"
                  />
                </label>
              </div>
              <button
                type="button"
                className={`admin-ban-wide ${selectedReport.reportedUserIsSuspended ? "is-secondary" : "is-danger"}`}
                onClick={handleBanReportedUser}
                disabled={isApplyingReportBan || selectedReport.reportedUserIsSuspended}
              >
                {selectedReport.reportedUserIsSuspended
                  ? "Utilisateur deja banni"
                  : isApplyingReportBan
                    ? "Bannissement..."
                    : "Bannir l'utilisateur signalee"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {page === "overview" && selectedUser ? (
        <div className="admin-report-modal-backdrop" onClick={closeUserModal}>
          <div
            className="admin-report-modal admin-user-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-modal-title"
          >
            <div className="admin-report-modal-head">
              <div>
                <h2 id="admin-user-modal-title">Informations de l'utilisateur</h2>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeUserModal}>
                Fermer
              </button>
            </div>

            <div className="admin-user-card">
              <div className="admin-user-card-top">
                <div>
                  <div className="admin-user">Bloc d'informations utilisateur</div>
                  <p className="admin-user-card-intro">
                    Les informations completes de l'utilisateur selectionne apparaissent ici.
                  </p>
                </div>
                <span className={`admin-status-badge ${selectedUser.isSuspended ? "is-banned" : "is-active"}`}>
                  {selectedUser.isSuspended ? "Banni" : "Actif"}
                </span>
              </div>

              <div className="admin-user-meta-grid">
                <div><span>Matricule</span><strong>{selectedUser.id}</strong></div>
                <div><span>Nom et prénom</span><strong>{selectedUser.name}</strong></div>
                <div><span>Email</span><strong>{selectedUser.email || "-"}</strong></div>
                <div><span>Role</span><strong>{selectedUser.role}</strong></div>
                <div><span>Company</span><strong>{selectedUser.company || "-"}</strong></div>
                <div><span>Title</span><strong>{selectedUser.title || "-"}</strong></div>
                <div><span>Location</span><strong>{selectedUser.location || "-"}</strong></div>
                <div><span>Phone</span><strong>{selectedUser.phone || "-"}</strong></div>
                <div><span>Points</span><strong>{selectedUser.points}</strong></div>
                <div><span>Cree le</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
                <div><span>Raison du ban</span><strong>{selectedUser.suspensionReason || "-"}</strong></div>
                <div><span>Date de retour</span><strong>{formatDate(selectedUser.suspendedUntil)}</strong></div>
                <div><span>Duree</span><strong>{formatDurationDays(selectedUser.suspensionDurationDays)}</strong></div>
              </div>

              <div className="admin-ban-history">
                <div className="admin-ban-history-head">
                  <span className="admin-panel-eyebrow">Historique des bans</span>
                </div>
                {!selectedUser.banHistory?.length ? (
                  <p className="admin-ban-history-empty">Aucun historique de ban pour cet utilisateur.</p>
                ) : (
                  <div className="admin-ban-history-list">
                    {selectedUser.banHistory.map((entry) => (
                      <article key={entry.id} className="admin-ban-history-item">
                        <strong>{entry.reason}</strong>
                        <span>Date du ban: {formatDate(entry.createdAt)}</span>
                        <span>Date de retour: {formatDate(entry.suspendedUntil)}</span>
                        <span>Duree: {formatDurationDays(entry.durationDays)}</span>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-ban-config">
                <label>
                  <span>Raison du ban</span>
                  <textarea
                    rows="4"
                    value={banReason}
                    onChange={(event) => setBanReason(event.target.value)}
                    placeholder="Explique la raison du ban"
                  />
                </label>
                <label>
                  <span>Duree du ban (jours)</span>
                  <input
                    type="number"
                    min="1"
                    value={banDurationDays}
                    onChange={(event) => setBanDurationDays(event.target.value)}
                    placeholder="7"
                    disabled={selectedUser.isSuspended}
                  />
                </label>
              </div>

              <button
                type="button"
                className={`admin-ban-wide ${selectedUser.isSuspended ? "is-secondary" : "is-danger"}`}
                onClick={handleBanSubmit}
                disabled={isApplyingBan}
              >
                {isApplyingBan ? "Mise a jour..." : selectedUser.isSuspended ? "Debannir cet utilisateur" : "Bannir cet utilisateur"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
