/**
 * Property-based tests for CORS middleware.
 * Feature: backend-improvements, Property 1: CORS origin matching
 *
 * **Validates: Requirements 1.1, 1.2**
 */

const fc = require('fast-check');
const { isOriginAllowed, buildOriginList } = require('../middleware/cors');

// The default whitelist (without env var overrides)
const DEFAULT_ORIGINS = [
  'https://vera-scanner.vercel.app',
  /\.vercel\.app$/,
  'http://localhost:3000',
  'http://localhost:3001',
];

/**
 * Check if an origin should be allowed based on the whitelist rules.
 * This is the reference implementation for property testing.
 */
function shouldBeAllowed(origin) {
  if (origin === 'https://vera-scanner.vercel.app') return true;
  if (/\.vercel\.app$/.test(origin)) return true;
  if (origin === 'http://localhost:3000') return true;
  if (origin === 'http://localhost:3001') return true;
  return false;
}

describe('Property 1: CORS origin matching', () => {
  it('should accept origins matching the whitelist and reject all others', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (origin) => {
          const result = isOriginAllowed(origin, DEFAULT_ORIGINS);
          const expected = shouldBeAllowed(origin);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always accept the production domain', () => {
    fc.assert(
      fc.property(
        fc.constant('https://vera-scanner.vercel.app'),
        (origin) => {
          expect(isOriginAllowed(origin, DEFAULT_ORIGINS)).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should always accept *.vercel.app preview deployments', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9-]{1,30}$/),
        (subdomain) => {
          const origin = `https://${subdomain}.vercel.app`;
          expect(isOriginAllowed(origin, DEFAULT_ORIGINS)).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject random origins that do not match the whitelist', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(
          (s) => !shouldBeAllowed(s)
        ),
        (origin) => {
          expect(isOriginAllowed(origin, DEFAULT_ORIGINS)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });
});
