import { successResponse } from "../../utils/apiResponse.js";

export const getpaymentStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "payments module is scaffolded but not implemented yet.",
  });
};
