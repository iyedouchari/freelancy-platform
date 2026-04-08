import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/landing.css";

function formatSuspendedUntil(value) {
  if (!value) {
    return "Duree indefinie";
  }

  try {
    return new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function BlockedAccess() {
  const navigate = useNavigate();
  const isSuspended = localStorage.getItem("is_suspended") === "true";
  const reason = localStorage.getItem("suspension_reason") || "Violation des regles de la plateforme.";
  const suspendedUntil = localStorage.getItem("suspended_until");

  useEffect(() => {
    if (!isSuspended) {
      navigate("/login");
    }
  }, [isSuspended, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("app_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("client_entry_page");
    localStorage.removeItem("is_suspended");
    localStorage.removeItem("suspension_reason");
    localStorage.removeItem("suspended_until");
    navigate("/login");
  };

  return (
    <div className="blocked-page-shell">
      <div className="blocked-page-card">
        <span className="blocked-page-eyebrow">Accés bloqué</span>
        <h1>Ce compte est temporairement bloqué.</h1>
        <p>
          Vous ne pouvez pas se connecter pendant la durée du ban.
        </p>

        <div className="blocked-page-panel">
          <span>Raison</span>
          <strong>{reason}</strong>
        </div>

        <div className="blocked-page-panel">
          <span>Date de retour</span>
          <strong>{formatSuspendedUntil(suspendedUntil)}</strong>
        </div>

        <button type="button" className="blocked-page-btn" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
