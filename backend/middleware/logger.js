/**
 * Structured logging middleware for VÉRA backend.
 * Uses console.log with category tags for Render's log viewer.
 */

/**
 * Log an info message with category tag and timestamp.
 * @param {string} category - Log category (e.g., 'HTTP', 'ML', 'SCRAPE')
 * @param {string} message - Log message
 */
function logInfo(category, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${category.toUpperCase()}] ${timestamp} ${message}`);
}

/**
 * Log an error message with category tag and timestamp.
 * @param {string} category - Log category (e.g., 'ERROR', 'SCRAPE')
 * @param {string} message - Error message
 */
function logError(category, message) {
  const timestamp = new Date().toISOString();
  console.error(`[${category.toUpperCase()}] ${timestamp} ${message}`);
}

/**
 * Express middleware that logs incoming requests and response completion.
 * Logs: [HTTP] METHOD /path on request
 * Logs: [HTTP] METHOD /path STATUS TIMEms on response finish
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl } = req;

  logInfo('HTTP', `${method} ${originalUrl}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logInfo('HTTP', `${method} ${originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}

module.exports = { requestLogger, logInfo, logError };
