import { io } from "socket.io-client";

// Instance unique partagée dans toute l'application
const socket = io("http://localhost:4000");

export default socket;
