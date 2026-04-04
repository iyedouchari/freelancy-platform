import { useEffect, useRef, useState } from "react";
import "../../styles/landing.css";
import Chat from "./Chat.jsx";

const API_BASE = "http://localhost:4000";

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function readDealField(deal, camelKey, snakeKey) {
  if (!deal) return undefined;
  if (deal[camelKey] !== undefined && deal[camelKey] !== null) return deal[camelKey];
  return deal[snakeKey];
}

function getParticipantName(viewerRole, explicitName) {
  if (explicitName) return explicitName;
  if (viewerRole === "client") {
    return localStorage.getItem("client_name") || "Client";
  }
  return localStorage.getItem("freelancer_name") || "Freelancer";
}

function getWorkspaceMeta(viewerRole, selectedDeal) {
  if (viewerRole === "client") {
    return {
      counterpartLabel: "Freelancer",
      counterpartName: readDealField(selectedDeal, "freelancerName", "freelancer_name") || "Freelancer",
      actionLabel: "Partager un fichier projet",
      receiverId: readDealField(selectedDeal, "freelancerId", "freelancer_id"),
    };
  }

  return {
    counterpartLabel: "Client",
    counterpartName: readDealField(selectedDeal, "clientName", "client_name") || "Client",
    actionLabel: "Soumettre une livraison",
    receiverId: readDealField(selectedDeal, "clientId", "client_id"),
  };
}

function formatDeadline(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function resolveFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRemainingTime(deadline) {
  if (!deadline) return "Date limite indisponible";

  const target = new Date(deadline);
  if (Number.isNaN(target.getTime())) return "Date limite indisponible";

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Date limite depassee";

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days === 0) {
    return `${hours} heure${hours !== 1 ? "s" : ""} restante${hours !== 1 ? "s" : ""}`;
  }

  return `${days} jour${days !== 1 ? "s" : ""} et ${hours} heure${hours !== 1 ? "s" : ""} restante${days !== 1 || hours !== 1 ? "s" : ""}`;
}

