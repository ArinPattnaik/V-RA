import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { encodeShareData, decodeShareData } from "../lib/shareUtils";

/**
 * Arbitrary for generating valid share data objects.
 */
const shareDataArb = fc.record({
  product: fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    retailer: fc.string({ minLength: 0, maxLength: 50 }),
    price: fc.string({ minLength: 0, maxLength: 20 }),
  }),
  score: fc.float({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
  verdict: fc.constantFrom(
    "Genuinely Sustainable",
    "Mostly Legitimate",
    "Mixed Signals",
    "Greenwashing Detected",
    "Heavy Greenwashing"
  ),
  breakdown: fc.record({
    material_score: fc.float({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
    buzzword_score: fc.float({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
    certification_score: fc.float({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
    vagueness_score: fc.float({ min: 0, max: 10, noNaN: true, noDefaultInfinity: true }),
  }),
});

describe("Share URL Round-Trip Encoding", () => {
  /**
   * **Validates: Requirements 14.2**
   *
   * Property: decodeShareData(encodeShareData(data)) produces data
   * deeply equal to the original for any valid share data object.
   */
  it("encode then decode produces equivalent data", () => {
    fc.assert(
      fc.property(shareDataArb, (data) => {
        const encoded = encodeShareData(data);
        const decoded = decodeShareData(encoded);

        expect(decoded).not.toBeNull();
        expect(decoded.product).toEqual(data.product);
        expect(decoded.score).toBeCloseTo(data.score, 5);
        expect(decoded.verdict).toBe(data.verdict);
        expect(decoded.breakdown.material_score).toBeCloseTo(
          data.breakdown.material_score,
          5
        );
        expect(decoded.breakdown.buzzword_score).toBeCloseTo(
          data.breakdown.buzzword_score,
          5
        );
        expect(decoded.breakdown.certification_score).toBeCloseTo(
          data.breakdown.certification_score,
          5
        );
        expect(decoded.breakdown.vagueness_score).toBeCloseTo(
          data.breakdown.vagueness_score,
          5
        );
      })
    );
  });

  /**
   * **Validates: Requirements 14.2**
   *
   * Property: The encoded string is a non-empty string (valid base64).
   */
  it("encodeShareData always produces a non-empty string", () => {
    fc.assert(
      fc.property(shareDataArb, (data) => {
        const encoded = encodeShareData(data);
        expect(typeof encoded).toBe("string");
        expect(encoded.length).toBeGreaterThan(0);
      })
    );
  });
});
