/**
 * Unit tests for all middleware modules.
 * Covers: security, CORS, validation, logger, error handler.
 */

const express = require('express');
const request = require('supertest');

// ── Security Middleware ──────────────────────────────────────────────────────

const { helmetMiddleware, requireJson } = require('../middleware/security');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(helmetMiddleware);
    app.use(express.json({ limit: '1mb' }));
    app.use(requireJson);
    app.get('/test', (req, res) => res.json({ ok: true }));
    app.post('/test', (req, res) => res.json({ ok: true }));
  });

  describe('Helmet headers', () => {
    it('should set X-Content-Type-Options to nosniff', async () => {
      const res = await request(app).get('/test');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-Frame-Options to DENY', async () => {
      const res = await request(app).get('/test');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });

    it('should set Strict-Transport-Security', async () => {
      const res = await request(app).get('/test');
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['strict-transport-security']).toContain('max-age=');
    });

    it('should not expose X-Powered-By', async () => {
      const res = await request(app).get('/test');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Body size limit', () => {
    it('should reject bodies larger than 1MB', async () => {
      const largeBody = JSON.stringify({ data: 'x'.repeat(1024 * 1024 + 1) });
      const res = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send(largeBody);

      expect(res.status).toBe(413);
    });
  });

  describe('Content-Type enforcement', () => {
    it('should reject POST with text/plain Content-Type', async () => {
      const res = await request(app)
        .post('/test')
        .set('Content-Type', 'text/plain')
        .send('hello');

      expect(res.status).toBe(415);
      expect(res.body.error).toContain('Content-Type');
    });

    it('should allow POST with application/json Content-Type', async () => {
      const res = await request(app)
        .post('/test')
        .set('Content-Type', 'application/json')
        .send('{}');

      expect(res.status).toBe(200);
    });

    it('should allow GET requests regardless of Content-Type', async () => {
      const res = await request(app)
        .get('/test')
        .set('Content-Type', 'text/plain');

      expect(res.status).toBe(200);
    });
  });
});

// ── CORS Middleware ──────────────────────────────────────────────────────────

const { createCorsMiddleware, buildOriginList, isOriginAllowed } = require('../middleware/cors');

