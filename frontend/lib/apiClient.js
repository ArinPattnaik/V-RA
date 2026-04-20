/**
 * API Client for VÉRA backend services.
 * Provides fetch wrapper with retry logic, timeout, and error classification.
 *
 * @module apiClient
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Error Classification ──────────────────────────────────────────────────────

/**
 * Error types for classified API failures.
 * @readonly
 * @enum {string}
 */
export const ErrorType = {
  COLD_START: "COLD_START",
  NETWORK_ERROR: "NETWORK_ERROR",
  SCRAPE_FAILED: "SCRAPE_FAILED",
  ML_ERROR: "ML_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  UNKNOWN: "UNKNOWN",
};

/**
 * Custom error class that carries a classified error type.
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} type - One of ErrorType values
   */
  constructor(message, type) {
    super(message);
    this.name = "ApiError";
    /** @type {string} */
    this.type = type;
  }
}

// ── Retry Helpers ─────────────────────────────────────────────────────────────

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simple retry helper that retries an async function on failure.
 * @param {() => Promise<any>} fn - Async function to retry
 * @param {number} retries - Number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise<any>}
 */
async function retryWithDelay(fn, retries, delayMs) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < retries) {
        await sleep(delayMs);
      } else {
        throw err;
      }
    }
  }
}

// ── Analyze Product ───────────────────────────────────────────────────────────

/**
 * Whether a retry is currently in progress. The UI can read this to show
 * cold-start messaging.
 * @type {boolean}
 */
export let isRetrying = false;

/**
 * Analyze a product by URL, pasted text, or demo selection.
 *
 * Wraps fetch with a 90-second timeout, exponential backoff retry (2 retries,
 * 5 s then 10 s), and classified error handling.
 *
 * @param {{ url?: string, text?: string, demo?: string }} input
 * @returns {Promise<object>} Parsed JSON response data from the backend
 * @throws {ApiError} Classified error on failure
 */
export async function analyzeProduct(input) {
  const MAX_RETRIES = 2;
  const BACKOFF = [5000, 10000]; // delays after 1st and 2nd failure
  const TIMEOUT_MS = 90000;

  /** Build the endpoint URL and request body based on input type. */
  let endpoint;
  let body;

  if (input.demo) {
    endpoint = `${API_BASE}/api/analyze/demo`;
    body = { product_id: input.demo };
  } else if (input.url) {
    endpoint = `${API_BASE}/api/analyze`;
    body = { url: input.url };
  } else if (input.text) {
    endpoint = `${API_BASE}/api/analyze`;
    body = { text: input.text };
  } else {
    throw new ApiError(
      "Please provide a URL, text, or demo product.",
      ErrorType.UNKNOWN
    );
  }

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Track retry state for UI cold-start messaging
    isRetrying = attempt > 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // ── Non-retryable status codes ──
      if (response.status === 400 || response.status === 422 || response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || data.details || "Request failed";
        throw classifyResponseError(response.status, message, data);
      }

      // ── Retryable: 503 ──
      if (response.status === 503) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Service unavailable";
        lastError = { status: 503, message, data, attempt };
        if (attempt < MAX_RETRIES) {
          await sleep(BACKOFF[attempt]);
          continue;
        }
        // All retries exhausted
        throw classifyResponseError(503, message, data);
      }

      // ── Other non-OK responses (not retried) ──
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || data.details || `Server error (${response.status})`;
        throw new ApiError(message, ErrorType.UNKNOWN);
      }

      // ── Success ──
      const data = await response.json();
      if (!data.success) {
        throw new ApiError(
          data.error || "Analysis returned an unsuccessful result",
          ErrorType.UNKNOWN
        );
      }

      isRetrying = false;
      return data;
    } catch (err) {
      // Already classified — rethrow non-retryable ApiErrors
      if (err instanceof ApiError) {
        isRetrying = false;
        throw err;
      }

      // ── Retryable: network errors (TypeError) and timeouts (AbortError) ──
      const isNetworkError = err instanceof TypeError;
      const isTimeout = err.name === "AbortError";

      if ((isNetworkError || isTimeout) && attempt < MAX_RETRIES) {
        lastError = { error: err, attempt };
        await sleep(BACKOFF[attempt]);
        continue;
      }

      // All retries exhausted or non-retryable error
      isRetrying = false;

      if (isNetworkError || isTimeout) {
        // First attempt failure → COLD_START; after retries → NETWORK_ERROR
        const type = attempt === 0 ? ErrorType.COLD_START : ErrorType.NETWORK_ERROR;
        throw new ApiError(
          err.message || "Network request failed",
          type
        );
      }

      throw new ApiError(
        err.message || "An unexpected error occurred",
        ErrorType.UNKNOWN
      );
    }
  }

  // Should not reach here, but safety net
  isRetrying = false;
  throw new ApiError("Analysis failed after all retries", ErrorType.NETWORK_ERROR);
}

/**
 * Classify an HTTP error response into a typed ApiError.
 *
 * @param {number} status - HTTP status code
 * @param {string} message - Error message from the response
 * @param {object} data - Parsed response body
 * @returns {ApiError}
 */
function classifyResponseError(status, message, data) {
  const bodyText = JSON.stringify(data).toLowerCase();

  if (status === 429) {
    return new ApiError(message, ErrorType.RATE_LIMITED);
  }

  if (
    status === 422 ||
    bodyText.includes("scrape") ||
    bodyText.includes("fallback")
  ) {
    return new ApiError(message, ErrorType.SCRAPE_FAILED);
  }

  if (status === 503 || bodyText.includes("ml service")) {
    return new ApiError(message, ErrorType.ML_ERROR);
  }

  return new ApiError(message, ErrorType.UNKNOWN);
}

// ── Health Ping ───────────────────────────────────────────────────────────────

/**
 * Ping both backend and ML service health endpoints in parallel.
 *
 * Each ping retries up to 3 times with 5-second delays. Never throws —
 * always returns a result object.
 *
 * @returns {Promise<{ backend: boolean, ml: boolean }>}
 */
export async function pingHealth() {
  /**
   * Attempt a single health check with retries.
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async function checkHealth(url) {
    try {
      return await retryWithDelay(
        async () => {
          const res = await fetch(url, {
            method: "GET",
            cache: "no-store",
          });
          if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
          return true;
        },
        3,
        5000
      );
    } catch {
      return false;
    }
  }

  const [backend, ml] = await Promise.all([
    checkHealth(`${API_BASE}/api/health`),
    checkHealth("/api/keep-alive"),
  ]);

  return { backend, ml };
}
