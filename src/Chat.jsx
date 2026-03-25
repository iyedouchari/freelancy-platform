import { useState, useRef, useEffect } from "react";

function formatTime(date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function Chat({ socket, username, room }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const usernameRef = useRef(username);

useEffect(() => {
  usernameRef.current = username;
}, [username]);

useEffect(() => {
    const handleReceive = (data) => { //fonction pour recevoir le message 
     console.log("reçu:", data); // bech nthabet bih 
    if (data.author === usernameRef.current) return; // si l message iji meni ignore le
    setMessages((prev) => [
      ...prev, // Si nahiw l ...prev , twali ki teb3ath message yrtnahaw les anciens message (iwali hedha 3ibara le 1er message)
      {
        id: Date.now(),
        type: "them",
        sender: data.author,
        text: data.message,
        isFile: data.isFile || false,
        fileName: data.fileName || null,
        fileUrl: data.fileUrl || null,
        time: formatTime(new Date()),
      },
    ]);
  };

  socket.on("receive_message", handleReceive);
  return () => socket.off("receive_message", handleReceive); // socket arrete a ecouter 
}, []); // medem fama [] , il s'execute une seule fois au debut

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" }); // ?. verifie si l'element existe ou non 
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("send_message", { room, author: username, message: input, time: new Date() });
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "me", text: input, time: formatTime(new Date()) },
    ]);
    setInput("");
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), type: "me", isFile: true, fileName: file.name, fileUrl, time: formatTime(new Date()) },
    ]);
    socket.emit("send_message", {
      room, author: username, message: "",
      isFile: true, fileName: file.name, fileUrl, time: new Date(),
    });
    e.target.value = "";
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-title">Chat</div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Aucun message pour le moment</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`msg-bubble-wrap ${msg.type}`}>
              {msg.type === "them" && msg.sender && (
                <div className="msg-sender">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  {msg.sender}
                </div>
              )}
              {msg.isFile ? (
                <div
                  className="file-msg"
                  onClick={() => msg.fileUrl && window.open(msg.fileUrl, "_blank")}
                  style={{ cursor: msg.fileUrl ? "pointer" : "default" }}
                  title="Cliquer pour ouvrir"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>{msg.fileName}</span>
                  {msg.fileUrl && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto", opacity: 0.5 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  )}
                </div>
              ) : (
                <div className="msg-bubble">{msg.text}</div>
              )}
              <div className="msg-time">{msg.time}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
        <button className="upload-icon-btn" onClick={() => fileRef.current.click()} title="Joindre un fichier">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input
          className="chat-input"
          type="text"
          placeholder="Écrire un message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="send-btn" onClick={sendMessage}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
