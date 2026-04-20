"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./FAQSection.module.css";

const FAQ_ITEMS = [
  {
    question: "How does the eco-score work?",
    answer:
      "VÉRA uses a weighted scoring system across four factors: Materials (35%), Buzzwords (25%), Certifications (20%), and Vagueness (20%). Each factor is analyzed using NLP and scored from 0 to 10, then combined into a final eco-score that reflects how genuine a product's sustainability claims are.",
  },
  {
    question: "What is greenwashing?",
    answer:
      "Greenwashing is when fashion brands use deceptive or misleading eco-marketing to appear more environmentally friendly than they actually are. This includes vague claims like \"eco-friendly\" or \"sustainable\" without evidence, overemphasizing minor green initiatives, or using misleading certifications.",
  },
  {
    question: "Which retailers are supported?",
    answer:
      "VÉRA supports major fast-fashion retailers including H&M, Zara, ASOS, SHEIN, Nike, Adidas, and Uniqlo. You can also paste a URL from any public product page, or paste the product description text directly for analysis.",
  },
  {
    question: "Is my data private?",
    answer:
      "Yes. VÉRA does not store any of your data on our servers. All analysis happens in real-time — we scrape the product page, analyze it, and return the results. Nothing is saved. Your scan history is stored locally in your browser only.",
  },
  {
    question: "How accurate are the scores?",
    answer:
      "VÉRA uses NLP-based analysis to evaluate sustainability claims. While our scoring provides a useful signal, it should be used as guidance rather than a definitive judgment. We recommend cross-referencing with official certification databases for important purchasing decisions.",
  },
  {
    question: "Can I paste text instead of a URL?",
    answer:
      "Absolutely! Switch to the \"Text\" tab in the scanner input and paste the product description directly. This is useful when a URL doesn't work or when you want to analyze text from any source.",
  },
];

/**
 * FAQ accordion section with smooth Framer Motion animations.
 * Only one item can be open at a time.
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
      <div className={styles.faqList}>
        {FAQ_ITEMS.map((item, index) => (
          <div key={index} className={styles.faqItem}>
            <button
              className={styles.question}
              onClick={() => handleToggle(index)}
              aria-expanded={openIndex === index}
            >
              <span className={styles.questionText}>{item.question}</span>
              <motion.span
                className={styles.chevron}
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                ▾
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  className={styles.answerWrapper}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className={styles.answer}>{item.answer}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
