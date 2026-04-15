import AppError from "../utils/AppError.js";

const runValidator = (validator, payload) => {
  if (typeof validator === "function") {
    return validator(payload);
  }

  if (validator && typeof validator.validate === "function") {
    const { error, value } = validator.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      throw new AppError(
        error.details.map((detail) => detail.message).join(". "),
        400,
        "VALIDATION_ERROR",
      );
    }

    return value;
  }

  throw new AppError("Invalid validator configuration.", 500, "INVALID_VALIDATOR");
};

export const validateRequest = (validator, source = "body") => {
  return (req, _res, next) => {
    try {
      const payload = req[source];
      const sanitizedPayload = runValidator(validator, payload);

      if (source === "body") {
        req.body = sanitizedPayload;
      } else {
        const target = req[source];

        if (target && typeof target === "object") {
          Object.keys(target).forEach((key) => {
            delete target[key];
          });

          if (sanitizedPayload && typeof sanitizedPayload === "object") {
            Object.assign(target, sanitizedPayload);
          }
        }
      }

      next();
    } catch (error) {
      const validationError =
        error instanceof AppError
          ? error
          : new AppError(error.message || "Invalid request payload", 400, "VALIDATION_ERROR");
      next(validationError);
    }
  };
};

export const validate = validateRequest;

