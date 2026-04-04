import cors from "cors";
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
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "./uploads");

app.disable("x-powered-by");
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(loggerMiddleware);
app.use(rateLimitMiddleware({ windowMs: 60_000, max: 100 }));
app.use("/uploads", express.static(uploadsDir));

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
