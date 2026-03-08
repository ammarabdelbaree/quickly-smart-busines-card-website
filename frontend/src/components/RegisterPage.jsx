// RegisterPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useTranslation } from "../LanguageContext";

function RegisterPage({ tagId, onAdminCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCreating, setIsCreating] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { t } = useTranslation();
  const s = t.register;

  const validateForm = () => {
    if (!email.includes("@")) return s.errors.invalidEmail;
    if (password.length < 6) return s.errors.shortPassword;
    if (!verificationCode) return s.errors.noCode;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) { setErrorMsg(validationError); return; }

    try {
      setLoading(true);
      setErrorMsg("");
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/claim-tag`, {
        tagId,
        code: verificationCode.trim().toUpperCase(),
        email: email.toLowerCase(),
        password,
        isExistingUser: !isCreating,
      });
      await signInWithEmailAndPassword(auth, email, password);
      onAdminCreated();
    } catch (err) {
      const serverMsg = err.response?.data?.error;
      if (serverMsg === "INVALID_CODE") setErrorMsg(s.errors.invalidCode);
      else if (serverMsg === "EMAIL_IN_USE") setErrorMsg(s.errors.emailInUse);
      else if (serverMsg === "TAG_ALREADY_CLAIMED") setErrorMsg(s.errors.tagClaimed);
      else setErrorMsg(serverMsg || s.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page animate-fade-in">
      <div className="auth-card">
        <header className="auth-header">
          <h2>{isCreating ? s.titleNew : s.titleExisting}</h2>
          <p className="auth-subtitle">{isCreating ? s.subtitleNew : s.subtitleExisting}</p>
        </header>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group highlight">
            <label>{s.codeLabel}</label>
            <input
              type="text"
              placeholder={s.codePlaceholder}
              className="code-input"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{s.emailLabel}</label>
            <input
              type="email"
              placeholder={s.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{s.passwordLabel}</label>
            <div className="password-wrapper">
              <input
                className="pass-input"
                type={showPassword ? "text" : "password"}
                placeholder={isCreating ? s.passwordPlaceholderNew : s.passwordPlaceholderExisting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword
                  ? <i className="fa-regular fa-eye"></i>
                  : <i className="fa-regular fa-eye-slash"></i>}
              </button>
            </div>
          </div>

          <button className="btn primary-btn submit-btn" type="submit" disabled={loading}>
            {loading
              ? <span className="loader-dots">{t.common.processing}</span>
              : (isCreating ? s.submitNew : s.submitExisting)}
          </button>
        </form>

        <div className="auth-footer">
          <button
            className="text-btn"
            onClick={() => { setIsCreating(!isCreating); setErrorMsg(""); }}
          >
            {isCreating ? s.switchToLogin : s.switchToRegister}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;