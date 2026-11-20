import mysql from "mysql2/promise";
import { env } from "../config/env.js";

const run = async () => {
  let connection;
  const isCloudDb =
    Boolean(env.DB_HOST && !["localhost", "127.0.0.1"].includes(env.DB_HOST)) ||
    Boolean(env.DB_SSL) ||
    Number(env.DB_PORT) === 4000 ||
    String(env.DB_HOST).includes("tidbcloud.com");

  try {
    connection = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: isCloudDb
        ? {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true,
          }
        : undefined,
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
        ) NOT NULL DEFAULT 'En attente acompte'`
      );
      console.log("Altered status column");
    } catch (error) {
      console.log("Column already has all needed values");
    }

    await connection.end();
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    process.exit(1);
  }
};

run();
