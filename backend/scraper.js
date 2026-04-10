/**
 * VÉRA — Product Page Scraper
 * Lightweight HTTP-based scraper using axios + cheerio.
 * No headless browser needed — fast, reliable, works on free tier.
 */

const axios = require("axios");
const cheerio = require("cheerio");

// ─────────────────────────────────────────────────────────────
// RETAILER SELECTOR CONFIGURATIONS
// ─────────────────────────────────────────────────────────────

const RETAILER_CONFIGS = {
  "hm.com": {
    name: "H&M",
    brand: "h&m",
    selectors: {
      productName: "h1",
      description: ".product-description p, .pdp-description-text, [data-testid='product-description'], .product-detail p",
      materials: ".product-materials, .composition-text, [data-testid='product-composition'], .pdp-description__composition, .product-sustainability",
      price: ".product-item-price span, [data-testid='product-price'], .price-value",
    },
  },
  "zara.com": {
    name: "Zara",
    brand: "zara",
    selectors: {
      productName: "h1",
      description: ".product-detail-description p, .product-detail-info__description",
      materials: ".product-detail-composition, .structured-component-text-block-paragraph",
      price: ".price__amount-current, .money-amount__main",
    },
  },
  "asos.com": {
    name: "ASOS",
    brand: "asos",
    selectors: {
      productName: "h1",
      description: ".product-description, [data-testid='productDescription']",
      materials: ".product-description li, .about-me, [data-testid='productDescriptionContent']",
      price: ".current-price span, [data-testid='current-price']",
    },
  },
  "shein.com": {
    name: "SHEIN",
    brand: "shein",
    selectors: {
      productName: "h1",
      description: ".product-intro__description, .product-middle__description",
      materials: ".product-intro__description-table, .product-detail__material",
      price: ".product-intro__head-mainprice, .from.original",
    },
  },
  "nike.com": {
    name: "Nike",
    brand: "nike",
    selectors: {
      productName: "h1",
      description: ".description-preview, [data-testid='product-description']",
      materials: ".description-preview p, .product-info",
      price: "[data-testid='currentPrice-container'], .product-price",
    },
  },
  "adidas.com": {
    name: "Adidas",
    brand: "adidas",
    selectors: {
      productName: "h1",
      description: "[data-auto-id='product-description'], .product-description",
      materials: ".specifications li, .product-information-content",
      price: "[data-auto-id='gl-price-item'], .gl-price-item",
    },
  },
  "uniqlo.com": {
    name: "Uniqlo",
    brand: "uniqlo",
    selectors: {
      productName: "h1",
      description: ".fr-ec-product-description, .pdp-description",
      materials: ".fr-ec-product-materials, .product-material",
      price: ".fr-ec-price, .pdp-price",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// USER AGENTS — rotate to avoid blocks
// ─────────────────────────────────────────────────────────────

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
];

function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─────────────────────────────────────────────────────────────
// SCRAPER CLASS
// ─────────────────────────────────────────────────────────────

class ProductScraper {
  /**
   * Detect which retailer config to use from the URL.
   */
  _getRetailerConfig(url) {
    const hostname = new URL(url).hostname.replace("www.", "").replace("www2.", "");
    for (const [domain, config] of Object.entries(RETAILER_CONFIGS)) {
      if (hostname.includes(domain)) {
        return config;
      }
    }
    return null;
  }

  /**
   * Fetch a page and return the cheerio-parsed DOM.
   * If SCRAPER_API_KEY is available, routes the request through ScraperAPI to bypass anti-bot.
   */
  async _fetchPage(url) {
    let fetchUrl = url;
    const axiosConfig = {
      timeout: 30000,
      headers: {
        "User-Agent": getRandomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    };

    // Use ScraperAPI if available
    if (process.env.SCRAPER_API_KEY) {
      // Removing render=true as it consumes 5x credits and often causes 429 on free tier
      fetchUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
      console.log(`[HTTP] Routing request via ScraperAPI without JS rendering...`);
      // Delete custom headers when using ScraperAPI so we don't interfere with their anti-bot evasion
      delete axiosConfig.headers;
      axiosConfig.timeout = 60000;
    }

    try {
      const response = await axios.get(fetchUrl, axiosConfig);
      return cheerio.load(response.data);
    } catch (err) {
      console.error(`[HTTP] Request failed: ${err.message}`);
      if (err.response) {
        console.error(`[HTTP] Status: ${err.response.status}`);
        console.error(`[HTTP] Data:`, err.response.data);
      }
      throw err;
    }
  }

  /**
   * Scrape a product page and extract structured data.
   */
  async scrape(url) {
    const config = this._getRetailerConfig(url);

    // Strategy 1: Direct HTTP fetch
    try {
      console.log(`[SCRAPE] Strategy 1 — Direct fetch: ${url}`);
      const $ = await this._fetchPage(url);
      const result = config
        ? this._scrapeWithConfig($, config)
        : this._scrapeGeneric($, url);

      result.url = url;
      result.scraped_at = new Date().toISOString();

      if (result.full_text && result.full_text.length > 20) {
        return { success: true, data: result };
      }
    } catch (err) {
      console.log(`[SCRAPE] Strategy 1 failed: ${err.message}`);
    }

    // Strategy 2: Try Google Web Cache
    try {
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
      console.log(`[SCRAPE] Strategy 2 — Google Cache`);
      const $ = await this._fetchPage(cacheUrl);
      const result = config
        ? this._scrapeWithConfig($, config)
        : this._scrapeGeneric($, url);

      result.url = url;
      result.scraped_at = new Date().toISOString();

      if (result.full_text && result.full_text.length > 20) {
        return { success: true, data: result };
      }
    } catch (err) {
      console.log(`[SCRAPE] Strategy 2 failed: ${err.message}`);
    }

    // Strategy 3: Try Wayback Machine latest snapshot
    try {
      console.log(`[SCRAPE] Strategy 3 — Wayback Machine`);
      const apiRes = await axios.get(
        `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
        { timeout: 10000 }
      );
      const snapshot = apiRes.data?.archived_snapshots?.closest;
      if (snapshot && snapshot.available && snapshot.url) {
        const $ = await this._fetchPage(snapshot.url);
        const result = config
          ? this._scrapeWithConfig($, config)
          : this._scrapeGeneric($, url);

        result.url = url;
        result.scraped_at = new Date().toISOString();

        if (result.full_text && result.full_text.length > 20) {
          return { success: true, data: result };
        }
      }
    } catch (err) {
      console.log(`[SCRAPE] Strategy 3 failed: ${err.message}`);
    }

    // Strategy 4: Extract what we can from the URL itself
    // (brand from domain, product name from slug)
    console.log(`[SCRAPE] Strategy 4 — URL-based extraction`);
    const urlData = this._extractFromUrl(url, config);
    if (urlData.full_text && urlData.full_text.length > 10) {
      return { success: true, data: urlData };
    }

    return {
      success: false,
      error: "All scraping strategies failed for this URL.",
      suggestion:
        "This retailer blocks automated access. Please paste the product description text manually using the 'Paste Text' tab.",
    };
  }

  /**
   * Scrape using retailer-specific selectors.
   */
  _scrapeWithConfig($, config) {
    const data = {
      brand: config.brand,
      retailer: config.name,
    };

    data.name = this._extractText($, config.selectors.productName);
    data.description = this._extractText($, config.selectors.description);
    data.materials_text = this._extractText($, config.selectors.materials);
    data.price = this._extractText($, config.selectors.price);

    // Also try JSON-LD for richer data
    const jsonLd = this._extractJsonLd($);
    if (jsonLd) {
      if (!data.name && jsonLd.name) data.name = jsonLd.name;
      if (!data.description && jsonLd.description) data.description = jsonLd.description;
      if (!data.price && jsonLd.offers) {
        const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
        if (offer && offer.price) data.price = `${offer.priceCurrency || "$"}${offer.price}`;
      }
    }

    // Also grab all visible body text as a fallback enrichment
    if (!data.description || data.description.length < 20) {
      data.description = this._extractBodyText($);
    }

    data.full_text = [data.name, data.description, data.materials_text]
      .filter(Boolean)
      .join(". ");

    data.materials = this._parseMaterials(data.materials_text || data.description || data.full_text);

    return data;
  }

  /**
   * Generic scraping for unsupported retailers.
   */
  _scrapeGeneric($, url) {
    const data = {
      brand: "unknown",
      retailer: new URL(url).hostname.replace("www.", ""),
    };

    // Try JSON-LD first (most reliable for generic sites)
    const jsonLd = this._extractJsonLd($);
    if (jsonLd) {
      data.name = jsonLd.name || "";
      data.description = jsonLd.description || "";
      if (jsonLd.brand) {
        data.brand = typeof jsonLd.brand === "string" ? jsonLd.brand : jsonLd.brand.name || "unknown";
      }
      if (jsonLd.offers) {
        const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
        if (offer && offer.price) data.price = `${offer.priceCurrency || "$"}${offer.price}`;
      }
    }

    // Fallback to HTML selectors
    if (!data.name) data.name = this._extractText($, "h1");
    if (!data.description) {
      data.description = this._extractText($, ".product-description p, .product-info p, main p, article p, [itemprop='description']");
    }
    if (!data.price) data.price = this._extractText($, ".price, .product-price, [itemprop='price']");

    // Grab meta description as extra fallback
    if (!data.description || data.description.length < 20) {
      const metaDesc = $('meta[name="description"]').attr("content") || "";
      const ogDesc = $('meta[property="og:description"]').attr("content") || "";
      data.description = metaDesc.length > ogDesc.length ? metaDesc : ogDesc;
    }

    // Last resort — get visible body text
    if (!data.description || data.description.length < 20) {
      data.description = this._extractBodyText($);
    }

    data.full_text = [data.name, data.description].filter(Boolean).join(". ");
    data.materials = this._parseMaterials(data.description);

    return data;
  }

  /**
   * Try to extract product data from JSON-LD structured data.
   */
  _extractJsonLd($) {
    try {
      const scripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < scripts.length; i++) {
        try {
          const json = JSON.parse($(scripts[i]).html());
          // Could be an array of items
          const items = Array.isArray(json) ? json : [json];
          for (const item of items) {
            if (item["@type"] === "Product") {
              return item;
            }
            // Sometimes nested in @graph
            if (item["@graph"]) {
              const product = item["@graph"].find(
                (g) => g["@type"] === "Product"
              );
              if (product) return product;
            }
          }
        } catch {}
      }
    } catch {}
    return null;
  }

  /**
   * Extract structured data fallback.
   */
  _scrapeFromStructuredData($, config, url) {
    const data = {
      brand: config ? config.brand : "unknown",
      retailer: config ? config.name : new URL(url).hostname.replace("www.", ""),
    };

    const jsonLd = this._extractJsonLd($);
    if (jsonLd) {
      data.name = jsonLd.name || "";
      data.description = jsonLd.description || "";
    }

    // Meta tags
    if (!data.name) {
      data.name = $('meta[property="og:title"]').attr("content") || $("title").text() || "";
    }
    if (!data.description) {
      data.description =
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content") ||
        "";
    }

    data.full_text = [data.name, data.description].filter(Boolean).join(". ");
    data.materials = this._parseMaterials(data.description);

    return data;
  }

  /**
   * Extract text content from a CSS selector.
   */
  _extractText($, selector) {
    try {
      const selectors = selector.split(",").map((s) => s.trim());
      for (const sel of selectors) {
        const el = $(sel).first();
        if (el.length) {
          const text = el.text().trim();
          if (text) return text;
        }
      }
      return "";
    } catch {
      return "";
    }
  }

  /**
   * Extract meaningful body text as a last resort.
   */
  _extractBodyText($) {
    try {
      // Remove scripts, styles, nav, footer, header
      $("script, style, nav, footer, header, noscript, iframe").remove();

      const text = $("main, article, .product, [role='main'], body")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      // Limit to ~3000 chars
      return text.substring(0, 3000);
    } catch {
      return "";
    }
  }
  /**
   * Extract what we can from the URL itself when all scraping fails.
   * Parses the domain for brand and the URL slug for a rough product name.
   */
  _extractFromUrl(url, config) {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace("www.", "").replace("www2.", "");
    const pathSegments = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((s) => s.replace(/[-_]/g, " ").replace(/\.\w+$/, ""));

    const brand = config ? config.brand : hostname.split(".")[0];
    const retailer = config ? config.name : hostname;

    // Try to build a product name from URL path
    const productName = pathSegments
      .filter((s) => s.length > 2 && !/^\d+$/.test(s) && !["en", "us", "in", "uk", "productpage", "product", "t", "p", "dp"].includes(s.toLowerCase()))
      .join(" ");

    const description = `${retailer} product: ${productName}. Brand: ${brand}.`;

    return {
      brand,
      retailer,
      name: productName || `${retailer} Product`,
      description,
      full_text: description,
      materials: {},
      url,
      scraped_at: new Date().toISOString(),
    };
  }

  /**
   * Parse material composition from text.
   * Handles formats like "60% Cotton, 35% Polyester, 5% Elastane"
   */
  _parseMaterials(text) {
    if (!text) return {};

    const materials = {};
    const pattern = /(\d+(?:\.\d+)?)\s*%\s*([a-zA-Z\s]+?)(?=[,.\d;|]|$)/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const percentage = parseFloat(match[1]);
      const material = match[2].trim().toLowerCase();
      if (material.length > 1 && percentage > 0 && percentage <= 100) {
        materials[material] = percentage;
      }
    }

    return materials;
  }
}

module.exports = { ProductScraper, RETAILER_CONFIGS };
