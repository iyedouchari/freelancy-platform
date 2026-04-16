import { successResponse } from "../../utils/apiResponse.js";
import {
  changeCurrentUserPassword,
  getCurrentUserProfile,
  getUserProfileById,
  updateCurrentUserProfile,
} from "./user.service.js";

export const getMe = async (req, res) => {
  const user = await getCurrentUserProfile(req.auth.userId);
  return successResponse(res, { message: "User profile retrieved.", data: user });
};

export const getUserById = async (req, res) => {
  const user = await getUserProfileById(req.params.id);
  return successResponse(res, { message: "User profile retrieved.", data: user });
};

export const updateMe = async (req, res) => {
  const user = await updateCurrentUserProfile(req.auth.userId, req.body);
  return successResponse(res, { message: "User profile updated.", data: user });
};

export const changeMyPassword = async (req, res) => {
  const result = await changeCurrentUserPassword(req.auth.userId, req.body);
  return successResponse(res, { message: "Password updated.", data: result });
};

