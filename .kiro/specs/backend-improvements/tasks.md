# Tasks: Backend Improvements

## Task 1: Project Setup and Dependencies

- [x] 1.1 Install `helmet` package (`npm install helmet@^8.0.0`) in the backend
- [x] 1.2 Install dev dependencies for testing: `jest`, `supertest`, `fast-check` (`npm install --save-dev jest supertest fast-check`)
- [x] 1.3 Add `"test": "jest"` script to `backend/package.json`
- [x] 1.4 Create `backend/jest.config.js` with basic configuration (testMatch for `__tests__/**/*.test.js`)
- [x] 1.5 Create the `backend/middleware/` directory structure

## Task 2: Security Middleware

- [x] 2.1 Create `backend/middleware/security.js` — export `helmetMiddleware` (configured helmet instance) and `requireJson` middleware that rejects non-`application/json` POST requests with 415 status
- [x] 2.2 Write property test `backend/__tests__/security.property.test.js` — Property 10: Content-Type enforcement on POST (fast-check, 100 iterations, random Content-Type strings)
- [x] 2.3 Write unit tests in `backend/__tests__/middleware.test.js` for security middleware — verify helmet headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security), no X-Powered-By, 1MB body limit rejection

## Task 3: CORS Middleware

- [x] 3.1 Create `backend/middleware/cors.js` — export configured CORS middleware with origin whitelist (production domain, `*.vercel.app` regex, localhost:3000, localhost:3001) and support for `ALLOWED_ORIGINS` env var (comma-separated), allow `Content-Type` and `Authorization` headers
- [x] 3.2 Write property test `backend/__tests__/cors.property.test.js` — Property 1: CORS origin matching (fast-check, 100 iterations, random origin strings accepted iff matching whitelist)
- [x] 3.3 Write unit tests for CORS in `backend/__tests__/middleware.test.js` — verify env var override, specific allowed/blocked origins, CORS headers in response

## Task 4: Input Validation Module

- [x] 4.1 Create `backend/middleware/validation.js` — export `validateUrl(url)`, `validateText(text)`, `validateDemoId(id)` as pure functions returning `{ valid, sanitized?, error? }`
  - `validateUrl`: well-formed HTTP(S), reject private IPs (127.x, 10.x, 192.168.x, 172.16-31.x), trim and prepend https:// if missing
  - `validateText`: non-empty, 10–50,000 chars, strip HTML tags
  - `validateDemoId`: match `/^demo-\d+$/`
- [x] 4.2 Write property tests `backend/__tests__/validation.property.test.js`:
  - Property 2: URL validation with SSRF protection (random URLs, IPs)
  - Property 3: Text validation with HTML sanitization (random strings with HTML, varying lengths)
  - Property 4: Demo ID format validation (random strings)
- [x] 4.3 Write unit tests for validation edge cases in `backend/__tests__/middleware.test.js` — malformed URLs, empty strings, boundary lengths (9 chars, 10 chars, 50000 chars, 50001 chars), HTML injection strings

## Task 5: Structured Logging

- [x] 5.1 Create `backend/middleware/logger.js` — export `requestLogger` middleware (logs `[HTTP] METHOD /path` on request, `[HTTP] METHOD /path STATUS TIMEms` on response finish), `logInfo(category, message)`, `logError(category, message)` helper functions with timestamp
- [x] 5.2 Write property test `backend/__tests__/logger.property.test.js` — Property 8: Log category tag format (random category and message strings, verify output starts with `[CATEGORY]`)
- [x] 5.3 Write unit tests for logger in `backend/__tests__/middleware.test.js` — verify request log format, error log format, no sensitive data (API keys, full bodies) in output

## Task 6: Error Handler

- [x] 6.1 Create `backend/middleware/errorHandler.js` — export `globalErrorHandler(err, req, res, next)` that returns `{ error, details? }` with 500 status, never exposing stack traces; also export `notFoundHandler` for 404s
- [x] 6.2 Write property test `backend/__tests__/errorHandler.property.test.js` — Property 5: Error response shape invariant (random Error objects with stack traces, verify output always has `error` field, never has stack traces)
- [x] 6.3 Write unit tests for error handler in `backend/__tests__/middleware.test.js` — verify 500 response shape, no stack trace leakage, 404 handler response

## Task 7: Scraper Improvements

- [x] 7.1 Update `backend/scraper.js`:
  - Add try/catch around `new URL(url)` in `_getRetailerConfig` and `scrape` methods to handle malformed URLs gracefully
  - Update `_fetchPage` to catch HTTP 403/429 errors and let them fall through to next strategy instead of throwing
  - Ensure the existing 20-char minimum text check and timeout values are preserved
- [x] 7.2 Write property test `backend/__tests__/scraper.property.test.js` — Property 6: Scrape text minimum length gate (random text strings of varying lengths, verify success:true only when full_text >= 20 chars)
- [x] 7.3 Write unit tests `backend/__tests__/scraper.test.js` — malformed URL handling, 403/429 fallback to next strategy, all-strategies-fail structured result, Wayback Machine fallback chain (mocked)

