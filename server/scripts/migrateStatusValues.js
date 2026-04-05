import mysql from "mysql2/promise";
import { env } from "../config/env.js";

const run = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    });

    console.log("Connected to database");

    // First, alter the table to modify the ENUM and add 'En attente acompte' if needed
    try {
      await connection.execute(
        `ALTER TABLE deals MODIFY COLUMN status ENUM(
          'En cours',
          'Actif',
          'Soumis',
          'En attente paiement final',
          'En attente acompte',
          'Termine',
          'Annule'
        ) NOT NULL DEFAULT 'En cours'`
      );
      console.log("✓ Altered status column");
    } catch (error) {
      console.log("Column already has all needed values");
    }

    // Update all deals with old status values
    const [result] = await connection.execute(
      `UPDATE deals SET status = 'En cours' WHERE status IN ('En attente acompte')`
    );

    console.log(`✓ Updated ${result.affectedRows} deals`);

    await connection.end();
    console.log("✓ Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    process.exit(1);
  }
};

run();
