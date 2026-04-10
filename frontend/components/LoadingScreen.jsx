"use client";

import styles from "./LoadingScreen.module.css";

const SCAN_STEPS = [
  "Extracting product data...",
  "Analyzing material composition...",
  "Scanning for greenwashing buzzwords...",
  "Cross-referencing certifications...",
  "Checking brand accountability...",
  "Calculating True Eco-Score...",
];

export default function LoadingScreen() {
  return (
    <div className={styles.container}>
      {/* Scanning animation */}
      <div className={styles.scannerVisual}>
        <div className={styles.scanRing}>
          <div className={styles.scanRingInner} />
        </div>
        <div className={styles.scanLine} />
        <div className={styles.scanPulse} />
      </div>

      {/* Steps */}
      <div className={styles.steps}>
        {SCAN_STEPS.map((step, i) => (
          <div
            key={i}
            className={styles.step}
            style={{ animationDelay: `${i * 0.8}s` }}
          >
            <div className={styles.stepDot} />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <p className={styles.subtitle}>
        This may take a moment for scraped URLs
      </p>
    </div>
  );
}
