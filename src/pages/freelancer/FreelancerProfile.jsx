import { useEffect, useRef, useState } from "react";
import FeedbackCard from "../../components/FeedbackCard";
import { DOMAIN_OPTIONS } from "../../data/domains";
import { requestService } from "../../services/requestService";
import { reviewService } from "../../services/reviewService";
import { userService } from "../../services/userService";
import { showAppFeedback } from "../../utils/appFeedback";
import "./FreelancerProfile.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const toAbsoluteMediaUrl = (value) => {
  const input = String(value || "").trim();
  if (!input) return "";
  if (input.startsWith("data:")) return input;
  if (input.startsWith("http://") || input.startsWith("https://")) return input;

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  if (input.startsWith("/")) {
    return `${apiOrigin}${input}`;
  }

  return `${apiOrigin}/${input}`;
};

const FALLBACK_STATS = [
  { label: "Avis", value: "0" },
  { label: "Note moyenne", value: "0.0 / 5" },
  { label: "Taux de reussite", value: "-" },
];

const localKey = (userId, field) => `freelancer_${userId}_${field}`;

const readLocalProfile = (userId) => ({
  bio: localStorage.getItem(localKey(userId, "bio")) || "",
  fields: JSON.parse(localStorage.getItem(localKey(userId, "fields")) || "[]"),
  profileImage: localStorage.getItem(localKey(userId, "image")) || null,
});

const persistLocalProfile = (userId, profile) => {
  localStorage.setItem(localKey(userId, "bio"), profile.bio || "");
  localStorage.setItem(localKey(userId, "fields"), JSON.stringify(profile.fields || []));
  if (profile.profileImage) {
    localStorage.setItem(localKey(userId, "image"), profile.profileImage);
  } else {
    localStorage.removeItem(localKey(userId, "image"));
  }
};

const persistSessionProfile = (userId, profile) => {
  localStorage.setItem(localKey(userId, "name"), profile.name || "");
  localStorage.setItem(localKey(userId, "title"), profile.title || "");
  localStorage.setItem(localKey(userId, "location"), profile.location || "");
  localStorage.setItem(localKey(userId, "email"), profile.email || "");
  localStorage.setItem(localKey(userId, "phone"), profile.phone || "");
};

