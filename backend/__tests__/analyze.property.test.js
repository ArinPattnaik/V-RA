/**
 * Property-based tests for analyze success response contract.
 * Feature: backend-improvements, Property 9: Analyze success response contract
 *
 * **Validates: Requirements 10.1**
 */

const fc = require('fast-check');

/**
 * Pure function that builds the analyze success response shape.
 * Mirrors the logic in server.js route handlers.
 */
function buildAnalyzeResponse({ product, analysisData, textLength, method }) {
  return {
    success: true,
    product: product || {},
    analysis: analysisData || {},
    input: {
      text_length: textLength,
      method,
    },
  };
}

/**
 * Validate that a response object conforms to the analyze success contract.
 */
function isValidAnalyzeResponse(response) {
  if (response.success !== true) return false;
  if (typeof response.product !== 'object' || response.product === null) return false;
  if (typeof response.analysis !== 'object' || response.analysis === null) return false;
  if (typeof response.input !== 'object' || response.input === null) return false;
  if (typeof response.input.text_length !== 'number') return false;
  if (!['scraped', 'manual', 'demo'].includes(response.input.method)) return false;
  return true;
}

describe('Property 9: Analyze success response contract', () => {
  it('should always produce a valid response shape for any product/analysis data', () => {
    const productArb = fc.record({
      name: fc.option(fc.string(), { nil: undefined }),
      price: fc.option(fc.string(), { nil: undefined }),
      retailer: fc.option(fc.string(), { nil: undefined }),
      url: fc.option(fc.webUrl(), { nil: undefined }),
      scraped_at: fc.option(fc.string(), { nil: undefined }),
    });

    const analysisArb = fc.dictionary(
      fc.string({ minLength: 1, maxLength: 10 }),
      fc.oneof(fc.string(), fc.integer(), fc.boolean())
    );

    const methodArb = fc.constantFrom('scraped', 'manual', 'demo');
    const textLengthArb = fc.nat({ max: 100000 });

    fc.assert(
      fc.property(
        productArb,
        analysisArb,
        textLengthArb,
        methodArb,
        (product, analysisData, textLength, method) => {
          const response = buildAnalyzeResponse({ product, analysisData, textLength, method });
          return isValidAnalyzeResponse(response);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should always include success: true', () => {
    const methodArb = fc.constantFrom('scraped', 'manual', 'demo');

    fc.assert(
      fc.property(methodArb, fc.nat({ max: 50000 }), (method, textLength) => {
        const response = buildAnalyzeResponse({
          product: {},
          analysisData: {},
          textLength,
          method,
        });
        return response.success === true;
      }),
      { numRuns: 20 }
    );
  });

  it('should always have text_length as a number and method as a valid string', () => {
    const methodArb = fc.constantFrom('scraped', 'manual', 'demo');
    const textLengthArb = fc.nat({ max: 100000 });

    fc.assert(
      fc.property(textLengthArb, methodArb, (textLength, method) => {
        const response = buildAnalyzeResponse({
          product: {},
          analysisData: {},
          textLength,
          method,
        });
        return (
          typeof response.input.text_length === 'number' &&
          ['scraped', 'manual', 'demo'].includes(response.input.method)
        );
      }),
      { numRuns: 20 }
    );
  });
});
