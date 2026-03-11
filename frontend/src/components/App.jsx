// App.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { supabase } from "./supabase";

import { LanguageProvider, useTranslation } from "../LanguageContext";
import LanguageSwitcher from "../LanguageSwitcher";

import Home from "./Home";
import FirstScanPage from "./FirstScanPage";
import RegisterPage from "./RegisterPage";
import AdminLoginPage from "./AdminLoginPage";
import SetupPage from "./SetupPage";
import PublicPage from "./PublicPage";
import AdminPanel from "./AdminPanel";

import "../style/App.css";

const VIEWS = {
  LOADING: "loading",
  ERROR: "error",
  DEACTIVATED: "deactivated",
  HOME: "home",
  FIRST_SCAN: "first-scan",
  REGISTER: "register",
  LOGIN: "login",
  SETUP: "setup",
  PUBLIC: "public",
};

let isPublic = false;

function AppInner() {
  const { t } = useTranslation();
  const s = t.app;

  const [view, setView] = useState(VIEWS.LOADING);
  const [tagData, setTagData] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const firstSegment = pathParts[0] || null;
  const isAdminPanel = window.location.pathname === "/admin";
  const tagId = !isAdminPanel ? firstSegment : null;

  const fetchTag = useCallback(async () => {
    if (!tagId) return;
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/tag/${tagId}`
      );
      setTagData(response.data);
    } catch {
      setView(VIEWS.ERROR);
    }
  }, [tagId]);

  // Listen to Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { fetchTag(); }, [fetchTag]);

  useEffect(() => {
    if (isAdminPanel) return;
    if (!tagId) { setView(VIEWS.HOME); return; }
    if (!authLoaded || !tagData) return;

    if (tagData.status === "deactivated") { setView(VIEWS.DEACTIVATED); return; }
    if (!tagData.ownerId && !tagData.isSetup) { setView(VIEWS.FIRST_SCAN); return; }
    if (tagData.ownerId && !tagData.isSetup) {
      setView(user && user.id === tagData.ownerId ? VIEWS.SETUP : VIEWS.LOGIN);
      return;
    }
    if (tagData.isSetup) { setView(VIEWS.PUBLIC); isPublic = true; }
  }, [authLoaded, tagData, user, tagId, isAdminPanel]);

  if (isAdminPanel) return <AdminPanel />;

  if (view === VIEWS.LOADING) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>{s.initializing}</p>
      </div>
    );
  }

  if (view === VIEWS.ERROR) {
    return (
      <div className="error-screen">
        <h1 style={{ fontSize: "7rem", textAlign: "center" }}>404</h1>
        <p style={{ fontSize: "1.5rem", textAlign: "center" }}>{s.notFound}</p>
      </div>
    );
  }

  if (view === VIEWS.DEACTIVATED) {
    return (
      <div className="error-screen">
        <h1 style={{ fontSize: "4rem", textAlign: "center" }}>⚠️</h1>
        <p style={{ fontSize: "1.5rem", textAlign: "center", fontWeight: "700" }}>
          {s.tagInactive}
        </p>
        <p style={{ fontSize: "1rem", textAlign: "center", color: "#64748b" }}>
          {s.tagInactiveHelp}
        </p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-container">
        {view === VIEWS.HOME && <Home />}
        {view === VIEWS.FIRST_SCAN && (
          <FirstScanPage tagId={tagId} onProceed={() => setView(VIEWS.REGISTER)} />
        )}
        {view === VIEWS.REGISTER && (
          <RegisterPage tagId={tagId} onAdminCreated={() => fetchTag()} />
        )}
        {view === VIEWS.LOGIN && (
          <AdminLoginPage onLoginSuccess={() => fetchTag()} onBack={() => setView(VIEWS.PUBLIC)} />
        )}
        {view === VIEWS.SETUP && (
          <SetupPage tagId={tagId} onSave={() => setView(VIEWS.PUBLIC)} onLogout={() => setView(VIEWS.PUBLIC)} />
        )}
        {view === VIEWS.PUBLIC && (
          <PublicPage
            tagId={tagId}
            onBack={() => (user ? setView(VIEWS.SETUP) : setView(VIEWS.LOGIN))}
            handleRetry={() => (user ? setView(VIEWS.SETUP) : setView(VIEWS.LOGIN))}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  const isAdminPanel = window.location.pathname === "/admin";
  return (
    <LanguageProvider defaultLang={isPublic ? "en" : "ar"}>
      {!isAdminPanel && (
        <div style={{ position: "fixed", top: 12, right: 12, zIndex: 9999 }}>
          <LanguageSwitcher />
        </div>
      )}
      <AppInner />
    </LanguageProvider>
  );
}

export default App;
