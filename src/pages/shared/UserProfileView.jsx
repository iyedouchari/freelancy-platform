import { useEffect, useMemo, useState } from "react";
import { reviewService } from "../../services/reviewService";
import { userService } from "../../services/userService";
import "./UserProfileView.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

function toAbsoluteMediaUrl(value) {
  const input = String(value || "").trim();
  if (!input) {
    return "";
  }

  if (input.startsWith("data:") || input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  if (input.startsWith("/")) {
    return `${apiOrigin}${input}`;
  }

  return `${apiOrigin}/${input}`;
}

function formatReviewDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderStars(score) {
  return "★".repeat(Math.max(1, Number(score || 0)));
}

function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function UserProfileView({ userId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [comment, setComment] = useState("");
  const [score, setScore] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editScore, setEditScore] = useState(5);
  const [editComment, setEditComment] = useState("");

  const currentUserId = String(localStorage.getItem("user_id") || "");
  const isOwnProfile = String(userId || "") === currentUserId;

  const handleSafeBack = () => {
    try {
      if (typeof onBack === "function") {
        onBack();
      } else {
        window.history.back();
      }
    } catch (error) {
      console.error("Error going back:", error);
      window.location.href = "/dashboard";
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setFeedback("");
      setProfile(null);
      setReviews([]);

      try {
        if (!userId) {
          return;
        }

        const user = await userService.getById(userId);
        if (!isMounted) {
          return;
        }

        if (!user) {
          setFeedback("Profil introuvable.");
          return;
        }

        setProfile(user);

        const reviewRows = await reviewService.listForUser(userId);
        if (!isMounted) {
          return;
        }

        const reviewsArray = Array.isArray(reviewRows) ? reviewRows : [];
        console.log("Reviews loaded from API:", reviewsArray, "currentUserId:", currentUserId);
        setReviews(reviewsArray);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Profile load error:", error);
        setFeedback(error.message || "Impossible de charger ce profil.");
        setProfile(null);
        setReviews([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) {
      return 0;
    }

    const total = reviews.reduce((sum, item) => sum + Number(item.score || 0), 0);
    return total / reviews.length;
  }, [reviews]);

  const initials = getInitials(profile?.name || "User");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      setFeedback("Ajoute un commentaire avant d'envoyer l'avis.");
      return;
    }

    if (comment.trim().length < 5) {
      setFeedback("Le commentaire doit contenir au moins 5 caractères.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback("");
      await reviewService.create({
        dealId: 0,
        toUserId: userId,
        score,
        comment: comment.trim(),
      });
      const latestReviews = await reviewService.listForUser(userId);

      setReviews(Array.isArray(latestReviews) ? latestReviews : []);
      setComment("");
      setScore(5);
      setFeedback("Avis ajouté avec succès.");
    } catch (error) {
      console.error("Create review error:", error);
      setFeedback(error.message || "Impossible d'ajouter l'avis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (review) => {
    setEditingReviewId(review.id);
    setEditScore(review.score);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditScore(5);
    setEditComment("");
  };

  const handleUpdateReview = async (event) => {
    event.preventDefault();

    if (!editComment.trim()) {
      setFeedback("Ajoute un commentaire avant d'envoyer l'avis.");
      return;
    }

    if (editComment.trim().length < 5) {
      setFeedback("Le commentaire doit contenir au moins 5 caractères.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback("");
      await reviewService.update(editingReviewId, {
        score: editScore,
        comment: editComment.trim(),
      });
      const latestReviews = await reviewService.listForUser(userId);

      setReviews(Array.isArray(latestReviews) ? latestReviews : []);
      setEditingReviewId(null);
      setEditScore(5);
      setEditComment("");
      setFeedback("Avis modifié avec succès.");
    } catch (error) {
      console.error("Update review error:", error);
      setFeedback(error.message || "Impossible de modifier l'avis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback("");
      await reviewService.delete(reviewId);
      
      const latestReviews = await reviewService.listForUser(userId);
      setReviews(Array.isArray(latestReviews) ? latestReviews : []);
      setFeedback("Avis supprimé avec succès.");
    } catch (error) {
      console.error("Delete review error:", error);
      setFeedback(error.message || "Impossible de supprimer l'avis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-profile-view">
      <div className="user-profile-shell">
        <button type="button" className="user-profile-back-btn" onClick={handleSafeBack}>
          Retour au tableau de bord
        </button>

        {feedback ? <div className="user-profile-feedback">{feedback}</div> : null}

        {isLoading ? (
          <div className="user-profile-panel">Chargement du profil...</div>
        ) : !profile ? (
          <div className="user-profile-panel">Profil introuvable.</div>
        ) : (
          <>
            <section className="user-profile-hero">
              <div className="user-profile-avatar">
                {toAbsoluteMediaUrl(profile.avatarUrl || profile.profileImage) ? (
                  <img src={toAbsoluteMediaUrl(profile.avatarUrl || profile.profileImage)} alt={profile.name || "Utilisateur"} className="user-profile-avatar-image" />
                ) : (
                  initials
                )}
              </div>
              <div className="user-profile-copy">
                <span className="user-profile-eyebrow">Profil utilisateur</span>
                <h1>{profile.name || "Utilisateur"}</h1>
                <p>
                  {[profile.title || profile.role || "Membre", profile.company].filter(Boolean).join(" • ")}
                </p>
                <div className="user-profile-tags">
                  <span>{profile.location || "Localisation non définie"}</span>
                  <span>{profile.email || "Email non défini"}</span>
                  <span>{reviews.length} avis</span>
                </div>
              </div>
              <div className="user-profile-metric">
                <span>Note moyenne</span>
                <strong>{averageRating ? averageRating.toFixed(1) : "N/A"}</strong>
              </div>
            </section>

            <section className="user-profile-grid">
              <article className="user-profile-panel">
                <h2>À propos</h2>
                <p>{profile.bio || "Aucune bio renseignée pour le moment."}</p>
              </article>

              <article className="user-profile-panel">
                <h2>Coordonnées</h2>
                <div className="user-profile-contact-list">
                  <div>
                    <span>Email</span>
                    <strong>{profile.email || "-"}</strong>
                  </div>
                  <div>
                    <span>Téléphone</span>
                    <strong>{profile.phone || "-"}</strong>
                  </div>
                  <div>
                    <span>Entreprise</span>
                    <strong>{profile.company || "-"}</strong>
                  </div>
                  <div>
                    <span>Rôle</span>
                    <strong>{profile.role || "-"}</strong>
                  </div>
                </div>
              </article>
            </section>

            {!isOwnProfile ? (
              <section className="user-profile-panel">
                <div className="user-profile-section-head">
                  <div>
                    <h2>Laisser un avis</h2>
                    <p>Ajoutez un retour clair sur la collaboration, la communication et la qualité du travail.</p>
                  </div>
                </div>
                <form className="user-profile-review-form" onSubmit={handleSubmit}>
                  <div className="user-profile-review-author">
                    <div className="user-profile-review-avatar user-profile-review-avatar-author">
                      {getInitials(localStorage.getItem("user_name") || "Moi")}
                    </div>
                    <div>
                      <strong>Votre avis</strong>
                      <span>Il sera affiché publiquement sur ce profil.</span>
                    </div>
                  </div>

                  <label className="user-profile-review-score-field">
                    <span>Votre note</span>
                    <select value={score} onChange={(event) => setScore(Number(event.target.value))}>
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} étoile{value > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="user-profile-review-comment-field">
                    <span>Votre feedback</span>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Partagez votre retour sur la collaboration."
                    />
                  </label>

                  <div className="user-profile-review-actions">
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Envoi..." : "Ajouter un avis"}
                    </button>
                  </div>
                </form>
              </section>
            ) : null}

            <section className="user-profile-panel">
              <div className="user-profile-section-head">
                <div>
                  <h2>Feedback</h2>
                  <p>Les retours récents apparaissent avec l'auteur et la note, comme un vrai fil de profil.</p>
                </div>
              </div>
              <div className="user-profile-review-list">
                {reviews.length === 0 ? (
                  <div className="user-profile-review-empty">Aucun avis pour le moment.</div>
                ) : (
                  reviews.map((review) => {
                    const isOwnReview = review && String(review.fromUserId || "") === currentUserId;
                    const isEditing = editingReviewId === review.id;

                    return isEditing ? (
                      <form key={review.id} className="user-profile-review-form" onSubmit={handleUpdateReview}>
                        <div className="user-profile-review-author">
                          <div className="user-profile-review-avatar user-profile-review-avatar-author">
                            {getInitials(localStorage.getItem("user_name") || "Moi")}
                          </div>
                          <div>
                            <strong>Modifier votre avis</strong>
                            <span>Les modifications seront visibles immédiatement.</span>
                          </div>
                        </div>

                        <label className="user-profile-review-score-field">
                          <span>Votre note</span>
                          <select value={editScore} onChange={(event) => setEditScore(Number(event.target.value))}>
                            {[5, 4, 3, 2, 1].map((value) => (
                              <option key={value} value={value}>
                                {value} étoile{value > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="user-profile-review-comment-field">
                          <span>Votre feedback</span>
                          <textarea
                            rows={4}
                            value={editComment}
                            onChange={(event) => setEditComment(event.target.value)}
                            placeholder="Partagez votre retour sur la collaboration."
                          />
                        </label>

                        <div className="user-profile-review-actions">
                          <button type="button" onClick={handleCancelEdit} disabled={isSubmitting}>
                            Annuler
                          </button>
                          <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Modification..." : "Modifier l'avis"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <article key={review.id} className="user-profile-review-card">
                        <div className="user-profile-review-top">
                          <div className="user-profile-review-author">
                            <div className="user-profile-review-avatar">
                              {toAbsoluteMediaUrl(review.fromUserAvatarUrl) ? (
                                <img
                                  src={toAbsoluteMediaUrl(review.fromUserAvatarUrl)}
                                  alt={review.fromUserName || "Utilisateur"}
                                  className="user-profile-avatar-image"
                                />
                              ) : (
                                getInitials(review.fromUserName || "Utilisateur")
                              )}
                            </div>
                            <div className="user-profile-review-meta">
                              <strong>{review.fromUserName || "Utilisateur"}</strong>
                              <span>{formatReviewDate(review.createdAt)}</span>
                            </div>
                          </div>
                          <div className="user-profile-review-stars-and-actions">
                            <p className="user-profile-review-stars">{renderStars(review.score)}</p>
                            {isOwnReview && (
                              <div className="user-profile-review-actions-inline">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(review)}
                                  disabled={isSubmitting}
                                  className="user-profile-review-btn-edit"
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(review.id)}
                                  disabled={isSubmitting}
                                  className="user-profile-review-btn-delete"
                                >
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="user-profile-review-body">{review.comment || "Aucun commentaire."}</p>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}