describe('CORS Middleware', () => {
  describe('Origin whitelist', () => {
    it('should allow the production domain', async () => {
      const app = express();
      app.use(createCorsMiddleware());
      app.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Origin', 'https://vera.arinpattnaik.me');

      expect(res.headers['access-control-allow-origin']).toBe('https://vera.arinpattnaik.me');
    });

    it('should allow the Vercel production domain', async () => {
      const app = express();
      app.use(createCorsMiddleware());
      app.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Origin', 'https://vera-scanner.vercel.app');

      expect(res.headers['access-control-allow-origin']).toBe('https://vera-scanner.vercel.app');
    });

    it('should allow Vercel preview deployments', async () => {
      const app = express();
      app.use(createCorsMiddleware());
      app.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Origin', 'https://my-branch-abc123.vercel.app');

      expect(res.headers['access-control-allow-origin']).toBe('https://my-branch-abc123.vercel.app');
    });

    it('should allow localhost:3000', async () => {
      const app = express();
      app.use(createCorsMiddleware());
      app.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should allow localhost:3001', async () => {
      const app = express();
      app.use(createCorsMiddleware());
      app.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3001');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3001');
    });

    it('should block unauthorized origins', async () => {
      const app = express();
      app.use(createCorsMiddleware());
      app.use((err, req, res, next) => {
        res.status(403).json({ error: err.message });
      });
      app.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app)
        .get('/test')
        .set('Origin', 'https://evil-site.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should include Content-Type and Authorization in allowed headers', async () => {
      const app = express();
      app.use(createCorsMiddleware());
      app.options('/test', (req, res) => res.sendStatus(204));
      app.get('/test', (req, res) => res.json({ ok: true }));

      const res = await request(app)
        .options('/test')
        .set('Origin', 'https://vera-scanner.vercel.app')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(res.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  describe('ALLOWED_ORIGINS env var', () => {
    const originalEnv = process.env.ALLOWED_ORIGINS;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.ALLOWED_ORIGINS;
      } else {
        process.env.ALLOWED_ORIGINS = originalEnv;
      }
    });

    it('should extend the whitelist with env var origins', () => {
      process.env.ALLOWED_ORIGINS = 'https://custom-domain.com,https://another.com';
      const origins = buildOriginList();

      expect(isOriginAllowed('https://custom-domain.com', origins)).toBe(true);
      expect(isOriginAllowed('https://another.com', origins)).toBe(true);
    });

    it('should still include default origins when env var is set', () => {
      process.env.ALLOWED_ORIGINS = 'https://custom-domain.com';
      const origins = buildOriginList();

      expect(isOriginAllowed('https://vera-scanner.vercel.app', origins)).toBe(true);
      expect(isOriginAllowed('http://localhost:3000', origins)).toBe(true);
    });
  });
});

// ── Input Validation ────────────────────────────────────────────────────────

const { validateUrl, validateText, validateDemoId } = require('../middleware/validation');

describe('Input Validation', () => {
  describe('validateUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com/product');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://example.com/product');
    });

    it('should accept valid HTTP URLs', () => {
      const result = validateUrl('http://example.com/product');
      expect(result.valid).toBe(true);
    });

    it('should prepend https:// when scheme is missing', () => {
      const result = validateUrl('example.com/product');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://example.com/product');
    });

    it('should trim whitespace', () => {
      const result = validateUrl('  https://example.com  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://example.com');
    });

    it('should reject malformed URLs', () => {
      const result = validateUrl('not a url at all !!!');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject empty string', () => {
      const result = validateUrl('');
      expect(result.valid).toBe(false);
    });

    it('should reject null', () => {
      const result = validateUrl(null);
      expect(result.valid).toBe(false);
    });

    it('should reject 127.x.x.x (loopback)', () => {
      const result = validateUrl('https://127.0.0.1/admin');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('private');
    });

    it('should reject 10.x.x.x (private)', () => {
      const result = validateUrl('https://10.0.0.1/internal');
      expect(result.valid).toBe(false);
    });

    it('should reject 192.168.x.x (private)', () => {
      const result = validateUrl('https://192.168.1.1/router');
      expect(result.valid).toBe(false);
    });

    it('should reject 172.16-31.x.x (private)', () => {
      const result = validateUrl('https://172.16.0.1/internal');
      expect(result.valid).toBe(false);
    });

    it('should reject localhost', () => {
      const result = validateUrl('https://localhost/admin');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateText', () => {
    it('should accept valid text within bounds', () => {
      const result = validateText('This is a valid product description text.');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('This is a valid product description text.');
    });

    it('should reject empty string', () => {
      const result = validateText('');
      expect(result.valid).toBe(false);
    });

    it('should reject null', () => {
      const result = validateText(null);
      expect(result.valid).toBe(false);
    });

    it('should reject text with 9 chars (below minimum)', () => {
      const result = validateText('123456789');
      expect(result.valid).toBe(false);
    });

    it('should accept text with exactly 10 chars', () => {
      const result = validateText('1234567890');
      expect(result.valid).toBe(true);
    });

    it('should accept text with exactly 50000 chars', () => {
      const result = validateText('a'.repeat(50000));
      expect(result.valid).toBe(true);
    });

    it('should reject text with 50001 chars', () => {
      const result = validateText('a'.repeat(50001));
      expect(result.valid).toBe(false);
    });

    it('should strip HTML tags', () => {
      const result = validateText('Hello <b>world</b> this is a test text');
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('<b>');
      expect(result.sanitized).not.toContain('</b>');
      expect(result.sanitized).toContain('Hello world this is a test text');
    });

    it('should strip script tags', () => {
      const result = validateText('Normal text <script>alert("xss")</script> more text here');
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).not.toContain('</script>');
    });

    it('should reject text that becomes too short after HTML stripping', () => {
      const result = validateText('<b><i><u></u></i></b>hi');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDemoId', () => {
    it('should accept demo-1', () => {
      expect(validateDemoId('demo-1').valid).toBe(true);
    });

    it('should accept demo-123', () => {
      expect(validateDemoId('demo-123').valid).toBe(true);
    });

    it('should reject empty string', () => {
      expect(validateDemoId('').valid).toBe(false);
    });

    it('should reject null', () => {
      expect(validateDemoId(null).valid).toBe(false);
    });

    it('should reject demo- (no number)', () => {
      expect(validateDemoId('demo-').valid).toBe(false);
    });

    it('should reject demo-abc (non-numeric)', () => {
      expect(validateDemoId('demo-abc').valid).toBe(false);
    });

    it('should reject product-1 (wrong prefix)', () => {
      expect(validateDemoId('product-1').valid).toBe(false);
    });

    it('should reject Demo-1 (case sensitive)', () => {
      expect(validateDemoId('Demo-1').valid).toBe(false);
    });
  });
});

// ── Logger ──────────────────────────────────────────────────────────────────

const { requestLogger, logInfo, logError } = require('../middleware/logger');

describe('Logger', () => {
  describe('logInfo', () => {
    it('should log with [CATEGORY] prefix', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      logInfo('HTTP', 'GET /api/health');

      expect(spy).toHaveBeenCalledTimes(1);
      const output = spy.mock.calls[0][0];
      expect(output).toMatch(/^\[HTTP\]/);
      expect(output).toContain('GET /api/health');

      spy.mockRestore();
    });

    it('should include ISO timestamp', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      logInfo('ML', 'Sending data');

      const output = spy.mock.calls[0][0];
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      spy.mockRestore();
    });
  });

  describe('logError', () => {
    it('should log with [CATEGORY] prefix to stderr', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      logError('SCRAPE', 'Strategy 1 failed');

      expect(spy).toHaveBeenCalledTimes(1);
      const output = spy.mock.calls[0][0];
      expect(output).toMatch(/^\[SCRAPE\]/);
      expect(output).toContain('Strategy 1 failed');

      spy.mockRestore();
    });

    it('should include ISO timestamp', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      logError('ERROR', 'Something broke');

      const output = spy.mock.calls[0][0];
      expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      spy.mockRestore();
    });
  });

  describe('requestLogger middleware', () => {
    it('should log request and response', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();

      const app = express();
      app.use(requestLogger);
      app.get('/api/health', (req, res) => res.json({ ok: true }));

      await request(app).get('/api/health');

      // Should have logged at least 2 messages (request + response)
      expect(spy.mock.calls.length).toBeGreaterThanOrEqual(2);

      const requestLog = spy.mock.calls[0][0];
      expect(requestLog).toContain('[HTTP]');
      expect(requestLog).toContain('GET');
      expect(requestLog).toContain('/api/health');

      const responseLog = spy.mock.calls[1][0];
      expect(responseLog).toContain('[HTTP]');
      expect(responseLog).toContain('200');
      expect(responseLog).toMatch(/\d+ms/);

      spy.mockRestore();
    });
  });

  describe('No sensitive data', () => {
    it('should not log API keys or full bodies', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();

      logInfo('HTTP', 'POST /api/analyze');

      const output = spy.mock.calls[0][0];
      expect(output).not.toContain('api_key');
      expect(output).not.toContain('SCRAPER_API_KEY');

      spy.mockRestore();
    });
  });
});

