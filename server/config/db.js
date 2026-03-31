import mysql from "mysql2/promise";
import { env } from "./env.js";

let pool;

export const getDb = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      connectionLimit: env.DB_POOL_SIZE,
      waitForConnections: true,
      queueLimit: 0,
    });
  }

  return pool;
};

export const checkDatabaseConnection = async () => {
  const db = getDb();
  await db.query("SELECT 1");
};

