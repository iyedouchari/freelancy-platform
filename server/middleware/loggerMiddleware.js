export const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const now = new Date().toISOString();
    console.log(`[${now}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`);
  });

  next();
};

