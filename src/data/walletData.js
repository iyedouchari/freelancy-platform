//Comptes wallet 
export const initialClientWallet = {
  ownerId: "client-1",
  ownerRole: "client",
  availableBalance: 8_730,
  escrowLocked: 4_200,
  totalPaid: 14_100,
  currency: "DT",
};

export const initialFreelancerWallet = {
  ownerId: "freelancer-1",
  ownerRole: "freelancer",
  availableBalance: 12_340,
  pendingBalance: 2_860,
  totalWithdrawn: 19_400,
  nextPayout: "2026-03-29",
  currency: "DT",
  bankAccountMasked: "**** **** 7821",
  withdrawalFee: 12,
  minWithdrawal: 100,
};

//Transactions client 
//types : credit / debit /escrow /fee /refund

export const initialClientTransactions = [
  {
    id: "tx-501",
    date: "2026-03-24",
    label: "Recharge portefeuille",
    detail: "Alimentation du solde client pour nouveau projet",
    type: "credit",
    amount: 1_800,
    status: "Traite",
    dealId: null,
  },
  {
    id: "tx-502",
    date: "2026-03-19",
    label: "Blocage fonds escrow",
    detail: "Acompte 20% — Accord React E-commerce avec Sarah Chen",
    type: "escrow",
    amount: -4_200,
    status: "En cours",
    dealId: "deal-1",
  },
  {
    id: "tx-503",
    date: "2026-03-14",
    label: "Paiement libere",
    detail: "Livraison validee — Refonte site vitrine",
    type: "debit",
    amount: -5_200,
    status: "Traite",
    dealId: "deal-4",
  },
  {
    id: "tx-504",
    date: "2026-03-10",
    label: "Remboursement partiel",
    detail: "Ajustement budget apres changement de perimetre",
    type: "refund",
    amount: 650,
    status: "Traite",
    dealId: "deal-2",
  },
  {
    id: "tx-505",
    date: "2026-03-03",
    label: "Frais plateforme",
    detail: "Frais de mise en relation et suivi de collaboration",
    type: "fee",
    amount: -120,
    status: "Traite",
    dealId: null,
  },
  {
    id: "tx-506",
    date: "2026-02-20",
    label: "Recharge portefeuille",
    detail: "Alimentation du solde client — virement bancaire",
    type: "credit",
    amount: 15_000,
    status: "Traite",
    dealId: null,
  },
];

//Transactions freelancer 
//types : credit / debit / fee / withdrawal

export const initialFreelancerTransactions = [
  {
    id: "ftx-101",
    date: "2026-03-24",
    label: "Acompte recu — Creation Site E-commerce React",
    detail: "20% de l'accord verse a la signature",
    type: "credit",
    amount: 2_960,
    status: "Disponible",
    dealId: "deal-1",
  },
  {
    id: "ftx-102",
    date: "2026-03-24",
    label: "Commission plateforme",
    detail: "Frais de service Freelancy (5%)",
    type: "fee",
    amount: -148,
    status: "Deduite",
    dealId: "deal-1",
  },
  {
    id: "ftx-103",
    date: "2026-03-21",
    label: "Retrait vers compte bancaire",
    detail: "Virement **** 7821",
    type: "withdrawal",
    amount: -3_000,
    status: "Traite",
    dealId: null,
  },
  {
    id: "ftx-104",
    date: "2026-03-19",
    label: "Paiement milestone — Conception Mobile iOS/Android",
    detail: "Maquettes livrees et validees",
    type: "credit",
    amount: 2_650,
    status: "En attente",
    dealId: "deal-3",
  },
  {
    id: "ftx-105",
    date: "2026-03-19",
    label: "Commission plateforme",
    detail: "Frais de service Freelancy (5%)",
    type: "fee",
    amount: -133,
    status: "Deduite",
    dealId: "deal-3",
  },
];

//Paiements lies aux deals 
//status: pending /processing /completed / failed /refunded
//phases: advance 20% /final 80%

export const initialPayments = [
  {
    id: "pay-001",
    dealId: "deal-1",
    dealTitle: "Creation d'un Site E-commerce React",
    clientId: "client-1",
    freelancerId: "freelancer-1",
    phase: "advance",
    amount: 4_200,
    platformFee: 210,
    netAmount: 3_990,
    status: "completed",
    method: "wallet",
    stripePaymentIntentId: "pi_dummy_001",
    createdAt: "2026-03-19T09:15:00Z",
    completedAt: "2026-03-19T09:16:42Z",
    note: "Acompte 20% verse automatiquement a l'activation du deal",
  },
  {
    id: "pay-002",
    dealId: "deal-2",
    dealTitle: "Redaction de Contenu pour Blog Tech",
    clientId: "client-1",
    freelancerId: "freelancer-2",
    phase: "advance",
    amount: 740,
    platformFee: 37,
    netAmount: 703,
    status: "completed",
    method: "wallet",
    stripePaymentIntentId: "pi_dummy_002",
    createdAt: "2026-02-28T14:30:00Z",
    completedAt: "2026-02-28T14:31:18Z",
    note: "Acompte 20% verse automatiquement a l'activation du deal",
  },
  {
    id: "pay-003",
    dealId: "deal-3",
    dealTitle: "Conception d'Interface Mobile iOS/Android",
    clientId: "client-1",
    freelancerId: "freelancer-3",
    phase: "advance",
    amount: 2_160,
    platformFee: 108,
    netAmount: 2_052,
    status: "completed",
    method: "wallet",
    stripePaymentIntentId: "pi_dummy_003",
    createdAt: "2026-03-10T11:00:00Z",
    completedAt: "2026-03-10T11:01:05Z",
    note: "Acompte 20% verse automatiquement a l'activation du deal",
  },
  {
    id: "pay-004",
    dealId: "deal-3",
    dealTitle: "Conception d'Interface Mobile iOS/Android",
    clientId: "client-1",
    freelancerId: "freelancer-3",
    phase: "final",
    amount: 8_640,
    platformFee: 432,
    netAmount: 8_208,
    status: "pending",
    method: "wallet",
    stripePaymentIntentId: null,
    createdAt: null,
    completedAt: null,
    note: "Paiement final 80% — en attente de validation livraison",
  },
];


export function getPaymentsByDealId(dealId) {
  return initialPayments.filter((p) => p.dealId === dealId);
}

export function computeWalletStats(transactions) {
  const available = transactions.reduce((sum, tx) => {
    if (tx.type === "credit" || tx.type === "refund") return sum + tx.amount;
    if (tx.type === "debit" || tx.type === "fee") return sum + tx.amount; // negative
    return sum;
  }, 0);

  const escrowLocked = transactions
    .filter((tx) => tx.type === "escrow")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalPaid = transactions
    .filter((tx) => tx.type === "debit")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return { available, escrowLocked, totalPaid };
}