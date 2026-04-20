/**
 * Property-based tests for structured logging.
 * Feature: backend-improvements, Property 8: Log category tag format
 *
 * **Validates: Requirements 7.4**
 */

const fc = require('fast-check');
const { logInfo, logError } = require('../middleware/logger');

describe('Property 8: Log category tag format', () => {
  it('logInfo output should start with [CATEGORY] tag', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z]{1,20}$/),
        fc.string({ minLength: 1, maxLength: 200 }),
        (category, message) => {
          const spy = jest.spyOn(console, 'log').mockImplementation();

          logInfo(category, message);

          expect(spy).toHaveBeenCalledTimes(1);
          const output = spy.mock.calls[0][0];
          expect(output).toMatch(new RegExp(`^\\[${category.toUpperCase()}\\]`));

          spy.mockRestore();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('logError output should start with [CATEGORY] tag', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[A-Z]{1,20}$/),
        fc.string({ minLength: 1, maxLength: 200 }),
        (category, message) => {
          const spy = jest.spyOn(console, 'error').mockImplementation();

          logError(category, message);

          expect(spy).toHaveBeenCalledTimes(1);
          const output = spy.mock.calls[0][0];
          expect(output).toMatch(new RegExp(`^\\[${category.toUpperCase()}\\]`));

          spy.mockRestore();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('log output should include an ISO timestamp', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('HTTP', 'ML', 'SCRAPE', 'ERROR', 'SERVER'),
        fc.string({ minLength: 1, maxLength: 100 }),
        (category, message) => {
          const spy = jest.spyOn(console, 'log').mockImplementation();

          logInfo(category, message);

          const output = spy.mock.calls[0][0];
          // Should contain an ISO timestamp pattern
          expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

          spy.mockRestore();
        }
      ),
      { numRuns: 20 }
    );
  });
});
