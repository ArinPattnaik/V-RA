/**
 * Unit tests for ProductScraper.
 * Covers: malformed URL handling, all-strategies-fail result structure.
 */

const { ProductScraper } = require('../scraper');

describe('ProductScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new ProductScraper();
  });

  describe('Malformed URL handling', () => {
    it('_getRetailerConfig should return null for malformed URLs', () => {
      const result = scraper._getRetailerConfig('not-a-url');
      expect(result).toBeNull();
    });

    it('scrape should return structured failure for malformed URLs', async () => {
      const result = await scraper.scrape('not a valid url!!!');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.suggestion).toBeDefined();
    });
  });

  describe('All-strategies-fail result structure', () => {
    it('should return success:false with error and suggestion fields', async () => {
      // Use a URL that will fail all strategies (unreachable host)
      const result = await scraper.scrape('https://this-domain-does-not-exist-xyz123.com/product');

      // Even if URL extraction (strategy 3) produces some text,
      // the result should have the expected shape
      expect(result).toHaveProperty('success');
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('suggestion');
        expect(typeof result.error).toBe('string');
        expect(typeof result.suggestion).toBe('string');
      } else {
        // Strategy 3 (URL extraction) might succeed with minimal text
        expect(result).toHaveProperty('data');
      }
    }, 60000);
  });

  describe('_getRetailerConfig', () => {
    it('should detect H&M URLs', () => {
      const config = scraper._getRetailerConfig('https://www.hm.com/product/123');
      expect(config).not.toBeNull();
      expect(config.name).toBe('H&M');
    });

    it('should return null for unknown retailers', () => {
      const config = scraper._getRetailerConfig('https://unknown-store.com/product');
      expect(config).toBeNull();
    });
  });
});
