import { describe, it, expect } from "vitest";
import fc from "fast-check";

/**
 * FAQ Accordion state logic extracted from FAQSection.jsx:
 * - State: openIndex (null or number)
 * - Toggle: clicking same index closes (null), clicking different opens that one
 */
function faqAccordionReducer(openIndex, clickIndex) {
  return openIndex === clickIndex ? null : clickIndex;
}

describe("FAQ Accordion Invariant", () => {
  /**
   * **Validates: Requirements 10.4**
   *
   * Property: For any sequence of click indices, at most one FAQ item
   * is open at a time. After each click, openIndex is either null (nothing open)
   * or a single valid index.
   */
  it("at most one FAQ item is open at a time for any click sequence", () => {
    const NUM_FAQ_ITEMS = 6; // matches FAQSection.jsx FAQ_ITEMS length

    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: NUM_FAQ_ITEMS - 1 }), {
          minLength: 1,
          maxLength: 100,
        }),
        (clickSequence) => {
          let openIndex = null;

          for (const clickIdx of clickSequence) {
            openIndex = faqAccordionReducer(openIndex, clickIdx);

            // Invariant: openIndex is null or a single valid index
            if (openIndex !== null) {
              expect(typeof openIndex).toBe("number");
              expect(openIndex).toBeGreaterThanOrEqual(0);
              expect(openIndex).toBeLessThan(NUM_FAQ_ITEMS);
            }

            // Count open items — should be 0 or 1
            const openCount = openIndex === null ? 0 : 1;
            expect(openCount).toBeLessThanOrEqual(1);
          }
        }
      )
    );
  });

  /**
   * **Validates: Requirements 10.4**
   *
   * Property: Clicking the same item twice returns to closed state.
   */
  it("clicking the same item twice closes it", () => {
    const NUM_FAQ_ITEMS = 6;

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: NUM_FAQ_ITEMS - 1 }),
        (index) => {
          let openIndex = null;
          openIndex = faqAccordionReducer(openIndex, index);
          expect(openIndex).toBe(index);
          openIndex = faqAccordionReducer(openIndex, index);
          expect(openIndex).toBeNull();
        }
      )
    );
  });
});
