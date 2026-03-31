import { successResponse } from "../../utils/apiResponse.js";
import { getCurrentUserProfile, getUserProfileById } from "./user.service.js";

export const getMe = async (req, res) => {
  const user = await getCurrentUserProfile(req.auth.userId);
  return successResponse(res, { message: "User profile retrieved.", data: user });
};

export const getUserById = async (req, res) => {
  const user = await getUserProfileById(req.params.id);
  return successResponse(res, { message: "User profile retrieved.", data: user });
};

