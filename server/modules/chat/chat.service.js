import { getDb } from "../../config/db.js";

const FILE_PREFIX = "__FILE__:";
let chatSchemaReadyPromise;

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

function normalizeTextContent(content) {
  return typeof content === "string" ? content.trim() : "";
}

function parseStoredContent(content) {
  if (typeof content !== "string" || !content.startsWith(FILE_PREFIX)) {
    return {
      parsedContent: content,
      fileName: null,
      fileUrl: null,
    };
  }

  try {
    const payload = JSON.parse(content.slice(FILE_PREFIX.length));
    return {
      parsedContent: `[Fichier] ${payload?.name || "piece jointe"}`,
      fileName: payload?.name || null,
      fileUrl: payload?.url || null,
    };
  } catch {
    return {
      parsedContent: content,
      fileName: null,
      fileUrl: null,
    };
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

function inferMessageType({ content, fileName, mimeType }) {
  if (!fileName) {
    return "text";
  }

  const normalizedMime = String(mimeType || "").toLowerCase();

  if (normalizedMime.startsWith("image/")) return "image";
  if (normalizedMime === "application/pdf") return "pdf";
  if (normalizedMime.startsWith("video/")) return "video";
  if (normalizedMime.startsWith("audio/")) return "audio";

  const normalizedContent = normalizeTextContent(content);
  return normalizedContent ? "attachment" : "document";
}

function normalizeMessageRow(row) {
  const legacyPayload = parseStoredContent(row.content);
  const fileName = row.file_name ?? legacyPayload.fileName;
  const fileUrl = row.file_url ?? legacyPayload.fileUrl;
  const textContent = normalizeTextContent(row.content);
  const isLegacyFileOnly = typeof row.content === "string" && row.content.startsWith(FILE_PREFIX);
  const messageType =
    row.message_type ??
    inferMessageType({
      content: isLegacyFileOnly ? "" : textContent,
      fileName,
      mimeType: row.file_mime_type,
    });

  return {
    ...row,
    conversation_id: row.deal_id,
    content: isLegacyFileOnly ? "" : textContent,
    text: isLegacyFileOnly ? "" : textContent,
    message_type: messageType,
    file_name: fileName,
    file_url: fileUrl,
    file_key: row.file_key ?? extractKeyFromUrl(fileUrl),
    file_mime_type: row.file_mime_type ?? null,
    file_size: row.file_size ?? null,
  };
}

async function ensureChatMessageSchema() {
  if (!chatSchemaReadyPromise) {
    chatSchemaReadyPromise = (async () => {
      const db = getDb();

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
      await addColumnIfMissing(
        db,
        "messages",
        "file_mime_type",
        "VARCHAR(255) NULL AFTER file_key"
      );
      await addColumnIfMissing(db, "messages", "file_size", "BIGINT NULL AFTER file_mime_type");
      await addColumnIfMissing(db, "messages", "file_url", "VARCHAR(1024) NULL AFTER file_size");
    })().catch((error) => {
      chatSchemaReadyPromise = null;
      throw error;
    });
  }

  await chatSchemaReadyPromise;
}

export async function handleSendMessage(
  dealId,
  senderId,
  receiverId,
  content,
  fileName = null,
  fileUrl = null,
  fileKey = null,
  fileMimeType = null,
  fileSize = null,
  messageType = null
) {
  const textContent = normalizeTextContent(content);
  const normalizedFileName = fileName ? String(fileName) : null;
  const normalizedFileUrl = fileUrl ? String(fileUrl) : null;
  const normalizedFileKey = fileKey || extractKeyFromUrl(normalizedFileUrl);
  const normalizedFileMimeType = fileMimeType ? String(fileMimeType) : null;
  const normalizedFileSize =
    fileSize == null || fileSize === "" ? null : Number.parseInt(fileSize, 10);
  const finalMessageType =
    messageType ||
    inferMessageType({
      content: textContent,
      fileName: normalizedFileName,
      mimeType: normalizedFileMimeType,
    });

  if (!dealId || !senderId || !receiverId || (!textContent && !normalizedFileName)) {
    throw new Error("Parametres manquants pour l'envoi du message.");
  }

  const db = getDb();
  await ensureChatMessageSchema();

  const [result] = await db.execute(
    `INSERT INTO messages (
      deal_id,
      sender_id,
      receiver_id,
      content,
      message_type,
      file_name,
      file_key,
      file_mime_type,
      file_size,
      file_url
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dealId,
      senderId,
      receiverId,
      textContent,
      finalMessageType,
      normalizedFileName,
      normalizedFileKey,
      normalizedFileMimeType,
      Number.isNaN(normalizedFileSize) ? null : normalizedFileSize,
      normalizedFileUrl,
    ]
  );

  const [rows] = await db.execute(
    `SELECT id, deal_id, sender_id, receiver_id, content, message_type, file_name, file_key,
            file_mime_type, file_size, file_url, is_read, sent_at
     FROM messages
     WHERE id = ?`,
    [result.insertId]
  );

  return normalizeMessageRow(rows[0]);
}

export async function getMessageHistory(dealId) {
  if (!dealId) throw new Error("dealId manquant.");

  const db = getDb();
  await ensureChatMessageSchema();

  const [rows] = await db.execute(
    `SELECT id, deal_id, sender_id, receiver_id, content, message_type, file_name, file_key,
            file_mime_type, file_size, file_url, is_read, sent_at
     FROM messages
     WHERE deal_id = ?
     ORDER BY sent_at ASC`,
    [dealId]
  );

  return rows.map(normalizeMessageRow);
}

export async function markMessagesAsRead(dealId, receiverId) {
  if (!dealId || !receiverId) throw new Error("Parametres manquants.");

  const db = getDb();
  await ensureChatMessageSchema();

  await db.execute(
    `UPDATE messages
     SET is_read = TRUE
     WHERE deal_id = ? AND receiver_id = ? AND is_read = FALSE`,
    [dealId, receiverId]
  );
}
