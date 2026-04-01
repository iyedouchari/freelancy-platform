import http from "http";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/db.js";
import { env } from "./config/env.js";
import { attachSocket } from "./config/socket.js";
import { prepareAuthStorage } from "./modules/auth/auth.repository.js";
import { ensureReviewsTable } from "./modules/reviews/review.repository.js";

const API_HEALTH_TIMEOUT_MS = 1500;
const MAX_PORT_ATTEMPTS = 5;

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

const createAlreadyRunningHandle = (port) => ({
  alreadyRunning: true,
  port,
  close(callback) {
    if (typeof callback === "function") {
      callback();
    }
  },
});

export const startServer = async () => {
  await checkDatabaseConnection();
  await prepareAuthStorage();
  await ensureReviewsTable();

  for (let offset = 0; offset < MAX_PORT_ATTEMPTS; offset += 1) {
    const port = env.PORT + offset;
    const server = createServerHandle();

    try {
      await listenOnPort(server, port);

      if (offset === 0) {
        console.log(`API server listening on port ${port}`);
      } else {
        console.warn(
          `Port ${env.PORT} is busy. API server listening on port ${port} instead.`,
        );
      }

      return server;
    } catch (error) {
      if (error?.code !== "EADDRINUSE") {
        throw error;
      }

      if (offset === 0 && (await isApiAlreadyRunning(port))) {
        console.log(`API is already running on port ${port}.`);
        return createAlreadyRunningHandle(port);
      }
    }
  }

  throw new Error(
    `Unable to start the API. Ports ${env.PORT} to ${env.PORT + MAX_PORT_ATTEMPTS - 1} are busy.`,
  );
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

