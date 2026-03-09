import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaTelegram, FaSnapchat, FaYoutube, FaLink, FaPhoneAlt } from "react-icons/fa";
import { FaXTwitter, FaThreads } from "react-icons/fa6";
import { HiOutlineMail } from "react-icons/hi";
import PropTypes from "prop-types";
import axios from "axios";
import QRCode from "qrcode";
import { useTranslation } from "../LanguageContext";
import "../style/PublicPage.css";

const PublicPage = React.memo(({ tagId, onAdminLogin, onBack, handleRetry }) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const { t } = useTranslation();
  const s = t.public;

  const getIcon = useCallback((platform) => {
    const platformName = platform?.toLowerCase().trim();
    const iconMap = {
      "facebook": <FaFacebook size={24} />,
      "instagram": <FaInstagram size={24} />,
      "linkedin": <FaLinkedin size={24} />,
      "whatsapp": <FaWhatsapp size={24} />,
      "instapay": <img className="sm-icons add-btn" style={{ width: "22px", height: "22px" }} src="https://upload.wikimedia.org/wikipedia/commons/2/20/InstaPay_Logo.png" alt="instapay" />,
      "telegram": <FaTelegram size={24} />,
      "snapchat": <FaSnapchat size={24} />,
      "twitter": <FaXTwitter size={24} />,
      "threads": <FaThreads size={24} />,
      "youtube": <FaYoutube size={24} />,
      "phone": <FaPhoneAlt size={24} />,
      "email": <HiOutlineMail size={33} />,
    };
    return iconMap[platformName] || <FaLink size={24} />;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/card/${tagId}`);
      setData(res.data);
    } catch (err) {
      setErrorMsg(s.errorMsg);
    } finally {
      setLoading(false);
    }
    const options = {
      width: 500, margin: 3,
      color: { dark: "#eceff4e6", light: "#f5f5f506" },
      errorCorrectionLevel: "H",
    };
    const qr = await QRCode.toDataURL(window.location.href, options);
    setQrCodeUrl(qr);
  }, [tagId, s.errorMsg]);
  
  useEffect(() => { fetchData(); }, [fetchData]);

  const downloadQrCode = useCallback(() => {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${data.name || "quickly-qr-code"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrCodeUrl, data.name]);

  const generateVCard = useMemo(() => {
    if (!data.name) return "";

    const phones = (data.phones || [])
      .map((ph) => `TEL;TYPE=CELL:${ph.number}`)
      .join("\n");

    const emails = (data.emails || [])
      .map((em) => `EMAIL:${em.address}`)
      .join("\n");

    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${data.name}`,
      `TITLE:${data.title || ""}`,
      phones,
      emails,
      `NOTE:${data.description || ""}`,
      "END:VCARD",
    ].filter(Boolean).join("\n");
  }, [data]);

  const downloadVCard = () => {
    if (!generateVCard) return;
    const blob = new Blob([generateVCard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${data.name || "contact"}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: data.name, text: `Check out ${data.name}'s Quickly Card`, url: window.location.href });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert(s.linkCopied);
      } catch {}
    }
  };

  // Build deduplicated list of all phones
  const allPhones = useMemo(() => {
    const phones = data.phones || [];
    if (!phones.length && data.phone) return [{ number: data.phone }];
    return phones.filter((ph) => ph.number && ph.number.trim() !== "");
  }, [data.phones, data.phone]);

  // Build deduplicated list of all emails
  const allEmails = useMemo(() => {
    const emails = data.emails || [];
    if (!emails.length && data.email) return [{ address: data.email }];
    return emails.filter((em) => em.address && em.address.trim() !== "");
  }, [data.emails, data.email]);

  const ContactGrid = () => (
    <div className="contact-grid" role="group" aria-label="Direct contacts">
      <div className="phones">
      {allPhones.map((ph, i) => (
        <a
          key={`phone-${i}`}
          href={`tel:${ph.number}`}
          className="contact-item"
          aria-label={`Call ${data.name}${allPhones.length > 1 ? ` (${i + 1})` : ""}`}
        >
          <div className="icon-box add-btn">{getIcon("phone")}</div>
          <span>{ph.number}</span>
        </a>
      ))}
      </div>
      <div className="emails">
      {allEmails.map((em, i) => (
        <a
          key={`email-${i}`}
          href={`mailto:${em.address}`}
          className="contact-item"
          aria-label={`Email ${data.name}${allEmails.length > 1 ? ` (${i + 1})` : ""}`}
        >
          <div className="icon-box add-btn">{getIcon("email")}</div>
          <span>{em.address}</span>
        </a>
      ))}
      </div>
    </div>
  );

  const Links = () => (
    <div className="links-list" role="list">
      {data.links?.map((sm, index) => (
        <a key={index} href={`${sm.url}`} target="_blank" rel="noopener noreferrer" className="custom-link-card">
          <div className="link-icon add-btn">{getIcon(sm.platform)}</div>
          <span className="link-text">{sm.label || sm.platform}</span>
          <span className="link-arrow">→</span>
        </a>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="card-wrapper skeleton-wrapper animate-pulse">
        <div className="skeleton-cover"></div>
        <div className="card-content">
          <div className="profile-container"><div className="skeleton-avatar"></div></div>
          <div className="identity-section">
            <div className="skeleton-text h-title"></div>
            <div className="skeleton-text h-subtitle"></div>
          </div>
          <div className="skeleton-text h-bio"></div>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="error-page">
        <h1>{errorMsg}</h1>
        <button onClick={handleRetry} className="btn primary-btn">{t.common.retry}</button>
      </div>
    );
  }

  return (
    <div className="public-page-container animate-fade-in">
      <div className="card-wrapper animate-fade-in">
        <div className="cover-photo"
          style={{ backgroundImage: `url(${data.coverPhoto || "/default-cover.jpg"})` }}
          role="img" aria-label="Cover photo">
        </div>
          <div className="profile-container">
            <img
              src={data.profilePic || "/imgs/default-avatar.png"}
              alt={`${data.name} profile`} className="profile-pic lazy-load"
              loading="lazy" onLoad={(e) => e.currentTarget.classList.add("loaded")}
            />
          </div>
        <div className="card-content">
          <div className="identity-section">
            <h1 className="user-name">{data.name}</h1>
            {data.title && <p className="user-title">{data.title}</p>}
          </div>
          {data.description && <div className="bio-section"><p>{data.description}</p></div>}
          <div className="action-buttons">
            <button onClick={downloadVCard} className="save-contact-btn">{s.saveContact}</button>
          </div>
          <ContactGrid />
          <Links />
          {qrCodeUrl && (
            <>
            <div className="divider-gradient"></div>
            <div className="qr-section">
              <img src={qrCodeUrl} alt="QR Code" className="qr-code" />
              <div className="qr-links">
                <p onClick={handleShare} style={{ cursor: "pointer" }}>{s.shareProfile}</p>
                <p onClick={downloadQrCode} style={{ cursor: "pointer" }}>{s.downloadQr}</p>
              </div>
            </div>
            </>
          )}
          <div className="login-footer">
            <button className="admin-btn" onClick={onBack}>{s.adminEdit}</button>
          </div>
          <div className="footer-branding">
            <p>{t.common.poweredBy} <strong>{t.common.brand}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
});

PublicPage.propTypes = {
  tagId: PropTypes.string.isRequired,
  onAdminLogin: PropTypes.func,
  onBack: PropTypes.func.isRequired,
};

export default PublicPage;