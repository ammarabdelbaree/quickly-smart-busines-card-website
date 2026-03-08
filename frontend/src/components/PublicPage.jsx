import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import QRCodeStyling from "qr-code-styling";
import { useTranslation } from "../LanguageContext";
import "../style/PublicPage.css";

const PublicPage = React.memo(({ tagId, onAdminLogin, onBack, handleRetry }) => {

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const qrRef = useRef(null);
  const qrInstance = useRef(null);

  const { t } = useTranslation();
  const s = t.public;

  /* ---------------- ICONS ---------------- */

  const getIcon = useCallback((platform) => {
    const platformName = platform?.toLowerCase().trim();

    const iconMap = {
      facebook: "/icons/facebook.png",
      instagram: "/icons/instagram.png",
      linkedin: "/icons/linkedin.png",
      twitter: "/icons/twitter.png",
      x: "/icons/twitter.png",
      tiktok: "/icons/tiktok.png",
      whatsapp: "/icons/whatsapp.png",
      phone: "/icons/phone.png",
      email: "/icons/email.png",
      link: "/icons/link.png",
      instapay: "/icons/instapay.png",
    };

    return iconMap[platformName] || "/icons/link.png";
  }, []);

  /* ---------------- FETCH DATA ---------------- */

  const fetchData = useCallback(async () => {
    try {

      setLoading(true);
      setErrorMsg("");

      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/card/${tagId}`
      );

      setData(res.data);

    } catch (err) {

      setErrorMsg(s.errorMsg);

    } finally {

      setLoading(false);

    }
  }, [tagId, s.errorMsg]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- QR CODE ---------------- */

  useEffect(() => {

    if (!qrRef.current) return;

    qrInstance.current = new QRCodeStyling({

      width: 250,
      height: 250,
      data: window.location.href,
      image: "/imgs/logo.png",
      margin: 5,

      qrOptions: {
        errorCorrectionLevel: "H",
      },

      dotsOptions: {
        color: "#111",
        type: "classy-rounded",
      },

      cornersSquareOptions: {
        type: "extra-rounded",
      },

      cornersDotOptions: {
        type: "dot",
      },

      backgroundOptions: {
        color: "#ffffff",
      },

      imageOptions: {
        crossOrigin: "anonymous",
        margin: 6,
        imageSize: 0.3,
      },

    });

    qrInstance.current.append(qrRef.current);

  }, []);

  const downloadQrCode = useCallback(() => {

    if (qrInstance.current) {

      qrInstance.current.download({
        name: data.name || "quickly-qr",
        extension: "png",
      });

    }

  }, [data.name]);

  /* ---------------- VCARD ---------------- */

  const generateVCard = useMemo(() => {

    if (!data.name) return "";

    return `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
TITLE:${data.title || ""}
TEL;TYPE=CELL:${data.phone || ""}
EMAIL:${data.email || ""}
NOTE:${data.description || ""}
END:VCARD`;

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

  /* ---------------- SHARE ---------------- */

  const handleShare = async () => {

    if (navigator.share) {

      try {

        await navigator.share({
          title: data.name,
          text: `Check out ${data.name}'s Quickly Card`,
          url: window.location.href,
        });

      } catch {}

    } else {

      try {

        await navigator.clipboard.writeText(window.location.href);
        alert(s.linkCopied);

      } catch {}

    }

  };

  /* ---------------- CONTACT GRID ---------------- */

  const ContactGrid = () => (

    <div className="contact-grid">

      {data.phone && (
        <a href={`tel:${data.phone}`} className="contact-item">
          <div className="icon-box phone">
            <img src={getIcon("phone")} alt="Phone" className="sp-icon" />
          </div>
          <span>{s.call}</span>
        </a>
      )}

      {data.email && (
        <a href={`mailto:${data.email}`} className="contact-item">
          <div className="icon-box email">
            <img src={getIcon("email")} alt="Email" className="sp-icon" />
          </div>
          <span>{s.email}</span>
        </a>
      )}

      {data.socialMedia?.find((sm) => sm.platform === "whatsapp") && (
        <a
          href={data.socialMedia.find((sm) => sm.platform === "whatsapp").url}
          className="contact-item"
        >
          <div className="icon-box whatsapp">
            <img src={getIcon("whatsapp")} alt="WhatsApp" className="icon" />
          </div>
          <span>WhatsApp</span>
        </a>
      )}

    </div>

  );

  /* ---------------- SOCIAL LINKS ---------------- */

  const SocialLinks = () => (

    <div className="links-list">

      {data.socialMedia
        ?.filter((sm) => sm.platform !== "whatsapp")
        .map((sm, index) => (

          <a
            key={index}
            href={`https://${sm.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="custom-link-card"
          >

            <div className="link-icon">
              <img src={getIcon(sm.platform)} alt={sm.platform} className="icon" />
            </div>

            <span className="link-text">{sm.platform}</span>
            <span className="link-arrow">→</span>

          </a>

        ))}

    </div>

  );

  /* ---------------- LOADING ---------------- */

  if (loading) {

    return (
      <div className="card-wrapper skeleton-wrapper">
        <div className="skeleton-cover"></div>
      </div>
    );

  }

  /* ---------------- ERROR ---------------- */

  if (errorMsg) {

    return (
      <div className="error-page">
        <h1>{errorMsg}</h1>
        <button onClick={handleRetry} className="btn primary-btn">
          {t.common.retry}
        </button>
      </div>
    );

  }

  /* ---------------- PAGE ---------------- */

  return (

    <div className="public-page-container">

      <div className="card-wrapper">

        <div
          className="cover-photo"
          style={{
            backgroundImage: `url(${data.coverPhoto || "/default-cover.jpg"})`,
          }}
        ></div>

        <div className="card-content">

          <div className="profile-container">
            <img
              src={data.profilePic || "/imgs/default-avatar.png"}
              alt={`${data.name} profile`}
              className="profile-pic"
              loading="lazy"
            />
          </div>

          <div className="identity-section">
            <h1 className="user-name">{data.name}</h1>
            {data.title && <p className="user-title">{data.title}</p>}
          </div>

          {data.description && (
            <div className="bio-section">
              <p>{data.description}</p>
            </div>
          )}

          <div className="action-buttons">
            <button onClick={downloadVCard} className="save-contact-btn">
              {s.saveContact}
            </button>
          </div>

          <ContactGrid />
          <SocialLinks />

          {/* QR SECTION */}

          <div className="qr-section">

            <div ref={qrRef} className="qr-code"></div>

            <div className="qr-links">

              <p onClick={handleShare} style={{ cursor: "pointer" }}>
                {s.shareProfile}
              </p>

              <p onClick={downloadQrCode} style={{ cursor: "pointer" }}>
                {s.downloadQr}
              </p>

            </div>

          </div>

          <div className="login-footer">
            <button className="admin-btn" onClick={onBack}>
              {s.adminEdit}
            </button>
          </div>

          <div className="footer-branding">
            <p>
              {t.common.poweredBy} <strong>{t.common.brand}</strong>
            </p>
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