"use client";

import { motion } from "framer-motion";
import styles from "./ErrorState.module.css";

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
  UNKNOWN: {
    icon: "⚠️",
    title: "Something went wrong",
    description: null, // will use errorMessage prop
  },
};

/**
 * Typed error state component that displays contextual error cards
 * based on the classified error type.
 *
 * @param {{ errorType: string, errorMessage: string, onRetry: () => void }} props
 */
export default function ErrorState({ errorType, errorMessage, onRetry }) {
  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.UNKNOWN;
  const description = config.description || errorMessage;
  const showRawMessage =
    errorMessage && config.description && errorMessage !== config.description;

  return (
    <section className={styles.errorSection}>
      <motion.div
        className={styles.errorCard}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className={styles.icon}>{config.icon}</span>
        <h3 className={styles.title}>{config.title}</h3>
        <p className={styles.description}>{description}</p>
        {showRawMessage && (
          <p className={styles.rawMessage}>{errorMessage}</p>
        )}
        <button className={styles.retryBtn} onClick={onRetry}>
          Try Again
        </button>
      </motion.div>
    </section>
  );
}
