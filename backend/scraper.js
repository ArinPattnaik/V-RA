/**
 * VÉRA — Product Page Scraper
 * Puppeteer-based scraper with retailer-specific selectors and stealth plugin.
 */

const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// ─────────────────────────────────────────────────────────────
// RETAILER SELECTOR CONFIGURATIONS
// ─────────────────────────────────────────────────────────────

const RETAILER_CONFIGS = {
  "hm.com": {
    name: "H&M",
    brand: "h&m",
    selectors: {
      productName: "h1.product-item-headline, h1[data-testid='product-title'], .product-detail-title h1",
      description: ".product-description p, .pdp-description-text, [data-testid='product-description']",
      materials: ".product-materials, .composition-text, [data-testid='product-composition'], .pdp-description__composition",
      price: ".product-item-price span, [data-testid='product-price'], .price-value",
    },
  },
  "zara.com": {
    name: "Zara",
    brand: "zara",
    selectors: {
      productName: "h1.product-detail-info__header-name, .product-detail-info__name",
      description: ".product-detail-description p, .product-detail-info__description",
      materials: ".product-detail-composition, .structured-component-text-block-paragraph",
      price: ".price__amount-current, .money-amount__main",
    },
  },
  "asos.com": {
    name: "ASOS",
    brand: "asos",
    selectors: {
      productName: "h1#aside-content, .product-hero h1",
      description: ".product-description, [data-testid='productDescription']",
      materials: ".product-description li, .about-me, [data-testid='productDescriptionContent']",
      price: ".current-price span, [data-testid='current-price']",
    },
  },
  "shein.com": {
    name: "SHEIN",
    brand: "shein",
    selectors: {
      productName: "h1.product-intro__head-name, .product-intro__head-mainTitle",
      description: ".product-intro__description, .product-middle__description",
      materials: ".product-intro__description-table, .product-detail__material",
      price: ".product-intro__head-mainprice, .from.original",
    },
  },
  "nike.com": {
    name: "Nike",
    brand: "nike",
    selectors: {
      productName: "h1#pdp_product_title, h1.headline-2",
      description: ".description-preview, [data-testid='product-description']",
      materials: ".description-preview p, .product-info",
      price: "[data-testid='currentPrice-container'], .product-price",
    },
  },
  "adidas.com": {
    name: "Adidas",
    brand: "adidas",
    selectors: {
      productName: "h1[data-auto-id='product-title'], h1.product-title",
      description: "[data-auto-id='product-description'], .product-description",
      materials: ".specifications___2gJMh li, .product-information-content",
      price: "[data-auto-id='gl-price-item'], .gl-price-item",
    },
  },
  "uniqlo.com": {
    name: "Uniqlo",
    brand: "uniqlo",
    selectors: {
      productName: "h1.productTitle, .fr-ec-product-heading__title",
      description: ".fr-ec-product-description, .pdp-description",
      materials: ".fr-ec-product-materials, .product-material",
      price: ".fr-ec-price, .pdp-price",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// SCRAPER CLASS
// ─────────────────────────────────────────────────────────────

class ProductScraper {
  constructor() {
    this.browser = null;
  }

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
   * Scrape a product page and extract structured data.
   */
  async scrape(url) {
    const config = this._getRetailerConfig(url);
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1920,1080",
        ],
        executablePath:
          process.env.PUPPETEER_EXEC_PATH || undefined,
      });

      const page = await browser.newPage();

      // Set a realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Navigate with timeout
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Wait for content to load
      await new Promise(r => setTimeout(r, 2000));

      let result;

      if (config) {
        // Use retailer-specific selectors
        result = await this._scrapeWithConfig(page, config);
      } else {
        // Generic scraping fallback
        result = await this._scrapeGeneric(page);
      }

      result.url = url;
      result.scraped_at = new Date().toISOString();

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestion:
          "This site may have anti-bot protections. Try pasting the product description manually.",
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Scrape using retailer-specific selectors.
   */
  async _scrapeWithConfig(page, config) {
    const data = {
      brand: config.brand,
      retailer: config.name,
    };

    // Extract each field, with fallback to empty string
    data.name = await this._safeExtract(page, config.selectors.productName);
    data.description = await this._safeExtract(page, config.selectors.description);
    data.materials_text = await this._safeExtract(page, config.selectors.materials);
    data.price = await this._safeExtract(page, config.selectors.price);

    // Combine description + materials for full analysis text
    data.full_text = [data.name, data.description, data.materials_text]
      .filter(Boolean)
      .join(". ");

    // Parse material percentages from text
    data.materials = this._parseMaterials(data.materials_text || data.description);

    return data;
  }

  /**
   * Generic scraping for unsupported retailers.
   */
  async _scrapeGeneric(page) {
    const data = {
      brand: "unknown",
      retailer: "unknown",
    };

    // Try common product page selectors
    data.name = await this._safeExtract(
      page,
      "h1, .product-title, .product-name, [data-testid*='title']"
    );

    // Get all paragraph text from the page as description
    data.description = await page.evaluate(() => {
      const paragraphs = document.querySelectorAll(
        ".product-description p, .product-info p, main p, article p"
      );
      return Array.from(paragraphs)
        .map((p) => p.textContent.trim())
        .filter((t) => t.length > 20)
        .join(" ");
    });

    data.price = await this._safeExtract(
      page,
      ".price, .product-price, [data-testid*='price']"
    );

    data.full_text = [data.name, data.description].filter(Boolean).join(". ");
    data.materials = this._parseMaterials(data.description);

    return data;
  }

  /**
   * Safely extract text content from a CSS selector.
   */
  async _safeExtract(page, selector) {
    try {
      // Handle comma-separated selectors (try each)
      const selectors = selector.split(",").map((s) => s.trim());
      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            const text = await page.evaluate((elem) => elem.textContent.trim(), el);
            if (text) return text;
          }
        } catch {
          continue;
        }
      }
      return "";
    } catch {
      return "";
    }
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
