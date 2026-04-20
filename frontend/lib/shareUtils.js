/**
 * Share utilities for encoding/decoding results and generating share images.
 *
 * @module shareUtils
 */

/**
 * Encode analysis data into a URL-safe base64 string for sharing.
 * @param {{ product: object, score: number, verdict: string, breakdown: object }} data
 * @returns {string} Base64-encoded string
 */
export function encodeShareData(data) {
  const json = JSON.stringify(data);
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Decode a shared base64 string back into analysis data.
 * @param {string} hash - Base64-encoded string
 * @returns {object|null} Decoded analysis data or null if invalid
 */
export function decodeShareData(hash) {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Generate a shareable image from a DOM element using html2canvas.
 * @param {React.RefObject} elementRef - Ref to the DOM element to capture
 * @returns {Promise<Blob>} PNG image blob
 */
export async function generateShareImage(elementRef) {
  const element = elementRef.current || elementRef;
  if (!element) {
    throw new Error("No element to capture");
  }

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    backgroundColor: "#fafafa",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to generate image"));
      }
    }, "image/png");
  });
}
