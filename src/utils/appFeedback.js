export const APP_FEEDBACK_EVENT = "app:feedback";

const ALLOWED_TONES = new Set(["success", "warning", "error", "info"]);

export const APP_FEEDBACK_TITLES = {
  success: "Action confirmee",
  warning: "Attention",
  error: "Operation impossible",
  info: "Information",
};

export function showAppFeedback(payload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const nextTone = ALLOWED_TONES.has(payload.tone) ? payload.tone : "info";
  const nextTitle =
    typeof payload.title === "string" && payload.title.trim()
      ? payload.title
      : APP_FEEDBACK_TITLES[nextTone];
  const nextMessage =
    typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : "";

  if (!nextTitle && !nextMessage) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(APP_FEEDBACK_EVENT, {
      detail: {
        tone: nextTone,
        title: nextTitle,
        message: nextMessage,
      },
    })
  );
}
