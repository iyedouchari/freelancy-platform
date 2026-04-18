import db from "../config/db.js";

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE deals
      MODIFY COLUMN status ENUM(
        'En cours',
        'Actif',
        'Soumis',
        'En attente paiement final',
        'En attente acompte',
        'Termine',
        'Annule',
        'Avance payé',
        'Totalité payé'
      ) NOT NULL DEFAULT 'En attente acompte'
    `);
    console.log("ENUM updated with Avance payé / Totalité payé");
  } catch (e) {
    console.error("ENUM error:", e.message);
  }

  try {
    await db.query(`DROP TRIGGER IF EXISTS trig_after_payment_update`);
    console.log("Old trigger dropped");
  } catch (e) {
    console.error("Drop trigger error:", e.message);
  }

  try {
    await db.query(`
      CREATE TRIGGER trig_after_payment_update
      AFTER UPDATE ON payments
      FOR EACH ROW
      BEGIN
        IF NEW.status = 'Paye' AND OLD.status <> 'Paye'
           AND NEW.payment_type = 'Avance' THEN
          UPDATE deals SET status = 'Avance payé' WHERE id = NEW.deal_id;
        END IF;

        IF NEW.status = 'Paye' AND OLD.status <> 'Paye'
           AND NEW.payment_type = 'Paiement final' THEN
          UPDATE deals
          SET status = 'Totalité payé', final_paid_at = CURRENT_TIMESTAMP
          WHERE id = NEW.deal_id;
        END IF;

        IF NEW.status = 'Rembourse' AND OLD.status <> 'Rembourse' THEN
          UPDATE deals SET status = 'Annule' WHERE id = NEW.deal_id;
        END IF;
      END
    `);
    console.log("New trigger created");
  } catch (e) {
    console.error("Trigger creation error:", e.message);
  }

  process.exit(0);
}

migrate();
