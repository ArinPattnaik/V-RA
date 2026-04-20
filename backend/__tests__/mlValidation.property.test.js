/**
 * Property-based tests for ML response shape validation.
 * Feature: backend-improvements, Property 7: ML response shape validation
 *
 * **Validates: Requirements 5.5**
 */

const fc = require('fast-check');
const { isValidMlResponse } = require('../server');

describe('Property 7: ML response shape validation', () => {
  afterAll(() => {
    // Close the server that was opened by requiring server.js
    const { server } = require('../server');
    server.close();
  });

  it('should accept only responses with success: true and data as a non-array object', () => {
    // Generate valid ML responses — these must always be accepted
    const validResponse = fc.record({
      success: fc.constant(true),
      data: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.anything()),
    });

    fc.assert(
      fc.property(validResponse, (response) => {
        return isValidMlResponse(response) === true;
      }),
      { numRuns: 20 }
    );
  });

  it('should reject responses missing success: true', () => {
    // Generate responses where success is NOT true
    const nonTrueSuccess = fc.oneof(
      fc.constant(false),
      fc.constant(null),
      fc.constant(undefined),
      fc.constant(0),
      fc.constant(1),
      fc.constant('true'),
    );

    const invalidResponse = fc.record({
      success: nonTrueSuccess,
      data: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.anything()),
    });

    fc.assert(
      fc.property(invalidResponse, (response) => {
        return isValidMlResponse(response) === false;
      }),
      { numRuns: 20 }
    );
  });

  it('should reject responses where data is not a non-array object', () => {
    // Generate responses where data is not a plain object
    const nonObjectData = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant('string'),
      fc.constant(42),
      fc.constant(true),
      fc.array(fc.anything()),
    );

    const invalidResponse = fc.record({
      success: fc.constant(true),
      data: nonObjectData,
    });

    fc.assert(
      fc.property(invalidResponse, (response) => {
        return isValidMlResponse(response) === false;
      }),
      { numRuns: 20 }
    );
  });

  it('should reject non-object responses', () => {
    const nonObjects = fc.oneof(
      fc.constant(null),
      fc.constant(undefined),
      fc.constant('string'),
      fc.constant(42),
      fc.constant(true),
    );

    fc.assert(
      fc.property(nonObjects, (response) => {
        return isValidMlResponse(response) === false;
      }),
      { numRuns: 20 }
    );
  });
});
