"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";
import ScannerInput from "../components/ScannerInput";
import LoadingScreen from "../components/LoadingScreen";
import ScoreDisplay from "../components/ScoreDisplay";
import MaterialChart from "../components/MaterialChart";
import BuzzwordRadar from "../components/BuzzwordRadar";
import CertificationCard from "../components/CertificationCard";
import CarbonTimeline from "../components/CarbonTimeline";
import VaguenessMeter from "../components/VaguenessMeter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [state, setState] = useState("idle"); // idle | loading | results | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const resultsRef = useRef(null);

  // Scroll reveal for bento cards
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [state]);

  const handleAnalyze = async (input) => {
    setState("loading");
    setError(null);
    setResult(null);
    setProduct(null);

    try {
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

      setResult(data.analysis);
      setProduct(data.product);
      setState("results");

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setError(err.message);
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setProduct(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.main}>
      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {/* Decorative elements */}
          <div className={styles.heroGlow} />

          <div className={styles.heroTag}>
            <span className={styles.heroTagDot} />
            NLP-Powered Greenwashing Detection
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleAccent}>VÉRA</span>
          </h1>

          <p className={styles.heroSubtitle}>
            See through fast fashion&apos;s eco-marketing.
            <br />
            Paste a product link. Get the <span className={styles.highlight}>True Eco-Score</span>.
          </p>

          {/* Scanner Input */}
          <div className={styles.scannerSection}>
            <ScannerInput
              onAnalyze={handleAnalyze}
              isLoading={state === "loading"}
            />
          </div>

          {/* Supported Retailers */}
          <div className={styles.retailers}>
            <span className={styles.retailersLabel}>Supported retailers</span>
            <div className={styles.retailerLogos}>
              {["H&M", "Zara", "ASOS", "SHEIN", "Nike", "Adidas", "Uniqlo"].map((name) => (
                <span key={name} className={styles.retailerBadge}>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Loading State ── */}
      {state === "loading" && <LoadingScreen />}

      {/* ── Error State ── */}
      {state === "error" && (
        <section className={styles.errorSection}>
          <div className={styles.errorCard}>
            <span className={styles.errorIcon}>⚠</span>
            <h3>Analysis Failed</h3>
            <p>{error}</p>
            <p className={styles.errorHint}>
              Try pasting the product description text directly, or use one of
              the demo products.
            </p>
            <button className={styles.retryBtn} onClick={handleReset}>
              Try Again
            </button>
          </div>
        </section>
      )}

      {/* ── Results Section ── */}
      {state === "results" && result && (
        <section ref={resultsRef} className={styles.resultsSection}>
          {/* Product info banner */}
          {product && product.name && (
            <div className={`${styles.productBanner} reveal`}>
              <div className={styles.productInfo}>
                <span className={styles.productRetailer}>
                  {product.retailer || product.brand || "Product"}
                </span>
                <h2 className={styles.productName}>{product.name}</h2>
                {product.price && (
                  <span className={styles.productPrice}>{product.price}</span>
                )}
              </div>
            </div>
          )}

          {/* Score Display */}
          <ScoreDisplay
            score={result.eco_score}
            verdict={result.verdict}
            confidence={result.confidence}
          />

          {/* Sub-scores bar */}
          <div className={`${styles.subScores} reveal`}>
            {[
              { label: "Materials", value: result.breakdown.material_score, weight: "35%" },
              { label: "Buzzwords", value: result.breakdown.buzzword_score, weight: "25%" },
              { label: "Certifications", value: result.breakdown.certification_score, weight: "20%" },
              { label: "Clarity", value: result.breakdown.vagueness_score, weight: "20%" },
            ].map((sub) => (
              <div key={sub.label} className={styles.subScore}>
                <span className={styles.subScoreLabel}>{sub.label}</span>
                <span
                  className={styles.subScoreValue}
                  style={{
                    color:
                      sub.value >= 7
                        ? "#00ff88"
                        : sub.value >= 5
                        ? "#facc15"
                        : "#ef4444",
                  }}
                >
                  {sub.value}
                </span>
                <span className={styles.subScoreWeight}>{sub.weight}</span>
              </div>
            ))}
          </div>

          {/* Flags */}
          {result.flags && result.flags.length > 0 && (
            <div className={`${styles.flags} reveal`}>
              {result.flags.map((flag, i) => (
                <div key={i} className={styles.flag}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {flag}
                </div>
              ))}
            </div>
          )}

          {/* ── Bento Grid ── */}
          <div className="bento-grid">
            {/* Materials Card — 2 columns */}
            <div className="bento-card span-2 reveal">
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🧵</span>
                Material Composition
              </h3>
              <MaterialChart materials={result.materials} />
            </div>

            {/* Vagueness Meter */}
            <div className="bento-card reveal">
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🔍</span>
                Language Clarity
              </h3>
              <VaguenessMeter
                score={result.breakdown.vagueness_score}
                phrases={result.vagueness_phrases}
              />
            </div>

            {/* Certifications */}
            <div className="bento-card reveal">
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🏷️</span>
                Certifications
              </h3>
              <CertificationCard certifications={result.certifications} />
            </div>

            {/* Buzzword Radar — 2 columns */}
            <div className="bento-card span-2 row-2 reveal">
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🎯</span>
                Greenwashing Radar
              </h3>
              <BuzzwordRadar buzzwords={result.buzzwords} />
            </div>

            {/* Carbon Timeline — 2 columns */}
            <div className="bento-card span-2 reveal">
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}>📈</span>
                Brand Carbon Footprint
              </h3>
              <CarbonTimeline brandData={result.brand_data} />
            </div>
          </div>

          {/* Reset button */}
          <div className={styles.resetSection}>
            <button className={styles.resetBtn} onClick={handleReset}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Scan Another Product
            </button>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerBrand}>VÉRA</span>
          <span className={styles.footerDivider}>·</span>
          <span className={styles.footerText}>
            NLP-powered greenwashing detection for fashion
          </span>
        </div>
        <p className={styles.footerDisclaimer}>
          Scores are generated by NLP analysis and should be used as guidance.
          Always verify claims through official certification databases.
        </p>
      </footer>
    </main>
  );
}
