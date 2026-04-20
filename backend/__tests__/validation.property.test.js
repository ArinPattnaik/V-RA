/**
 * Property-based tests for input validation module.
 * Feature: backend-improvements
 *
 * Property 2: URL validation with SSRF protection
 * Property 3: Text validation with HTML sanitization
 * Property 4: Demo ID format validation
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */

const fc = require('fast-check');
const { validateUrl, validateText, validateDemoId } = require('../middleware/validation');

describe('Property 2: URL validation with SSRF protection', () => {
  it('should reject URLs with private IP ranges', () => {
    const privateIpArb = fc.oneof(
      // 127.x.x.x
      fc.tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      ).map(([b, c, d]) => `127.${b}.${c}.${d}`),
      // 10.x.x.x
      fc.tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      ).map(([b, c, d]) => `10.${b}.${c}.${d}`),
      // 192.168.x.x
      fc.tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      ).map(([c, d]) => `192.168.${c}.${d}`),
      // 172.16-31.x.x
      fc.tuple(
        fc.integer({ min: 16, max: 31 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      ).map(([b, c, d]) => `172.${b}.${c}.${d}`)
    );

    fc.assert(
      fc.property(privateIpArb, (ip) => {
        const result = validateUrl(`https://${ip}/path`);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 20 }
    );
  });

  it('should accept valid public HTTP(S) URLs', () => {
    const publicUrlArb = fc.oneof(
      fc.constant('https://example.com'),
      fc.constant('https://hm.com/product/123'),
      fc.constant('http://zara.com/en/product'),
      fc.constant('https://nike.com/t/shoe-abc'),
      fc.constant('https://sub.domain.example.org/path')
    );

    fc.assert(
      fc.property(publicUrlArb, (url) => {
        const result = validateUrl(url);
        expect(result.valid).toBe(true);
        expect(result.sanitized).toBeDefined();
      }),
      { numRuns: 20 }
    );
  });

  it('should prepend https:// when scheme is missing', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('example.com', 'hm.com/product', 'zara.com/en'),
        (url) => {
          const result = validateUrl(url);
          expect(result.valid).toBe(true);
          expect(result.sanitized).toMatch(/^https:\/\//);
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 3: Text validation with HTML sanitization', () => {
  it('should strip all HTML tags from input and validate length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        fc.array(fc.tuple(
          fc.constantFrom('<b>', '<script>', '<div class="x">', '<img src="x">'),
          fc.constantFrom('</b>', '</script>', '</div>', '')
        ), { minLength: 0, maxLength: 3 }),
        (baseText, htmlPairs) => {
          // Inject HTML tags into the text
          let text = baseText;
          for (const [open, close] of htmlPairs) {
            text = open + text + close;
          }

          const result = validateText(text);

          if (result.valid) {
            // Sanitized output should contain no HTML tags
            expect(result.sanitized).not.toMatch(/<[^>]*>/);
            // Length should be within bounds
            expect(result.sanitized.length).toBeGreaterThanOrEqual(10);
            expect(result.sanitized.length).toBeLessThanOrEqual(50000);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject text shorter than 10 chars after HTML stripping', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 9 }),
        (shortText) => {
          const result = validateText(shortText);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject text longer than 50000 chars', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50001, max: 50100 }),
        (len) => {
          const longText = 'a'.repeat(len);
          const result = validateText(longText);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('Property 4: Demo ID format validation', () => {
  it('should accept valid demo IDs matching demo-N pattern', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 99999 }),
        (n) => {
          const result = validateDemoId(`demo-${n}`);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should reject strings not matching demo-N pattern', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(
          (s) => !/^demo-\d+$/.test(s)
        ),
        (id) => {
          const result = validateDemoId(id);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });
});
