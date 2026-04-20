/**
 * Property-based tests for security middleware.
 * Feature: backend-improvements, Property 10: Content-Type enforcement on POST
 *
 * **Validates: Requirements 11.4**
 */

const fc = require('fast-check');
const express = require('express');
const request = require('supertest');
const { requireJson } = require('../middleware/security');

function createTestApp() {
  const app = express();
  app.use(requireJson);
  app.post('/test', (req, res) => res.status(200).json({ ok: true }));
  app.get('/test', (req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe('Property 10: Content-Type enforcement on POST', () => {
  it('should reject POST requests with non-application/json Content-Type', async () => {
    const app = createTestApp();

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('text/plain', 'text/html', 'multipart/form-data', 'application/xml', 'application/x-www-form-urlencoded', 'image/png'),
        async (contentType) => {
          const res = await request(app)
            .post('/test')
            .set('Content-Type', contentType)
            .send('{}');

          // Should be rejected with 415
          expect(res.status).toBe(415);
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toContain('Content-Type');
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should allow POST requests with application/json Content-Type', async () => {
    const app = createTestApp();

    await fc.assert(
      fc.asyncProperty(
        fc.constant('application/json'),
        async (contentType) => {
          const res = await request(app)
            .post('/test')
            .set('Content-Type', contentType)
            .send('{}');

          expect(res.status).toBe(200);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should not affect GET requests regardless of Content-Type', async () => {
    const app = createTestApp();

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('text/plain', 'text/html', 'multipart/form-data', 'application/xml', 'image/png'),
        async (contentType) => {
          const res = await request(app)
            .get('/test')
            .set('Content-Type', contentType);

          expect(res.status).toBe(200);
        }
      ),
      { numRuns: 10 }
    );
  });
});
