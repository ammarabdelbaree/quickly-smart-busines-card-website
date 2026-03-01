import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Components
import Home from "./Home";
import FirstScanPage from "./FirstScanPage";
import RegisterPage from "./RegisterPage";
import AdminLoginPage from "./AdminLoginPage";
import LandingChoicePage from "./LandingChoicePage";
import SetupPage from "./SetupPage";
import PublicPage from "./PublicPage";

import "./App.css";

const VIEWS = {
  LOADING: "loading",
  ERROR: "error",
  HOME: "home",
  FIRST_SCAN: "first-scan",
  REGISTER: "register",
  LOGIN: "login",
  LANDING_CHOICE: "choice",
  SETUP: "setup",
  PUBLIC: "public",
  CARDS: "cards",
  BUYNOW: "buy-now",
};

function App() {
  const [view, setView] = useState(VIEWS.LOADING);
  const [tagData, setTagData] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [showChoice, setShowChoice] = useState(false);
  const [closingChoice, setClosingChoice] = useState(false);

  // =============================
  // URL Logic
  // =============================

  const RESERVED_ROUTES = {
    REGISTER: "create-profile",
    CARDS: "cards",
    BUYNOW: "buy-now",
  };

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const firstSegment = pathParts[0] || null;

  const hasInvalidQuery =
    window.location.search &&
    window.location.search !== "" &&
    window.location.search !== "?";

  const isReservedRoute =
    firstSegment &&
    Object.values(RESERVED_ROUTES).includes(firstSegment);

  const urlParams = new URLSearchParams(window.location.search);
  const queryTagId = urlParams.get("tagId");

  const tagId =
    isReservedRoute && queryTagId
      ? queryTagId
      : !firstSegment && hasInvalidQuery
      ? "__INVALID__"
      : firstSegment;

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
  // Fetch Tag
  // =============================

  const fetchTag = useCallback(async () => {
    if (!firstSegment && hasInvalidQuery) {
      setView(VIEWS.ERROR);
      return;
    }

    if (isReservedRoute) {
      setView(firstSegment);
      return;
    }

    if (!firstSegment) {
      setView(VIEWS.HOME);
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/tag/${tagId}`
      );
      setTagData(response.data);
    } catch (error) {
      console.error("Fetch failed:", error);
      setView(VIEWS.ERROR);
    }
  }, [tagId, isReservedRoute, firstSegment, hasInvalidQuery]);

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
    if (isReservedRoute || !tagId) return;

    if (tagId === "__INVALID__") {
      setView(VIEWS.ERROR);
      return;
    }

    if (!authLoaded || !tagData) return;

    // Brand new tag
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
  }, [authLoaded, tagData, user, tagId, isReservedRoute]);

  // =============================
  // Open overlay only when entering PUBLIC
  // =============================

  useEffect(() => {
    if (view === VIEWS.PUBLIC) {
      setShowChoice(true);
    }
  }, [view]);

  // =============================
  // Body Scroll Control (CLEAN FIX)
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
        <h1>Error</h1>
        <p>Failed to load tag data.</p>
      </div>
    );
  }

  // =============================
  // Render
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
        <RegisterPage
          tagId={tagId}
          code={tagData?.code}
          onAdminCreated={() => fetchTag()}
        />
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
            onBack = {() => user
                    ? setView(VIEWS.SETUP)
                    : setView(VIEWS.LOGIN)}
            onAdminLogin={() => setShowChoice(true)}
            handleRetry = {() => user
                    ? setView(VIEWS.SETUP)
                    : setView(VIEWS.LOGIN)}
          />

          {showChoice && (
            <LandingChoicePage
              tagId={tagId}
              closing={closingChoice}
              onGuest={() => closeChoiceSmoothly()}
              onAdmin={() =>
                closeChoiceSmoothly(() =>
                  user
                    ? setView(VIEWS.SETUP)
                    : setView(VIEWS.LOGIN)
                )
              }
            />
          )}
        </>
      )}


      {/* Updated: Added rendering for reserved routes */}
      {/* {view === VIEWS.CARDS && <CardsPage tagId={tagId} />}  Pass tagId if needed */}
      {/* {view === VIEWS.BUYNOW && <BuyNowPage tagId={tagId} />}  Pass tagId if needed */}

      </div>
    </div>
  );
}

export default App;
