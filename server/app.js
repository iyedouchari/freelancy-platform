import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import walletRoutes  from "./modules/wallet/wallet.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import db from "./config/db.js";

dotenv.config();

export const app = express();

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "3mb" }));

// Test connexion MySQL
db.query("SELECT 1")
  .then(() => console.log("✅ MySQL connecté"))
  .catch((err) => console.error("❌ Erreur MySQL :", err.message));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/payments", paymentRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, _req, res, _next) => {
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error."
      : err?.message || "Internal server error.";
  res.status(500).json({ message });
});

export function startServer(port = PORT) {
  return app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  startServer();
}