function formatReview(review) {
  return {
    client: review.fromUserName || "Utilisateur",
    avatarUrl: toAbsoluteMediaUrl(review.fromUserAvatarUrl),
    title: "Avis verifie",
    comment: review.comment || "",
    stars: Number(review.score || 0),
    date: new Date(review.updatedAt || review.createdAt || Date.now()).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

function EditProfile({ profile, onSave, onCancel, isSaving }) {
  const [draft, setDraft] = useState(profile);
  const imageInputRef = useRef(null);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const toggleField = (field) => {
    setDraft((current) => ({
      ...current,
      fields: current.fields.includes(field)
        ? current.fields.filter((item) => item !== field)
        : [...current.fields, field],
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDraft((current) => ({ ...current, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <form className="profile-edit-layout" onSubmit={handleSubmit}>
      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Informations principales</h2>
          <p>Les informations ci-dessous seront visibles dans ton profil.</p>
        </div>

        <div className="profile-form-grid">
          <label>
            <span>Nom complet</span>
            <input type="text" value={draft.name} onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))} />
          </label>
          <label>
            <span>Titre</span>
            <input type="text" value={draft.title} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={draft.email} onChange={(e) => setDraft((c) => ({ ...c, email: e.target.value }))} />
          </label>
          <label>
            <span>Telephone</span>
            <input type="text" value={draft.phone} onChange={(e) => setDraft((c) => ({ ...c, phone: e.target.value }))} />
          </label>
          <label>
            <span>Localisation</span>
            <input type="text" value={draft.location} onChange={(e) => setDraft((c) => ({ ...c, location: e.target.value }))} />
          </label>
          <label>
            <span>Mot de passe actuel</span>
            <input type="password" value={draft.currentPassword || ""} onChange={(e) => setDraft((c) => ({ ...c, currentPassword: e.target.value }))} />
          </label>
          <label>
            <span>Nouveau mot de passe</span>
            <input type="password" value={draft.newPassword || ""} onChange={(e) => setDraft((c) => ({ ...c, newPassword: e.target.value }))} />
          </label>
          <label>
            <span>Confirmation</span>
            <input type="password" value={draft.confirmPassword || ""} onChange={(e) => setDraft((c) => ({ ...c, confirmPassword: e.target.value }))} />
          </label>
        </div>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Presentation</h2>
        </div>
        <label className="profile-textarea-field">
          <span>Bio</span>
          <textarea rows={5} value={draft.bio} onChange={(e) => setDraft((c) => ({ ...c, bio: e.target.value }))} />
        </label>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Domaines</h2>
        </div>
        <div className="profile-domain-grid">
          {DOMAIN_OPTIONS.map((field) => (
            <button
              key={field}
              type="button"
              className={`profile-domain-chip${draft.fields.includes(field) ? " active" : ""}`}
              onClick={() => toggleField(field)}
            >
              {field}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-panel">
        <div className="profile-panel-head">
          <h2>Photo</h2>
        </div>
        <div className="profile-image-upload">
          <div className={`profile-image-preview ${draft.profileImage ? "has-image" : ""}`}>
            {draft.profileImage ? <img src={draft.profileImage} alt={draft.name} /> : <div className="profile-image-placeholder"><span>Aucune photo</span></div>}
          </div>
          <div className="profile-image-controls">
            <div className="profile-image-actions">
              <button type="button" className="profile-image-trigger" onClick={() => imageInputRef.current?.click()}>
                Choisir une image
              </button>
              {draft.profileImage ? (
                <button type="button" className="profile-image-remove" onClick={() => setDraft((c) => ({ ...c, profileImage: null }))}>
                  Supprimer
                </button>
              ) : null}
            </div>
            <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
          </div>
        </div>
      </section>

      <div className="profile-edit-actions-row">
        <button type="button" className="profile-secondary-btn" onClick={onCancel}>Annuler</button>
        <button type="submit" className="profile-primary-btn" disabled={isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

export default function FreelancerProfile({ onBack, mode = "self", publicUserId = null, dealId = null, stats: externalStats = null }) {
  const isPublicMode = mode === "public" && Boolean(publicUserId);
  const currentUserId = Number(localStorage.getItem("user_id") || 0);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState({
    name: "Freelancer",
    title: "Freelance",
    email: "",
    phone: "",
    location: "",
    bio: "",
    fields: [],
    profileImage: null,
  });
  const [reviews, setReviews] = useState([]);
  const [reviewDraft, setReviewDraft] = useState({ score: 5, comment: "" });
  const [showEdit, setShowEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [isReviewEditorOpen, setIsReviewEditorOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const [user, domains] = await Promise.all([
          isPublicMode ? userService.getById(publicUserId) : userService.getMe(),
          isPublicMode ? Promise.resolve([]) : requestService.getMyDomains().catch(() => []),
        ]);

        if (!isMounted || !user) return;

        const uid = user.id || user._id || user.email || "default";
        const local = readLocalProfile(uid);
        const legacyOwnImage = !isPublicMode ? localStorage.getItem("freelancer_image") : "";
        let resolvedProfileImage = toAbsoluteMediaUrl(
          user.avatarUrl || user.profileImage || local.profileImage || legacyOwnImage,
        );

        if (!isPublicMode && !user.avatarUrl && !user.profileImage) {
          const imageToSync = local.profileImage || legacyOwnImage;
          if (imageToSync) {
            try {
              const syncedUser = await userService.updateMe({ profileImage: imageToSync });
              resolvedProfileImage = toAbsoluteMediaUrl(syncedUser?.avatarUrl || imageToSync);
            } catch {
              // Keep local image display even if sync fails.
            }
          }
        }

        const mergedProfile = {
          name: user.name || localStorage.getItem(localKey(uid, "name")) || "Freelancer",
          title: user.title || localStorage.getItem(localKey(uid, "title")) || "Freelance",
          email: user.email || localStorage.getItem(localKey(uid, "email")) || "",
          phone: user.telephone || user.phone || localStorage.getItem(localKey(uid, "phone")) || "",
          location: user.location || localStorage.getItem(localKey(uid, "location")) || "",
          bio: user.bio || local.bio || "",
          fields: Array.isArray(domains) && domains.length ? domains : local.fields,
          profileImage: resolvedProfileImage,
        };

        setUserId(uid);
        setProfile(mergedProfile);

        if (!isPublicMode) {
          persistSessionProfile(uid, mergedProfile);
          persistLocalProfile(uid, mergedProfile);
        }
      } catch {
        // keep defaults
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [isPublicMode, publicUserId]);

  useEffect(() => {
    let isMounted = true;

    const targetUserId = publicUserId || userId;
    if (!targetUserId) return undefined;

    const loadReviews = async () => {
      try {
        const nextReviews = await reviewService.listForUser(targetUserId);
        if (!isMounted) return;
        setReviews(nextReviews);

        const ownReview = nextReviews.find((item) => Number(item.fromUserId) === currentUserId);
        if (ownReview) {
          setReviewDraft({
            score: Number(ownReview.score || 5),
            comment: ownReview.comment || "",
          });
          setIsReviewEditorOpen(false);
        } else {
          setReviewDraft({ score: 5, comment: "" });
          setIsReviewEditorOpen(false);
        }
      } catch {
        if (isMounted) setReviews([]);
      }
    };

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [publicUserId, userId, currentUserId]);

  const handleSave = async (draft) => {
    setFeedback("");

    const wantsPasswordChange = Boolean(
      String(draft.newPassword || "").trim() ||
      String(draft.currentPassword || "").trim() ||
      String(draft.confirmPassword || "").trim(),
    );

    if (wantsPasswordChange && !String(draft.newPassword || "").trim()) {
      setFeedback("Le nouveau mot de passe est vide.");
      return;
    }
    if (wantsPasswordChange && !String(draft.currentPassword || "").trim()) {
      setFeedback("Saisis le mot de passe actuel.");
      return;
    }
    if (wantsPasswordChange && draft.newPassword !== draft.confirmPassword) {
      setFeedback("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    try {
      setIsSaving(true);
      const updatedUser = await userService.updateMe({
        name: draft.name,
        title: draft.title,
        email: draft.email,
        phone: draft.phone,
        telephone: draft.phone,
        location: draft.location,
        bio: draft.bio,
        profileImage: draft.profileImage,
      });

      if (wantsPasswordChange) {
        await userService.changePassword({
          currentPassword: draft.currentPassword,
          newPassword: draft.newPassword,
        });
      }

      const nextProfile = {
        name: updatedUser.name || draft.name,
        title: updatedUser.title || draft.title,
        email: updatedUser.email || draft.email,
        phone: updatedUser.telephone || updatedUser.phone || draft.phone,
        location: updatedUser.location || draft.location,
        bio: updatedUser.bio ?? draft.bio,
        fields: draft.fields,
        profileImage: toAbsoluteMediaUrl(updatedUser.avatarUrl || draft.profileImage),
      };

      setProfile(nextProfile);
      if (userId) {
        persistSessionProfile(userId, nextProfile);
        persistLocalProfile(userId, nextProfile);
      }
      await requestService.syncFreelancerDomains(draft.fields).catch(() => []);
      setShowEdit(false);
      setFeedback("Profil mis a jour.");
      showAppFeedback({
        tone: "success",
        title: "Profil mis a jour",
        message: "Les informations ont ete enregistrees.",
      });
    } catch (error) {
      setFeedback(error.message || "Impossible de mettre a jour le profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!dealId || !publicUserId) {
      setFeedback("Aucun accord disponible pour enregistrer cet avis.");
      return;
    }
    if (!String(reviewDraft.comment || "").trim()) {
      setFeedback("Ajoute un commentaire avant d'enregistrer l'avis.");
      return;
    }

    try {
      setIsSavingReview(true);
      setFeedback("");
      await reviewService.save({
        dealId,
        toUserId: publicUserId,
        score: reviewDraft.score,
        comment: reviewDraft.comment.trim(),
      });
      const nextReviews = await reviewService.listForUser(publicUserId);
      setReviews(nextReviews);
      setIsReviewEditorOpen(false);
      setFeedback("Avis enregistre.");
    } catch (error) {
      setFeedback(error.message || "Impossible d'enregistrer l'avis.");
    } finally {
      setIsSavingReview(false);
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.score || 0), 0) / reviews.length).toFixed(1)
    : "0.0";
  const sortedReviews = [...reviews].sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime()
      - new Date(a.updatedAt || a.createdAt || 0).getTime(),
  );
  const ownReview = sortedReviews.find((item) => Number(item.fromUserId) === currentUserId);
  const canReview = isPublicMode && Boolean(publicUserId) && Number(publicUserId) !== currentUserId && Boolean(dealId);
  const shareTargetUserId = isPublicMode ? publicUserId : userId;

  const handlePublishProfile = async () => {
    if (!shareTargetUserId) {
      setFeedback("Impossible de publier ce profil pour le moment.");
      return;
    }

    const params = new URLSearchParams({ viewProfileUserId: String(shareTargetUserId) });
    const shareUrl = `${window.location.origin}/app?${params.toString()}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setFeedback(`Lien profil copie: ${shareUrl}`);
        return;
      }
    } catch {
      // Ignore clipboard errors and fallback to visible link.
    }

    setFeedback(`Lien profil: ${shareUrl}`);
  };

  const computedStats = [
    { label: "Avis", value: String(reviews.length) },
    { label: "Note moyenne", value: `${averageRating} / 5` },
    FALLBACK_STATS[2],
  ];

  const displayStats = Array.isArray(externalStats) && externalStats.length ? externalStats : computedStats;

  const initials = profile.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (showEdit && !isPublicMode) {
    return (
      <div className="freelancer-profile-shell">
        <div className="freelancer-profile-content profile-page">
          <button onClick={() => setShowEdit(false)} className="profile-back-btn">Retour au profil</button>
          {feedback ? <div className="profile-feedback">{feedback}</div> : null}
          <EditProfile profile={profile} onSave={handleSave} onCancel={() => setShowEdit(false)} isSaving={isSaving} />
        </div>
      </div>
    );
  }

  return (
    <div className="freelancer-profile-shell">
      <div className="freelancer-profile-content profile-page">
        <button onClick={onBack} className="profile-back-btn">Retour</button>
        {feedback ? <div className="profile-feedback">{feedback}</div> : null}

        <section className="profile-simple-hero">
          <div className="profile-simple-main">
            <div className="profile-simple-avatar">
              {profile.profileImage ? <img src={profile.profileImage} alt={profile.name} className="profile-avatar-img" /> : initials}
            </div>
            <div>
              <h1>{profile.name}</h1>
              <p>{profile.title || "Freelancer"}</p>
              <div className="profile-simple-pills">
                <span>{profile.location || "Localisation non definie"}</span>
                <span>{profile.email || "Email non defini"}</span>
              </div>
            </div>
          </div>
          <div className="profile-hero-actions">
            <button type="button" className="profile-secondary-btn" onClick={handlePublishProfile} disabled={isLoading || !shareTargetUserId}>
              Partager le profil
            </button>
            {!isPublicMode ? (
              <button type="button" className="profile-primary-btn" onClick={() => setShowEdit(true)} disabled={isLoading}>
                Modifier le profil
              </button>
            ) : null}
          </div>
        </section>

        <section className="profile-simple-stats">
          {displayStats.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>

        <div className="profile-simple-grid">
          <section className="profile-panel">
            <div className="profile-panel-head"><h2>A propos</h2></div>
            <p className="profile-bio-text">{isLoading ? "Chargement..." : profile.bio || <em className="profile-empty-text">Aucune bio renseignee.</em>}</p>
          </section>

          <section className="profile-panel">
            <div className="profile-panel-head"><h2>Coordonnees</h2></div>
            <div className="profile-contact-list">
              <div><span>Email</span><strong>{profile.email || "-"}</strong></div>
              <div><span>Telephone</span><strong>{profile.phone || "-"}</strong></div>
              <div><span>Localisation</span><strong>{profile.location || "-"}</strong></div>
            </div>
          </section>
        </div>

        <section className="profile-panel" style={{ marginBottom: 24 }}>
          <div className="profile-panel-head"><h2>Domaines</h2></div>
          <div className="profile-fields-wrap">
            {(profile.fields || []).length
              ? profile.fields.map((field) => <span key={field} className="profile-field-tag">{field}</span>)
              : <span className="profile-empty-text">Aucun domaine selectionne.</span>}
          </div>
        </section>

        <section className="profile-panel">
          <div className="profile-reviews-head">
            <div className="profile-panel-head">
              <h2>Avis recents</h2>
              <p>Les retours enregistres ici apparaissent directement sur le profil de l'utilisateur.</p>
            </div>
            {canReview ? (
              <button
                type="button"
                className="profile-primary-btn"
                onClick={() => setIsReviewEditorOpen((current) => !current)}
              >
                {ownReview ? (isReviewEditorOpen ? "Fermer" : "Modifier") : (isReviewEditorOpen ? "Fermer" : "Enregistrer")}
              </button>
            ) : null}
          </div>

          {canReview && isReviewEditorOpen ? (
            <form className="profile-review-form" onSubmit={handleReviewSubmit}>
              <label>
                <span>Votre note</span>
                <select value={reviewDraft.score} onChange={(event) => setReviewDraft((current) => ({ ...current, score: Number(event.target.value) }))}>
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
                  value={reviewDraft.comment}
                  onChange={(event) => setReviewDraft((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Cet avis sera enregistre dans la base et visible sur ce profil."
                />
              </label>
              <div className="profile-review-form-actions">
                <button type="button" className="profile-secondary-btn" onClick={() => setIsReviewEditorOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="profile-primary-btn" disabled={isSavingReview}>
                  {isSavingReview ? "Enregistrement..." : ownReview ? "Modifier l'avis" : "Enregistrer l'avis"}
                </button>
              </div>
            </form>
          ) : null}

          {sortedReviews.length === 0 ? (
            <span className="profile-empty-text">Aucun avis pour le moment.</span>
          ) : (
            <div className="profile-reviews-list">
              {sortedReviews.map((item) => <FeedbackCard key={item.id} feedback={formatReview(item)} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
