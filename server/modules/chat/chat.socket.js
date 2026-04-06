import * as chatService from "./chat.service.js";

const userRoom = (userId) => `user:${userId}`;

export const chatSocketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("register_user", (userId) => {
      const normalizedUserId = userId?.toString();
      if (!normalizedUserId) {
        return;
      }

      socket.data.userId = normalizedUserId;
      socket.join(userRoom(normalizedUserId));
      console.log(`Utilisateur ${normalizedUserId} enregistre (socket: ${socket.id})`);
    });

    socket.on("send_message", async (data) => {
      const {
        dealId,
        senderId,
        receiverId,
        content,
        fileName,
        fileUrl,
        key,
        mimeType,
        size,
        messageType,
      } = data;

      try {
        const savedMsg = await chatService.handleSendMessage(
          dealId,
          senderId,
          receiverId,
          content,
          fileName,
          fileUrl,
          key,
          mimeType,
          size,
          messageType
        );

        const payload = {
          id: savedMsg.id,
          dealId: savedMsg.deal_id ?? dealId,
          conversationId: savedMsg.conversation_id ?? savedMsg.deal_id ?? dealId,
          senderId: savedMsg.sender_id ?? senderId,
          content: savedMsg.content ?? content,
          text: savedMsg.text ?? savedMsg.content ?? content,
          messageType: savedMsg.message_type ?? messageType ?? "text",
          fileName: savedMsg.file_name ?? fileName ?? null,
          key: savedMsg.file_key ?? key ?? null,
          mimeType: savedMsg.file_mime_type ?? mimeType ?? null,
          size: savedMsg.file_size ?? size ?? null,
          fileUrl: savedMsg.file_url ?? fileUrl ?? null,
          sentAt: savedMsg.sent_at ?? new Date(),
        };

        const normalizedReceiverId = receiverId?.toString();
        if (normalizedReceiverId) {
          io.to(userRoom(normalizedReceiverId)).emit("receive_message", payload);
          console.log(`Message transmis a l'utilisateur ${receiverId}`);
        } else {
          console.log(`Receiver manquant - message stocke uniquement.`);
        }
      } catch (err) {
        console.error("Erreur socket send_message :", err.message);
        socket.emit("message_error", { error: "Echec de l'envoi du message." });
      }
    });

    socket.on("disconnect", () => {
      if (socket.data.userId) {
        console.log(`Utilisateur ${socket.data.userId} deconnecte.`);
      }
    });
  });
};
