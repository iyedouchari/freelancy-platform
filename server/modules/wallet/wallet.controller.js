import { successResponse } from "../../utils/apiResponse.js";

export const getwalletStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "wallet module is scaffolded but not implemented yet.",
  });
};
