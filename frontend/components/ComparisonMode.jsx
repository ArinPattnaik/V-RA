"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ScannerInput from "./ScannerInput";
import styles from "./ComparisonMode.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const CATEGORIES = [
  { key: "material_score", label: "Materials", icon: "🧵", weight: "35%" },
  { key: "buzzword_score", label: "Buzzwords", icon: "🎯", weight: "25%" },
  { key: "certification_score", label: "Certifications", icon: "🏷️", weight: "20%" },
  { key: "vagueness_score", label: "Clarity", icon: "🔍", weight: "20%" },
];

/**
 * Returns a color class based on comparison of two scores.
 * Higher score gets green, lower gets red, equal gets neutral.
 */
export function getComparisonColor(scoreA, scoreB) {
  if (scoreA == null || scoreB == null) return "neutral";
  if (scoreA > scoreB) return "better";
  if (scoreA < scoreB) return "worse";
  return "neutral";
}

function getScoreColor(score) {
  if (score >= 8) return "#00c96b";
  if (score >= 6.5) return "#4ade80";
  if (score >= 5) return "#d4a017";
  if (score >= 3.5) return "#e07a2f";
  return "#dc2626";
}

function getScoreLabel(score) {
  if (score >= 8) return "Genuinely Sustainable";
  if (score >= 6.5) return "Mostly Legitimate";
  if (score >= 5) return "Mixed Signals";
  if (score >= 3.5) return "Greenwashing Detected";
  return "Heavy Greenwashing";
}

async function fetchAnalysis(input) {
  let response;
  if (input.demo) {
    response = await fetch(`${API_BASE}/api/analyze/demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: input.demo }),
    });
  } else if (input.url) {
    response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: input.url }),
    });
  } else if (input.text) {
    response = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input.text }),
    });
  }
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.details || "Analysis failed");
  }
  return data;
}

export default function ComparisonMode({ onBack }) {
  const [sideA, setSideA] = useState({ state: "idle", result: null, product: null, error: null });
  const [sideB, setSideB] = useState({ state: "idle", result: null, product: null, error: null });

  const handleAnalyze = (side) => async (input) => {
    const setter = side === "A" ? setSideA : setSideB;
    setter({ state: "loading", result: null, product: null, error: null });
    try {
      const data = await fetchAnalysis(input);
      setter({ state: "results", result: data.analysis, product: data.product, error: null });
    } catch (err) {
      setter({ state: "error", result: null, product: null, error: err.message });
    }
  };

  const bothReady = sideA.state === "results" && sideB.state === "results";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Compare Products</h2>
        <button className={styles.backBtn} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to single scan
        </button>
      </div>

      {/* Dual scanner inputs */}
      <div className={styles.sides}>
        {/* Side A */}
        <div className={styles.side}>
          <span className={styles.sideLabel}>Product A</span>
          {sideA.state === "idle" || sideA.state === "loading" ? (
            <ScannerInput onAnalyze={handleAnalyze("A")} isLoading={sideA.state === "loading"} />
          ) : sideA.state === "error" ? (
            <div className={styles.sideError}>
              <span className={styles.sideErrorIcon}>⚠️</span>
              <p>{sideA.error}</p>
              <button className={styles.retryBtn} onClick={() => setSideA({ state: "idle", result: null, product: null, error: null })}>
                Try again
              </button>
            </div>
          ) : (
            <motion.div
              className={styles.sideResult}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.productName}>
                {sideA.product?.name || "Product A"}
              </div>
              <div className={styles.scoreCircle} style={{ color: getScoreColor(sideA.result?.eco_score) }}>
                {sideA.result?.eco_score?.toFixed(1)}
              </div>
              <div className={styles.verdict}>{sideA.result?.verdict || getScoreLabel(sideA.result?.eco_score)}</div>
              <button
                className={styles.rescanBtn}
                onClick={() => setSideA({ state: "idle", result: null, product: null, error: null })}
              >
                Rescan
              </button>
            </motion.div>
          )}
        </div>

        {/* VS divider */}
        <div className={styles.vsDivider}>
          <span className={styles.vsText}>VS</span>
        </div>

        {/* Side B */}
        <div className={styles.side}>
          <span className={styles.sideLabel}>Product B</span>
          {sideB.state === "idle" || sideB.state === "loading" ? (
            <ScannerInput onAnalyze={handleAnalyze("B")} isLoading={sideB.state === "loading"} />
          ) : sideB.state === "error" ? (
            <div className={styles.sideError}>
              <span className={styles.sideErrorIcon}>⚠️</span>
              <p>{sideB.error}</p>
              <button className={styles.retryBtn} onClick={() => setSideB({ state: "idle", result: null, product: null, error: null })}>
                Try again
              </button>
            </div>
          ) : (
            <motion.div
              className={styles.sideResult}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.productName}>
                {sideB.product?.name || "Product B"}
              </div>
              <div className={styles.scoreCircle} style={{ color: getScoreColor(sideB.result?.eco_score) }}>
                {sideB.result?.eco_score?.toFixed(1)}
              </div>
              <div className={styles.verdict}>{sideB.result?.verdict || getScoreLabel(sideB.result?.eco_score)}</div>
              <button
                className={styles.rescanBtn}
                onClick={() => setSideB({ state: "idle", result: null, product: null, error: null })}
              >
                Rescan
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Comparison view — shown when both sides have results */}
      <AnimatePresence>
        {bothReady && (
          <motion.div
            className={styles.comparison}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className={styles.comparisonTitle}>Score Breakdown</h3>

            {/* Overall score row */}
            <div className={styles.comparisonRow}>
              <div className={`${styles.comparisonCell} ${styles[getComparisonColor(sideA.result.eco_score, sideB.result.eco_score)]}`}>
                <span className={styles.comparisonScore}>{sideA.result.eco_score?.toFixed(1)}</span>
              </div>
              <div className={styles.comparisonLabel}>
                <span className={styles.comparisonLabelIcon}>⭐</span>
                Overall
              </div>
              <div className={`${styles.comparisonCell} ${styles[getComparisonColor(sideB.result.eco_score, sideA.result.eco_score)]}`}>
                <span className={styles.comparisonScore}>{sideB.result.eco_score?.toFixed(1)}</span>
              </div>
            </div>

            {/* Category rows */}
            {CATEGORIES.map((cat) => {
              const valA = sideA.result.breakdown?.[cat.key];
              const valB = sideB.result.breakdown?.[cat.key];
              return (
                <div key={cat.key} className={styles.comparisonRow}>
                  <div className={`${styles.comparisonCell} ${styles[getComparisonColor(valA, valB)]}`}>
                    <span className={styles.comparisonCatScore}>{valA ?? "—"}</span>
                  </div>
                  <div className={styles.comparisonLabel}>
                    <span className={styles.comparisonLabelIcon}>{cat.icon}</span>
                    {cat.label}
                    <span className={styles.comparisonWeight}>{cat.weight}</span>
                  </div>
                  <div className={`${styles.comparisonCell} ${styles[getComparisonColor(valB, valA)]}`}>
                    <span className={styles.comparisonCatScore}>{valB ?? "—"}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
