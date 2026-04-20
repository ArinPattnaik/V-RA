/**
 * Scan History persistence layer using localStorage.
 * Manages past scan results with a 50-entry cap.
 *
 * @module scanHistory
 */

const STORAGE_KEY = "vera-scan-history";
const MAX_ENTRIES = 50;

/**
 * Read the raw history array from localStorage.
 * Returns an empty array on any parse error.
 * @returns {Array<object>}
 */
function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Write the history array to localStorage.
 * @param {Array<object>} history
 */
function writeStorage(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Generate a unique ID. Uses crypto.randomUUID when available,
 * falls back to Date.now-based ID.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Add a scan entry to history.
 * Auto-generates `id` and `timestamp` if not provided.
 * Maintains max 50 entries, removes oldest when exceeded.
 * Keeps sorted by timestamp descending (most recent first).
 *
 * @param {object} entry - Scan result to persist
 * @param {object} entry.product - Product info { name, retailer, price }
 * @param {number} entry.score - Eco-score
 * @param {string} entry.verdict - Verdict string
 * @param {object} [entry.analysis] - Full analysis object
 * @param {string} [entry.id] - Optional ID (auto-generated if missing)
 * @param {string} [entry.timestamp] - Optional ISO timestamp (auto-generated if missing)
 */
export function addScan(entry) {
  const history = readStorage();

  const newEntry = {
    ...entry,
    id: entry.id || generateId(),
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  // Add to front (most recent first)
  history.unshift(newEntry);

  // Sort by timestamp descending to ensure order
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Trim to max entries
  if (history.length > MAX_ENTRIES) {
    history.length = MAX_ENTRIES;
  }

  writeStorage(history);
}

/**
 * Get all scan history entries, sorted by most recent first.
 * @returns {Array<object>} Scan history entries
 */
export function getHistory() {
  const history = readStorage();
  // Ensure sorted descending by timestamp
  history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return history;
}

/**
 * Clear all scan history from localStorage.
 */
export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

/**
 * Get a specific scan entry by ID.
 * @param {string} id - Scan entry ID
 * @returns {object|null} Scan entry or null if not found
 */
export function getScanById(id) {
  const history = readStorage();
  return history.find((entry) => entry.id === id) || null;
}
