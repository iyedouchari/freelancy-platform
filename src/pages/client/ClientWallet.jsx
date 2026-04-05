import { useMemo, useState } from "react";
import { format } from "../../utils/format";
import "./ClientWallet.css";

const initialTransactions = [
  {
    id: "tx-501",
    date: "2026-03-24",
    label: "Recharge portefeuille",
    detail: "Alimentation du solde client pour nouveau projet",
    type: "credit",
    amount: 1800,
    status: "Traite",
  },
  {
    id: "tx-502",
    date: "2026-03-19",
    label: "Blocage fonds escrow",
    detail: "Creation d'un accord React commerce avec Sarah Chen",
    type: "escrow",
    amount: -4200,
    status: "En cours",
  },
  {
    id: "tx-503",
    date: "2026-03-14",
    label: "Paiement libere",
    detail: "Livraison validee pour refonte site vitrine",
    type: "debit",
    amount: -5200,
    status: "Traite",
  },
  {
    id: "tx-504",
    date: "2026-03-10",
    label: "Remboursement partiel",
    detail: "Ajustement budget apres changement de perimetre",
    type: "credit",
    amount: 650,
    status: "Traite",
  },
  {
    id: "tx-505",
    date: "2026-03-03",
    label: "Frais plateforme",
    detail: "Frais de mise en relation et suivi",
    type: "fee",
    amount: -120,
    status: "Traite",
  },
];

const filterOptions = [
  { key: "all", label: "Toutes" },
  { key: "credit", label: "Credits" },
  { key: "debit", label: "Debits" },
  { key: "escrow", label: "Escrow" },
  { key: "fee", label: "Frais" },
];

const typeMeta = {
  credit: {
    label: "Credit",
    className: "credit",
    prefix: "+",
  },
  debit: {
    label: "Paiement",
    className: "debit",
    prefix: "-",
  },
  escrow: {
    label: "Escrow",
    className: "escrow",
    prefix: "-",
  },
  fee: {
    label: "Frais",
    className: "fee",
    prefix: "-",
  },
};

function exportTransactions(transactions) {
  const rows = [
    ["Date", "Libelle", "Detail", "Type", "Montant", "Statut"].join(";"),
    ...transactions.map((transaction) =>
      [
        transaction.date,
        transaction.label,
        transaction.detail,
        typeMeta[transaction.type].label,
        transaction.amount,
        transaction.status,
      ].join(";")
    ),
  ];

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "client-wallet-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function ClientWallet() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesFilter = filter === "all" || transaction.type === filter;
      const matchesQuery =
        !query ||
        transaction.label.toLowerCase().includes(query) ||
        transaction.detail.toLowerCase().includes(query);

      return matchesFilter && matchesQuery;
    });
  }, [filter, search, transactions]);

  const stats = useMemo(() => {
    const availableBalance = transactions.reduce((sum, transaction) => {
      if (transaction.type === "credit") {
        return sum + transaction.amount;
      }

      if (transaction.type === "debit" || transaction.type === "fee") {
        return sum + transaction.amount;
      }

      return sum;
    }, 0);

    const escrowLocked = transactions
      .filter((transaction) => transaction.type === "escrow")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    const totalPaid = transactions
      .filter((transaction) => transaction.type === "debit")
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    return {
      availableBalance,
      escrowLocked,
      totalPaid,
    };
  }, [transactions]);

  const handleRecharge = () => {
    const amount = Number(rechargeAmount);
    if (!amount || amount <= 0) {
      return;
    }

    setTransactions((current) => [
      {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        label: "Recharge portefeuille",
        detail: "Recharge manuelle ajoutee depuis le wallet client",
        type: "credit",
        amount,
        status: "Traite",
      },
      ...current,
    ]);
    setRechargeAmount("");
  };

  return (
    <div className="client-wallet-page">
      <div className="client-wallet-shell">
        <section className="client-wallet-hero">
          <div className="client-wallet-copy">
            <span className="client-wallet-eyebrow">Portefeuille client</span>
            <h1>Suivre votre solde, vos fonds bloques et les paiements projet</h1>
            <p>
              Ce wallet vous donne une vue claire sur les recharges, les montants places en escrow
              et les paiements déjà libérés sur vos collaborations.
            </p>
          </div>

          <div className="client-wallet-recharge-card">
            <span>Ajouter des fonds</span>
            <div className="client-wallet-recharge-row">
              <input
                type="number"
                min="1"
                placeholder="Montant en DT"
                value={rechargeAmount}
                onChange={(event) => setRechargeAmount(event.target.value)}
              />
              <button type="button" onClick={handleRecharge}>
                Recharger
              </button>
            </div>
            <small>Le montant est ajoute comme recharge manuelle dans l'historique.</small>
          </div>
        </section>

        <section className="client-wallet-stats">
          <article>
            <span>Solde disponible</span>
            <strong>{format(stats.availableBalance)} DT</strong>
          </article>
          <article>
            <span>Fonds en escrow</span>
            <strong>{format(stats.escrowLocked)} DT</strong>
          </article>
          <article>
            <span>Deja paye</span>
            <strong>{format(stats.totalPaid)} DT</strong>
          </article>
        </section>

        <section className="client-wallet-panel">
          <div className="client-wallet-panel-head">
            <div>
              <span className="client-wallet-panel-eyebrow">Historique</span>
              <h2>Mouvements du portefeuille</h2>
            </div>
            <button type="button" onClick={() => exportTransactions(filteredTransactions)}>
              Exporter CSV
            </button>
          </div>

          <div className="client-wallet-toolbar">
            <div className="client-wallet-filters">
              {filterOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`client-wallet-filter ${filter === option.key ? "active" : ""}`}
                  onClick={() => setFilter(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="client-wallet-search">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un mouvement"
              />
            </label>
          </div>

          <div className="client-wallet-transaction-list">
            {filteredTransactions.length === 0 ? (
              <div className="client-wallet-empty">
                <strong>Aucun mouvement correspondant</strong>
                <p>Essayez un autre filtre ou ajoutez des fonds au portefeuille.</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const meta = typeMeta[transaction.type];

                return (
                  <article key={transaction.id} className="client-wallet-transaction-card">
                    <div className="client-wallet-transaction-top">
                      <div>
                        <span className={`client-wallet-badge is-${meta.className}`}>
                          {meta.label}
                        </span>
                        <h3>{transaction.label}</h3>
                      </div>
                      <div className="client-wallet-amount-block">
                        <strong className={`is-${meta.className}`}>
                          {meta.prefix}
                          {format(Math.abs(transaction.amount))} DT
                        </strong>
                        <small>{transaction.status}</small>
                      </div>
                    </div>

                    <p>{transaction.detail}</p>

                    <div className="client-wallet-transaction-footer">
                      <span>{new Date(transaction.date).toLocaleDateString("fr-FR")}</span>
                      <span>Reference {transaction.id}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