export default function Workspace({
  dealId,
  deal,
  onBack,
  viewerRole = "freelancer",
  participantName: participantNameProp,
  backLabel = "Retour a mes accords",
  socket,
  myUserId,
}) {
  const uploadRef = useRef(null);
  const [selectedDeal, setSelectedDeal] = useState(deal ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryFiles, setDeliveryFiles] = useState([]);
  const [deliveryUploading, setDeliveryUploading] = useState(false);
  const [deletingDeliveryId, setDeletingDeliveryId] = useState(null);

  const resolvedDealId = dealId ?? deal?.id;

  const loadDeliveries = async () => {
    if (!resolvedDealId) {
      setDeliveryFiles([]);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/deals/${resolvedDealId}/deliveries`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Impossible de charger les livraisons.");
      const rows = await res.json();

      const files = rows
        .filter((msg) => msg.file_url)
        .map((msg) => ({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          fileName: msg.file_name || "Fichier",
          fileUrl: resolveFileUrl(msg.file_url),
          sentAt: msg.created_at,
        }))
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

      setDeliveryFiles(files);
    } catch {
      setDeliveryFiles([]);
    }
  };

  useEffect(() => {
    if (!resolvedDealId) {
      setSelectedDeal(null);
      setError("Aucun deal selectionne.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadDeal = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/deals/${resolvedDealId}`, {
          signal: controller.signal,
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Deal introuvable.");
          }
          if (res.status === 401) {
            throw new Error("Session expiree. Reconnectez-vous.");
          }
          throw new Error("Impossible de charger ce deal.");
        }

        const payload = await res.json();
        setSelectedDeal(payload?.data ?? null);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSelectedDeal(null);
          setError(err.message || "Erreur lors du chargement du deal.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDeal();

    return () => controller.abort();
  }, [resolvedDealId]);

  useEffect(() => {
    if (!resolvedDealId) {
      setDeliveryFiles([]);
      return;
    }

    loadDeliveries();
  }, [resolvedDealId]);

  if (loading) {
    return <div className="workspace-page" style={{ padding: "2rem" }}>Chargement...</div>;
  }

  if (error || !selectedDeal) {
    return <div className="workspace-page" style={{ padding: "2rem" }}>{error || "Projet introuvable."}</div>;
  }

  const participantName = getParticipantName(viewerRole, participantNameProp);
  const workspaceMeta = getWorkspaceMeta(viewerRole, selectedDeal);
  const resolvedMyUserId =
    myUserId ||
    (viewerRole === "client"
      ? readDealField(selectedDeal, "clientId", "client_id")
      : readDealField(selectedDeal, "freelancerId", "freelancer_id"));
  const daysLeft = readDealField(selectedDeal, "daysLeft", "days_left");
  const dealTitle = readDealField(selectedDeal, "title", "title");
  const dealDescription = readDealField(selectedDeal, "description", "description");
  const dealStatus = readDealField(selectedDeal, "status", "status");
  const finalPrice = readDealField(selectedDeal, "finalPrice", "final_price");
  const deadline = readDealField(selectedDeal, "deadline", "deadline");
  const timeRemainingLabel = formatRemainingTime(deadline);

  const handleDeliveryFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !resolvedDealId || !resolvedMyUserId || !workspaceMeta.receiverId) {
      event.target.value = "";
      return;
    }

    setDeliveryUploading(true);
    try {
      const params = new URLSearchParams({
        senderId: String(resolvedMyUserId),
        receiverId: String(workspaceMeta.receiverId),
        fileName: file.name,
      });

      const uploadRes = await fetch(`${API_BASE}/api/deals/${resolvedDealId}/deliveries/upload?${params.toString()}`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload HTTP ${uploadRes.status}`);
      }

      const uploaded = await uploadRes.json();
      setDeliveryFiles((prev) => {
        const nextFile = {
          id: uploaded.id ?? `local-${Date.now()}`,
          senderId: resolvedMyUserId,
          receiverId: workspaceMeta.receiverId,
          fileName: uploaded.file_name || file.name,
          fileUrl: resolveFileUrl(uploaded.file_url),
          sentAt: uploaded.created_at || new Date().toISOString(),
        };
        const merged = [nextFile, ...prev.filter((item) => item.id !== nextFile.id)];
        return merged.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      });
      await loadDeliveries();
    } catch (err) {
      console.error("Erreur soumission livraison:", err);
    } finally {
      setDeliveryUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteDelivery = async (deliveryId) => {
    if (!resolvedDealId || !deliveryId) return;

    setDeletingDeliveryId(deliveryId);
    try {
      const res = await fetch(`${API_BASE}/api/deals/${resolvedDealId}/deliveries/${deliveryId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Delete HTTP ${res.status}`);
      }

      setDeliveryFiles((prev) => prev.filter((file) => file.id !== deliveryId));
    } catch (err) {
      console.error("Erreur suppression livraison:", err);
    } finally {
      setDeletingDeliveryId(null);
    }
  };

  return (
    <div className="workspace-page">
      <div className="workspace-back-row">
        <button className="workspace-back-btn" onClick={() => onBack?.()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {backLabel}
        </button>
      </div>

      <div className="workspace-layout">
        <div className="workspace-details">
          <div className="workspace-deal-card">
            <div className="workspace-deal-badge">{dealStatus}</div>
            <h2 className="workspace-deal-title">{dealTitle}</h2>
            <p className="workspace-deal-description">{dealDescription}</p>

            <div className="workspace-deal-info-grid">
              <div className="workspace-deal-info">
                <div className="workspace-deal-info-label">Montant total</div>
                <div className="workspace-deal-amount">{finalPrice} DT</div>
              </div>

              <div className="workspace-deal-info">
                <div className="workspace-deal-info-label">Date limite</div>
                <div className="workspace-deal-deadline">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {formatDeadline(deadline)}
                </div>
                <div className="workspace-days-left">
                  {daysLeft === null || daysLeft < 0
                    ? "Projet finalise"
                    : timeRemainingLabel}
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-actions-card">
            <h3>Actions</h3>
            <button
              className="workspace-action-btn"
              onClick={() => uploadRef.current?.click()}
              disabled={deliveryUploading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {deliveryUploading ? "Envoi en cours..." : workspaceMeta.actionLabel}
            </button>
            <input
              type="file"
              ref={uploadRef}
              style={{ display: "none" }}
              onChange={handleDeliveryFile}
            />

            <div className="workspace-delivery-list">
              <h4>Fichiers envoyes</h4>
              {deliveryFiles.length === 0 ? (
                <p className="workspace-delivery-empty">Aucun fichier envoye pour le moment.</p>
              ) : (
                <ul>
                  {deliveryFiles.map((file) => (
                    <li key={file.id}>
                      <div className="workspace-delivery-row">
                        <div className="workspace-delivery-main">
                          <a href={file.fileUrl} target="_blank" rel="noreferrer">
                            {file.fileName}
                          </a>
                          <strong className="workspace-delivery-author">
                            Envoye par{" "}
                            {String(file.senderId) === String(readDealField(selectedDeal, "clientId", "client_id"))
                              ? readDealField(selectedDeal, "clientName", "client_name") || "Client"
                              : readDealField(selectedDeal, "freelancerName", "freelancer_name") || "Freelancer"}
                          </strong>
                          <span>{formatDateTime(file.sentAt)}</span>
                        </div>
                        {String(file.senderId) === String(resolvedMyUserId) && (
                          <button
                            type="button"
                            className="workspace-delivery-delete"
                            onClick={() => handleDeleteDelivery(file.id)}
                            disabled={deletingDeliveryId === file.id}
                          >
                            {deletingDeliveryId === file.id ? "Suppression..." : "Supprimer"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <Chat
          socket={socket}
          username={participantName}
          chatTitle={workspaceMeta.counterpartName}
          myUserId={resolvedMyUserId}
          receiverId={workspaceMeta.receiverId}
          dealId={resolvedDealId}
        />
      </div>
    </div>
  );
}
