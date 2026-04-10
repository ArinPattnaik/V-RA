"use client";

import styles from "./MaterialChart.module.css";

function getMaterialColor(sustainability) {
  switch (sustainability) {
    case "good": return "#00ff88";
    case "moderate": return "#facc15";
    case "poor": return "#ef4444";
    default: return "rgba(255,255,255,0.3)";
  }
}

function getMaterialBg(sustainability) {
  switch (sustainability) {
    case "good": return "rgba(0, 255, 136, 0.1)";
    case "moderate": return "rgba(250, 204, 21, 0.1)";
    case "poor": return "rgba(239, 68, 68, 0.1)";
    default: return "rgba(255,255,255,0.05)";
  }
}

export default function MaterialChart({ materials }) {
  if (!materials || materials.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🧵</span>
        <p>No material data available</p>
      </div>
    );
  }

  // Sort by percentage descending
  const sorted = [...materials].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className={styles.container}>
      {sorted.map((mat, i) => (
        <div key={i} className={styles.row}>
          <div className={styles.info}>
            <span className={styles.name}>{mat.name}</span>
            <div className={styles.meta}>
              <span
                className={styles.sustainability}
                style={{ color: getMaterialColor(mat.sustainability) }}
              >
                {mat.sustainability}
              </span>
              <span className={styles.matScore}>
                {mat.sustainability_score > 0 ? `${mat.sustainability_score}/10` : "—"}
              </span>
            </div>
          </div>
          <div className={styles.barWrapper}>
            <div
              className={styles.bar}
              style={{
                width: `${mat.percentage}%`,
                background: `linear-gradient(90deg, ${getMaterialColor(mat.sustainability)}, ${getMaterialColor(mat.sustainability)}88)`,
                boxShadow: `0 0 12px ${getMaterialBg(mat.sustainability)}`,
              }}
            />
            <span
              className={styles.percentage}
              style={{ color: getMaterialColor(mat.sustainability) }}
            >
              {mat.percentage}%
            </span>
          </div>
        </div>
      ))}

      {/* Overall composition summary */}
      <div className={styles.summary}>
        {(() => {
          const goodPct = sorted
            .filter((m) => m.sustainability === "good")
            .reduce((sum, m) => sum + m.percentage, 0);
          const poorPct = sorted
            .filter((m) => m.sustainability === "poor")
            .reduce((sum, m) => sum + m.percentage, 0);
          return (
            <>
              {goodPct > 0 && (
                <span className={styles.summaryItem} style={{ color: "#00ff88" }}>
                  ● {goodPct}% sustainable
                </span>
              )}
              {poorPct > 0 && (
                <span className={styles.summaryItem} style={{ color: "#ef4444" }}>
                  ● {poorPct}% low-sustainability
                </span>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
