# Requirements Document

## Introduction

The VÉRA backend is a Node.js/Express API server that orchestrates product page scraping and ML-based greenwashing analysis for the fashion industry. The frontend (Next.js 14 on Vercel) has been fully redesigned with new features including comparison mode, scan history, shareable results, and improved error handling. This spec focuses on making the backend robust, production-ready, and fully compatible with the redesigned frontend. Key concerns include: CORS configuration, input validation, error response consistency, scraper reliability, ML service communication resilience, health check accuracy, structured logging, and cold-start mitigation on Render free tier.

## Glossary

- **Backend**: The Node.js/Express API server (server.js) deployed on Render free tier that handles scraping, proxies ML requests, and serves API endpoints
- **ML_Service**: The Python/FastAPI microservice that performs NLP greenwashing analysis, deployed on Render free tier
- **Frontend**: The Next.js 14 application deployed on Vercel that consumes the Backend API
- **Scraper**: The ProductScraper class (scraper.js) that extracts product data from retailer websites using axios and cheerio
- **Rate_Limiter**: The express-rate-limit middleware that throttles API requests per IP
- **Health_Endpoint**: The GET /api/health route that reports Backend and ML_Service connectivity status
- **Analyze_Endpoint**: The POST /api/analyze route that accepts URL or text input and returns greenwashing analysis
- **Demo_Endpoint**: The POST /api/analyze/demo route that analyzes pre-loaded demo products
- **Error_Response**: A JSON object returned by the Backend on failure, containing `error`, optional `details`, optional `suggestion`, and optional `fallback` fields
- **Cold_Start**: The delay (up to 30+ seconds) when Render free-tier services resume after inactivity
- **CORS**: Cross-Origin Resource Sharing headers that control which origins can call the Backend API
- **Request_Timeout**: The maximum time the Backend waits for an external service (ML_Service or scraper target) before aborting

## Requirements

### Requirement 1: CORS Configuration

**User Story:** As a frontend developer, I want the backend to have explicit CORS configuration so that only the production frontend and local development origins can call the API, preventing unauthorized cross-origin access.

#### Acceptance Criteria

1. THE Backend SHALL configure CORS to allow requests from the Vercel production domain, Vercel preview deployment domains, and localhost origins used during development
2. THE Backend SHALL reject cross-origin requests from origins not in the allowed list by returning an appropriate CORS error
3. THE Backend SHALL allow the CORS origin list to be configured via an environment variable (e.g., `ALLOWED_ORIGINS`) so that new origins can be added without code changes
4. THE Backend SHALL include the `Content-Type` and `Authorization` headers in the CORS `Access-Control-Allow-Headers` response

### Requirement 2: Input Validation and Sanitization

**User Story:** As a developer, I want the backend to validate and sanitize all incoming request data so that malformed or malicious input is rejected before processing.

#### Acceptance Criteria

1. WHEN the Analyze_Endpoint receives a request with a `url` field, THE Backend SHALL validate that the URL is a well-formed HTTP or HTTPS URL and reject it with a 400 status and descriptive Error_Response if invalid
2. WHEN the Analyze_Endpoint receives a request with a `text` field, THE Backend SHALL validate that the text is a non-empty string with a minimum length of 10 characters and a maximum length of 50,000 characters, rejecting out-of-range input with a 400 status
3. WHEN the Demo_Endpoint receives a request, THE Backend SHALL validate that `product_id` is a non-empty string matching the expected demo ID format (e.g., `demo-N`) and reject invalid IDs with a 400 status
4. THE Backend SHALL strip or reject any HTML tags from the `text` field to prevent injection of markup into downstream services
5. WHEN the Analyze_Endpoint receives a request with a `url` field, THE Backend SHALL reject URLs pointing to private/internal IP ranges (127.x.x.x, 10.x.x.x, 192.168.x.x, 172.16-31.x.x) with a 400 status to prevent SSRF attacks

### Requirement 3: Consistent Error Response Format

**User Story:** As a frontend developer, I want all backend error responses to follow a consistent JSON structure so that the frontend can reliably parse and classify errors.

#### Acceptance Criteria

