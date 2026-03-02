import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Components
import Home from "./Home";
import FirstScanPage from "./FirstScanPage";
import RegisterPage from "./RegisterPage";
import AdminLoginPage from "./AdminLoginPage";
import SetupPage from "./SetupPage";
import PublicPage from "./PublicPage";
import AdminPanel from "./AdminPanel";
import LandingChoicePage from "./LandingChoicePage";

// Keep CSS intact
import "./App.css";

const VIEWS = {
  LOADING: "loading",
  ERROR: "error",
  DEACTIVATED: "deactivated",   // ← NEW
  HOME: "home",
  FIRST_SCAN: "first-scan",
  REGISTER: "register",
  LOGIN: "login",
  SETUP: "setup",
  PUBLIC: "public",
};

function App() {
  const [view, setView] = useState(VIEWS.LOADING);
  const [tagData, setTagData] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [showChoice, setShowChoice] = useState(false);
  const [closingChoice, setClosingChoice] = useState(false);

  // =============================
  // Extract tagId from URL
  // =============================
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const firstSegment = pathParts[0] || null;

  const isAdminPanel = window.location.pathname === "/admin";
  const tagId = !isAdminPanel ? firstSegment : null;

  // =============================
  // Smooth Close Overlay
  // =============================
  const closeChoiceSmoothly = (callback) => {
    setClosingChoice(true);
    setTimeout(() => {
      setShowChoice(false);
      setClosingChoice(false);
      if (callback) callback();
    }, 300);
  };

  // =============================
  // Fetch Tag Data from Backend
  // =============================
  const fetchTag = useCallback(async () => {
    if (!tagId) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/tag/${tagId}`
      );
      setTagData(response.data);
    } catch (error) {
      console.error("Fetch failed:", error.response?.status, error.message);
      setView(VIEWS.ERROR);
    }
  }, [tagId]);

  // =============================
  // Auth Listener
  // =============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoaded(true);
    });
    return unsubscribe;
  }, []);

  // =============================
  // Initial Fetch
  // =============================
  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  // =============================
  // Decision Engine
  // =============================
  useEffect(() => {
    if (isAdminPanel) return;

    if (!tagId) {
      setView(VIEWS.HOME);
      return;
    }

    if (!authLoaded || !tagData) return;

    // ← NEW: tag is deactivated
    if (tagData.status === "deactivated") {
      setView(VIEWS.DEACTIVATED);
      return;
    }

    // Tag exists but unclaimed
    if (!tagData.ownerId && !tagData.isSetup) {
      setView(VIEWS.FIRST_SCAN);
      return;
    }

    // Claimed but not setup
    if (tagData.ownerId && !tagData.isSetup) {
      if (user && user.uid === tagData.ownerId) {
        setView(VIEWS.SETUP);
      } else {
        setView(VIEWS.LOGIN);
      }
      return;
    }

    // Fully setup
    if (tagData.isSetup) {
      setView(VIEWS.PUBLIC);
    }
  }, [authLoaded, tagData, user, tagId, isAdminPanel]);

  // =============================
  // Open overlay only when entering PUBLIC
  // =============================
  useEffect(() => {
    if (view === VIEWS.PUBLIC) {
      setShowChoice(true);
    }
  }, [view]);

  // =============================
  // Body Scroll Control
  // =============================
  useEffect(() => {
    if (showChoice) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [showChoice]);

  // =============================
  // Admin Panel — FIRST, before loading/error
  // =============================
  if (isAdminPanel) {
    return <AdminPanel />;
  }

  // =============================
  // Loading / Error
  // =============================
  if (view === VIEWS.LOADING) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Initializing Quickly...</p>
      </div>
    );
  }

  if (view === VIEWS.ERROR) {
    return (
      <div className="error-screen">
        <h1 style={{ fontSize: "7rem", textAlign: "center" }}>404</h1>
        <p style={{ fontSize: "1.5rem", textAlign: "center" }}>
          This is not the page you are looking for.
        </p>
      </div>
    );
  }

  // ← NEW: Deactivated screen
  if (view === VIEWS.DEACTIVATED) {
    return (
      <div className="error-screen">
        <h1 style={{ fontSize: "4rem", textAlign: "center" }}>⚠️</h1>
        <p style={{ fontSize: "1.5rem", textAlign: "center", fontWeight: "700" }}>
          This tag is currently inactive.
        </p>
        <p style={{ fontSize: "1rem", textAlign: "center", color: "#64748b" }}>
          Please contact support to reactivate it.
        </p>
      </div>
    );
  }

  // =============================
  // Render Main App
  // =============================
  return (
    <div className="app-shell">
      <div className="app-container">
        {view === VIEWS.HOME && <Home />}

        {view === VIEWS.FIRST_SCAN && (
          <FirstScanPage
            tagId={tagId}
            verificationCode={tagData?.code}
            onProceed={() => setView(VIEWS.REGISTER)}
          />
        )}

        {view === VIEWS.REGISTER && (
          <RegisterPage tagId={tagId} code={tagData?.code} onAdminCreated={() => fetchTag()} />
        )}

        {view === VIEWS.LOGIN && (
          <AdminLoginPage
            onLoginSuccess={() => fetchTag()}
            onBack={() => setView(VIEWS.PUBLIC)}
          />
        )}

        {view === VIEWS.SETUP && (
          <SetupPage
            tagId={tagId}
            onSave={() => setView(VIEWS.PUBLIC)}
            onLogout={async () => {
              await auth.signOut();
              setView(VIEWS.PUBLIC);
            }}
          />
        )}

        {view === VIEWS.PUBLIC && (
          <>
            <PublicPage
              tagId={tagId}
              onBack={() => (user ? setView(VIEWS.SETUP) : setView(VIEWS.LOGIN))}
              onAdminLogin={() => setShowChoice(true)}
              handleRetry={() => (user ? setView(VIEWS.SETUP) : setView(VIEWS.LOGIN))}
            />

            {showChoice && (
              <LandingChoicePage
                tagId={tagId}
                closing={closingChoice}
                onGuest={() => closeChoiceSmoothly()}
                onAdmin={() =>
                  closeChoiceSmoothly(() =>
                    user ? setView(VIEWS.SETUP) : setView(VIEWS.LOGIN)
                  )
                }
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
