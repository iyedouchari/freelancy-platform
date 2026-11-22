import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../config/api.js";

// Instance unique partagée dans toute l'application
const socket = io(SOCKET_BASE_URL, {
	autoConnect: true,
	reconnection: true,
	reconnectionAttempts: Infinity,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	transports: ["websocket", "polling"],
});

export default socket;
