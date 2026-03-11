// AdminLoginPage.jsx
import React, { useState } from "react";
import { supabase } from "./supabase";
import { useTranslation } from "../LanguageContext";

function AdminLoginPage({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");

  const { t } = useTranslation();
  const s = t.adminLogin;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) { setErrorMsg(s.errors.emptyFields); return; }

    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setErrorMsg(s.errors.emailNotConfirmed);
        } else if (error.message.includes("Invalid login")) {
          setErrorMsg(s.errors.invalidCredential);
        } else {
          setErrorMsg(s.errors.generic);
        }
        setLoading(false);
        return;
      }
      onLoginSuccess();
    } catch {
      setErrorMsg(s.errors.generic);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setForgotError(s.errors.invalidEmail);
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    setForgotMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
      if (error) {
        setForgotError(s.errors.resetFailed);
      } else {
        setForgotMsg(s.resetEmailSent);
        setForgotEmail("");
      }
    } catch {
      setForgotError(s.errors.resetFailed);
    } finally {
      setForgotLoading(false);
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

        {/* Forgot Password */}
        <div className="login-footer">
          <button
            className="text-btn"
            onClick={() => { setShowForgot(!showForgot); setForgotMsg(""); setForgotError(""); }}
          >
            {s.forgotPassword}
          </button>
        </div>

        {showForgot && (
          <div className="forgot-password-box">
            {forgotMsg ? (
              <p className="success-inline">{forgotMsg}</p>
            ) : (
              <form onSubmit={handleForgotPassword} className="forgot-form">
                <p className="forgot-hint">{s.forgotHint}</p>
                {forgotError && <div className="error-banner">{forgotError}</div>}
                <div className="form-group">
                  <input
                    type="email"
                    placeholder={s.emailPlaceholder}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn primary-btn" disabled={forgotLoading}>
                  {forgotLoading ? t.common.processing : s.sendResetEmail}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminLoginPage;
