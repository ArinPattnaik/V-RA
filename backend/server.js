/**
 * VÉRA — Backend API Server
 * Express server that orchestrates scraping and ML analysis.
 */

const startTime = Date.now();
const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const { ProductScraper, RETAILER_CONFIGS } = require("./scraper");
const { helmetMiddleware, requireJson } = require("./middleware/security");
const { createCorsMiddleware } = require("./middleware/cors");
const { requestLogger, logInfo, logError } = require("./middleware/logger");
const { globalErrorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { validateUrl, validateText, validateDemoId } = require("./middleware/validation");

const app = express();
const PORT = process.env.PORT || 3001;
let ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
if (process.env.ML_SERVICE_URL && !process.env.ML_SERVICE_URL.startsWith("http")) {
  ML_SERVICE_URL = `http://${process.env.ML_SERVICE_URL}`;
}

// ── Middleware (order matters) ──

// 1. Security headers
app.use(helmetMiddleware);

// 2. CORS
app.use(createCorsMiddleware());

// 3. Body parser
app.use(express.json({ limit: "1mb" }));

// 4. Content-Type check for POST
app.use(requireJson);

// 5. Request logger
app.use(requestLogger);

// 6. Rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute." },
});
app.use("/api/", limiter);

// ── Scraper Instance ──
const scraper = new ProductScraper();

// ── Helper: Validate ML response shape ──

/**
 * Check that an ML service response has the expected shape.
 * Returns true only when response is an object with success === true and data is an object.
 * @param {any} body
 * @returns {boolean}
 */
function isValidMlResponse(body) {
  return (
    body != null &&
    typeof body === "object" &&
    body.success === true &&
    body.data != null &&
    typeof body.data === "object" &&
    !Array.isArray(body.data)
  );
}

/**
 * Classify an axios error from the ML service and send the appropriate response.
 * @param {Error} error - The caught error
 * @param {import('express').Response} res
 * @param {string} context - Log context label
 */
function handleMlError(error, res, context) {
  logError("ML", `${context}: ${error.message}`);

  if (error.code === "ECONNREFUSED") {
    return res.status(503).json({
      error: "ML service is unavailable. Please try again later.",
    });
  }

  if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
    return res.status(503).json({
      error: "ML service timed out. Please try again later.",
    });
  }

  if (error.response) {
    const status = error.response.status;
    return res.status(503).json({
      error: "ML service encountered an error",
      details: `ML service returned status ${status}`,
    });
  }

  return res.status(500).json({
    error: "Analysis failed. Please try again.",
    details: error.message,
  });
}

// ─────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/analyze
 * Main endpoint — accepts a URL or raw text, returns greenwashing analysis.
 */
app.post("/api/analyze", async (req, res) => {
  const { text, brand } = req.body;
  let url = req.body.url;

  // Validate URL if provided
  if (url && typeof url === "string") {
    const urlResult = validateUrl(url);
    if (!urlResult.valid) {
      return res.status(400).json({ error: urlResult.error });
    }
    url = urlResult.sanitized;
  }

  // Validate text if provided
  if (text && typeof text === "string") {
    const textResult = validateText(text);
    if (!textResult.valid) {
      return res.status(400).json({ error: textResult.error });
    }
  }

  if (!url && !text) {
    return res.status(400).json({
      error: "Please provide either a product URL or paste the product description text.",
    });
  }

  try {
    let analysisText = text || "";
    let materials = null;
    let detectedBrand = brand || "";
    let productInfo = {};

    // ── Step 1: Scrape if URL provided ──
    if (url && !text) {
      logInfo("SCRAPE", `Scraping: ${url}`);
      const scrapeResult = await scraper.scrape(url);

      if (!scrapeResult.success) {
        return res.status(422).json({
          error: "Failed to scrape this product page.",
          details: scrapeResult.error,
          suggestion: scrapeResult.suggestion,
          fallback: "paste_text",
        });
      }

      const data = scrapeResult.data;
      analysisText = data.full_text || data.description || "";
      materials = Object.keys(data.materials || {}).length > 0 ? data.materials : null;
      detectedBrand = data.brand || detectedBrand;

      productInfo = {
        name: data.name,
        price: data.price,
        retailer: data.retailer,
        url: data.url,
        scraped_at: data.scraped_at,
      };

      if (!analysisText || analysisText.length < 10) {
        return res.status(422).json({
          error: "Could not extract enough text from this page.",
          suggestion: "Please paste the product description manually.",
          fallback: "paste_text",
        });
      }
    }

    // ── Step 2: Send to ML service ──
    logInfo("ML", `Sending ${analysisText.length} chars to ML service`);

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, {
      text: analysisText,
      materials: materials,
      brand: detectedBrand,
    }, {
      timeout: 90000,
    });

    // Validate ML response shape
    if (!isValidMlResponse(mlResponse.data)) {
      return res.status(502).json({
        error: "Invalid response from ML service",
      });
    }

    // ── Step 3: Return combined result ──
    const method = url ? "scraped" : "manual";
    if (method === "manual") {
      productInfo = {};
    }

    return res.json({
      success: true,
      product: productInfo,
      analysis: mlResponse.data.data,
      input: {
        text_length: analysisText.length,
        method,
      },
    });
  } catch (error) {
    return handleMlError(error, res, "Analysis failed");
  }
});

