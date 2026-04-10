"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CarbonTimeline.module.css";

export default function CarbonTimeline({ brandData }) {
  const svgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (svgRef.current) {
      observer.observe(svgRef.current);
    }
    return () => observer.disconnect();
  }, []);

  if (!brandData || !brandData.emissions) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📊</span>
        <p>Brand data not available</p>
      </div>
    );
  }

  const { emissions, name, transparency_score, notes } = brandData;
  const years = Object.keys(emissions).sort();
  const values = years.map((y) => emissions[y]);
  const maxVal = Math.max(...values) * 1.1;
  const minVal = 0;

  // SVG dimensions
  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 25, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Generate path
  const points = values.map((val, i) => {
    const x = padding.left + (i / (values.length - 1)) * chartW;
    const y = padding.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, val, year: years[i] };
  });

  const pathD = points.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (p.x - prev.x) / 3;
    const cpx2 = p.x - (p.x - prev.x) / 3;
    return `${d} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
  }, "");

  // Trend: are emissions going up or down?
  const trend = values[values.length - 1] < values[0] ? "down" : "up";
  const trendColor = trend === "down" ? "#00ff88" : "#ef4444";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h4 className={styles.brandName}>{name}</h4>
          <span className={styles.metric}>
            CO₂e Emissions (Million Tonnes)
          </span>
        </div>
        <div className={styles.trend} style={{ color: trendColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {trend === "down" ? (
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            ) : (
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            )}
          </svg>
          {trend === "down" ? "Decreasing" : "Increasing"}
        </div>
      </div>

      {/* Sparkline Chart */}
      <div ref={svgRef} className={styles.chartWrapper}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`${styles.chart} ${isVisible ? styles.chartVisible : ""}`}
        >
          {/* Gradient fill */}
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`}
            fill="url(#lineGradient)"
            className={styles.area}
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={trendColor}
            strokeWidth="2"
            className={styles.line}
          />

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3"
                fill={trendColor}
                className={styles.dot}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
              <text
                x={p.x}
                y={height - 5}
                textAnchor="middle"
                className={styles.yearLabel}
              >
                {p.year.slice(2)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Transparency Score */}
      <div className={styles.transparency}>
        <span className={styles.transparencyLabel}>Transparency Score</span>
        <div className={styles.transparencyBarBg}>
          <div
            className={styles.transparencyBar}
            style={{
              width: isVisible ? `${transparency_score}%` : "0%",
              background:
                transparency_score >= 70
                  ? "#00ff88"
                  : transparency_score >= 40
                  ? "#facc15"
                  : "#ef4444",
            }}
          />
        </div>
        <span className={styles.transparencyValue}>{transparency_score}/100</span>
      </div>

      {/* Notes */}
      {notes && <p className={styles.notes}>{notes}</p>}
    </div>
  );
}
