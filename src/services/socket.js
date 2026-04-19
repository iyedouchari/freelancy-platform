import { io } from "socket.io-client";

// Instance unique partagée dans toute l'application
const socket = io("http://localhost:4000", {
	autoConnect: true,
	reconnection: true,
	reconnectionAttempts: Infinity,
	reconnectionDelay: 1000,
	reconnectionDelayMax: 5000,
	transports: ["websocket", "polling"],
});

export default socket;
