import AppError from "../utils/AppError.js";

export const validateRequest = (validator, source = "body") => {
  return (req, _res, next) => {
    try {
      const payload = req[source];
      const sanitizedPayload = validator(payload);
      req[source] = sanitizedPayload;
      next();
    } catch (error) {
      const validationError =
        error instanceof AppError ? error : new AppError(error.message || "Invalid request payload", 400, "VALIDATION_ERROR");
      next(validationError);
    }
  };
};

