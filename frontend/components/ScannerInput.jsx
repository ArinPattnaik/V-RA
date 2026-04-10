"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./ScannerInput.module.css";

const DEMO_PRODUCTS = [
  { id: "demo-1", name: "H&M — Conscious Choice T-Shirt", tag: "Greenwashed" },
  { id: "demo-2", name: "Patagonia — Organic Cotton Tee", tag: "Genuine" },
  { id: "demo-3", name: "SHEIN — EcoWave Wide Leg Pants", tag: "Heavy Greenwash" },
  { id: "demo-4", name: "Zara — Join Life Textured Blazer", tag: "Mixed Signals" },
];

export default function ScannerInput({ onAnalyze, isLoading }) {
  const [mode, setMode] = useState("url"); // url | text | demo
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current && mode !== "demo") {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "url" && url.trim()) {
      onAnalyze({ url: url.trim() });
    } else if (mode === "text" && text.trim()) {
      onAnalyze({ text: text.trim() });
    }
  };

  const handleDemo = (productId) => {
    onAnalyze({ demo: productId });
  };

  return (
    <div className={styles.container}>
      {/* Mode Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === "url" ? styles.tabActive : ""}`}
          onClick={() => setMode("url")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Paste URL
        </button>
        <button
          className={`${styles.tab} ${mode === "text" ? styles.tabActive : ""}`}
          onClick={() => setMode("text")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Paste Text
        </button>
        <button
          className={`${styles.tab} ${mode === "demo" ? styles.tabActive : ""}`}
          onClick={() => setMode("demo")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Demo Mode
        </button>
      </div>

      {/* URL Mode */}
      {mode === "url" && (
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <div className={`${styles.inputWrapper} ${isFocused ? styles.inputFocused : ""}`}>
            <div className={styles.inputIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Paste a product URL (H&M, Zara, ASOS, Nike, Adidas...)"
              className={styles.input}
              disabled={isLoading}
              id="url-input"
            />
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!url.trim() || isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  Scan
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
          <p className={styles.hint}>
            Supported: H&M, Zara, ASOS, SHEIN, Nike, Adidas, Uniqlo + any public product page
          </p>
        </form>
      )}

      {/* Text Mode */}
      {mode === "text" && (
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <div className={`${styles.textareaWrapper} ${isFocused ? styles.inputFocused : ""}`}>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Paste the product description, material information, and any sustainability claims here..."
              className={styles.textarea}
              rows={6}
              disabled={isLoading}
              id="text-input"
            />
          </div>
          <div className={styles.textActions}>
            <span className={styles.charCount}>{text.length} characters</span>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={text.trim().length < 10 || isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  Analyze Text
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Demo Mode */}
      {mode === "demo" && (
        <div className={styles.demoGrid}>
          {DEMO_PRODUCTS.map((product) => (
            <button
              key={product.id}
              className={styles.demoCard}
              onClick={() => handleDemo(product.id)}
              disabled={isLoading}
              id={`demo-${product.id}`}
            >
              <div className={styles.demoInfo}>
                <span className={styles.demoName}>{product.name}</span>
                <span className={`${styles.demoTag} ${
                  product.tag === "Genuine" ? styles.demoTagGreen :
                  product.tag === "Mixed Signals" ? styles.demoTagAmber :
                  styles.demoTagRed
                }`}>
                  {product.tag}
                </span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.demoArrow}>
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
