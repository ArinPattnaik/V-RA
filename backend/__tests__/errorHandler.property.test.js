/**
 * Property-based tests for error handler.
 * Feature: backend-improvements, Property 5: Error response shape invariant
 *
 * **Validates: Requirements 3.1, 3.5**
 */

const fc = require('fast-check');
const express = require('express');
const request = require('supertest');
const { globalErrorHandler } = require('../middleware/errorHandler');

function createTestApp(errorToThrow) {
  const app = express();
  app.get('/error', (req, res, next) => {
    next(errorToThrow);
  });
  app.use(globalErrorHandler);
  return app;
}

describe('Property 5: Error response shape invariant', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should always return an error field and never expose stack traces in production', async () => {
    process.env.NODE_ENV = 'production';

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const err = new Error(errorMessage);
          // Ensure the error has a stack trace
          Error.captureStackTrace(err);

          const app = createTestApp(err);
          const spy = jest.spyOn(console, 'error').mockImplementation();

          const res = await request(app).get('/error');

          // Must always have an error field
          expect(res.body).toHaveProperty('error');
          expect(typeof res.body.error).toBe('string');
          expect(res.body.error.length).toBeGreaterThan(0);

          // Must never contain stack traces in production
          const responseStr = JSON.stringify(res.body);
          expect(responseStr).not.toMatch(/at\s+\S+\s+\(/); // stack trace pattern
          expect(responseStr).not.toContain('.js:');

          // Should not have details in production
          expect(res.body).not.toHaveProperty('details');

          spy.mockRestore();
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always return status 500 for unclassified errors', async () => {
    process.env.NODE_ENV = 'production';

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (errorMessage) => {
          const err = new Error(errorMessage);
          const app = createTestApp(err);
          const spy = jest.spyOn(console, 'error').mockImplementation();

          const res = await request(app).get('/error');

          expect(res.status).toBe(500);
          expect(res.body).toHaveProperty('error');

          spy.mockRestore();
        }
      ),
      { numRuns: 20 }
    );
  });
});
