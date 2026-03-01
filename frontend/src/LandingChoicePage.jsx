import React from "react";

function LandingChoicePage({ onGuest, onAdmin, tagId, closing }) {
  return (
    <div className={`choice-overlay ${closing ? "closing" : ""}`}>
      <div className="choice-page">
        <header className="choice-header">
          <h1>Welcome to <strong>{tagId.toUpperCase()}</strong></h1>
        </header>

        <div className="choice-container">
          <div className="option-card visitor-option" onClick={onGuest}>
            <button className="btn btn-secondary">Open Profile</button>
          </div>

          <div className="option-card admin-option" onClick={onAdmin}>
            <button className="btn primary-btn">Edit Profile</button>
          </div>
        </div>

        <footer className="choice-footer">
          <p>Powered by <strong>Quickly</strong></p>
        </footer>
      </div>
    </div>
  );
}

export default LandingChoicePage;