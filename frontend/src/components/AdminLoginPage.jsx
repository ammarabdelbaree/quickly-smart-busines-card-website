// AdminLoginPage.jsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useTranslation } from "../LanguageContext";

function AdminLoginPage({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { t } = useTranslation();
  const s = t.adminLogin;

  const contactSupport = () => window.open("https://wa.me/1234567890", "_blank");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) { setErrorMsg(s.errors.emptyFields); return; }

    setLoading(true);
    setErrorMsg("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err) {
      if (err.code === "auth/invalid-credential") setErrorMsg(s.errors.invalidCredential);
      else if (err.code === "auth/too-many-requests") setErrorMsg(s.errors.tooManyRequests);
      else setErrorMsg(s.errors.generic);
      setLoading(false);
    }
  };

  return (
    <div className="page admin-login-page animate-fade-in">
      <nav className="setup-nav">
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
          <button
            onClick={onBack}
            className="logout-btn"
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}
          >
            {t.common.returnToProfile}
          </button>
        </div>
      </nav>

      <div className="login-header">
        <h2>{s.title}</h2>
        <p>{s.subtitle}</p>
      </div>

      <div className="login-container">
        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>{s.emailLabel}</label>
            <input
              type="email"
              placeholder={s.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>{s.passwordLabel}</label>
            <input
              className="pass-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn primary-btn" disabled={loading}>
            {loading ? t.common.verifying : s.signIn}
          </button>
        </form>

        <div className="login-footer">
          <p onClick={contactSupport} style={{ cursor: "pointer" }}>{s.forgotPassword}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;