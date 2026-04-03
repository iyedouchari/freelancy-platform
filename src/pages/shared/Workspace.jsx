import { useEffect, useRef, useState } from "react";
import "../../styles/landing.css";

function formatTime(date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function createSystemMessage(text) {
  return {
    id: `system-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: "system",
    text,
    time: formatTime(new Date()),
  };
}

function getParticipantName(viewerRole, explicitName) {
  if (explicitName) {
    return explicitName;
  }

  if (viewerRole === "client") {
    return localStorage.getItem("client_name") || "Iyed";
  }

  return localStorage.getItem("freelancer_name") || "Freelancer";
}

function WorkspaceChat({ participantName, roomCode, dealTitle, conversationTarget }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!participantName || !roomCode) {
      setMessages([]);
      return;
    }

    setMessages([
      createSystemMessage(`${participantName} a rejoint la salle ${roomCode}.`),
      createSystemMessage(`Le suivi est ouvert pour ${dealTitle}.`),
    ]);
  }, [dealTitle, participantName, roomCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "me", text: input.trim(), time: formatTime(new Date()) },
    ]);
    setInput("");
  };

  const handleFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "me",
        isFile: true,
        fileName: file.name,
        fileUrl,
        time: formatTime(new Date()),
      },
    ]);
    event.target.value = "";
  };

  return (
    <div className="workspace-chat">
      <div className="workspace-chat-header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <div className="workspace-chat-title-block">
          <span>Chat du projet</span>
          <small>
            Salle {roomCode} · {participantName}
          </small>
        </div>
      </div>
      <div className="workspace-chat-messages">
        {messages.length === 0 ? (
          <div className="workspace-chat-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Aucun message pour le moment</p>
            <span>Commencez la conversation avec votre {conversationTarget}</span>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`workspace-msg ${message.type}`}>
              {message.type === "system" ? (
                <div className="workspace-system-msg">
                  <span>{message.text}</span>
                  <small>{message.time}</small>
                </div>
              ) : (
                <>
                  {message.isFile ? (
                    <div
                      className="workspace-file-msg"
                      onClick={() => message.fileUrl && window.open(message.fileUrl, "_blank")}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span>{message.fileName}</span>
                    </div>
                  ) : (
                    <div className="workspace-msg-bubble">{message.text}</div>
                  )}
                  <div className="workspace-msg-time">{message.time}</div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="workspace-chat-input">
        <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
        <button className="workspace-attach-btn" onClick={() => fileRef.current?.click()} title="Joindre un fichier">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          className="workspace-chat-textinput"
          type="text"
          placeholder="Ecrire un message..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && sendMessage()}
        />
        <button className="workspace-send-btn" onClick={sendMessage}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function getWorkspaceMeta(viewerRole, selectedDeal) {
  if (viewerRole === "client") {
    return {
      counterpartLabel: "Freelancer",
      counterpartName: selectedDeal.freelancer || "Freelancer confirme",
      conversationTarget: "freelancer",
      actionLabel: "Partager un fichier projet",
    };
  }

  return {
    counterpartLabel: "Client",
    counterpartName: selectedDeal.client || selectedDeal.clientName || "Client confirme",
    conversationTarget: "client",
    actionLabel: "Soumettre une livraison",
  };
}

export default function Workspace({
  dealId,
  deal,
  onBack,
  viewerRole = "freelancer",
  participantName: participantNameProp,
  backLabel = "Retour a mes accords",
}) {
  const uploadRef = useRef(null);
  const selectedDeal = deal ?? null;

  if (!selectedDeal) {
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
          <div className="workspace-deal-card">
            <h2 className="workspace-deal-title">Aucun deal ouvert</h2>
            <p className="workspace-deal-description">
              Ouvrez un vrai deal depuis le dashboard client ou depuis Mes accords.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const participantName = getParticipantName(viewerRole, participantNameProp);
  const roomCode = selectedDeal?.roomCode ?? `deal-room-${selectedDeal?.id ?? "default"}`;
  const workspaceMeta = getWorkspaceMeta(viewerRole, selectedDeal);

  const handleBack = () => {
    onBack?.();
  };

  return (
    <div className="workspace-page">
      <div className="workspace-back-row">
        <button className="workspace-back-btn" onClick={handleBack}>
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
            <div className="workspace-deal-badge">{selectedDeal.status}</div>
            <h2 className="workspace-deal-title">{selectedDeal.title}</h2>
            <p className="workspace-deal-description">{selectedDeal.description}</p>

            <div className="workspace-deal-info-grid">
              <div className="workspace-deal-info">
                <div className="workspace-deal-info-label">{workspaceMeta.counterpartLabel}</div>
                <div className="workspace-deal-status">{workspaceMeta.counterpartName}</div>
              </div>

              <div className="workspace-deal-info">
                <div className="workspace-deal-info-label">Montant total</div>
                <div className="workspace-deal-amount">{selectedDeal.total} DT</div>
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
                  {selectedDeal.deadline}
                </div>
                <div className="workspace-days-left">
                  {selectedDeal.daysLeft === null
                    ? "Projet finalise"
                    : `${selectedDeal.daysLeft} jour${selectedDeal.daysLeft !== 1 ? "s" : ""} restant${
                        selectedDeal.daysLeft !== 1 ? "s" : ""
                      }`}
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-actions-card">
            <h3>Actions</h3>
            <div className="workspace-session-meta">
              <span>Participant</span>
              <strong>{participantName}</strong>
            </div>
            <div className="workspace-session-meta">
              <span>Salle active</span>
              <strong>{roomCode}</strong>
            </div>
            <button className="workspace-action-btn" onClick={() => uploadRef.current?.click()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {workspaceMeta.actionLabel}
            </button>
            <input type="file" ref={uploadRef} style={{ display: "none" }} />
          </div>
        </div>

        <WorkspaceChat
          participantName={participantName}
          roomCode={roomCode}
          dealTitle={selectedDeal.title}
          conversationTarget={workspaceMeta.conversationTarget}
        />
      </div>
    </div>
  );
}
