import * as chatService from "./chat.service.js";

export const getHistory = async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const history = await chatService.getChatHistory(user1, user2);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};