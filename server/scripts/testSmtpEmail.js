import { env } from "../config/env.js";
import { mailer } from "../utils/mailer.js";

const target = String(process.argv[2] || process.env.TEST_EMAIL_TO || env.SMTP_USER || "").trim();

if (!target) {
  console.error("Missing recipient. Usage: npm run email:test -- your@email.com");
  process.exit(1);
}

const now = new Date().toISOString();

try {
  const info = await mailer.sendMail({
    to: target,
    subject: "Freelancy SMTP test",
    text: `SMTP is configured and this is a real email test.\n\nTimestamp: ${now}`,
    html: `
      <p>SMTP is configured and this is a <strong>real email test</strong>.</p>
      <p>Timestamp: ${now}</p>
    `,
  });

  console.log("SMTP test email sent successfully.");
  console.log(`Message ID: ${info?.messageId || "n/a"}`);
  if (Array.isArray(info?.accepted) && info.accepted.length) {
    console.log(`Accepted: ${info.accepted.join(", ")}`);
  }
} catch (error) {
  console.error(`SMTP test failed: ${error?.message || "Unknown error"}`);
  process.exit(1);
}
