export const validateChat = (req, res, next) => {
    const { content, receiverId } = req.body;
    if (!content || !receiverId) {
        return res.status(400).json({ message: "Content and receiverId are required" });
    }
    next();// Si la validation est réussie, on passe au middleware suivant ou au contrôleur
};