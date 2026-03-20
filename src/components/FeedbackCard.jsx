const FeedbackCard = ({ feedback }) => {
  return (
    <div className="glass-card p-5 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-900">{feedback.client}</p>
          <p className="text-sm text-slate-500">{feedback.title}</p>
        </div>
        <p className="text-amber-500 font-semibold">{"★".repeat(feedback.stars)}</p>
      </div>
      <p className="text-slate-700 leading-relaxed">{feedback.comment}</p>
      <p className="text-xs text-slate-500">{feedback.date}</p>
    </div>
  );
};

export default FeedbackCard;
