/**
 * Security middleware for VÉRA backend.
 * Configures helmet for security headers and Content-Type enforcement.
 */

const helmet = require('helmet');

/**
 * Configured helmet instance.
 * Sets X-Content-Type-Options: nosniff, X-Frame-Options: DENY,
 * Strict-Transport-Security, and removes X-Powered-By.
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Disable CSP for API server
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
});

/**
 * Reject non-application/json POST requests with 415 status.
 */
function requireJson(req, res, next) {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  next();
}

module.exports = { helmetMiddleware, requireJson };
