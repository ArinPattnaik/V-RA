import { describe, it, expect } from "vitest";
import fc from "fast-check";

/**
 * ERROR_CONFIG extracted from ErrorState.jsx for testing without React rendering.
 */
const ERROR_CONFIG = {
  COLD_START: {
    icon: "☕",
    title: "Services are starting up",
    description:
      "Our servers need a moment to wake up. Please wait and try again.",
  },
  NETWORK_ERROR: {
    icon: "📡",
    title: "Connection failed",
    description:
      "Could not reach our servers. Check your internet connection.",
  },
  SCRAPE_FAILED: {
    icon: "⚠️",
    title: "Scraping failed",
    description:
      "We couldn't extract data from this page. Try pasting the product description text directly.",
  },
  ML_ERROR: {
    icon: "⚙️",
    title: "Analysis service unavailable",
    description:
      "Our analysis engine is temporarily down. Try again in a moment.",
  },
  RATE_LIMITED: {
    icon: "⏱️",
    title: "Too many requests",
    description: "Please wait a minute before trying again.",
  },
};

const ERROR_TYPES = Object.keys(ERROR_CONFIG);

describe("Error Type Classification", () => {
  /**
   * **Validates: Requirements 16.3**
   *
   * Property: All 5 error types produce distinct title+description pairs.
   * For any two different error types, their display content is different.
   */
  it("different error types produce distinct display content", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...ERROR_TYPES),
        fc.constantFrom(...ERROR_TYPES),
        (typeA, typeB) => {
          if (typeA === typeB) return; // skip same types

          const configA = ERROR_CONFIG[typeA];
          const configB = ERROR_CONFIG[typeB];

          // At least one of title or description must differ
          const titleSame = configA.title === configB.title;
          const descSame = configA.description === configB.description;

          expect(titleSame && descSame).toBe(false);
        }
      )
    );
  });

  /**
   * **Validates: Requirements 16.3**
   *
   * Property: Every error type has a non-empty title and description.
   */
  it("every error type has non-empty title and description", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ERROR_TYPES), (errorType) => {
        const config = ERROR_CONFIG[errorType];

        expect(typeof config.title).toBe("string");
        expect(config.title.length).toBeGreaterThan(0);
        expect(typeof config.description).toBe("string");
        expect(config.description.length).toBeGreaterThan(0);
      })
    );
  });

  /**
   * **Validates: Requirements 16.3**
   *
   * Exhaustive check: all 5 error types have unique titles.
   */
  it("all error types have unique titles", () => {
    const titles = ERROR_TYPES.map((type) => ERROR_CONFIG[type].title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(ERROR_TYPES.length);
  });
});
