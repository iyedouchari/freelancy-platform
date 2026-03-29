import { successResponse } from "../../utils/apiResponse.js";

export const getrequestStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "requests module is scaffolded but not implemented yet.",
  });
};
