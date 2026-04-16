function getInitials(name) {
  return String(name || "U")
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const FeedbackCard = ({ feedback }) => {
  return (
    <div className="glass-card p-5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold"
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: "50%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e2e8f0",
              color: "#334155",
              fontWeight: 700,
              fontSize: 12,
              textTransform: "uppercase",
            }}
          >
            {feedback.avatarUrl ? (
              <img
                src={feedback.avatarUrl}
                alt={feedback.client || "Utilisateur"}
                className="h-full w-full object-cover"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getInitials(feedback.client)
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{feedback.client}</p>
            <p className="text-sm text-slate-500">{feedback.title}</p>
          </div>
        </div>
        <p className="text-amber-500 font-semibold">{"★".repeat(feedback.stars)}</p>
      </div>
      <p className="text-slate-700 leading-relaxed">{feedback.comment}</p>
      <p className="text-xs text-slate-500">{feedback.date}</p>
    </div>
  );
};

export default FeedbackCard;
