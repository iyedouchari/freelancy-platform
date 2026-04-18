import { useEffect, useState } from "react";
import { APP_FEEDBACK_EVENT, APP_FEEDBACK_TITLES } from "../utils/appFeedback";
import "./AppFeedbackHost.css";

const FEEDBACK_ICON = {
  success: "✔",
  warning: "!",
  error: "✕",
  info: "i",
};

const initialState = {
  open: false,
  tone: "info",
  title: APP_FEEDBACK_TITLES.info,
  message: "",
};

export default function AppFeedbackHost() {
  const [feedback, setFeedback] = useState(initialState);

  const closeFeedback = () => {
    setFeedback((current) => ({ ...current, open: false }));
  };

  useEffect(() => {
    const handleFeedback = (event) => {
      const detail = event?.detail ?? {};
      const tone = detail.tone || "info";

      setFeedback({
        open: true,
        tone,
        title: detail.title || APP_FEEDBACK_TITLES[tone] || APP_FEEDBACK_TITLES.info,
        message: detail.message || "",
      });
    };

    window.addEventListener(APP_FEEDBACK_EVENT, handleFeedback);

    return () => {
      window.removeEventListener(APP_FEEDBACK_EVENT, handleFeedback);
    };
  }, []);

  useEffect(() => {
    if (!feedback.open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeFeedback();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [feedback.open]);

  if (!feedback.open) {
    return null;
  }

  return (
    <div className="app-feedback-overlay" onClick={closeFeedback}>
      <div
        className={`app-feedback-modal is-${feedback.tone}`}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={feedback.title || APP_FEEDBACK_TITLES[feedback.tone] || APP_FEEDBACK_TITLES.info}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-feedback-badge" aria-hidden="true">
          {FEEDBACK_ICON[feedback.tone] || FEEDBACK_ICON.info}
        </div>

        <div className="app-feedback-copy">
          <h3>{feedback.title || APP_FEEDBACK_TITLES[feedback.tone] || APP_FEEDBACK_TITLES.info}</h3>
          <p>{feedback.message}</p>
        </div>

        <div className="app-feedback-actions">
          <button type="button" className="button-primary app-feedback-confirm" onClick={closeFeedback}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
