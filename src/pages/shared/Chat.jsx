import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:4000";

function createMessageItem(message, myUserId, username) {
  const isMine = message.senderId?.toString?.() === myUserId?.toString?.()
    || message.sender_id?.toString?.() === myUserId?.toString?.();

  return {
    id: message.id ?? `${message.sentAt ?? message.sent_at ?? Date.now()}-${message.fileName ?? message.content ?? "msg"}`,
    type: isMine ? "me" : "them",
    sender: isMine ? username : "Destinataire",
    text: message.content,
    fileName: message.fileName || message.file_name || null,
    fileUrl: resolveFileUrl(message.fileUrl || message.file_url),
    isFile: Boolean(message.fileName || message.file_name),
    time: formatDateTime(message.sentAt || message.sent_at || new Date()),
  };
}

function formatDateTime(date) {
  const d = new Date(date);
  return isNaN(d)
    ? ""
    : d.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function resolveFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl;
  return `${API_BASE}${fileUrl}`;
}

export default function Chat({
  socket,
  username,
  myUserId,
  receiverId,
  dealId,
  chatTitle,
  onOpenReport,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef(null);
  const fileRef = useRef(null);
  const hasLoadedInitialMessages = useRef(false);

  useEffect(() => {
    if (!socket || !myUserId || !dealId) return;

    socket.emit("register_user", myUserId);

    const loadHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat/history/${dealId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data.map((message) => createMessageItem(message, myUserId, username)) : []);
      } catch (err) {
        console.error("Erreur chargement historique :", err);
      }
    };

    loadHistory();

    const handleReceive = (data) => {
      const isSameDeal = data.dealId?.toString() === dealId?.toString();
      const isFromOther = data.senderId?.toString() !== myUserId?.toString();

      if (isSameDeal && isFromOther) {
        setMessages((prev) => [...prev, createMessageItem(data, myUserId, username)]);
      }
    };

    const handleError = (data) => {
      console.error("Erreur socket :", data?.error || "Echec de l'envoi du message.");
      setSending(false);
    };

    socket.on("receive_message", handleReceive);
    socket.on("message_error", handleError);
    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("message_error", handleError);
    };
  }, [socket, myUserId, dealId, username]);

  useEffect(() => {
    if (!messages.length) return;

    if (!hasLoadedInitialMessages.current) {
      hasLoadedInitialMessages.current = true;
      return;
    }

    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !dealId || !socket || !myUserId || !receiverId) return;

    const payload = {
      dealId,
      senderId: myUserId,
      receiverId,
      content: input.trim(),
    };

    setSending(true);
    socket.emit("send_message", payload);

    setMessages((prev) => [...prev, createMessageItem(payload, myUserId, username)]);
    setInput("");
    setSending(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !dealId || !myUserId || !receiverId) return;

    try {
      setSending(true);
      const params = new URLSearchParams({
        dealId: String(dealId),
        senderId: String(myUserId),
        receiverId: String(receiverId),
        fileName: file.name,
      });

      const uploadRes = await fetch(`${API_BASE}/api/chat/upload?${params.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload HTTP ${uploadRes.status}`);
      }

      const uploaded = await uploadRes.json();
      const absoluteFileUrl = resolveFileUrl(uploaded.fileUrl);

      socket.emit("send_message", {
        dealId,
        senderId: myUserId,
        receiverId,
        content: `[Fichier] ${uploaded.fileName}`,
        fileName: uploaded.fileName,
        fileUrl: uploaded.fileUrl,
      });

      setMessages((prev) => [
        ...prev,
        createMessageItem(
          {
            id: Date.now(),
            senderId: myUserId,
            content: `[Fichier] ${uploaded.fileName}`,
            fileName: uploaded.fileName,
            fileUrl: absoluteFileUrl,
            sentAt: new Date().toISOString(),
          },
          myUserId,
          username,
        ),
      ]);
    } catch (err) {
      console.error("Erreur upload fichier :", err);
    } finally {
      setSending(false);
      e.target.value = "";
    }
  };

  return (
    <div className="workspace-chat">
      <div className="workspace-chat-header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <div className="workspace-chat-title-block">
          <small>{chatTitle || "Destinataire"}</small>
        </div>
        {onOpenReport ? (
          <button type="button" className="workspace-report-btn" onClick={onOpenReport}>
            Reporter
          </button>
        ) : null}
      </div>

      <div className="workspace-chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="workspace-chat-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4f6ce8" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>Aucun message pour le moment</p>
            <span>Commencez la conversation</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`workspace-msg ${msg.type}`}>
              <div className={`workspace-msg-bubble ${msg.isFile ? "is-file" : ""}`}>
                {msg.isFile ? (
                  <button
                    type="button"
                    className="workspace-file-msg"
                    onClick={() => msg.fileUrl && window.open(msg.fileUrl, "_blank")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{msg.fileName}</span>
                  </button>
                ) : (
                  msg.text
                )}
              </div>
              <div className="workspace-msg-time">{msg.time}</div>
            </div>
          ))
        )}
      </div>

      <div className="workspace-chat-input">
        <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
        <button
          className="workspace-attach-btn"
          onClick={() => fileRef.current?.click()}
          title="Joindre un fichier"
          disabled={sending}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          className="workspace-chat-textinput"
          type="text"
          placeholder="Ecrire un message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="workspace-send-btn" onClick={sendMessage} disabled={sending}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
