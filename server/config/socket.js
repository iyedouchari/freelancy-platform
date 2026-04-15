import { Server } from "socket.io";
import { corsOptions } from "./cors.js";
import { chatSocketHandler } from "../modules/chat/chat.socket.js";
import { setSocketInstance } from "./socketManager.js";

export const attachSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: corsOptions.credentials,
    },
  });

  // Set the global socket instance so it can be used from other modules
  setSocketInstance(io);

  chatSocketHandler(io);
  return io;
};

