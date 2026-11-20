import mysql from "mysql2/promise";
import { env } from "./env.js";

const dbHost = process.env.DB_HOST || env.DB_HOST || "127.0.0.1";
const isCloudDb =
  Boolean(dbHost && !["localhost", "127.0.0.1"].includes(dbHost)) ||
  Boolean(env.DB_SSL) ||
  Number(process.env.DB_PORT || env.DB_PORT) === 4000 ||
  String(dbHost).includes("tidbcloud.com");

let pool;

export const getDb = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: dbHost,
      port: Number(process.env.DB_PORT || env.DB_PORT) || 3306,
      user: process.env.DB_USER || env.DB_USER,
      password: process.env.DB_PASSWORD || env.DB_PASSWORD,
      database: process.env.DB_NAME || env.DB_NAME,
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || env.DB_POOL_SIZE) || 5,
      queueLimit: 0,
      enableKeepAlive: true,
      ...(isCloudDb
        ? {
            ssl: {
              minVersion: "TLSv1.2",
              rejectUnauthorized: true,
            },
          }
        : {}),
    });
  }

  return pool;
};

export const checkDatabaseConnection = async () => {
  const db = getDb();
  await db.query("SELECT 1");
};

// Backward-compatible default export for modules that still import `db` directly.
const db = getDb();
export default db;
