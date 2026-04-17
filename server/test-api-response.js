import { getDb } from "./config/db.js";

const db = getDb();

async function testApiResponse() {
  try {
    console.log("\n🔗 Testing API Response Format:\n");

    // This mimics what the repository returns
    const [rows] = await db.query(`
      SELECT 
        r.id,
        r.title,
        r.client_id,
        r.budget,
        r.negotiable,
        r.deadline,
        r.created_at,
        u.name AS client_name,
        u.avatar_url AS client_avatar_url
      FROM requests r
      LEFT JOIN users u ON u.id = r.client_id
      WHERE r.status = 'Ouverte'
      LIMIT 3
    `);
    
    console.log("📋 RAW DATABASE ROWS:");
    rows.forEach(row => {
      console.log("\nRow keys:", Object.keys(row));
      console.log("  - id:", row.id);
      console.log("  - title:", row.title);
      console.log("  - client_id:", row.client_id);
      console.log("  - client_name:", row.client_name);
      console.log("  - client_avatar_url:", row.client_avatar_url ? "EXISTS (length: " + row.client_avatar_url.length + ")" : "NULL");
    });

    console.log("\n✅ Test complete!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await db.end();
  }
}

testApiResponse();
