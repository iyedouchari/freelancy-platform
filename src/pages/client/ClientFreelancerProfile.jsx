import { useState } from "react";
import "./ClientFreelancerProfile.css";

function renderStars(stars) {
  return "★".repeat(stars);
}

export default function ClientFreelancerProfile({
  profile,
  feedbackEntries,
  onBack,
  onAddFeedback,
}) {
  const [comment, setComment] = useState("");
  const [stars, setStars] = useState(5);

  if (!profile) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!comment.trim()) {
      return;
    }

    onAddFeedback?.(profile.id, { comment: comment.trim(), stars });
    setComment("");
    setStars(5);
  };

  return (
    <div className="client-freelancer-profile-page">
      <div className="client-freelancer-profile-shell">
        <button type="button" className="client-freelancer-back-btn" onClick={onBack}>
          Retour aux demandes
        </button>

        <section className="client-freelancer-hero">
          <div className="client-freelancer-avatar">
            {profile.name
              .split(" ")
              .map((item) => item[0])
              .join("")
              .slice(0, 2)}
          </div>

          <div className="client-freelancer-copy">
            <span className="client-freelancer-eyebrow">Profil freelance</span>
            <h1>{profile.name}</h1>
            <p>{profile.title}</p>
            <div className="client-freelancer-tags">
              <span>{profile.location}</span>
              <span>Note {profile.rating.toFixed(1)}</span>
              <span>{profile.projectsCompleted} projets livres</span>
            </div>
          </div>

          <div className="client-freelancer-metrics">
            <article>
              <span>Taux de reussite</span>
              <strong>{profile.successRate}</strong>
            </article>
            <article>
              <span>Reputation</span>
              <strong>{profile.reputationPoints}</strong>
            </article>
          </div>
        </section>

        <section className="client-freelancer-panel">
          <h2>À propos</h2>
          <p>{profile.bio}</p>
        </section>

        <section className="client-freelancer-panel">
          <h2>Expertises</h2>
          <div className="client-freelancer-fields">
            {profile.fields.map((field) => (
              <span key={field}>{field}</span>
            ))}
          </div>
        </section>

        <section className="client-freelancer-panel">
          <h2>Coordonnees</h2>
          <div className="client-freelancer-contact-grid">
            <div>
              <span>Email</span>
              <strong>{profile.email}</strong>
            </div>
            <div>
              <span>Téléphone</span>
              <strong>{profile.phone}</strong>
            </div>
          </div>
        </section>

        <section className="client-freelancer-panel">
          <div className="client-freelancer-feedback-head">
            <div>
              <h2>Feedback client</h2>
              <p>Ajoutez un retour directement sur le profil du freelance.</p>
            </div>
          </div>

          <form className="client-freelancer-feedback-form" onSubmit={handleSubmit}>
            <label>
              <span>Votre note</span>
              <select value={stars} onChange={(event) => setStars(Number(event.target.value))}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} etoile{value > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide">
              <span>Votre avis</span>
              <textarea
                rows={4}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Partagez votre impression sur ce freelance, son approche et sa communication."
              />
            </label>
            <button type="submit">Ajouter l'avis</button>
          </form>

          <div className="client-freelancer-feedback-list">
            {feedbackEntries.length === 0 ? (
              <div className="client-freelancer-feedback-empty">
                Aucun avis pour le moment.
              </div>
            ) : (
              feedbackEntries.map((feedback, index) => (
                <article key={`${feedback.client}-${index}`} className="client-freelancer-feedback-card">
                  <div className="client-freelancer-feedback-top">
                    <div>
                      <strong>{feedback.client}</strong>
                      <span>{feedback.title}</span>
                    </div>
                    <p>{renderStars(feedback.stars)}</p>
                  </div>
                  <p>{feedback.comment}</p>
                  <small>{feedback.date}</small>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
