import http from "http";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/db.js";
import { env } from "./config/env.js";
import { attachSocket } from "./config/socket.js";
import { prepareAuthStorage } from "./modules/auth/auth.repository.js";

const startServer = async () => {
  await checkDatabaseConnection();
  await prepareAuthStorage();

  const server = http.createServer(app);
  attachSocket(server);

  server.listen(env.PORT, () => {
    console.log(`API server listening on port ${env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

