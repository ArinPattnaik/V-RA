"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getHistory, clearHistory } from "../lib/scanHistory";
import styles from "./ScanHistoryPanel.module.css";

/**
 * Format a timestamp into a relative time string (e.g. "2 hours ago").
 * @param {string} isoString
 * @returns {string}
 */
function timeAgo(isoString) {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = Math.max(0, now - then);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Get score color based on value.
 * @param {number} score
 * @returns {string}
 */
function getScoreColor(score) {
  if (score >= 7) return "var(--eco-excellent)";
  if (score >= 5) return "var(--eco-moderate)";
  return "var(--eco-terrible)";
}

/**
 * Scan history panel showing past scans.
 *
 * @param {{ onSelectScan: (entry: object) => void, onClose: () => void }} props
 */
export default function ScanHistoryPanel({ onSelectScan, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.panel}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Scan History</h3>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close history"
          >
            ✕
          </button>
        </div>

        <div className={styles.list}>
          {history.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📋</span>
              <p>No scans yet</p>
              <p className={styles.emptyHint}>
                Your scan results will appear here
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {history.map((entry, index) => (
                <motion.button
                  key={entry.id}
                  className={styles.item}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onSelectScan(entry)}
                >
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>
                      {entry.product?.name || "Unknown Product"}
                    </span>
                    <span className={styles.itemVerdict}>
                      {entry.verdict || "—"}
                    </span>
                  </div>
                  <div className={styles.itemMeta}>
                    <span
                      className={styles.itemScore}
                      style={{ color: getScoreColor(entry.score) }}
                    >
                      {entry.score ?? "—"}
                    </span>
                    <span className={styles.itemTime}>
                      {entry.timestamp ? timeAgo(entry.timestamp) : "—"}
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          )}
        </div>

        {history.length > 0 && (
          <div className={styles.footer}>
            <button className={styles.clearBtn} onClick={handleClear}>
              Clear All
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
