/**
 * CORS middleware for VÉRA backend.
 * Configures origin whitelist with env var override support.
 */

const cors = require('cors');

/**
 * Build the list of allowed origins.
 * Includes production domain, Vercel preview regex, and localhost dev origins.
 * Extends with ALLOWED_ORIGINS env var (comma-separated) if set.
 */
function buildOriginList() {
  const origins = [
    'https://vera-scanner.vercel.app',
    /\.vercel\.app$/,
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  if (process.env.ALLOWED_ORIGINS) {
    const extra = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
    origins.push(...extra);
  }

  return origins;
}

/**
 * Check if an origin matches the whitelist.
 * Supports both string equality and regex matching.
 */
function isOriginAllowed(origin, allowedOrigins) {
  for (const allowed of allowedOrigins) {
    if (allowed instanceof RegExp) {
      if (allowed.test(origin)) return true;
    } else if (allowed === origin) {
      return true;
    }
  }
  return false;
}

/**
 * Create configured CORS middleware.
 */
function createCorsMiddleware() {
  const allowedOrigins = buildOriginList();

  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g., server-to-server, curl)
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
}

module.exports = { createCorsMiddleware, buildOriginList, isOriginAllowed };
