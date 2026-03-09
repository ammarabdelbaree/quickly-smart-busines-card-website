import React, { useState, useEffect } from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaTelegram, FaSnapchat, FaYoutube, FaLink } from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { TiDeleteOutline } from "react-icons/ti";
import axios from "axios";
import { auth, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
          name: serverData.name || "",
          title: serverData.title || "",
          phone: serverData.phone || "",
          email: serverData.email || "",
          phones: serverData.phones || [],
          emails: serverData.emails || [],
          description: serverData.description || "",
          links: serverData.links || [],
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

  const addSocial = (platform) => {
    setPageData({
      ...pageData,
      links: [
        ...pageData.links,
        { platform: platform, url: "", isCustomLink: platform === "link" }
      ]
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
              <input
                value={em.address}
                onChange={(e) => updateItem("emails", i, "address", e.target.value)}
              />
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
              <input
                value={ph.number}
                onChange={(e) => updateItem("phones", i, "number", e.target.value)}
              />
              <button onClick={() => removeItem("phones", i)} className="remove-btn">
                <TiDeleteOutline size={30} />
              </button>
            </div>
          )
        )}
      </div>

      {/* Links */}
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