1. THE Backend SHALL return all error responses as JSON objects containing at minimum an `error` field with a human-readable message string
2. WHEN a scraping failure occurs, THE Backend SHALL return a 422 status with an Error_Response containing `error`, `details`, `suggestion`, and `fallback` fields so the Frontend can suggest the paste-text alternative
3. WHEN the ML_Service is unreachable or returns an error, THE Backend SHALL return a 503 status with an Error_Response containing `error` set to a message that includes "ML service" so the Frontend can classify it as an ML_ERROR
4. WHEN a rate limit is exceeded, THE Rate_Limiter SHALL return a 429 status with an Error_Response containing an `error` field
5. WHEN an unexpected server error occurs, THE Backend SHALL return a 500 status with an Error_Response containing `error` and `details` fields, without exposing internal stack traces or sensitive information

### Requirement 4: Scraper Reliability and Error Handling

**User Story:** As a user, I want the product scraper to handle failures gracefully and try multiple strategies so that I get results even when a retailer blocks direct access.

#### Acceptance Criteria

1. WHEN the Scraper attempts to fetch a product page and the HTTP request fails or times out, THE Scraper SHALL fall back to the Wayback Machine strategy before reporting failure
2. WHEN all scraping strategies fail, THE Scraper SHALL return a structured failure result containing `success: false`, an `error` message, and a `suggestion` directing the user to paste text manually
3. THE Scraper SHALL set a timeout of 25 seconds for direct HTTP fetches and 40 seconds for ScraperAPI-routed fetches to prevent requests from hanging indefinitely
4. WHEN the Scraper encounters an HTTP response with status 403 or 429, THE Scraper SHALL log the status and proceed to the next scraping strategy without throwing an unhandled exception
5. THE Scraper SHALL validate that the scraped `full_text` contains at least 20 characters before returning a successful result, falling through to the next strategy if insufficient text is extracted
6. THE Scraper SHALL handle malformed URLs by catching URL parsing errors and returning a descriptive failure result instead of crashing

### Requirement 5: ML Service Communication Resilience

**User Story:** As a user, I want the backend to handle ML service outages gracefully so that I receive a clear error message instead of a generic failure.

#### Acceptance Criteria

1. THE Backend SHALL set a timeout of 90 seconds for requests to the ML_Service to accommodate cold-start delays on Render free tier
2. WHEN the ML_Service returns an HTTP error status (4xx or 5xx), THE Backend SHALL return a 503 status with an Error_Response indicating the ML service encountered an error, including the ML_Service status code in the `details` field
3. WHEN the ML_Service connection is refused (ECONNREFUSED), THE Backend SHALL return a 503 status with an Error_Response containing "ML service is unavailable" in the `error` field
4. WHEN the ML_Service request times out (ETIMEDOUT or ECONNABORTED), THE Backend SHALL return a 503 status with an Error_Response indicating the ML service timed out
5. THE Backend SHALL validate that the ML_Service response contains a `success: true` field and a `data` object before forwarding it to the Frontend, returning a 502 status if the response structure is invalid

### Requirement 6: Health Check Endpoint

**User Story:** As a DevOps engineer, I want the health endpoint to accurately report the status of the backend and its dependency on the ML service so that monitoring tools can detect issues.

#### Acceptance Criteria

1. THE Health_Endpoint SHALL return a JSON response containing `status`, `service`, `ml_service`, and `version` fields
2. THE Health_Endpoint SHALL always return HTTP 200 with `status: "healthy"` for the Backend itself, even when the ML_Service is disconnected, so that Render's health check does not restart the container
3. WHEN the ML_Service health check succeeds, THE Health_Endpoint SHALL set `ml_service` to `"connected"`
4. WHEN the ML_Service health check fails or times out, THE Health_Endpoint SHALL set `ml_service` to `"disconnected"`
5. THE Health_Endpoint SHALL set a timeout of 5 seconds for the ML_Service health ping to ensure the health endpoint responds promptly
6. THE Health_Endpoint SHALL include an `uptime` field reporting the Backend process uptime in seconds

### Requirement 7: Structured Logging

**User Story:** As a developer, I want the backend to produce structured, consistent log output so that I can diagnose issues in production from Render's log viewer.

#### Acceptance Criteria

1. THE Backend SHALL log each incoming API request with the HTTP method, path, and a timestamp
2. THE Backend SHALL log the outcome of each analysis request including the input method (URL, text, or demo), text length sent to ML_Service, and response time in milliseconds
3. WHEN an error occurs during scraping or ML_Service communication, THE Backend SHALL log the error with a severity level (ERROR), the endpoint path, and the error message
4. THE Backend SHALL prefix all log messages with a category tag (e.g., `[HTTP]`, `[SCRAPE]`, `[ML]`, `[ERROR]`) for easy filtering in log viewers
5. THE Backend SHALL NOT log sensitive data such as full request bodies, user IP addresses, or ScraperAPI keys in production logs