## Task 8: ML Service Communication Resilience

- [x] 8.1 Update the `/api/analyze` route error handling in `backend/server.js`:
  - Classify ECONNREFUSED → 503 "ML service is unavailable"
  - Classify ETIMEDOUT/ECONNABORTED → 503 "ML service timed out"
  - Classify ML 4xx/5xx → 503 with ML status code in details
  - Validate ML response has `success: true` and `data` object → 502 if invalid
- [x] 8.2 Update the `/api/analyze/demo` route with the same ML error classification
- [x] 8.3 Write property test `backend/__tests__/mlValidation.property.test.js` — Property 7: ML response shape validation (random response objects, verify only `{ success: true, data: {...} }` is accepted)
- [x] 8.4 Write unit tests `backend/__tests__/routes.test.js` — ECONNREFUSED → 503, ETIMEDOUT → 503, ML 500 → 503 with details, invalid ML response → 502

## Task 9: Health Check Enhancement

- [x] 9.1 Update the `/api/health` route in `backend/server.js`:
  - Reduce ML ping timeout from 25s to 5s
  - Add `uptime` field (process.uptime() in seconds)
  - Ensure always returns 200 with `status: "healthy"`
- [x] 9.2 Write unit tests in `backend/__tests__/routes.test.js` — health response shape, ML connected/disconnected states, uptime field is a number, 5s timeout behavior

## Task 10: Rate Limiter Configuration

- [x] 10.1 Update rate limiter in `backend/server.js`:
  - Read `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` from env vars with defaults (60000ms, 20)
  - Enable standard rate limit headers (`standardHeaders: true`, `legacyHeaders: false`)
  - Ensure 429 response matches `{ error: "Too many requests. Please wait a minute." }`
- [x] 10.2 Write unit tests in `backend/__tests__/routes.test.js` — 429 response body, rate limit headers present, env var configuration

## Task 11: Analyze Endpoint Response Contract

- [x] 11.1 Update `/api/analyze` route to ensure consistent response shape:
  - URL method: `input.method = "scraped"`, product populated with scraped metadata
  - Text method: `input.method = "manual"`, product is empty object
  - Always include `input.text_length`
- [x] 11.2 Update `/api/analyze/demo` route to include `input.method = "demo"` and `input.text_length`
- [x] 11.3 Write property test `backend/__tests__/analyze.property.test.js` — Property 9: Analyze success response contract (random product/analysis data, verify response always has success, product, analysis, input with correct types)
- [x] 11.4 Write unit tests in `backend/__tests__/routes.test.js` — URL/text/demo response shapes, method field values

## Task 12: Graceful Shutdown and Server Timeout

- [x] 12.1 Update `backend/server.js` startup:
  - Set `server.timeout = 120000` (120s request timeout)
  - Record startup time and log it: `[SERVER] Started in Xms`
  - Add SIGTERM handler: log `[SERVER] SIGTERM received`, call `server.close()`, force exit after 10s
- [x] 12.2 Write unit tests in `backend/__tests__/routes.test.js` — verify server.timeout value, SIGTERM handler logs shutdown message

## Task 13: Docker and Deployment Optimization

- [x] 13.1 Update `backend/Dockerfile`:
  - Add `ENV NODE_ENV=production` before npm install
  - Ensure using `node:20-slim` base image (already present)
  - Ensure `npm install --production` (already present)
- [x] 13.2 Verify `render.yaml` has `/api/health` health check path (already configured — no changes needed, just verify)

## Task 14: Wire Up Middleware in server.js

- [x] 14.1 Refactor `backend/server.js` to import and use all new middleware in the correct order:
  1. `helmet` (security headers)
  2. CORS middleware (from `middleware/cors.js`)
  3. `express.json({ limit: '1mb' })` (body parser)
  4. `requireJson` (Content-Type check)
  5. `requestLogger` (from `middleware/logger.js`)
  6. Rate limiter (updated config)
  7. Route handlers (existing)
  8. `notFoundHandler` (from `middleware/errorHandler.js`)
  9. `globalErrorHandler` (from `middleware/errorHandler.js`)
- [x] 14.2 Update route handlers to use `validateUrl`, `validateText`, `validateDemoId` from `middleware/validation.js`
- [x] 14.3 Replace inline `console.log`/`console.error` calls with `logInfo`/`logError` from `middleware/logger.js`

## Task 15: Integration Tests

- [x] 15.1 Write integration tests `backend/__tests__/integration.test.js`:
  - Full POST /api/analyze flow with mocked scraper and ML service (URL input)
  - Full POST /api/analyze flow with text input
  - POST /api/analyze/demo flow
  - Health check with ML up/down
  - CORS preflight request
  - Rate limiting across multiple requests
  - Invalid Content-Type rejection
  - Input validation rejection (bad URL, short text, invalid demo ID)
