import db from "../config/db.js";

const email = process.argv[2] || "iyed.ouchariii@gmail.com";

async function run() {
  const [before] = await db.query(
    `SELECT d.id, r.title, d.status, d.submitted_at,
            uc.email AS client_email,
            uf.email AS freelancer_email
     FROM deals d
     JOIN users uc ON uc.id = d.client_id
     JOIN users uf ON uf.id = d.freelancer_id
     LEFT JOIN requests r ON r.id = d.request_id
     WHERE uc.email = ? OR uf.email = ?
     ORDER BY d.id DESC`,
    [email, email],
  );

  console.log("BEFORE", before);

  await db.query(
    `UPDATE deals d
     JOIN users uc ON uc.id = d.client_id
     JOIN users uf ON uf.id = d.freelancer_id
     LEFT JOIN (
       SELECT
         p.deal_id,
         MAX(CASE WHEN p.payment_type = 'Avance' AND p.status = 'Paye' THEN 1 ELSE 0 END) AS advance_paid,
         MAX(CASE WHEN p.payment_type = 'Paiement final' AND p.status = 'Paye' THEN 1 ELSE 0 END) AS final_paid
       FROM payments p
       GROUP BY p.deal_id
     ) pay ON pay.deal_id = d.id
     LEFT JOIN (
       SELECT wt.deal_id, MAX(wt.created_at) AS released_at
       FROM wallet_transactions wt
       WHERE wt.type = 'submission_release'
       GROUP BY wt.deal_id
     ) rel ON rel.deal_id = d.id
     SET
       d.submitted_at = COALESCE(d.submitted_at, rel.released_at),
       d.status = CASE
         WHEN d.status IN ('Annule', 'Annulé') THEN 'Annule'
         WHEN (COALESCE(d.submitted_at, rel.released_at) IS NOT NULL) AND COALESCE(pay.final_paid, 0) = 1 THEN 'Terminé'
         WHEN COALESCE(pay.final_paid, 0) = 1 THEN 'Totalité payée'
         WHEN COALESCE(pay.advance_paid, 0) = 1 THEN 'En cours'
         ELSE d.status
       END
     WHERE uc.email = ? OR uf.email = ?`,
    [email, email],
  );

  const [after] = await db.query(
    `SELECT d.id, r.title, d.status, d.submitted_at,
            uc.email AS client_email,
            uf.email AS freelancer_email
     FROM deals d
     JOIN users uc ON uc.id = d.client_id
     JOIN users uf ON uf.id = d.freelancer_id
     LEFT JOIN requests r ON r.id = d.request_id
     WHERE uc.email = ? OR uf.email = ?
     ORDER BY d.id DESC`,
    [email, email],
  );

  console.log("AFTER", after);
  await db.end();
}

run().catch(async (error) => {
  console.error("Status fix failed:", error.message);
  await db.end();
  process.exit(1);
});
