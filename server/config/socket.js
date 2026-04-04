import { Server } from "socket.io";
import { corsOptions } from "./cors.js";
import { chatSocketHandler } from "../modules/chat/chat.socket.js";

export const attachSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: corsOptions.credentials,
    },
  });

  chatSocketHandler(io);
  return io;
};