/**
 * POST /api/analyze/demo
 * Analyze a pre-loaded demo product.
 */
app.post("/api/analyze/demo", async (req, res) => {
  const { product_id } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: "product_id is required" });
  }

  // Validate demo ID
  const demoResult = validateDemoId(product_id);
  if (!demoResult.valid) {
    return res.status(400).json({ error: demoResult.error });
  }

  try {
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze/demo`, {
      product_id,
    }, {
      timeout: 90000,
    });

    // Validate ML response shape
    if (!isValidMlResponse(mlResponse.data)) {
      return res.status(502).json({
        error: "Invalid response from ML service",
      });
    }

    return res.json({
      success: true,
      product: mlResponse.data.product || {},
      analysis: mlResponse.data.data,
      input: {
        method: "demo",
        text_length: 0,
      },
    });
  } catch (error) {
    return handleMlError(error, res, "Demo analysis failed");
  }
});

/**
 * GET /api/demo/products
 * List available demo products.
 */
app.get("/api/demo/products", async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/demo/products`);
    return res.json(mlResponse.data);
  } catch (error) {
    logError("ML", `Could not fetch demo products: ${error.message}`);
    return res.status(500).json({ error: "Could not fetch demo products" });
  }
});

/**
 * GET /api/brands
 * Get brand carbon footprint data.
 */
app.get("/api/brands", async (req, res) => {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/brands`);
    return res.json(mlResponse.data);
  } catch (error) {
    logError("ML", `Could not fetch brand data: ${error.message}`);
    return res.status(500).json({ error: "Could not fetch brand data" });
  }
});

/**
 * GET /api/retailers
 * Get supported retailers for the scraper.
 */
app.get("/api/retailers", (req, res) => {
  const retailers = Object.entries(RETAILER_CONFIGS).map(([domain, config]) => ({
    domain,
    name: config.name,
  }));
  return res.json({ retailers });
});

/**
 * GET /api/health
 */
app.get("/api/health", async (req, res) => {
  let mlHealthy = false;
  try {
    const mlRes = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    mlHealthy = mlRes.data.status === "healthy";
  } catch {
    // ML service is disconnected — that's fine
  }

  return res.json({
    status: "healthy",
    service: "vera-backend",
    ml_service: mlHealthy ? "connected" : "disconnected",
    version: "1.0.0",
    uptime: Math.floor(process.uptime()),
  });
});

// ── 404 and Error Handlers (must be last) ──
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Start Server ──
const server = app.listen(PORT, () => {
  logInfo("SERVER", `VÉRA Backend running on port ${PORT}`);
  logInfo("SERVER", `ML Service: ${ML_SERVICE_URL}`);
  logInfo("SERVER", `Health: http://localhost:${PORT}/api/health`);
  logInfo("SERVER", `Started in ${Date.now() - startTime}ms`);
});

server.timeout = 120000;

// ── Graceful Shutdown ──
process.on("SIGTERM", () => {
  logInfo("SERVER", "SIGTERM received");
  server.close();
  setTimeout(() => process.exit(0), 10000);
});

// Export for testing
module.exports = { app, server, isValidMlResponse };
