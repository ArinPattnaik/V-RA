import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { getComparisonColor } from "../components/ComparisonMode";

describe("Comparison Mode Color Coding", () => {
  /**
   * **Validates: Requirements 12.3**
   *
   * Property: For any two scores (0-10), the function returns:
   * - "better" when scoreA > scoreB
   * - "worse" when scoreA < scoreB
   * - "neutral" when scoreA === scoreB
   */
  it("correctly classifies score comparisons for any pair of scores", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (scoreA, scoreB) => {
          const result = getComparisonColor(scoreA, scoreB);

          if (scoreA > scoreB) {
            expect(result).toBe("better");
          } else if (scoreA < scoreB) {
            expect(result).toBe("worse");
          } else {
            expect(result).toBe("neutral");
          }
        }
      )
    );
  });

  /**
   * **Validates: Requirements 12.3**
   *
   * Property: The comparison is antisymmetric — if A is "better" than B,
   * then B is "worse" than A.
   */
  it("comparison is antisymmetric", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }),
        fc.integer({ min: 0, max: 10 }),
        (scoreA, scoreB) => {
          const colorAB = getComparisonColor(scoreA, scoreB);
          const colorBA = getComparisonColor(scoreB, scoreA);

          if (colorAB === "better") {
            expect(colorBA).toBe("worse");
          } else if (colorAB === "worse") {
            expect(colorBA).toBe("better");
          } else {
            expect(colorBA).toBe("neutral");
          }
        }
      )
    );
  });
});
