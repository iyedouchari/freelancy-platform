import cors from "cors";
<<<<<<< HEAD
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
=======
import express from "express";
import { corsOptions } from "./config/cors.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { loggerMiddleware } from "./middleware/loggerMiddleware.js";
import { notFoundMiddleware } from "./middleware/notFoundMiddleware.js";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware.js";
import authRoutes from "./modules/auth/auth.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import dealRoutes from "./modules/deals/deal.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import proposalRoutes from "./modules/proposals/proposal.routes.js";
import requestRoutes from "./modules/requests/request.routes.js";
import reviewRoutes from "./modules/reviews/review.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import walletRoutes from "./modules/wallet/wallet.routes.js";
import { successResponse } from "./utils/apiResponse.js";

const app = express();

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(loggerMiddleware);
app.use(rateLimitMiddleware({ windowMs: 60_000, max: 100 }));

app.get("/api/health", (_req, res) => {
  return successResponse(res, {
    message: "API is running.",
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/reviews", reviewRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
>>>>>>> 6d7d396b3e930ea7d876fff44858e0fe069a50b2
