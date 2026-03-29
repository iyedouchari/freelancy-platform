export const successResponse = (res, { statusCode = 200, message = "OK", data = null } = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, { statusCode = 500, message = "Something went wrong", code = "INTERNAL_ERROR" } = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};

