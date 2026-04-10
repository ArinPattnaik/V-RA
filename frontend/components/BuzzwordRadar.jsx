"use client";

import styles from "./BuzzwordRadar.module.css";

const CATEGORY_LABELS = {
  vague_claims: "Vague Claims",
  misleading_labels: "Misleading Labels",
  unsubstantiated: "Unsubstantiated",
  deflection: "Deflection",
};

const CATEGORY_COLORS = {
  vague_claims: "#facc15",
  misleading_labels: "#fb923c",
  unsubstantiated: "#ef4444",
  deflection: "#8b5cf6",
};

export default function BuzzwordRadar({ buzzwords }) {
  if (!buzzwords || buzzwords.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>✓</span>
        <p>No greenwashing buzzwords detected</p>
        <span className={styles.emptySubtext}>This is a good sign!</span>
      </div>
    );
  }

  // Group by category
  const grouped = {};
  buzzwords.forEach((b) => {
    if (!grouped[b.category]) grouped[b.category] = [];
    grouped[b.category].push(b);
  });

  return (
    <div className={styles.container}>
      {/* Summary header */}
      <div className={styles.header}>
        <span className={styles.count}>{buzzwords.length}</span>
        <span className={styles.countLabel}>
          greenwashing {buzzwords.length === 1 ? "term" : "terms"} detected
        </span>
      </div>

      {/* Buzzword list by category */}
      <div className={styles.categories}>
        {Object.entries(grouped).map(([category, terms]) => (
          <div key={category} className={styles.category}>
            <div className={styles.categoryHeader}>
              <span
                className={styles.categoryDot}
                style={{ background: CATEGORY_COLORS[category] }}
              />
              <span className={styles.categoryName}>
                {CATEGORY_LABELS[category] || category}
              </span>
              <span className={styles.categoryCount}>{terms.length}</span>
            </div>
            <div className={styles.terms}>
              {terms.map((term, i) => (
                <div key={i} className={styles.term}>
                  <div className={styles.termHeader}>
                    <span className={styles.termText}>"{term.term}"</span>
                    <div className={styles.severityDots}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span
                          key={j}
                          className={styles.severityDot}
                          style={{
                            background:
                              j < term.severity
                                ? CATEGORY_COLORS[category]
                                : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className={styles.termExplanation}>{term.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
