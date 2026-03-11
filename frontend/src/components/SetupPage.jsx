// SetupPage.jsx
import React, { useState, useEffect } from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaTelegram, FaSnapchat, FaYoutube, FaLink } from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { TiDeleteOutline } from "react-icons/ti";
import axios from "axios";
import { supabase } from "./supabase";
import { useTranslation } from "../LanguageContext";

function SetupPage({ tagId, onSave, onLogout }) {
  const { t } = useTranslation();
  const s = t.setup;

  const [pageData, setPageData] = useState({
    name: "", title: "", phone: "", email: "", phones: [], emails: [], description: "", links: [],
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setFetching(true);

      // 1. Try server first — use authenticated /edit-data endpoint
      //    so we get data even before is_setup is true
      let serverData = null;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/edit-data/${tagId}`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        serverData = res.data || {};
      } catch {
        // Server unreachable — will fall back to draft
      }

      // 2. Load local draft (unsaved changes since last save)
      let draft = null;
      try {
        const draftJson = localStorage.getItem(`setup_draft_${tagId}`);
        if (draftJson) draft = JSON.parse(draftJson);
      } catch {
        localStorage.removeItem(`setup_draft_${tagId}`);
      }

      // 3. Merge: server is the base, draft overlays unsaved changes on top
      const base = serverData || {};
      const d = draft?.pageData || {};

      setPageData({
        name:        d.name        !== undefined ? d.name        : (base.name        || ""),
        title:       d.title       !== undefined ? d.title       : (base.title       || ""),
        phone:       d.phone       !== undefined ? d.phone       : (base.phone       || ""),
        email:       d.email       !== undefined ? d.email       : (base.email       || ""),
        description: d.description !== undefined ? d.description : (base.description || ""),
        phones: Array.isArray(d.phones) ? d.phones : (Array.isArray(base.phones) ? base.phones : []),
        emails: Array.isArray(d.emails) ? d.emails : (Array.isArray(base.emails) ? base.emails : []),
        links:  Array.isArray(d.links)  ? d.links  : (Array.isArray(base.links)  ? base.links  : []),
      });

      // Prefer draft pic (new local pick) over server URL
      setProfilePicFile(draft?.profilePic || base.profilePic || null);
      setCoverPhotoFile(draft?.coverPhoto  || base.coverPhoto  || null);

      setFetching(false);
    };
    loadData();
  }, [tagId]);

  useEffect(() => {
    if (!tagId) return;
    const handler = setTimeout(() => {
      const draft = {
        pageData,
        profilePic: typeof profilePicFile === "string" ? profilePicFile : null,
        coverPhoto: typeof coverPhotoFile === "string" ? coverPhotoFile : null,
      };
      localStorage.setItem(`setup_draft_${tagId}`, JSON.stringify(draft));
    }, 1000);
    return () => clearTimeout(handler);
  }, [tagId, pageData, profilePicFile, coverPhotoFile]);

  // Upload image to Supabase Storage
  const uploadImage = async (file, bucket) => {
    // null/undefined = no file picked, no change — return null so backend keeps existing URL
    if (!file) return null;
    // Already a URL = file unchanged — return it as-is
    if (typeof file === "string" && file.startsWith("https://")) return file;

    const { data: { user } } = await supabase.auth.getUser();
    const filePath = `${user.id}-${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const savePage = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setErrorMsg(s.errors.notLoggedIn);
    if (!pageData.name || !pageData.phone) return setErrorMsg(s.errors.missingFields);

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const profilePicUrl = await uploadImage(profilePicFile, "profile-pics");
      const coverPhotoUrl = await uploadImage(coverPhotoFile, "cover-photos");

      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/save-page`,
        { tagId, pageData, profilePic: profilePicUrl, coverPhoto: coverPhotoUrl },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      localStorage.removeItem(`setup_draft_${tagId}`);
      setSuccessMsg(s.successMsg);
      setTimeout(() => onSave(), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || s.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  const addSocial = (platform) => {
    setPageData({
      ...pageData,
      links: [...pageData.links, { platform, url: "", isCustomLink: platform === "link" }],
    });
  };

  const getIcon = (platform) => {
    switch (platform) {
      case "facebook": return <FaFacebook size={24} />;
      case "instagram": return <FaInstagram size={24} />;
      case "linkedin": return <FaLinkedin size={24} />;
      case "whatsapp": return <FaWhatsapp size={24} />;
      case "instapay": return <img className="sm-icons add-btn" style={{ width: "22px", height: "22px" }} src="https://upload.wikimedia.org/wikipedia/commons/2/20/InstaPay_Logo.png" alt="instapay" />;
      case "telegram": return <FaTelegram size={24} />;
      case "twitter": return <FaXTwitter size={24} />;
      case "threads": return <FaThreads size={24} />;
      case "snapchat": return <FaSnapchat size={24} />;
      case "youtube": return <FaYoutube size={24} />;
      default: return <FaLink size={24} />;
    }
  };

  const removeItem = (list, index) => {
    const newList = [...pageData[list]]; newList.splice(index, 1);
    setPageData({ ...pageData, [list]: newList });
  };

  const updateItem = (list, index, field, value) => {
    const newList = [...pageData[list]]; newList[index][field] = value;
    setPageData({ ...pageData, [list]: newList });
  };

  if (fetching) return <div>{t.common.loading}</div>;

  const imgPreviewStyle = (round) => ({
    width: round ? 80 : "100%", height: 80, borderRadius: round ? "50%" : 8,
    marginBottom: 10, objectFit: "cover",
  });

  return (
    <div className="page setup-page animate-fade-in">
      <nav className="setup-nav">
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
          <button onClick={onLogout} className="logout-btn"
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>
            {t.common.viewProfile}
          </button>
        </div>
      </nav>

      <h2>{s.title}</h2>

      <div className="form-group">
        <label>{s.profilePicLabel}</label>
        {profilePicFile && (
          <img
            src={typeof profilePicFile === "string" ? profilePicFile : URL.createObjectURL(profilePicFile)}
            alt="Profile" style={imgPreviewStyle(true)}
          />
        )}
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files[0];
          if (file && file.size > 1.5 * 1024 * 1024) {
            setErrorMsg(s.errors.imageTooLarge);
            e.target.value = "";
            return;
          }
          setProfilePicFile(file);
        }} />
      </div>

      <div className="form-group">
        <label>{s.coverPhotoLabel}</label>
        {coverPhotoFile && (
          <img
            src={typeof coverPhotoFile === "string" ? coverPhotoFile : URL.createObjectURL(coverPhotoFile)}
            alt="Cover" style={imgPreviewStyle(false)}
          />
        )}
        <input type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files[0];
          if (file && file.size > 1.5 * 1024 * 1024) {
            setErrorMsg(s.errors.imageTooLarge);
            e.target.value = "";
            return;
          }
          setCoverPhotoFile(file);
        }} />
      </div>

      <div className="form-group">
        <label>{s.nameLabel}</label>
        <input value={pageData.name} onChange={(e) => setPageData({ ...pageData, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>{s.titleFieldLabel}</label>
        <input value={pageData.title} onChange={(e) => setPageData({ ...pageData, title: e.target.value })} />
      </div>
      <div className="form-group">
        <label>{s.descriptionLabel}</label>
        <textarea value={pageData.description} onChange={(e) => setPageData({ ...pageData, description: e.target.value })} />
      </div>

      <div className="form-group">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label>{s.emailLabel}</label>
          <label
            style={{ textDecoration: "underline", fontSize: "12px", cursor: "pointer" }}
            onClick={() => setPageData({ ...pageData, emails: [...pageData.emails, { address: "" }] })}
          >
            {s.emailAddLabel}
          </label>
        </div>
        <input
          value={pageData.email}
          onChange={(e) => {
            const updatedEmails = [...pageData.emails];
            updatedEmails[0] = { address: e.target.value };
            setPageData({ ...pageData, email: e.target.value, emails: updatedEmails });
          }}
        />
        {pageData.emails.map((em, i) =>
          i === 0 ? null : (
            <div key={i} className="input-with-remove">
              <input value={em.address} onChange={(e) => updateItem("emails", i, "address", e.target.value)} />
              <button onClick={() => removeItem("emails", i)} className="remove-btn">
                <TiDeleteOutline size={30} />
              </button>
            </div>
          )
        )}
      </div>

      <div className="form-group">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label>{s.phoneLabel}</label>
          <label
            style={{ textDecoration: "underline", fontSize: "12px", cursor: "pointer" }}
            onClick={() => setPageData({ ...pageData, phones: [...pageData.phones, { number: "" }] })}
          >
            {s.phoneAddLabel}
          </label>
        </div>
        <input
          value={pageData.phone}
          onChange={(e) => {
            const updatedPhones = [...pageData.phones];
            updatedPhones[0] = { number: e.target.value };
            setPageData({ ...pageData, phone: e.target.value, phones: updatedPhones });
          }}
        />
        {pageData.phones.map((ph, i) =>
          i === 0 ? null : (
            <div key={i} className="input-with-remove">
              <input value={ph.number} onChange={(e) => updateItem("phones", i, "number", e.target.value)} />
              <button onClick={() => removeItem("phones", i)} className="remove-btn">
                <TiDeleteOutline size={30} />
              </button>
            </div>
          )
        )}
      </div>

      <section className="setup-section">
        <div className="section-header">
          <h3>{s.socialMediaTitle}</h3>
          <div className="sm-icons">
            <button className="add-btn" onClick={() => addSocial("facebook")}><FaFacebook size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("instagram")}><FaInstagram size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("linkedin")}><FaLinkedin size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("whatsapp")}><FaWhatsapp size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("instapay")}>{getIcon("instapay")}</button>
            <button className="add-btn" onClick={() => addSocial("telegram")}><FaTelegram size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("snapchat")}><FaSnapchat size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("twitter")}><FaXTwitter size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("threads")}><FaThreads size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("youtube")}><FaYoutube size={22} /></button>
            <button className="add-btn" onClick={() => addSocial("link")}><FaLink size={22} /></button>
          </div>
        </div>

        {pageData.links.map((sm, i) => (
          <div key={i} className="dynamic-row">
            <div className="sm-icons">
              <div className="add-btn sm-icons">{getIcon(sm.platform)}</div>
            </div>
            <>
              {sm.isCustomLink && (
                <input
                  placeholder={s.linkLabelPlaceholder}
                  value={sm.platform === "link" ? "" : sm.platform}
                  onChange={(e) => updateItem("links", i, "platform", e.target.value)}
                />
              )}
              <input
                placeholder={s.urlPlaceholder}
                value={sm.url}
                dir="ltr"
                style={{ textAlign: "left" }}
                onChange={(e) => updateItem("links", i, "url", e.target.value)}
              />
            </>
            <button onClick={() => removeItem("links", i)} className="remove-btn">
              <TiDeleteOutline size={30} />
            </button>
          </div>
        ))}
      </section>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      <button className="btn primary-btn" style={{ marginTop: "2rem" }} onClick={savePage} disabled={loading}>
        {loading ? t.common.saving : t.common.saveChanges}
      </button>
    </div>
  );
}

export default SetupPage;
