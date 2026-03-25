import { useState, useRef } from "react";
import { Link } from "react-router-dom"; 
import { io } from "socket.io-client";
import Chat from "./Chat";
import "./App.css";
export default ChatPage;

const socket = io("http://localhost:4500");

function ChatPage() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const fileRef = useRef(null);

  const joinRoom = () => {
    if (username.trim() !== "" && room.trim() !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  if (!showChat) {
    return (
      <div className="join-container">
        <div className="join-card">
          <div className="join-logo">Freelancy</div>
          <div className="join-subtitle">Rejoignez votre espace de travail</div>

          <div className="join-label">Votre nom</div>
          <input
            className="join-input"
            type="text"
            placeholder="Ex: Sarah Chen"
            onChange={(e) => setUsername(e.target.value)}
          />

          <div className="join-label">ID du salon</div>
          <input
            className="join-input"
            type="text"
            placeholder="Ex: design-mobile-2026"
            onChange={(e) => setRoom(e.target.value)}
          />

          <button className="join-btn" onClick={joinRoom}>
            Rejoindre le salon →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <nav className="nav">
        <div className="nav-logo">Freelancy</div>
        <ul className="nav-links">
          <li><a href="#">Parcourir les talents</a></li>
          <li><a href="#">Catégories</a></li>
          <li><a href="#">Comment ça marche</a></li>
          <li><a href="#">Tableau de bord</a></li>
        </ul>
        <div className="nav-actions">
          <button className="nav-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className="btn-signin">Se connecter</button>
          <button className="btn-post">Publier un projet</button>
        </div>
      </nav>

      <div className="main-content">
        <Link className="back-link" to="/">
          Retour à mes contrats
        </Link>

        <div className="deal-layout">
          <div>
            <div className="deal-card">
              <div className="deal-title">Design UI/UX Application Mobile</div>

              <div className="deal-field-label">Statut</div>
              <div className="status-badge">
                <span className="status-dot" />
                En attente du paiement d'avance
              </div>

              <div className="amount-block">
                <div className="deal-field-label">Montant total</div>
                <div className="amount-value">
                  <span className="amount-currency">10 500 DT</span>
                </div>
              </div>

              <div className="deadline-block">
                <div className="deal-field-label">Date limite</div>
                <div className="deadline-value">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  15 mars 2026
                </div>
                <div className="days-remaining">12 jours restants</div>
              </div>
            </div>

            <div className="actions-card">
              <div className="actions-title">Actions</div>
              <button className="btn-action" onClick={() => fileRef.current.click()}>
                Soumettre une livraison
              </button>
              <input type="file" ref={fileRef} style={{ display: "none" }} />
            </div>
          </div>

          <Chat socket={socket} username={username} room={room} />
        </div>
      </div>
    </div>
  );
}

