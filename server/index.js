import { startServer } from "./server.js";

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
