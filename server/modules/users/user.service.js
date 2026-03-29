import AppError from "../../utils/AppError.js";
import { findUserById } from "./user.repository.js";

export const getCurrentUserProfile = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  return user;
};

export const getUserProfileById = async (id) => {
  const user = await findUserById(id);

  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  return user;
};

