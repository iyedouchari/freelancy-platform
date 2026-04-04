import { getDb } from "../../config/db.js";

const FILE_PREFIX = "__FILE__:";

function buildStoredContent(content, fileName, fileUrl) {
  if (fileName && fileUrl) {
    return `${FILE_PREFIX}${JSON.stringify({ name: fileName, url: fileUrl })}`;
  }
  return content?.trim() || "";
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

export async function handleSendMessage(
  dealId,
  senderId,
  receiverId,
  content,
  fileName = null,
  fileUrl = null
) {
  const finalContent = buildStoredContent(content, fileName, fileUrl);

  if (!dealId || !senderId || !receiverId || !finalContent) {
    throw new Error("Parametres manquants pour l'envoi du message.");
  }

  const db = getDb();

  const [result] = await db.execute(
    `INSERT INTO messages (deal_id, sender_id, receiver_id, content)
     VALUES (?, ?, ?, ?)`,
    [dealId, senderId, receiverId, finalContent]
  );

  const [rows] = await db.execute(
    `SELECT id, deal_id, sender_id, receiver_id, content, is_read, sent_at
     FROM messages
     WHERE id = ?`,
    [result.insertId]
  );

  const message = rows[0];
  const parsed = parseStoredContent(message.content);

  return {
    ...message,
    content: parsed.parsedContent,
    file_name: parsed.fileName,
    file_url: parsed.fileUrl,
  };
}

export async function getMessageHistory(dealId) {
  if (!dealId) throw new Error("dealId manquant.");

  const db = getDb();

  const [rows] = await db.execute(
    `SELECT id, deal_id, sender_id, receiver_id, content, is_read, sent_at
     FROM messages
     WHERE deal_id = ?
     ORDER BY sent_at ASC`,
    [dealId]
  );

  return rows.map((row) => {
    const parsed = parseStoredContent(row.content);
    return {
      ...row,
      content: parsed.parsedContent,
      file_name: parsed.fileName,
      file_url: parsed.fileUrl,
    };
  });
}

export async function markMessagesAsRead(dealId, receiverId) {
  if (!dealId || !receiverId) throw new Error("Parametres manquants.");

  const db = getDb();

  await db.execute(
    `UPDATE messages
     SET is_read = TRUE
     WHERE deal_id = ? AND receiver_id = ? AND is_read = FALSE`,
    [dealId, receiverId]
  );
}
