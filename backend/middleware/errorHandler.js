/**
 * Error handling middleware for VÉRA backend.
 * Global error handler and 404 handler.
 */

/**
 * Global Express error handler.
 * Returns { error, details? } with 500 status.
 * Never exposes stack traces in production.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function globalErrorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const response = {
    error: err.message || 'Internal server error',
  };

  // Include details in development only, never stack traces in production
  if (!isProduction && err.stack) {
    response.details = err.stack;
  }

  // Log the error
  const timestamp = new Date().toISOString();
  console.error(`[ERROR] ${timestamp} ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler.
 * Returns { error } with 404 status.
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: `Not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { globalErrorHandler, notFoundHandler };
