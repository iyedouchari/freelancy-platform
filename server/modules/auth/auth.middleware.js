import { roleMiddleware } from "../../middleware/roleMiddleware.js";

export const requireAuthRoles = (...roles) => roleMiddleware(...roles);

