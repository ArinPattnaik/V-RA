import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { addScan, getHistory, clearHistory } from "../lib/scanHistory";

/**
 * Mock localStorage for Node.js/jsdom environment.
 */
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

/**
 * Arbitrary for generating a valid scan entry.
 */
const scanEntryArb = fc.record({
  id: fc.uuid(),
  timestamp: fc.date({
    min: new Date("2020-01-01"),
    max: new Date("2030-12-31"),
  }).map((d) => d.toISOString()),
  product: fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    retailer: fc.string({ minLength: 1, maxLength: 30 }),
    price: fc.string({ minLength: 1, maxLength: 10 }),
  }),
  score: fc.float({ min: 0, max: 10, noNaN: true }),
  verdict: fc.constantFrom(
    "Genuinely Sustainable",
    "Mostly Legitimate",
    "Mixed Signals",
    "Greenwashing Detected",
    "Heavy Greenwashing"
  ),
});

describe("Scan History Round-Trip Persistence", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  /**
   * **Validates: Requirements 13.1**
   *
   * Property: addScan + getHistory produces entries that match the original.
   * Serializing then deserializing a scan entry produces equivalent data.
   */
  it("round-trip: addScan then getHistory returns matching entries", () => {
    fc.assert(
      fc.property(scanEntryArb, (entry) => {
        localStorageMock.clear();

        addScan(entry);
        const history = getHistory();

        expect(history.length).toBe(1);

        const stored = history[0];
        expect(stored.id).toBe(entry.id);
        expect(stored.timestamp).toBe(entry.timestamp);
        expect(stored.product).toEqual(entry.product);
        expect(stored.score).toBeCloseTo(entry.score, 5);
        expect(stored.verdict).toBe(entry.verdict);
      })
    );
  });
});

describe("Scan History Maximum Size Invariant", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  /**
   * **Validates: Requirements 13.4**
   *
   * Property: After any number of addScan calls, getHistory().length <= 50.
   */
  it("history length never exceeds 50 after any number of additions", () => {
    fc.assert(
      fc.property(
        fc.array(scanEntryArb, { minLength: 1, maxLength: 200 }),
        (entries) => {
          localStorageMock.clear();

          for (const entry of entries) {
            addScan(entry);
            const history = getHistory();
            expect(history.length).toBeLessThanOrEqual(50);
          }
        }
      ),
      { numRuns: 20 } // fewer runs since each run adds up to 200 entries
    );
  });
});

describe("Scan History Sort Order", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  /**
   * **Validates: Requirements 13.2**
   *
   * Property: getHistory() is always sorted descending by timestamp.
   */
  it("history is always sorted descending by timestamp", () => {
    fc.assert(
      fc.property(
        fc.array(scanEntryArb, { minLength: 2, maxLength: 30 }),
        (entries) => {
          localStorageMock.clear();

          for (const entry of entries) {
            addScan(entry);
          }

          const history = getHistory();

          for (let i = 0; i < history.length - 1; i++) {
            const current = new Date(history[i].timestamp).getTime();
            const next = new Date(history[i + 1].timestamp).getTime();
            expect(current).toBeGreaterThanOrEqual(next);
          }
        }
      )
    );
  });
});
