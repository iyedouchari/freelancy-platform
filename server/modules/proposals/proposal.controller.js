import { successResponse } from "../../utils/apiResponse.js";

export const getproposalStatus = async (_req, res) => {
  return successResponse(res, {
    statusCode: 501,
    message: "proposals module is scaffolded but not implemented yet.",
  });
};
