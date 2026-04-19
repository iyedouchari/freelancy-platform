import http from "http";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/db.js";
import { env } from "./config/env.js";
import { attachSocket } from "./config/socket.js";
import { prepareAuthStorage } from "./modules/auth/auth.repository.js";
import { ensureDealsTable, ensureDealTriggers } from "./modules/deals/deal.repository.js";
import { ensurePaymentsTable } from "./modules/payments/payment.repository.js";
import { startNonPaymentFinalRuleWatcher } from "./modules/payments/payment.service.js";
import { ensureProposalsTable } from "./modules/proposals/proposal.repository.js";
import { ensureRequestsTable } from "./modules/requests/request.repository.js";
import { ensureReviewsTable } from "./modules/reviews/review.repository.js";
import { ensureWalletTables } from "./modules/wallet/wallet.repository.js";
import { ensureReportsTable } from "./modules/admin/admin.repository.js";

const API_HEALTH_TIMEOUT_MS = 1500;

const createServerHandle = () => {
  const server = http.createServer(app);
  attachSocket(server);
  return server;
};

const listenOnPort = (server, port) =>
  new Promise((resolve, reject) => {
    const handleListening = () => {
      server.off("error", handleError);
      resolve(server);
    };

    const handleError = (error) => {
      server.off("listening", handleListening);
      reject(error);
    };

    server.once("listening", handleListening);
    server.once("error", handleError);
    server.listen(port);
  });

const isApiAlreadyRunning = async (port) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => null);
    return Boolean(payload?.success);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

export const startServer = async () => {
  await checkDatabaseConnection();
  await prepareAuthStorage();
  await ensureRequestsTable();
  await ensureProposalsTable();
  await ensureDealsTable();
  await ensurePaymentsTable();
  await ensureWalletTables();
  await ensureDealTriggers();
  await ensureReviewsTable();
  await ensureReportsTable();

  const port = env.PORT;
  const server = createServerHandle();

  try {
    await listenOnPort(server, port);
    console.log(`API server listening on port ${port}`);
    startNonPaymentFinalRuleWatcher();
    return server;
  } catch (error) {
    if (error?.code !== "EADDRINUSE") {
      throw error;
    }

    if (await isApiAlreadyRunning(port)) {
      throw new Error(
        `API already running on port ${port}. Stop the previous process before starting a new one.`,
      );
    }

    throw new Error(`Port ${port} is busy. Free this port and restart the API.`);
  }
};

const isDirectRun = process.argv[1] && process.argv[1].endsWith("server.js");

if (isDirectRun) {
  startServer()
    .then((server) => {
      if (server?.alreadyRunning) {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error("Failed to start server:", error);
      process.exit(1);
    });
}