// ── Error Handler ───────────────────────────────────────────────────────────

const { globalErrorHandler, notFoundHandler } = require('../middleware/errorHandler');

describe('Error Handler', () => {
  describe('globalErrorHandler', () => {
    it('should return 500 with error field', async () => {
      const app = express();
      app.get('/error', (req, res, next) => {
        next(new Error('Something went wrong'));
      });
      app.use(globalErrorHandler);

      const spy = jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).get('/error');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toBe('Something went wrong');

      spy.mockRestore();
    });

    it('should not expose stack traces in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const app = express();
      app.get('/error', (req, res, next) => {
        next(new Error('Sensitive error'));
      });
      app.use(globalErrorHandler);

      const spy = jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).get('/error');

      expect(res.body).not.toHaveProperty('details');
      const responseStr = JSON.stringify(res.body);
      expect(responseStr).not.toContain('.js:');

      process.env.NODE_ENV = originalEnv;
      spy.mockRestore();
    });

    it('should include details in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const app = express();
      app.get('/error', (req, res, next) => {
        next(new Error('Dev error'));
      });
      app.use(globalErrorHandler);

      const spy = jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).get('/error');

      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');

      process.env.NODE_ENV = originalEnv;
      spy.mockRestore();
    });

    it('should use custom statusCode if set on error', async () => {
      const app = express();
      app.get('/error', (req, res, next) => {
        const err = new Error('Bad request');
        err.statusCode = 400;
        next(err);
      });
      app.use(globalErrorHandler);

      const spy = jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).get('/error');

      expect(res.status).toBe(400);

      spy.mockRestore();
    });
  });

  describe('notFoundHandler', () => {
    it('should return 404 with error message', async () => {
      const app = express();
      app.use(notFoundHandler);

      const res = await request(app).get('/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Not found');
      expect(res.body.error).toContain('/nonexistent');
    });

    it('should include the HTTP method in the error', async () => {
      const app = express();
      app.use(notFoundHandler);

      const res = await request(app).post('/missing');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('POST');
    });
  });
});
