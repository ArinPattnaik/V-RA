"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./LoadingScreen.module.css";

const SCAN_STEPS = [
  "Connecting to server...",
  "Scraping product page...",
  "Analyzing materials...",
  "Scanning for buzzwords...",
  "Checking certifications...",
  "Calculating eco-score...",
];

const STEP_DURATION = 2500; // ms per step

export default function LoadingScreen({ isColdStart = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Advance steps automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < SCAN_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, STEP_DURATION);

    return () => clearInterval(timer);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      {/* Cold start message */}
      {isColdStart && (
        <motion.div
          className={styles.coldStart}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className={styles.coldStartIcon}>☕</span>
          <p className={styles.coldStartText}>
            Our servers are waking up, this may take a moment...
          </p>
        </motion.div>
      )}

      {/* Steps */}
      <div className={styles.steps}>
        <AnimatePresence>
          {SCAN_STEPS.map((step, i) => (
            <motion.div
              key={i}
              className={`${styles.step} ${
                i < currentStep
                  ? styles.stepComplete
                  : i === currentStep
                  ? styles.stepActive
                  : styles.stepPending
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className={styles.stepIndicator}>
                {i < currentStep ? (
                  <motion.span
                    className={styles.checkmark}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    ✓
                  </motion.span>
                ) : i === currentStep ? (
                  <span className={styles.spinner} />
                ) : (
                  <span className={styles.pendingDot} />
                )}
              </div>
              <span className={styles.stepText}>{step}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Elapsed time */}
      <div className={styles.timer}>
        <span className={styles.timerLabel}>Elapsed</span>
        <span className={styles.timerValue}>{elapsed}s</span>
      </div>
    </div>
  );
}
