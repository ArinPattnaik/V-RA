/**
 * VÉRA — Backend API Server
 * Express server that orchestrates scraping and ML analysis.
 */

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const { ProductScraper, RETAILER_CONFIGS } = require("./scraper");

const app = express();
const PORT = process.env.PORT || 3001;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate limiting: 20 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many requests. Please wait a minute." },
});
app.use("/api/", limiter);

// ── Scraper Instance ──
const scraper = new ProductScraper();

// ─────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/analyze
 * Main endpoint — accepts a URL or raw text, returns greenwashing analysis.
 */
app.post("/api/analyze", async (req, res) => {
  const { url, text, brand } = req.body;

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
      console.log(`[SCRAPE] Scraping: ${url}`);
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
    console.log(`[ANALYZE] Sending ${analysisText.length} chars to ML service`);

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, {
      text: analysisText,
      materials: materials,
      brand: detectedBrand,
    }, {
      timeout: 30000,
    });

    if (!mlResponse.data.success) {
      throw new Error("ML service returned an error");
    }

    // ── Step 3: Return combined result ──
    return res.json({
      success: true,
      product: productInfo,
      analysis: mlResponse.data.data,
      input: {
        text_length: analysisText.length,
        method: url ? "scraped" : "manual",
      },
    });
  } catch (error) {
    console.error(`[ERROR] Analysis failed:`, error.message);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "ML service is unavailable. Please try again later.",
      });
    }

    return res.status(500).json({
      error: "Analysis failed. Please try again.",
      details: error.message,
    });
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

  try {
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze/demo`, {
      product_id,
    }, {
      timeout: 30000,
    });

    return res.json({
      success: true,
      product: mlResponse.data.product,
      analysis: mlResponse.data.data,
      input: { method: "demo" },
    });
  } catch (error) {
    console.error(`[ERROR] Demo analysis failed:`, error.message);
    return res.status(500).json({
      error: "Demo analysis failed.",
      details: error.message,
    });
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
  } catch {}

  return res.json({
    status: "healthy",
    service: "vera-backend",
    ml_service: mlHealthy ? "connected" : "disconnected",
    version: "1.0.0",
  });
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`\n🌿 VÉRA Backend running on port ${PORT}`);
  console.log(`   ML Service: ${ML_SERVICE_URL}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
