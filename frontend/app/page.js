"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./page.module.css";
import { useKeepAlive } from "../hooks/useKeepAlive";
import ScannerInput from "../components/ScannerInput";
import LoadingScreen from "../components/LoadingScreen";
import AnimatedGradientBg from "../components/AnimatedGradientBg";
import ScrollReveal from "../components/ScrollReveal";
import ScoreDisplay from "../components/ScoreDisplay";
import MaterialChart from "../components/MaterialChart";
import BuzzwordRadar from "../components/BuzzwordRadar";
import CertificationCard from "../components/CertificationCard";
import CarbonTimeline from "../components/CarbonTimeline";
import VaguenessMeter from "../components/VaguenessMeter";
import ErrorState from "../components/ErrorState";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import ScanHistoryPanel from "../components/ScanHistoryPanel";
import ShareButton from "../components/ShareButton";
import ComparisonMode from "../components/ComparisonMode";
import { addScan } from "../lib/scanHistory";
import { decodeShareData } from "../lib/shareUtils";
import { analyzeProduct, ApiError, isRetrying } from "../lib/apiClient";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: "easeInOut" },
};

export default function Home() {
  useKeepAlive();

  const [state, setState] = useState("idle"); // idle | loading | results | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState("UNKNOWN");
  const [product, setProduct] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isColdStart, setIsColdStart] = useState(false);
  const resultsRef = useRef(null);
  const scoreCardRef = useRef(null);

  // Check for shared data in URL hash on load
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.startsWith("#share=")) {
      const encoded = hash.slice(7);
      const data = decodeShareData(encoded);
      if (data) {
        setResult({
          eco_score: data.score,
          verdict: data.verdict,
          breakdown: data.breakdown || {},
        });
        setProduct(data.product || null);
        setState("results");
        // Clean the hash
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);

  const handleAnalyze = async (input) => {
    setState("loading");
    setError(null);
    setResult(null);
    setProduct(null);
    setIsColdStart(false);

    try {
      // Poll isRetrying to update cold-start UI
      const retryPollId = setInterval(() => {
        setIsColdStart(isRetrying);
      }, 500);

      const data = await analyzeProduct(input);

      clearInterval(retryPollId);
      setIsColdStart(false);

      setResult(data.analysis);
      setProduct(data.product);
      setState("results");

      // Save to scan history
      addScan({
        product: {
          name: data.product?.name || "Unknown Product",
          retailer: data.product?.retailer || data.product?.brand || "",
          price: data.product?.price || "",
        },
        score: data.analysis?.eco_score,
        verdict: data.analysis?.verdict,
        analysis: data.analysis,
      });

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setIsColdStart(false);
      setError(err.message);
      setErrorType(err instanceof ApiError ? err.type : "UNKNOWN");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setProduct(null);
    setError(null);
    setErrorType("UNKNOWN");
    setIsColdStart(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectScan = (entry) => {
    setShowHistory(false);
    if (entry.analysis) {
      setResult(entry.analysis);
      setProduct({
        name: entry.product?.name || "Unknown Product",
        retailer: entry.product?.retailer || "",
        price: entry.product?.price || "",
      });
      setState("results");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  };

  return (
    <main className={styles.main}>
      <AnimatePresence mode="wait">
        {/* ── Hero / Idle Section ── */}
        {(state === "idle" || state === "loading") && (
          <motion.div key="hero" {...pageTransition}>
            <section className={styles.hero}>
              <AnimatedGradientBg />
              <div className={styles.heroContent}>
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
                  {state === "idle" && (
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.historyBtn}
                        onClick={() => setShowHistory(true)}
                      >
                        📋 History
                      </button>
                      <button
                        className={styles.historyBtn}
                        onClick={() => setState("comparison")}
                      >
                        ⚖️ Compare Products
                      </button>
                    </div>
                  )}
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
            {state === "loading" && <LoadingScreen isColdStart={isColdStart} />}

            {/* ── FAQ (visible in idle) ── */}
            {state === "idle" && <FAQSection />}
          </motion.div>
        )}

        {/* ── Error State ── */}
        {state === "error" && (
          <motion.div key="error" {...pageTransition}>
            <ErrorState
              errorType={errorType}
              errorMessage={error}
              onRetry={handleReset}
            />
          </motion.div>
        )}

        {/* ── Comparison Mode ── */}
        {state === "comparison" && (
          <motion.div key="comparison" {...pageTransition}>
            <ComparisonMode onBack={handleReset} />
          </motion.div>
        )}

        {/* ── Results Section ── */}
        {state === "results" && result && (
          <motion.div key="results" {...pageTransition}>
            <section ref={resultsRef} className={styles.resultsSection}>

              {/* Back button */}
              <div className={styles.backBar}>
                <button className={styles.backBtn} onClick={handleReset}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back
                </button>
              </div>
              {/* Product info banner */}
              {product && product.name && (
                <ScrollReveal>
                  <div className={styles.productBanner}>
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
                </ScrollReveal>
              )}

              {/* Score Display */}
              <div ref={scoreCardRef}>
                <ScoreDisplay
                  score={result.eco_score}
                  verdict={result.verdict}
                  confidence={result.confidence}
                />

                {/* Sub-scores bar */}
                <ScrollReveal>
                  <div className={styles.subScores}>
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
                                ? "#00c96b"
                                : sub.value >= 5
                                ? "#d4a017"
                                : "#dc2626",
                          }}
                        >
                          {sub.value}
                        </span>
                        <span className={styles.subScoreWeight}>{sub.weight}</span>
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              </div>

              {/* Flags */}
              {result.flags && result.flags.length > 0 && (
                <ScrollReveal>
                  <div className={styles.flags}>
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
                </ScrollReveal>
              )}

              {/* ── Bento Grid ── */}
              <div className="bento-grid">
                {/* Materials Card — 2 columns */}
                <ScrollReveal delay={0} className="bento-card span-2">
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                    <h3 className={styles.cardTitle}>
                      <span className={styles.cardIcon}>🧵</span>
                      Material Composition
                    </h3>
                    <MaterialChart materials={result.materials} />
                  </motion.div>
                </ScrollReveal>

                {/* Vagueness Meter */}
                <ScrollReveal delay={0.1} className="bento-card">
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                    <h3 className={styles.cardTitle}>
                      <span className={styles.cardIcon}>🔍</span>
                      Language Clarity
                    </h3>
                    <VaguenessMeter
                      score={result.breakdown.vagueness_score}
                      phrases={result.vagueness_phrases}
                    />
                  </motion.div>
                </ScrollReveal>

                {/* Certifications */}
                <ScrollReveal delay={0.2} className="bento-card">
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                    <h3 className={styles.cardTitle}>
                      <span className={styles.cardIcon}>🏷️</span>
                      Certifications
                    </h3>
                    <CertificationCard certifications={result.certifications} />
                  </motion.div>
                </ScrollReveal>

                {/* Buzzword Radar — 2 columns */}
                <ScrollReveal delay={0.3} className="bento-card span-2 row-2">
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                    <h3 className={styles.cardTitle}>
                      <span className={styles.cardIcon}>🎯</span>
                      Greenwashing Radar
                    </h3>
                    <BuzzwordRadar buzzwords={result.buzzwords} />
                  </motion.div>
                </ScrollReveal>

                {/* Carbon Timeline — 2 columns */}
                <ScrollReveal delay={0.4} className="bento-card span-2">
                  <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
                    <h3 className={styles.cardTitle}>
                      <span className={styles.cardIcon}>📈</span>
                      Brand Carbon Footprint
                    </h3>
                    <CarbonTimeline brandData={result.brand_data} />
                  </motion.div>
                </ScrollReveal>
              </div>

              {/* Reset & Share buttons */}
              <div className={styles.resetSection}>
                <ShareButton
                  data={{
                    product: product || {},
                    score: result.eco_score,
                    verdict: result.verdict,
                    breakdown: result.breakdown,
                  }}
                  scoreCardRef={scoreCardRef}
                />
                <button className={styles.resetBtn} onClick={handleReset}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Scan Another Product
                </button>
              </div>
            </section>

            {/* ── FAQ (visible in results) ── */}
            <FAQSection />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <Footer />

      {/* ── Scan History Panel ── */}
      <AnimatePresence>
        {showHistory && (
          <ScanHistoryPanel
            onSelectScan={handleSelectScan}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
