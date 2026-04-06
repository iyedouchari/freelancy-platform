import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "../config/db.js";
import { deleteFromB2, uploadToB2 } from "../config/b2.js";

const FILE_PREFIX = "__FILE__:";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatUploadDir = path.resolve(__dirname, "../uploads/chat");

function sanitizeFileName(fileName) {
  return String(fileName || "").replace(/[^a-zA-Z0-9._-]/g, "_") || "file";
}

function buildStorageKey(fileName) {
  const safeFileName = sanitizeFileName(fileName);
  const ext = path.extname(safeFileName);
  const baseName = path.basename(safeFileName, ext) || "file";
  return `chat/${Date.now()}-${crypto.randomUUID()}-${baseName}${ext}`;
}

function buildChatDownloadUrl(key, fileName) {
  const params = new URLSearchParams({
    key,
    fileName,
  });

  return `/api/chat/file?${params.toString()}`;
}

function parseLegacyPayload(content) {
  if (typeof content !== "string" || !content.startsWith(FILE_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(content.slice(FILE_PREFIX.length));
  } catch {
    return null;
  }
}

function extractKeyFromUrl(fileUrl) {
  if (!fileUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(String(fileUrl), "http://localhost");
    return parsedUrl.searchParams.get("key");
  } catch {
    return null;
  }
}

function getLocalFileName(fileUrl) {
  if (typeof fileUrl !== "string" || !fileUrl.startsWith("/uploads/chat/")) {
    return null;
  }

  return path.basename(fileUrl);
}

function inferMessageType(fileName) {
  return fileName ? "attachment" : "text";
}

async function addColumnIfMissing(db, tableName, columnName, definition) {
  const [rows] = await db.execute(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  if (rows.length === 0) {
    await db.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureMessageColumns(db) {
  await addColumnIfMissing(
    db,
    "messages",
    "message_type",
    `ENUM(
      'text',
      'image',
      'pdf',
      'video',
      'audio',
      'document',
      'attachment'
    ) NOT NULL DEFAULT 'text' AFTER content`
  );
  await addColumnIfMissing(db, "messages", "file_name", "VARCHAR(255) NULL AFTER message_type");
  await addColumnIfMissing(db, "messages", "file_key", "VARCHAR(512) NULL AFTER file_name");
  await addColumnIfMissing(db, "messages", "file_mime_type", "VARCHAR(255) NULL AFTER file_key");
  await addColumnIfMissing(db, "messages", "file_size", "BIGINT NULL AFTER file_mime_type");
  await addColumnIfMissing(db, "messages", "file_url", "VARCHAR(1024) NULL AFTER file_size");
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function migrateLegacyMessage(db, row) {
  const payload = parseLegacyPayload(row.content);

  if (!payload) {
    const content = typeof row.content === "string" ? row.content.trim() : "";
    await db.execute(
      `UPDATE messages
       SET message_type = ?, file_name = NULL, file_key = NULL, file_mime_type = NULL, file_size = NULL, file_url = NULL, content = ?
       WHERE id = ?`,
      ["text", content, row.id]
    );
    return { migrated: false, missingFile: false };
  }

  const fileName = sanitizeFileName(payload.name);
  const existingKey = extractKeyFromUrl(payload.url);

  if (existingKey) {
    await db.execute(
      `UPDATE messages
       SET message_type = ?, file_name = ?, file_key = ?, file_mime_type = NULL, file_size = NULL, file_url = ?, content = ''
       WHERE id = ?`,
      [inferMessageType(fileName), fileName, existingKey, payload.url, row.id]
    );
    return { migrated: false, missingFile: false };
  }

  const localFileName = getLocalFileName(payload.url);

  if (!localFileName) {
    await db.execute(
      `UPDATE messages
       SET message_type = ?, file_name = ?, file_key = NULL, file_mime_type = NULL, file_size = NULL, file_url = NULL, content = ''
       WHERE id = ?`,
      [inferMessageType(fileName), fileName, row.id]
    );
    return { migrated: false, missingFile: true };
  }

  const localPath = path.join(chatUploadDir, localFileName);

  if (!(await fileExists(localPath))) {
    await db.execute(
      `UPDATE messages
       SET message_type = ?, file_name = ?, file_key = NULL, file_mime_type = NULL, file_size = NULL, file_url = NULL, content = ''
       WHERE id = ?`,
      [inferMessageType(fileName), fileName, row.id]
    );
    return { migrated: false, missingFile: true };
  }

  const fileBuffer = await fs.readFile(localPath);
  const key = buildStorageKey(fileName);

  try {
    await uploadToB2({
      key,
      body: fileBuffer,
      contentType: "application/octet-stream",
    });

    const fileUrl = buildChatDownloadUrl(key, fileName);
    await db.execute(
      `UPDATE messages
       SET message_type = ?, file_name = ?, file_key = ?, file_mime_type = NULL, file_size = ?, file_url = ?, content = ''
       WHERE id = ?`,
      [inferMessageType(fileName), fileName, key, fileBuffer.length, fileUrl, row.id]
    );

    await fs.unlink(localPath).catch(() => null);
    return { migrated: true, missingFile: false };
  } catch (error) {
    await deleteFromB2(key).catch(() => null);
    throw error;
  }
}

async function main() {
  const db = getDb();
  await ensureMessageColumns(db);

  const [rows] = await db.execute(
    `SELECT id, content
     FROM messages
     ORDER BY id ASC`
  );

  let migratedCount = 0;
  let normalizedCount = 0;
  const missingMessages = [];

  for (const row of rows) {
    const result = await migrateLegacyMessage(db, row);
    if (result.migrated) {
      migratedCount += 1;
    } else {
      normalizedCount += 1;
    }

    if (result.missingFile) {
      missingMessages.push(row.id);
    }
  }

  const localEntries = await fs.readdir(chatUploadDir).catch(() => []);
  for (const entry of localEntries) {
    await fs.unlink(path.join(chatUploadDir, entry)).catch(() => null);
  }

  console.log(
    JSON.stringify(
      {
        migratedCount,
        normalizedCount,
        missingMessages,
        remainingLocalChatFiles: (await fs.readdir(chatUploadDir).catch(() => [])).length,
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Chat migration failed:", error);
    process.exit(1);
  });
