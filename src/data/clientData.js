import { activeDeals, completedDeals } from "./deals";

const CLIENT_DEAL_META = {
  1: {
    freelancerId: "sarah-chen",
    progressLabel: "Sprint final valide par les deux parties",
  },
  2: {
    freelancerId: "yassine-ben-amor",
    progressLabel: "Livraisons editoriales deja lancees",
  },
  3: {
    freelancerId: "maya-ferjani",
    progressLabel: "Suivi design et retours client en cours",
  },
  4: {
    freelancerId: "karim-haddad",
    progressLabel: "Projet termine et archive",
  },
  5: {
    freelancerId: "nour-gharbi",
    progressLabel: "Projet termine et archive",
  },
};

export const freelancerDirectory = [
  {
    id: "lina-trabelsi",
    name: "Lina Trabelsi",
    title: "Product Designer & Front-end",
    location: "Tunis, Tunisie",
    email: "lina.trabelsi@freelancy.dev",
    phone: "+216 55 310 440",
    bio:
      "Je conçois des experiences produit qui passent vite du brief aux ecrans exploitables. J'interviens sur l'UX, le design system et l'integration front-end quand il faut accelerer la livraison.",
    fields: ["UI/UX Design", "Developpement Web", "Design System"],
    rating: 4.9,
    projectsCompleted: 27,
    successRate: "98%",
    reputationPoints: "2 860 pts",
  },
  {
    id: "ahmed-kacem",
    name: "Ahmed Kacem",
    title: "Full-stack React Engineer",
    location: "Sousse, Tunisie",
    email: "ahmed.kacem@freelancy.dev",
    phone: "+216 52 220 910",
    bio:
      "Je livre des applications React et Node robustes, avec une attention particuliere sur l'architecture, l'integration API et la lisibilite du code sur la duree.",
    fields: ["Developpement Web", "Node.js", "Architecture Produit"],
    rating: 4.8,
    projectsCompleted: 31,
    successRate: "96%",
    reputationPoints: "3 040 pts",
  },
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    title: "React Commerce Specialist",
    location: "Remote",
    email: "sarah.chen@freelancy.dev",
    phone: "+1 415 240 1109",
    bio:
      "Je pilote des experiences e-commerce React avec une forte attention a la conversion, aux paiements et a la qualite d'execution sur desktop comme mobile.",
    fields: ["E-commerce", "Developpement Web", "React"],
    rating: 5,
    projectsCompleted: 39,
    successRate: "99%",
    reputationPoints: "3 420 pts",
  },
  {
    id: "yassine-ben-amor",
    name: "Yassine Ben Amor",
    title: "SEO Content Strategist",
    location: "Sfax, Tunisie",
    email: "yassine.benamor@freelancy.dev",
    phone: "+216 58 901 675",
    bio:
      "Je structure des plans editoriaux SEO et des contenus B2B avec un focus sur l'intention de recherche, la clarte du message et l'impact business.",
    fields: ["Marketing Digital", "SEO", "Content Strategy"],
    rating: 4.7,
    projectsCompleted: 24,
    successRate: "95%",
    reputationPoints: "2 120 pts",
  },
  {
    id: "maya-ferjani",
    name: "Maya Ferjani",
    title: "Mobile Product Designer",
    location: "Tunis, Tunisie",
    email: "maya.ferjani@freelancy.dev",
    phone: "+216 22 886 714",
    bio:
      "Je transforme les idees produit en parcours mobiles fluides, avec prototypes, systemes de composants et livrables clairs pour les equipes tech.",
    fields: ["Developpement Mobile", "UI/UX Design", "Product Thinking"],
    rating: 5,
    projectsCompleted: 22,
    successRate: "99%",
    reputationPoints: "2 740 pts",
  },
  {
    id: "karim-haddad",
    name: "Karim Haddad",
    title: "Brand & Front-end Lead",
    location: "Remote",
    email: "karim.haddad@freelancy.dev",
    phone: "+971 50 320 4410",
    bio:
      "Je mene les refontes de marque et de front-end avec une approche orientee identite visuelle, performance et details de finition.",
    fields: ["Developpement Web", "Brand Design", "Animation UI"],
    rating: 4.8,
    projectsCompleted: 35,
    successRate: "97%",
    reputationPoints: "3 010 pts",
  },
  {
    id: "nour-gharbi",
    name: "Nour Gharbi",
    title: "HR SaaS Engineer",
    location: "Bizerte, Tunisie",
    email: "nour.gharbi@freelancy.dev",
    phone: "+216 29 770 114",
    bio:
      "Je developpe des outils RH et des back-offices SaaS capables de tenir la charge, avec des workflows clairs pour les equipes internes.",
    fields: ["Developpement Web", "SaaS", "Back-office"],
    rating: 4.9,
    projectsCompleted: 29,
    successRate: "98%",
    reputationPoints: "2 930 pts",
  },
];

