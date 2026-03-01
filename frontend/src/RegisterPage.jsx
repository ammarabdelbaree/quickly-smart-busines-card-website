import React, { useState } from "react";
import axios from "axios";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function RegisterPage({ tagId, onAdminCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCreating, setIsCreating] = useState(true); // Default to new user for NFC activation
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const validateForm = () => {
    if (!email.includes("@")) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (!verificationCode) return "Verification code is required to claim this tag.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Claim Tag via Backend
      // This links the tagId to the UID in Firestore and creates/verifies the user
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/claim-tag`,
        {
          tagId,
          code: verificationCode.trim().toUpperCase(),
          email: email.toLowerCase(),
          password,
          isExistingUser: !isCreating, 
        }
      );

      // 2. Establish Firebase Session on the Client
      await signInWithEmailAndPassword(auth, email, password);

      // 3. Callback to App.jsx to re-fetch tag data and move to SetupPage
      onAdminCreated();
      
    } catch (err) {
      console.error("Claim Error:", err);
      const serverMsg = err.response?.data?.error;
      
      // User-friendly error mapping
      if (serverMsg === "INVALID_CODE") setErrorMsg("The verification code is incorrect.");
      else if (serverMsg === "EMAIL_IN_USE") setErrorMsg("An account with this email already exists.");
      else if (serverMsg === "TAG_ALREADY_CLAIMED") setErrorMsg("This tag has already been claimed by someone else.");
      else setErrorMsg(serverMsg || "Email or password are incorrect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page animate-fade-in">
      <div className="auth-card">
        <header className="auth-header">
          <h2>{isCreating ? 'Activate Your Card' : 'Sign In to Admin'}</h2>
          <p className="auth-subtitle">
            {isCreating 
              ? "Create your admin account to manage this card." 
              : "Login with your existing account to claim this new card."}
          </p>
        </header>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group highlight">
            <label>Security Verification Code</label>
            <input
              type="text"
              placeholder="Enter the 6-digit code"
              className="code-input"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
              className="pass-input"
                type={showPassword ? "text" : "password"}
                placeholder={isCreating ? "Create a strong password" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <i className="fa-regular fa-eye"></i> :  <i className="fa-regular fa-eye-slash"></i>}
              </button>
            </div>
          </div>

          <button className="btn primary-btn submit-btn" type="submit" disabled={loading}>
            {loading ? (
              <span className="loader-dots">Processing...</span>
            ) : (
              isCreating ? "Activate Card" : "Login & Claim"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <button 
            className="text-btn" 
            onClick={() => {
              setIsCreating(!isCreating);
              setErrorMsg("");
            }}
          >
            {isCreating 
              ? 'Already have a Quickly account? Log in' 
              : "New user? Create an account instead"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;