// Global Socket.io instance manager
let globalIO = null;

export const setSocketInstance = (io) => {
  globalIO = io;
};

export const getSocketInstance = () => {
  return globalIO;
};

/**
 * Disconnect a user from all their active socket connections
 * @param {number} userId - The user ID to disconnect
 * @param {string|object} details - Optional reason or payload for disconnection
 */
export const disconnectUser = (userId, details = "User banned") => {
  if (!globalIO) {
    console.warn("Socket.io instance not initialized");
    return;
  }

  const userRoom = `user:${userId}`;
  const payload =
    typeof details === "object" && details !== null
      ? {
          message: details.message || "User banned",
          suspendedUntil: details.suspendedUntil || "",
          timestamp: new Date(),
        }
      : {
          message: details || "User banned",
          suspendedUntil: "",
          timestamp: new Date(),
        };
  
  // Emit ban event to the user first
  globalIO.to(userRoom).emit("user_banned", payload);

  // Get all sockets in the user's room and disconnect them
  const room = globalIO.sockets.adapter.rooms.get(userRoom);
  if (room) {
    room.forEach((socketId) => {
      const socket = globalIO.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        console.log(`Disconnected socket ${socketId} for user ${userId}`);
      }
    });
  }
};
