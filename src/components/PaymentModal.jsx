// ─── Module 4 : PaymentModal ──────────────────────────────────────────────────
// Modale de paiement déclenchée par le Membre 3 (Deals) quand :
//   1. Une Proposal est acceptée → paiement acompte 20%
//   2. La livraison est validée  → paiement final 80%
//
// Usage (depuis ClientShell ou DealRoom) :
//   <PaymentModal
//     isOpen={showPaymentModal}
//     phase="advance"           // ou "final"
//     deal={{ id, title, total }}
//     onSuccess={(result) => { /* mettre à jour l'état du deal */ }}
//     onClose={() => setShowPaymentModal(false)}
//   />

import { useState } from "react";
import { format } from "../utils/format";
import { paymentService } from "../services/paymentService";
import "./PaymentModal.css";

function parseDealTotal(value) {
  return Number(String(value).replace(/\s/g, "").replace(",", ".")) || 0;
}

export default function PaymentModal({ isOpen, phase = "advance", deal, onSuccess, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError]               = useState(null);
  const [done, setDone]                 = useState(false);
  const [result, setResult]             = useState(null);

  if (!isOpen || !deal) return null;

  const totalAmount = parseDealTotal(deal.total);
  const amounts     = paymentService.calculateAmounts(totalAmount);
  const isAdvance   = phase === "advance";
  const phaseAmount = isAdvance ? amounts.advance : amounts.final;
  const phaseLabel  = isAdvance ? "Acompte 20%" : "Paiement final 80%";
  const phaseFee    = isAdvance ? amounts.feeOnAdvance : amounts.feeOnFinal;
  const phaseNet    = isAdvance ? amounts.netAdvance : amounts.netFinal;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let res;

      if (isAdvance) {
        res = await paymentService.chargeAdvancePayment({
          dealId:       deal.id,
          dealTitle:    deal.title,
          clientId:     "client-1",
          freelancerId: deal.freelancerId ?? "freelancer-1",
          totalAmount,
        });
      } else {
        res = await paymentService.releaseFinalPayment({
          dealId:       deal.id,
          dealTitle:    deal.title,
          clientId:     "client-1",
          freelancerId: deal.freelancerId ?? "freelancer-1",
          totalAmount,
        });
      }

      setResult(res);
      setDone(true);
      onSuccess?.(res);
    } catch (err) {
      setError(err.message ?? "Echec du paiement. Veuillez reessayer.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setDone(false);
    setResult(null);
    setError(null);
    onClose?.();
  };

  return (
    <div className="payment-modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="payment-modal">

        {/* En-tête */}
        <div className="payment-modal-head">
          <h2>{done ? "Paiement confirme ✓" : phaseLabel}</h2>
          <button type="button" className="payment-modal-close" onClick={handleClose}>✕</button>
        </div>

        {/* Corps */}
        {!done ? (
          <div className="payment-modal-body">
            <p className="payment-modal-deal-title">{deal.title}</p>

            <div className="payment-modal-breakdown">
              <div className="payment-modal-row">
                <span>Montant {phaseLabel}</span>
                <strong>{format(phaseAmount)} DT</strong>
              </div>
              <div className="payment-modal-row is-fee">
                <span>Commission plateforme (5%)</span>
                <span>-{format(phaseFee)} DT</span>
              </div>
              <div className="payment-modal-row is-total">
                <span>Net freelancer</span>
                <strong>{format(phaseNet)} DT</strong>
              </div>
            </div>

            <p className="payment-modal-info">
              {isAdvance
                ? "Ce paiement sera place en escrow et libere au freelancer apres livraison acceptee."
                : "Le paiement final libere le solde restant directement dans le wallet du freelancer."}
            </p>

            {error && (
              <p className="payment-modal-error">{error}</p>
            )}

            <div className="payment-modal-actions">
              <button type="button" className="payment-modal-cancel" onClick={handleClose} disabled={isProcessing}>
                Annuler
              </button>
              <button
                type="button"
                className={`payment-modal-confirm ${isProcessing ? "loading" : ""}`}
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? "Traitement en cours…" : `Payer ${format(phaseAmount)} DT`}
              </button>
            </div>
          </div>
        ) : (
          <div className="payment-modal-success">
            <div className="payment-modal-success-icon">✓</div>
            <p>
              <strong>{format(phaseAmount)} DT</strong> ont ete traites avec succes.
            </p>
            {result?.payment?.stripePaymentIntentId && (
              <p className="payment-modal-ref">
                Ref. transaction : {result.payment.stripePaymentIntentId}
              </p>
            )}
            {phase === "final" && (
              <p className="payment-modal-deal-update">
                ✓ Le deal a ete marque comme <strong>Termine</strong>.
              </p>
            )}
            <button type="button" className="payment-modal-confirm" onClick={handleClose}>
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}