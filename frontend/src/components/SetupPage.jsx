// SetupPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTranslation } from "../LanguageContext";

function SetupPage({ tagId, onSave, onLogout }) {
  const { t } = useTranslation();
  const s = t.setup;

  const [pageData, setPageData] = useState({
    title: "", name: "", phone: "", description: "",
    email: "", socialMedia: [], links: [],
  });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setFetching(true);
        const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/card/${tagId}`);
        let serverData = res.data || {};
        const draftJson = localStorage.getItem(`setup_draft_${tagId}`);
        if (draftJson) {
          const draft = JSON.parse(draftJson);
          serverData = { ...serverData, ...draft.pageData };
          setProfilePicFile(draft.profilePic || null);
          setCoverPhotoFile(draft.coverPhoto || null);
        } else {
          setProfilePicFile(res.data?.profilePic || null);
          setCoverPhotoFile(res.data?.coverPhoto || null);
        }
        setPageData({
          name: serverData.name || "", title: serverData.title || "",
          phone: serverData.phone || "", email: serverData.email || "",
          description: serverData.description || "",
          socialMedia: serverData.socialMedia || [], links: serverData.links || [],
        });
      } catch {
        const draftJson = localStorage.getItem(`setup_draft_${tagId}`);
        if (draftJson) {
          const draft = JSON.parse(draftJson);
          setPageData(draft.pageData);
          setProfilePicFile(draft.profilePic || null);
          setCoverPhotoFile(draft.coverPhoto || null);
        }
      } finally {
        setFetching(false);
      }
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

  const uploadImage = async (file, folder) => {
    if (!file) return "";
    if (typeof file === "string" && file.startsWith("https://")) return file;
    const imageRef = ref(storage, `${folder}/${auth.currentUser.uid}-${Date.now()}-${file.name}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const savePage = async () => {
    if (!auth.currentUser) return setErrorMsg(s.errors.notLoggedIn);
    if (!pageData.name || !pageData.phone) return setErrorMsg(s.errors.missingFields);
    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      const token = await auth.currentUser.getIdToken();
      const profilePicUrl = await uploadImage(profilePicFile, "profile-pics");
      const coverPhotoUrl = await uploadImage(coverPhotoFile, "cover-photos");
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/save-page`, {
        token, tagId, pageData, profilePic: profilePicUrl, coverPhoto: coverPhotoUrl,
      });
      localStorage.removeItem(`setup_draft_${tagId}`);
      setSuccessMsg(s.successMsg);
      setTimeout(() => onSave(), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || s.errors.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (list) => setPageData({ ...pageData, [list]: [...pageData[list], { platform: "", text: "", url: "" }] });
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
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <button onClick={onLogout} className="logout-btn"
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>
            {t.common.viewProfile}
          </button>
        </div>
      </nav>

      <h2>{s.title}</h2>

      {/* Profile Picture */}
      <div className="form-group">
        <label>{s.profilePicLabel}</label>
        {profilePicFile && (
          <img
            src={typeof profilePicFile === "string" ? profilePicFile : URL.createObjectURL(profilePicFile)}
            alt="Profile" style={imgPreviewStyle(true)}
          />
        )}
        <input type="file" accept="image/*" onChange={(e) => setProfilePicFile(e.target.files[0])} />
      </div>

      {/* Cover Photo */}
      <div className="form-group">
        <label>{s.coverPhotoLabel}</label>
        {coverPhotoFile && (
          <img
            src={typeof coverPhotoFile === "string" ? coverPhotoFile : URL.createObjectURL(coverPhotoFile)}
            alt="Cover" style={imgPreviewStyle(false)}
          />
        )}
        <input type="file" accept="image/*" onChange={(e) => setCoverPhotoFile(e.target.files[0])} />
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
        <label>{s.emailLabel}</label>
        <input value={pageData.email} onChange={(e) => setPageData({ ...pageData, email: e.target.value })} />
      </div>
      <div className="form-group">
        <label>{s.phoneLabel}</label>
        <input value={pageData.phone} onChange={(e) => setPageData({ ...pageData, phone: e.target.value })} />
      </div>

      {/* Social Media */}
      <section className="setup-section">
        <div className="section-header">
          <h3>{s.socialMediaTitle}</h3>
          <button className="add-btn" onClick={() => addItem("socialMedia")}>{s.addBtn}</button>
        </div>
        {pageData.socialMedia.map((sm, i) => (
          <div key={i} className="dynamic-row">
            <select value={sm.platform} onChange={(e) => updateItem("socialMedia", i, "platform", e.target.value)}>
              <option value="">{s.platformPlaceholder}</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter/X</option>
              <option value="TikTok">TikTok</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
            <input placeholder={s.urlPlaceholder} value={sm.url} onChange={(e) => updateItem("socialMedia", i, "url", e.target.value)} />
            <button onClick={() => removeItem("socialMedia", i)} className="remove-btn">×</button>
          </div>
        ))}
      </section>

      {/* Custom Links */}
      <section className="setup-section">
        <div className="section-header">
          <h3>{s.customLinksTitle}</h3>
          <button className="add-btn" onClick={() => addItem("links")}>{s.addBtn}</button>
        </div>
        {pageData.links.map((ln, i) => (
          <div key={i} className="dynamic-row">
            <input placeholder={s.linkLabelPlaceholder} value={ln.text} onChange={(e) => updateItem("links", i, "text", e.target.value)} />
            <input placeholder={s.linkUrlPlaceholder} value={ln.url} onChange={(e) => updateItem("links", i, "url", e.target.value)} />
            <button onClick={() => removeItem("links", i)} className="remove-btn">×</button>
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