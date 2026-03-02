import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPanel.css";

const API = process.env.REACT_APP_API_BASE_URL;

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
function Badge({ tag }) {
  if (!tag.isActive) return <span className="ap-badge deactivated">Deactivated</span>;
  if (tag.isSetup)   return <span className="ap-badge active">Active</span>;
  if (tag.ownerId)   return <span className="ap-badge claimed">Claimed</span>;
  return               <span className="ap-badge unclaimed">Unclaimed</span>;
}

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [secret, setSecret]   = useState("");
  const [error, setError]     = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const attempt = async () => {
    if (!secret.trim()) return;
    setLoading(true);
    try {
      await axios.post(
        `${API}/admin/login`,
        {},
        { headers: { "x-admin-secret": secret } }
      );
      onLogin(secret);
    } catch (err) {
      setError("Invalid admin secret.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") attempt(); };

  return (
    <div className="ap-login-wrapper">
      <div className={`ap-login-card ${shaking ? "shake" : ""}`}>
        <div className="ap-lock-icon">🔐</div>
        <h2 className="ap-login-title">Admin Access</h2>
        <p className="ap-login-sub">Enter your admin secret to continue</p>
        <input
          type="password"
          className="ap-input"
          placeholder="Admin secret"
          value={secret}
          onChange={(e) => { setSecret(e.target.value); setError(""); }}
          onKeyDown={handleKey}
          autoFocus
        />
        {error && <p className="ap-error-txt">{error}</p>}
        <button className="ap-btn-primary" onClick={attempt} disabled={loading}>
          {loading ? "Checking..." : "Enter Panel"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────
function Panel({ secret }) {
  const authHeaders = { headers: { "x-admin-secret": secret } };

  const [tags, setTags]         = useState([]);
  const [search, setSearch]     = useState("");
  const [newTagId, setNewTagId] = useState("");
  const [msg, setMsg]           = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/tags`, authHeaders);
      setTags(res.data.tags || []);
    } catch (err) {
      flash(`Failed to load tags: ${err.response?.data?.error || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const createTag = async () => {
    const id = newTagId.trim().toLowerCase();
    if (!id) return flash("Please enter a Tag ID.", "error");
    try {
      const res = await axios.post(`${API}/admin/create-tag`, { tagId: id }, authHeaders);
      flash(`✅ Tag "${id}" created!`, "success");
      setNewTagId("");
      fetchTags();
    } catch (err) {
      flash(`❌ ${err.response?.data?.error || err.message}`, "error");
    }
  };

  const deactivateTag = async (tagId) => {
    if (!window.confirm(`Deactivate "${tagId}"? Users will see a "contact support" message.`)) return;
    try {
      await axios.post(`${API}/admin/deactivate-tag`, { tagId }, authHeaders);
      flash(`Tag "${tagId}" deactivated.`, "success");
      fetchTags();
    } catch (err) {
      flash(`❌ ${err.response?.data?.error || err.message}`, "error");
    }
  };

  const reactivateTag = async (tagId) => {
    try {
      await axios.post(`${API}/admin/reactivate-tag`, { tagId }, authHeaders);
      flash(`✅ Tag "${tagId}" reactivated.`, "success");
      fetchTags();
    } catch (err) {
      flash(`❌ ${err.response?.data?.error || err.message}`, "error");
    }
  };

  // Search by Tag ID or phone number
  const filtered = tags.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.tagId.toLowerCase().includes(q) ||
      (t.phone && t.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="ap-panel-wrapper">
      <div className="ap-panel">

        {/* Header */}
        <div className="ap-header">
          <h1 className="ap-header-title">Admin Panel</h1>
          <span className="ap-header-count">{tags.length} tags total</span>
        </div>

        {/* Flash message */}
        {msg && (
          <div className={`ap-flash ${msg.type}`}>{msg.text}</div>
        )}

        {/* Create new tag */}
        <div className="ap-section">
          <h3 className="ap-section-title">Create New Tag</h3>
          <div className="ap-row">
            <input
              className="ap-input"
              placeholder="Enter Tag ID"
              value={newTagId}
              onChange={(e) => setNewTagId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTag()}
            />
            <button className="ap-btn-primary" onClick={createTag}>Create</button>
          </div>
        </div>

        {/* Search */}
        <div className="ap-section">
          <h3 className="ap-section-title">All Tags</h3>
          <input
            className="ap-input"
            placeholder="Search by Tag ID or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tag list */}
        <div className="ap-table-wrapper">
          {loading ? (
            <p className="ap-empty-txt">Loading tags...</p>
          ) : filtered.length === 0 ? (
            <p className="ap-empty-txt">No tags found.</p>
          ) : (
            <table className="ap-table">
              <thead>
                <tr>
                  {["Tag ID", "Status", "Phone", "Owner", "Setup", "Actions"].map((h) => (
                    <th key={h} className="ap-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tag) => (
                  <tr key={tag.tagId} className="ap-tr">
                    <td className="ap-td"><code className="ap-code">{tag.tagId}</code></td>
                    <td className="ap-td"><Badge tag={tag} /></td>
                    <td className="ap-td">
                      <span className="ap-subtle">{tag.phone || "—"}</span>
                    </td>
                    <td className="ap-td"><span className="ap-subtle">{tag.ownerId ? "Yes" : "—"}</span></td>
                    <td className="ap-td"><span className="ap-subtle">{tag.isSetup ? "✓" : "—"}</span></td>
                    <td className="ap-td">
                      {tag.isActive ? (
                        <button className="ap-btn-danger" onClick={() => deactivateTag(tag.tagId)}>
                          Deactivate
                        </button>
                      ) : (
                        <button className="ap-btn-success" onClick={() => reactivateTag(tag.tagId)}>
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT: login gate
// ─────────────────────────────────────────────
function AdminPanel() {
  const [secret, setSecret] = useState(null);
  if (!secret) return <LoginScreen onLogin={(s) => setSecret(s)} />;
  return <Panel secret={secret} />;
}

export default AdminPanel;