// FirstScanPage.jsx
import { useTranslation } from "../LanguageContext";

export default function FirstScanPage({ tagId, onProceed }) {
  const { t } = useTranslation();
  const s = t.firstScan;

  return (
    <div className="page first-scan-page animate-fade-in">
      <header className="hero-section">
        <div className="nfc-icon-wrapper">
          <span className="nfc-animation-ring"></span>
        </div>
        <h1>{s.welcomePrefix} <strong className="brand">{t.common.brand}</strong></h1>
        <p className="subtitle">{s.subtitle}</p>
      </header>

      <section className="info-card">
        <p className="tag-id-display">
          {s.tagDetected} <strong>{tagId.toUpperCase()}</strong>
        </p>

        <div className="verification-container">
          <p>{s.keepCode}</p>
          <p className="note-paragraph">
            {s.keepCodeNote}
          </p>
        </div>
      </section>

      <footer className="action-footer">
        <button
          className="btn primary-btn large-btn"
          onClick={onProceed}
        >
          {s.claimTag}
        </button>
      </footer>
    </div>
  );
}
