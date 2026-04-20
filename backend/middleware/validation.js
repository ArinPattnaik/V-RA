/**
 * Input validation module for VÉRA backend.
 * Pure functions for validating and sanitizing request data.
 */

/**
 * Private IP ranges for SSRF protection.
 */
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^0\./,
  /^localhost$/i,
];

/**
 * Validate a URL string.
 * - Trims and prepends https:// if no scheme
 * - Checks well-formed HTTP(S)
 * - Rejects private/internal IP ranges (SSRF protection)
 *
 * @param {string} url
 * @returns {{ valid: boolean, sanitized?: string, error?: string }}
 */
function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let sanitized = url.trim();

  if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
    sanitized = `https://${sanitized}`;
  }

  let parsed;
  try {
    parsed = new URL(sanitized);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
  }

  const hostname = parsed.hostname;

  // Check for private/internal IPs (SSRF protection)
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'URLs pointing to private/internal addresses are not allowed' };
    }
  }

  return { valid: true, sanitized };
}

/**
 * Validate and sanitize text input.
 * - Non-empty string, 10–50,000 chars
 * - Strips HTML tags
 *
 * @param {string} text
 * @returns {{ valid: boolean, sanitized?: string, error?: string }}
 */
function validateText(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text is required' };
  }

  // Strip HTML tags
  const sanitized = text.replace(/<[^>]*>/g, '');

  if (sanitized.length < 10) {
    return { valid: false, error: 'Text must be at least 10 characters long' };
  }

  if (sanitized.length > 50000) {
    return { valid: false, error: 'Text must not exceed 50,000 characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validate a demo product ID.
 * Must match /^demo-\d+$/
 *
 * @param {string} id
 * @returns {{ valid: boolean, error?: string }}
 */
function validateDemoId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'Demo ID is required' };
  }

  if (!/^demo-\d+$/.test(id)) {
    return { valid: false, error: 'Invalid demo ID format. Expected format: demo-N' };
  }

  return { valid: true };
}

module.exports = { validateUrl, validateText, validateDemoId };
