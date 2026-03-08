// FirstScanPage.jsx
import { useState } from "react";
import { useTranslation } from "../LanguageContext";

export default function FirstScanPage({ tagId, verificationCode, onProceed }) {
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();
  const s = t.firstScan;

  const handleCopy = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

        {verificationCode ? (
          <div className="verification-container">
            <p>{s.securityCode} <span className="code-text" style={{fontSize: '23px'}}>{verificationCode}&nbsp;&nbsp;</span></p>
            <div className="code-display-group">

              <button
                className={`copy-btn ${copied ? "copied" : ""}`}
                onClick={handleCopy}
                title={s.copyTitle}
              >
                {copied
                  ? <i className="fa-solid fa-check"></i>
                  : <i className="fa-regular fa-copy"></i>}
              </button>
            </div>
            <p className="note-paragraph">
              {/* <strong>{s.keepCode}</strong> */}
              {/* <br /> */}
              {s.keepCodeNote}
            </p>
          </div>
        ) : (
          <div className="error-box">
            <p className="warning">{s.noCode}</p>
            <p>{s.noCodeHelp}</p>
          </div>
        )}
      </section>

      <footer className="action-footer">
        <button
          className="btn primary-btn large-btn"
          onClick={onProceed}
          disabled={!verificationCode}
        >
          {s.claimTag}
        </button>
        <p className="secure-text">{s.secureText}</p>
      </footer>
    </div>
  );
}