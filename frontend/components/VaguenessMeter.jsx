"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import styles from "./VaguenessMeter.module.css";

export default function VaguenessMeter({ score, phrases }) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // VaguenessScore is 1-10 where 10 = very specific (good) and 1 = very vague (bad)
  // For the meter, we show vagueness percentage (lower score = more vague)
  const vaguenessPercent = Math.round((10 - score) * 10);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (vaguenessPercent / 100) * circumference;

  const color =
    vaguenessPercent <= 30
      ? "#00ff88"
      : vaguenessPercent <= 60
      ? "#facc15"
      : "#ef4444";

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.gaugeWrapper}>
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
          className={styles.gauge}
        >
          {/* Background circle */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isInView ? offset : circumference}
            transform="rotate(-90 65 65)"
            className={styles.progressArc}
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
          {/* Center text */}
          <text x="65" y="60" textAnchor="middle" className={styles.gaugeValue}>
            {isInView ? vaguenessPercent : 0}%
          </text>
          <text x="65" y="78" textAnchor="middle" className={styles.gaugeLabel}>
            vague
          </text>
        </svg>
      </div>

      {/* Phrases list */}
      {phrases && phrases.length > 0 && (
        <div className={styles.phrases}>
          <span className={styles.phrasesTitle}>Hedging Language Found</span>
          <div className={styles.phrasesList}>
            {phrases.slice(0, 6).map((p, i) => (
              <span key={i} className={styles.phrase}>
                &quot;{p.phrase}&quot;
              </span>
            ))}
            {phrases.length > 6 && (
              <span className={styles.moreCount}>
                +{phrases.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
