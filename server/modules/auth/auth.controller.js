import { successResponse } from "../../utils/apiResponse.js";
import { getAuthUserById, login, register } from "./auth.service.js";

export const registerController = async (req, res) => {
  const result = await register(req.body);
  return successResponse(res, {
    statusCode: 201,
    message: "Registration successful.",
    data: result,
  });
};

export const loginController = async (req, res) => {
  const result = await login(req.body);
  return successResponse(res, {
    message: "Login successful.",
    data: result,
  });
};

export const meController = async (req, res) => {
  const user = await getAuthUserById(req.auth.userId);
  return successResponse(res, {
    message: "Authenticated user retrieved.",
    data: user,
  });
};

export const logoutController = async (_req, res) => {
  return successResponse(res, {
    message: "Logout successful on API side. Remove token on client.",
  });
};