### Requirement 8: Request Timeout and Graceful Shutdown

**User Story:** As a DevOps engineer, I want the backend to handle timeouts and shutdowns cleanly so that in-flight requests are not abruptly terminated.

#### Acceptance Criteria

1. THE Backend SHALL set a server-level request timeout of 120 seconds to prevent any single request from consuming resources indefinitely
2. WHEN the Backend process receives a SIGTERM signal, THE Backend SHALL stop accepting new connections and allow in-flight requests up to 10 seconds to complete before shutting down
3. WHEN the Backend process receives a SIGTERM signal, THE Backend SHALL log a shutdown message indicating the reason for termination

### Requirement 9: Rate Limiting Configuration

**User Story:** As a developer, I want rate limiting to be appropriately configured so that the backend is protected from abuse while allowing legitimate usage patterns.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL limit requests to 20 per minute per IP address on all `/api/` routes
2. WHEN a client exceeds the rate limit, THE Rate_Limiter SHALL return a 429 status with an Error_Response containing `error: "Too many requests. Please wait a minute."`
3. THE Rate_Limiter SHALL use a standard rate-limit header (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) in responses so the Frontend can display rate-limit information if needed
4. THE Rate_Limiter SHALL allow the rate limit window and max requests to be configured via environment variables (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`)

### Requirement 10: Analyze Endpoint Response Contract

**User Story:** As a frontend developer, I want the analyze endpoint to return a consistent response shape so that the frontend can reliably render results.

#### Acceptance Criteria

1. WHEN analysis succeeds, THE Analyze_Endpoint SHALL return a JSON response with `success: true`, a `product` object (containing `name`, `price`, `retailer`, `url`, `scraped_at` when available), an `analysis` object (the ML_Service result), and an `input` object (containing `text_length` and `method`)
2. WHEN analysis succeeds via the text input method, THE Analyze_Endpoint SHALL set `input.method` to `"manual"` and the `product` object SHALL be an empty object or contain only available fields
3. WHEN analysis succeeds via the URL input method, THE Analyze_Endpoint SHALL set `input.method` to `"scraped"` and populate the `product` object with scraped metadata
4. THE Demo_Endpoint SHALL return a JSON response with `success: true`, a `product` object (from the ML_Service demo data), an `analysis` object, and `input.method` set to `"demo"`

### Requirement 11: Security Hardening

**User Story:** As a developer, I want the backend to follow security best practices so that the application is protected against common web vulnerabilities.

#### Acceptance Criteria

1. THE Backend SHALL set security-related HTTP headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Strict-Transport-Security` using a security middleware (e.g., helmet)
2. THE Backend SHALL limit the JSON request body size to 1 MB to prevent payload-based denial-of-service attacks
3. THE Backend SHALL not expose the Express server version or framework identity in response headers (remove `X-Powered-By` header)
4. THE Backend SHALL validate the `Content-Type` header on POST requests and reject requests that are not `application/json` with a 415 status

### Requirement 12: Docker and Deployment Configuration

**User Story:** As a DevOps engineer, I want the Docker image to be optimized and the deployment configuration correct so that the backend starts quickly and runs efficiently on Render free tier.

#### Acceptance Criteria

1. THE Dockerfile SHALL use a multi-stage or slim Node.js base image and install only production dependencies to minimize image size
2. THE Dockerfile SHALL set the `NODE_ENV` environment variable to `production`
3. THE Backend SHALL read the `PORT` environment variable and bind to it, defaulting to 3001 if not set
4. THE render.yaml SHALL configure the Backend service with a health check path of `/api/health` so Render can verify the service is running

### Requirement 13: Cold-Start Mitigation

**User Story:** As a user, I want the backend to start up as quickly as possible so that cold-start delays are minimized.

#### Acceptance Criteria

1. THE Backend SHALL complete startup (begin accepting HTTP requests) within 10 seconds of process launch under normal conditions
2. THE Backend SHALL not perform any blocking initialization (e.g., pre-warming ML_Service connections) during startup that would delay the health check response
3. THE Health_Endpoint SHALL respond within 1 second when the ML_Service is unreachable, so that Render's health check does not time out during cold starts
4. THE Backend SHALL log the startup time (time from process start to listening on port) to aid in diagnosing cold-start performance
