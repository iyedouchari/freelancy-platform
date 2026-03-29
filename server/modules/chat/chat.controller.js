import { successResponse } from "../../utils/apiResponse.js";

export const getchatStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "chat module is scaffolded but not implemented yet.",
  });
};
