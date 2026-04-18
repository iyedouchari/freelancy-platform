import { getDb } from "./config/db.js";

const db = getDb();

async function testClientData() {
  try {
    console.log("\n🔍 Testing client data retrieval...\n");

    // Check if there are any users
    const [users] = await db.query("SELECT id, name, avatar_url FROM users LIMIT 5");
    console.log("Users in database:");
    users.forEach(u => {
      console.log(`  - ID: ${u.id}, Name: ${u.name}, Avatar: ${u.avatar_url ? "Yes" : "No"}`);
    });

    // Check if there are any requests
    const [requests] = await db.query("SELECT id, client_id, title FROM requests LIMIT 5");
    console.log(`\nRequests in database (${requests.length} total):`);
    requests.forEach(r => {
      console.log(`  - ID: ${r.id}, Client ID: ${r.client_id}, Title: ${r.title}`);
    });

    // Test the JOIN query
    console.log("\nTesting JOIN query for requests with client data:");
    const [joinedResults] = await db.query(`
      SELECT 
        r.id,
        r.title,
        r.client_id,
        u.name AS client_name,
        u.avatar_url AS client_avatar_url
      FROM requests r
      LEFT JOIN users u ON u.id = r.client_id
      LIMIT 5
    `);
    
    joinedResults.forEach(r => {
      console.log(`\n  Request ID ${r.id}:`);
      console.log(`    - Title: ${r.title}`);
      console.log(`    - Client ID: ${r.client_id}`);
      console.log(`    - Client Name: ${r.client_name || "NULL"}`);
      console.log(`    - Client Avatar: ${r.client_avatar_url || "NULL"}`);
    });

    console.log("\nTest complete!\n");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await db.end();
  }
}

testClientData();
