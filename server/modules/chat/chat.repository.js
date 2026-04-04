import { getDb } from "../../config/db.js";

export const createMessage = async (dealId, senderId, receiverId, content) => {
  const db = getDb();
  // Ta table a besoin de deal_id, sender_id, receiver_id, content
  const query = `
    INSERT INTO messages (deal_id, sender_id, receiver_id, content) 
    VALUES (?, ?, ?, ?)`;
  
  const [result] = await db.execute(query, [dealId, senderId, receiverId, content]);
  return result.insertId;
};

export const findMessagesByDeal = async (dealId) => {
  const db = getDb();
  // On récupère l'historique par deal_id
  const query = `
    SELECT * FROM messages 
    WHERE deal_id = ? 
    ORDER BY sent_at ASC`;
    
  const [rows] = await db.execute(query, [dealId]);
  return rows;
};