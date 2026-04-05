import { DOMAIN_OPTIONS } from "./domains";

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

export const initialFreelancerFeedbackById = {};

export const clientRequestCategories = [
  ...DOMAIN_OPTIONS,
];

export function getFreelancerProfileById(freelancerId) {
  return freelancerDirectoryById[freelancerId] ?? null;
}
