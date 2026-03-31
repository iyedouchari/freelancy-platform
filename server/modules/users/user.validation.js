import AppError from "../../utils/AppError.js";

export const validateUserIdParam = (params) => {
  const rawId = params?.id;
  const id = Number.parseInt(rawId, 10);

  if (!rawId || Number.isNaN(id) || id <= 0) {
    throw new AppError("User id must be a positive integer.", 400, "INVALID_USER_ID");
  }

  return {
    ...params,
    id,
  };
};

