const formatter = new Intl.NumberFormat("fr-FR");

export function format(value, mode = "number") {
  if (mode === "number") return formatter.format(value);
  if (mode === "date") {
    const date = new Date(value);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (mode === "relative") {
    const now = new Date();
    const date = new Date(value);
    const diffDays = Math.round((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "aujourd'hui";
    if (diffDays === 1) return "il y a 1 jour";
    return `il y a ${diffDays} jours`;
  }
  return value;
}
