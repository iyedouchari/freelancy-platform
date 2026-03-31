import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../database/schema.sql");

const parseSqlStatements = (sql) => {
  const lines = sql.split(/\r?\n/);
  let delimiter = ";";
  let buffer = "";
  const statements = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("--")) {
      continue;
    }

    if (trimmedLine.toUpperCase().startsWith("DELIMITER ")) {
      delimiter = trimmedLine.slice("DELIMITER ".length).trim();
      continue;
    }

    buffer += `${line}\n`;
    const candidate = buffer.trimEnd();
    if (candidate.endsWith(delimiter)) {
      const statement = candidate.slice(0, -delimiter.length).trim();
      if (statement) {
        statements.push(statement);
      }
      buffer = "";
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    statements.push(trailing);
  }

  return statements;
};

const run = async () => {
  const sqlContent = await fs.readFile(schemaPath, "utf8");
  const statements = parseSqlStatements(sqlContent);

  if (statements.length === 0) {
    throw new Error("No SQL statements found in schema.sql.");
  }

  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    multipleStatements: false,
  });

  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
    console.log(`Schema initialized successfully with ${statements.length} statement(s).`);
  } finally {
    await connection.end();
  }
};

run().catch((error) => {
  console.error("Failed to initialize database schema:", error.message);
  process.exit(1);
});

