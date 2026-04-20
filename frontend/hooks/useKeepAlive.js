/**
 * Custom hook to keep backend services warm by periodic health pings.
 * Pings on mount and every 10 minutes to prevent Render free-tier cold starts.
 *
 * @module useKeepAlive
 */

import { useEffect } from 'react';
import { pingHealth } from '../lib/apiClient';

/** Interval between keep-alive pings in milliseconds (10 minutes). */
const PING_INTERVAL_MS = 600000;

/**
 * Starts a keep-alive loop that pings backend and ML service health endpoints.
 *
 * - Fires an immediate ping on mount.
 * - Repeats every 10 minutes while the component is mounted.
 * - Cleans up the interval on unmount.
 *
 * @returns {void}
 */
export function useKeepAlive() {
  useEffect(() => {
    // Ping immediately on mount
    pingHealth();

    // Set up recurring pings every 10 minutes
    const intervalId = setInterval(() => {
      pingHealth();
    }, PING_INTERVAL_MS);

    // Clean up on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);
}
