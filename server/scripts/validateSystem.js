import db from "../config/db.js";
import { env } from "../config/env.js";

const SYSTEM_WALLET_OWNER_ID = env.SYSTEM_WALLET_OWNER_ID;

async function validateSystem() {
  console.log("\n🔍 Starting system validation...\n");

  try {
    // Check database connection
    console.log("Testing database connection...");
    const [result] = await db.query("SELECT 1");
    console.log("Database connected\n");

    // Verify tables exist
    console.log("Verifying database tables...");
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('users', 'deals', 'payments', 'reviews', 'wallet_accounts', 'wallet_transactions')
    `);
    console.log(`Found ${tables.length} required tables\n`);

    // Verify System Wallet exists
    console.log("Verifying System Wallet (999)...");
    const [systemUser] = await db.query(
      "SELECT id, role FROM users WHERE id = ?",
      [SYSTEM_WALLET_OWNER_ID],
    );
    if (!systemUser[0]) {
      console.warn(`⚠ System Wallet user (${SYSTEM_WALLET_OWNER_ID}) not found - will be created on first transaction\n`);
    } else {
      console.log(`System Wallet user exists (role: ${systemUser[0].role})\n`);
    }

    // Check sample users
    console.log("Checking sample users...");
    const [users] = await db.query(
      "SELECT id, name, email, role FROM users WHERE role IN ('CLIENT', 'FREELANCER') LIMIT 3",
    );
    users.forEach(user => {
      console.log(`  - User ${user.id}: ${user.name} (${user.role})`);
    });
    console.log();

    // Verify wallet structure
    console.log("Verifying wallet structure...");
    const [walletUsers] = await db.query(
      "SELECT COUNT(*) as count FROM wallet_accounts",
    );
    console.log(`Found ${walletUsers[0].count} wallets\n`);

    // Check payment history
    console.log("Checking payment statistics...");
    const [paymentStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Paye' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN payment_type = 'Avance' THEN 1 ELSE 0 END) as advances,
        SUM(CASE WHEN payment_type = 'Paiement final' THEN 1 ELSE 0 END) as finals
      FROM payments
    `);
    console.log(`  - Total payments: ${paymentStats[0].total}`);
    console.log(`  - Paid: ${paymentStats[0].paid}`);
    console.log(`  - Advances: ${paymentStats[0].advances}`);
    console.log(`  - Finals: ${paymentStats[0].finals}\n`);

    // Check reviews
    console.log("Checking reviews statistics...");
    const [reviewStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        AVG(score) as avg_score,
        MIN(score) as min_score,
        MAX(score) as max_score
      FROM reviews
    `);
    const avgScore =
      reviewStats[0].avg_score === null || reviewStats[0].avg_score === undefined
        ? null
        : Number(reviewStats[0].avg_score);
    console.log(`  - Total reviews: ${reviewStats[0].total}`);
    console.log(`  - Average score: ${avgScore !== null && Number.isFinite(avgScore) ? avgScore.toFixed(2) : "N/A"}`);
    console.log(`  - Score range: ${reviewStats[0].min_score} - ${reviewStats[0].max_score}\n`);

    // Environment check
    console.log("Verifying environment configuration...");
    console.log(`  - NON_PAYMENT_RULE_ENABLED: ${env.NON_PAYMENT_RULE_ENABLED}`);
    console.log(`  - NON_PAYMENT_RULE_GRACE_HOURS: ${env.NON_PAYMENT_RULE_GRACE_HOURS}`);
    console.log(`  - System Wallet Owner ID: ${SYSTEM_WALLET_OWNER_ID}\n`);

    console.log("System validation complete!\n");
    console.log("ℹ Key endpoints:");
    console.log("  - POST /api/payments/advance");
    console.log("  - POST /api/payments/final");
    console.log("  - POST /api/payments/total");
    console.log("  - POST /api/reviews (requires dealId or proposalId)");
    console.log("  - PATCH /api/reviews/:reviewId");
    console.log("  - DELETE /api/reviews/:reviewId\n");

    return true;
  } catch (error) {
    console.error("\nSystem validation failed:", error.message, "\n");
    return false;
  }
}

export default validateSystem;
