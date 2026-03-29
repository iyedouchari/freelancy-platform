import { format } from "../../utils/format";
import "./FreelancerWallet.css";

const WALLET_OVERVIEW = {
  available: 12340,
  pending: 2860,
  withdrawn: 19400,
  nextPayout: "29 mars 2026",
};

const TRANSACTIONS = [
  {
    id: 1,
    label: "Acompte - Creation d'un Site E-commerce React",
    date: "2026-03-24",
    type: "credit",
    amount: 4200,
    status: "Disponible",
  },
  {
    id: 2,
    label: "Retrait vers compte bancaire",
    date: "2026-03-21",
    type: "debit",
    amount: 3000,
    status: "Traite",
  },
  {
    id: 3,
    label: "Paiement milestone - Conception mobile",
    date: "2026-03-19",
    type: "credit",
    amount: 2650,
    status: "En attente",
  },
  {
    id: 4,
    label: "Commission plateforme",
    date: "2026-03-19",
    type: "debit",
    amount: 180,
    status: "Deduite",
  },
];

function WalletStat({ label, value, hint }) {
  return (
    <div className="freelancer-wallet-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

export default function FreelancerWallet() {
  return (
    <div className="freelancer-wallet-page">
      <div className="freelancer-wallet-shell">
        <header className="freelancer-wallet-header">
          <div className="freelancer-wallet-copy">
            <span className="freelancer-wallet-eyebrow">Portefeuille</span>
            <h1>Vos encaissements et retraits dans une page dediee</h1>
            <p>
              Le wallet du freelancer est maintenant isole du reste de l'interface avec son propre
              suivi de solde, de virements et d'historique de transactions.
            </p>
          </div>

          <div className="freelancer-wallet-stats">
            <WalletStat
              label="Disponible"
              value={`${format(WALLET_OVERVIEW.available)} DT`}
              hint="pret pour retrait"
            />
            <WalletStat
              label="En attente"
              value={`${format(WALLET_OVERVIEW.pending)} DT`}
              hint="milestones non deblocs"
            />
            <WalletStat
              label="Retire"
              value={`${format(WALLET_OVERVIEW.withdrawn)} DT`}
              hint="sur les 90 derniers jours"
            />
          </div>
        </header>

        <div className="freelancer-wallet-panels">
          <section className="freelancer-wallet-balance-card">
            <span className="freelancer-wallet-card-label">Solde principal</span>
            <strong>{format(WALLET_OVERVIEW.available)} DT</strong>
            <p>
              Votre prochain virement automatique est programme pour le {WALLET_OVERVIEW.nextPayout}.
            </p>

            <div className="freelancer-wallet-badges">
              <span>Virement bancaire actif</span>
              <span>Verification completee</span>
            </div>
          </section>

          <section className="freelancer-wallet-payout-card">
            <h2>Configuration de retrait</h2>
            <div className="freelancer-wallet-payout-row">
              <span>Methode</span>
              <strong>Virement bancaire</strong>
            </div>
            <div className="freelancer-wallet-payout-row">
              <span>Compte</span>
              <strong>**** **** 7821</strong>
            </div>
            <div className="freelancer-wallet-payout-row">
              <span>Frais estimes</span>
              <strong>12 DT</strong>
            </div>
            <div className="freelancer-wallet-payout-row">
              <span>Seuil minimum</span>
              <strong>100 DT</strong>
            </div>
          </section>
        </div>

        <section className="freelancer-wallet-history">
          <div className="freelancer-wallet-section-head">
            <div>
              <span className="freelancer-wallet-section-eyebrow">Historique</span>
              <h2>Mouvements recents</h2>
            </div>
            <p>Chaque entree separe credits, debits et statut de traitement.</p>
          </div>

          <div className="freelancer-wallet-transaction-list">
            {TRANSACTIONS.map((transaction) => (
              <article key={transaction.id} className="freelancer-wallet-transaction">
                <div className="freelancer-wallet-transaction-main">
                  <span className={`freelancer-wallet-direction is-${transaction.type}`}>
                    {transaction.type === "credit" ? "Credit" : "Debit"}
                  </span>
                  <div>
                    <h3>{transaction.label}</h3>
                    <p>{format(transaction.date, "date")}</p>
                  </div>
                </div>

                <div className="freelancer-wallet-transaction-side">
                  <strong className={transaction.type === "credit" ? "is-credit" : "is-debit"}>
                    {transaction.type === "credit" ? "+" : "-"}
                    {format(transaction.amount)} DT
                  </strong>
                  <span>{transaction.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
