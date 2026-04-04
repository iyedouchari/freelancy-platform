export const validateChat = (req, res, next) => {
    // Tu peux utiliser Joi ou express-validator ici
    const { content, receiverId } = req.body;
    if (!content || !receiverId) {
        return res.status(400).json({ message: "Content and receiverId are required" });
    }
    next();
};