export const freelancerDirectoryById = Object.fromEntries(
  freelancerDirectory.map((profile) => [profile.id, profile])
);

export const initialFreelancerFeedbackById = {
  "lina-trabelsi": [
    {
      client: "Emma Rodriguez",
      title: "COO - FinFlow",
      comment:
        "Lina a clarifie notre produit tres vite. Ses propositions UX etaient precises et directement exploitables par l'equipe front.",
      stars: 5,
      date: "12 mars 2026",
    },
  ],
  "ahmed-kacem": [
    {
      client: "Nicolas Perrin",
      title: "CTO - MarketBridge",
      comment:
        "Ahmed a repris un projet React complexe avec une bonne vision de l'architecture et un vrai sens du delivery.",
      stars: 5,
      date: "8 mars 2026",
    },
  ],
  "sarah-chen": [
    {
      client: "Julia Meyer",
      title: "Head of Growth - Nova Store",
      comment:
        "Le travail de Sarah sur notre storefront a ameliore a la fois la vitesse du site et le parcours de conversion.",
      stars: 5,
      date: "18 fev. 2026",
    },
  ],
  "yassine-ben-amor": [
    {
      client: "Leo Martin",
      title: "CMO - B2B Signals",
      comment:
        "Strategie SEO claire, cadence de production solide et tres bon niveau de conseil sur les priorites a traiter.",
      stars: 4,
      date: "27 fev. 2026",
    },
  ],
  "maya-ferjani": [
    {
      client: "Sana Rekik",
      title: "Product Lead - Wellio",
      comment:
        "Maya a su faire converger l'equipe autour d'un parcours mobile tres propre, avec des maquettes impeccables.",
      stars: 5,
      date: "4 mars 2026",
    },
  ],
};

export const clientRequestCategories = [
  "Developpement Web",
  "Developpement Mobile",
  "UI/UX Design",
  "IA & Machine Learning",
  "Cloud & DevOps",
  "Data Science",
  "E-commerce",
  "Marketing Digital",
];

export const clientSkillSuggestions = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Figma",
  "Stripe",
  "SEO",
  "Docker",
  "AWS",
  "Analytics",
];

function buildProposal({ id, freelancerId, rate, deliveryDays, summary }) {
  const profile = freelancerDirectoryById[freelancerId];

  return {
    id,
    freelancerId,
    freelancerName: profile.name,
    title: profile.title,
    rating: profile.rating,
    rate,
    deliveryDays,
    summary,
  };
}

