import { successResponse } from "../../utils/apiResponse.js";

export const getdealStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "deals module is scaffolded but not implemented yet.",
  });
};
