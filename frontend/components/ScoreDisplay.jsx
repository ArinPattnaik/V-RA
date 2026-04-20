"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./ScoreDisplay.module.css";

function getScoreColor(score) {
  if (score >= 8) return "#00ff88";
  if (score >= 6.5) return "#4ade80";
  if (score >= 5) return "#facc15";
  if (score >= 3.5) return "#fb923c";
  return "#ef4444";
}

function getScoreLabel(score) {
  if (score >= 8) return "Genuinely Sustainable";
  if (score >= 6.5) return "Mostly Legitimate";
  if (score >= 5) return "Mixed Signals";
  if (score >= 3.5) return "Greenwashing Detected";
  return "Heavy Greenwashing";
}

export default function ScoreDisplay({ score, verdict, confidence }) {
  const [displayScore, setDisplayScore] = useState(0);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // Animated counter
  useEffect(() => {
    if (!isInView || score === undefined) return;

    const duration = 1500;
    const steps = 60;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      // Easing: cubic ease-out
      const progress = 1 - Math.pow(1 - step / steps, 3);
      setDisplayScore(score * progress);

      if (step >= steps) {
        setDisplayScore(score);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, score]);

  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <motion.div
      ref={containerRef}
      className={styles.container}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Ambient glow behind score */}
      <div
        className={styles.ambientGlow}
        style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }}
      />

      {/* Main score */}
      <div className={styles.scoreWrapper}>
        <span
          className={styles.score}
          style={{ color }}
        >
          {displayScore.toFixed(1)}
        </span>
        <span className={styles.outOf}>/10</span>
      </div>

      {/* Label */}
      <div className={styles.label} style={{ color }}>
        {label}
      </div>

      {/* Verdict */}
      {verdict && (
        <p className={styles.verdict}>{verdict}</p>
      )}

      {/* Confidence indicator */}
      {confidence !== undefined && (
        <div className={styles.confidence}>
          <span className={styles.confidenceLabel}>Analysis Confidence</span>
          <div className={styles.confidenceBar}>
            <div
              className={styles.confidenceFill}
              style={{
                width: isInView ? `${confidence * 100}%` : "0%",
                background: color,
              }}
            />
          </div>
          <span className={styles.confidenceValue}>{Math.round(confidence * 100)}%</span>
        </div>
      )}
    </motion.div>
  );
}