export const initialClientRequests = [
  {
    id: "req-201",
    title: "Refonte du portail RH interne",
    description:
      "Repenser le portail RH avec un tableau de bord plus clair, une meilleure experience employe et une migration front-end progressive.",
    category: "Developpement Web",
    budget: 6800,
    deadline: "2026-04-28",
    postedAt: "2026-03-23",
    status: "pending",
    skills: ["React", "Node.js", "Design System"],
    proposals: [
      buildProposal({
        id: "prop-201-a",
        freelancerId: "lina-trabelsi",
        rate: 6200,
        deliveryDays: 16,
        summary:
          "Je propose une refonte orientee experience employe avec audit UX, design system et implementation React progressive.",
      }),
      buildProposal({
        id: "prop-201-b",
        freelancerId: "ahmed-kacem",
        rate: 6900,
        deliveryDays: 18,
        summary:
          "Je peux livrer le front, les formulaires RH et l'integration API en conservant vos flux internes existants.",
      }),
    ],
  },
  {
    id: "req-202",
    title: "Landing SaaS B2B en Next.js",
    description:
      "Concevoir une landing conversion-first avec messages par segment, sections preuve sociale et suivi analytics propre pour le go-to-market.",
    category: "Developpement Web",
    budget: 4100,
    deadline: "2026-04-19",
    postedAt: "2026-03-21",
    status: "pending",
    skills: ["Next.js", "Copywriting", "Analytics"],
    proposals: [
      buildProposal({
        id: "prop-202-a",
        freelancerId: "sarah-chen",
        rate: 4500,
        deliveryDays: 11,
        summary:
          "Je prends la structure de page, le front Next.js et les optimisations conversion pour un lancement rapide.",
      }),
      buildProposal({
        id: "prop-202-b",
        freelancerId: "yassine-ben-amor",
        rate: 3600,
        deliveryDays: 13,
        summary:
          "Je peux cadrer l'angle message, le SEO initial et la structure des sections pour soutenir l'acquisition.",
      }),
    ],
  },
  {
    id: "req-203",
    title: "Automatisation du reporting marketing",
    description:
      "Centraliser les donnees des campagnes paid et CRM dans un reporting hebdomadaire lisible pour l'equipe de direction.",
    category: "Data Science",
    budget: 5200,
    deadline: "2026-05-03",
    postedAt: "2026-03-18",
    status: "pending",
    skills: ["Python", "Analytics", "Dashboarding"],
    proposals: [
      buildProposal({
        id: "prop-203-a",
        freelancerId: "ahmed-kacem",
        rate: 5100,
        deliveryDays: 14,
        summary:
          "Je peux monter le pipeline de donnees, les scripts d'automatisation et une vue exploitable pour les revues hebdomadaires.",
      }),
    ],
  },
];

export const initialClientDeals = [...activeDeals, ...completedDeals].map((deal) => {
  const meta = CLIENT_DEAL_META[deal.id] ?? {};
  const freelancerProfile = freelancerDirectoryById[meta.freelancerId] ?? freelancerDirectory[0];

  return {
    ...deal,
    freelancerId: freelancerProfile.id,
    freelancer: freelancerProfile.name,
    freelancerTitle: freelancerProfile.title,
    progressLabel: meta.progressLabel ?? "Collaboration acceptee par les deux parties",
    acceptedByClient: true,
    acceptedByFreelancer: true,
  };
});

export function getFreelancerProfileById(freelancerId) {
  return freelancerDirectoryById[freelancerId] ?? null;
}

export function createClientRequest(input) {
  return {
    id: `req-${Date.now()}`,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    budget: Number(input.budget),
    deadline: input.deadline,
    postedAt: new Date().toISOString().slice(0, 10),
    status: "pending",
    skills: input.skills,
    proposals: [],
  };
}

export function updateClientRequest(request, input) {
  return {
    ...request,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    budget: Number(input.budget),
    deadline: input.deadline,
    skills: input.skills,
  };
}

export function createClientDealFromRequest(request, proposal) {
  const clientName = localStorage.getItem("client_name") || "Iyed";
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(request.deadline) - new Date()) / (1000 * 60 * 60 * 24))
  );

  return {
    id: Date.now(),
    title: request.title,
    client: clientName,
    freelancerId: proposal.freelancerId,
    freelancer: proposal.freelancerName,
    freelancerTitle: proposal.title,
    status: "En Cours",
    statusType: "progress",
    description: request.description,
    location: "A distance",
    total: new Intl.NumberFormat("fr-FR").format(proposal.rate),
    remaining: new Intl.NumberFormat("fr-FR").format(Math.round(proposal.rate * 0.65)),
    deadline: new Date(request.deadline).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    daysLeft,
    urgent: daysLeft <= 5,
    roomCode: `${request.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()
      .toString()
      .slice(-5)}`,
    progressLabel: "Accord accepte et passe dans le suivi actif",
    acceptedByClient: true,
    acceptedByFreelancer: true,
  };
}
