/**
 * Wraps async route handlers so thrown errors / rejected promises
 * are automatically forwarded to Express's error-handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
