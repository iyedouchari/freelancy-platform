export const activeDeals = [
  {
    id: 1,
    title: "Creation d'un Site E-commerce React",
    client: "Tech Solutions Inc.",
    status: "En Cours",
    statusType: "progress",
    description:
      "Developpement d'une plateforme e-commerce complete avec React.js, incluant la gestion des produits, le panier d'achat, le systeme de paiement en ligne et un tableau de bord administrateur responsive.",
    location: "Tunis, Tunisie",
    total: "14 800",
    remaining: "13 320",
    deadline: "18 mars 2026",
    daysLeft: 0,
    urgent: true,
    roomCode: "ecommerce-react-2026",
  },
  {
    id: 2,
    title: "Redaction de Contenu pour Blog Tech",
    client: "Digital Media Co.",
    status: "Soumis",
    statusType: "submitted",
    description:
      "Creation de 20 articles de blog optimises SEO sur les themes de l'intelligence artificielle, du cloud computing et des nouvelles technologies. Livraison hebdomadaire de 4 a 5 articles.",
    location: "Sfax, Tunisie",
    total: "3 700",
    remaining: "3 330",
    deadline: "10 mars 2026",
    daysLeft: 5,
    urgent: false,
    roomCode: "blog-tech-2026",
  },
  {
    id: 3,
    title: "Conception d'Interface Mobile iOS/Android",
    client: "StartApp Ventures",
    status: "En Revision",
    statusType: "review",
    description:
      "Design UX/UI complet d'une application mobile multiplateforme (iOS & Android) incluant les maquettes, le prototypage interactif Figma, le systeme de design et la documentation des composants.",
    location: "Sousse, Tunisie",
    total: "10 800",
    remaining: "6 480",
    deadline: "2 avr. 2026",
    daysLeft: 9,
    urgent: false,
    roomCode: "mobile-ux-2026",
  },
];

export const completedDeals = [
  {
    id: 4,
    title: "Refonte du Site Vitrine",
    client: "Agence Pixel",
    status: "Complete",
    statusType: "done",
    description:
      "Refonte complete du site vitrine avec une nouvelle identite visuelle, animations CSS avancees et optimisation des performances pour atteindre un score Lighthouse superieur a 95.",
    location: "Tunis, Tunisie",
    total: "5 200",
    remaining: "0",
    deadline: "1 jan. 2026",
    daysLeft: null,
    urgent: false,
    roomCode: "site-vitrine-archive",
  },
  {
    id: 5,
    title: "Application de Gestion RH",
    client: "Innov Corp",
    status: "Complete",
    statusType: "done",
    description:
      "Developpement d'une application web de gestion des ressources humaines incluant suivi des conges, fiches de paie et tableau de bord analytique pour les managers.",
    location: "Bizerte, Tunisie",
    total: "8 900",
    remaining: "0",
    deadline: "15 fev. 2026",
    daysLeft: null,
    urgent: false,
    roomCode: "gestion-rh-archive",
  },
];

export const allDeals = [...activeDeals, ...completedDeals];

export function findDealById(dealId) {
  return allDeals.find((deal) => deal.id === dealId);
}
