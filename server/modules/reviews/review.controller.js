import { successResponse } from "../../utils/apiResponse.js";

export const getreviewStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "reviews module is scaffolded but not implemented yet.",
  });
};
