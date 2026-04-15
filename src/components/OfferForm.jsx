import { format } from "../utils/format";

const OfferForm = ({ project, onAcceptDeal }) => {
  return (
    <div className="glass-card p-7 h-fit">
      <h3 className="text-xl font-semibold text-slate-900 mb-4">Proposition du client</h3>

      <div className="space-y-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
        <p>Ce projet est <strong>non négociable</strong>. Consultez les détails puis acceptez si cela vous convient.</p>
        <p>Budget : {format(project.budget)} DT</p>
        <p>Date limite : {format(project.deadline, "date")}</p>
      </div>

      <button type="button" onClick={onAcceptDeal} className="button-primary w-full mt-4">
        Accepter la proposition
      </button>

      <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Notes importantes</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Paiement sécurisé en escrow</li>
          <li>30% d'avance à l'accord</li>
          <li>70% restants selon le mode de paiement choisi</li>
        </ul>
      </div>
    </div>
  );
};

export default OfferForm;
