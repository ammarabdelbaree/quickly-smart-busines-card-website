import React, { useState } from "react";

function FirstScanPage({ tagId, verificationCode, onProceed }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2s
    }
  };

  return (
    <div className="page first-scan-page animate-fade-in">
      <header className="hero-section">
        <div className="nfc-icon-wrapper">
          <span className="nfc-animation-ring"></span>
        </div>
        <h1>Welcome to <strong className="brand">Quickly</strong></h1>
        <p className="subtitle">Your smart digital journey starts here.</p>
      </header>

      <section className="info-card">
        <p className="tag-id-display">
          Tag Detected: <strong>{tagId.toUpperCase()}</strong>
        </p>

        {verificationCode ? (
          <div className="verification-container">
            <label>Security Verification Code:</label>
            <div className="code-display-group">
              <span className="code-text">{verificationCode}  </span>
              <button 
                className={`copy-btn ${copied ? 'copied' : ''}`} 
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {copied ? <i class="fa-solid fa-check"></i> : <i class="fa-regular fa-copy"></i>}
              </button>
            </div>
            <p className="note-paragraph">
              <strong>Keep this code handy!</strong> <br />You will need it in the next step to prove ownership of this tag.
            </p>
          </div>
        ) : (
          <div className="error-box">
            <p className="warning">
              ⚠️ Verification code not found.
            </p>
            <p>Please refresh the page or try scanning the tag again.</p>
          </div>
        )}
      </section>

      <footer className="action-footer">
        <button 
          className="btn primary-btn large-btn" 
          onClick={onProceed}
          disabled={!verificationCode}
        >
          Claim My Tag
        </button>
        <p className="secure-text">Secure end-to-end activation</p>
      </footer>
    </div>
  );
}

export default FirstScanPage;