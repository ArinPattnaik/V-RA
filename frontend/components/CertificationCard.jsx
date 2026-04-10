"use client";

import styles from "./CertificationCard.module.css";

export default function CertificationCard({ certifications }) {
  if (!certifications || certifications.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>🏷️</span>
        <p>No certifications referenced</p>
        <span className={styles.emptySubtext}>
          Legitimate products typically reference independent certifications
        </span>
      </div>
    );
  }

  const legitimate = certifications.filter((c) => c.legitimate);
  const fake = certifications.filter((c) => !c.legitimate);

  return (
    <div className={styles.container}>
      {legitimate.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>✓</span>
            <span className={styles.sectionTitle}>Verified Certifications</span>
          </div>
          {legitimate.map((cert, i) => (
            <div key={i} className={styles.cert}>
              <div className={styles.certHeader}>
                <span className={`${styles.certName} ${styles.certNameGreen}`}>
                  {cert.name}
                </span>
                <span className={styles.certStrength}>
                  {cert.strength}/10
                </span>
              </div>
              <p className={styles.certDesc}>{cert.description}</p>
            </div>
          ))}
        </div>
      )}

      {fake.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIconRed}>✗</span>
            <span className={styles.sectionTitle}>Self-Invented Labels</span>
          </div>
          {fake.map((cert, i) => (
            <div key={i} className={`${styles.cert} ${styles.certFake}`}>
              <div className={styles.certHeader}>
                <span className={`${styles.certName} ${styles.certNameRed}`}>
                  {cert.name}
                </span>
                <span className={styles.certStrength}>
                  {cert.strength}/10
                </span>
              </div>
              <p className={styles.certDesc}>{cert.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
