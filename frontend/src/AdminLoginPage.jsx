import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function AdminLoginPage({ onLoginSuccess, onBack}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const contactSupport = () => window.open("https://wa.me/1234567890", "_blank");

  const handleLogin = async (e) => {
    // Prevent default if called from a form submission
    if (e) e.preventDefault();
    
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err) {
      console.error("Login error:", err.code);
      // Map Firebase errors to user-friendly messages
      if (err.code === "auth/invalid-credential") {
        setErrorMsg("Incorrect email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many failed attempts. Try again later.");
      } else {
        setErrorMsg("Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="page admin-login-page animate-fade-in">

            <nav className="setup-nav">
           <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center'}}>
        <button onClick={onBack} className="logout-btn" style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.9rem'}}>↩ ‎ Return to Profile</button>
      </div>
        </nav>

           
      <div className="login-header">
        <h2>Admin Access</h2>
        <p>Manage your Quickly digital profile</p>
      </div>

      <div className="login-container">
        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
            className="pass-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn primary-btn" 
            disabled={loading}
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p onClick={contactSupport}>Don't remember your password? Contact support.</p>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;