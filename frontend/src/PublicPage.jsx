import React, { useEffect, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types"; 
import axios from "axios";
import QRCode from "qrcode"; 

import "./PublicPage.css";

const PublicPage = React.memo(({ tagId, onAdminLogin, onBack, handleRetry}) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced icon mapping with more platforms
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

  // Fetch data with retry logic
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/card/${tagId}`);
      setData(res.data);
      // Generate QR code for sharing
      const qr = await QRCode.toDataURL(window.location.href);
      setQrCodeUrl(qr);
    } catch (err) {
      console.error("Error fetching card data:", err);
      setErrorMsg("This Quickly profile isn't active yet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [tagId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized vCard generation
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.name,
          text: `Check out ${data.name}'s Quickly Card`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Clipboard failed:", err);
      }
    }
  };

  // const handleRetry = () => {
  //   setRetryCount((prev) => prev + 1);
  //   fetchData();
  // };

  // Sub-components for modularity
  const ContactGrid = () => (
    <div className="contact-grid" role="group" aria-label="Direct contacts">
      {data.phone && (
        <a href={`tel:${data.phone}`} className="contact-item" aria-label={`Call ${data.name}`}>
          <div className="icon-box phone">
            <img src={getIcon("phone")} alt="Phone" className="sp-icon" />
          </div>
          <span>Call</span>
        </a>
      )}
      {data.email && (
        <a href={`mailto:${data.email}`} className="contact-item" aria-label={`Email ${data.name}`}>
          <div className="icon-box email">
            <img src={getIcon("email")} alt="Email" className="sp-icon" />
          </div>
          <span>Email</span>
        </a>
      )}
      {data.socialMedia?.find((sm) => sm.platform === "whatsapp") && (
        <a
          href={data.socialMedia.find((sm) => sm.platform === "whatsapp").url}
          className="contact-item"
          aria-label="WhatsApp"
        >
          <div className="icon-box whatsapp">
            <img src={getIcon("whatsapp")} alt="WhatsApp" className="icon" />
          </div>
          <span>WhatsApp</span>
        </a>
      )}
    </div>
  );

  const SocialLinks = () => (
    <div className="links-list" role="list" aria-label="Social media and links">
      {data.socialMedia
        ?.filter((sm) => sm.platform !== "whatsapp")
        .map((sm, index) => (
          <a
            key={index}
            href={`https://${sm.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="custom-link-card"
            aria-label={`Visit ${sm.platform}`}
          >
            <div className="link-icon">
              <img src={getIcon(sm.platform)} alt={sm.platform} className="icon" />
            </div>
            <span className="link-text">{sm.platform}</span>
            <span className="link-arrow">→</span>
          </a>
        ))}
      {data.links?.map((link, index) => (
        <a
          key={index}
          href={`https://${link.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="custom-link-card"
          aria-label={`Visit ${link.text}`}
        >
          <div className="link-icon">
            <img
              src={link.text.toLowerCase().includes("instapay") ? getIcon("instapay") : getIcon("link")}
              alt={link.text}
              className="icon"
            />
          </div>
          <span className="link-text">{link.text}</span>
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
          <div className="profile-container">
            <div className="skeleton-avatar"></div>
          </div>
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
        <button onClick={handleRetry} className="btn primary-btn" aria-label="Retry loading profile">
          Retry
        </button>
      </div>
    );
  }

  return (
      <div className={`public-page-container animate-fade-in`}>
      <div className="card-wrapper animate-fade-in">
        {/* Cover Photo with Lazy Loading */}
        <div
          className="cover-photo"
          style={{ backgroundImage: `url(${data.coverPhoto || "/default-cover.jpg"})` }}
          role="img"
          aria-label="Cover photo"
        ></div>

        <div className="card-content">
          {/* Profile Picture */}
          <div className="profile-container">
            <img
              src={data.profilePic || "/imgs/default-avatar.png"}
              alt={`${data.name} profile`}
              className="profile-pic lazy-load"
              loading="lazy"
              onLoad={(e) => e.currentTarget.classList.add("loaded")}
            />
          </div>

          {/* Identity */}
          <div className="identity-section">
            <h1 className="user-name">{data.name}</h1>
            {data.title && <p className="user-title">{data.title}</p>}
          </div>

          {/* Description */}
          {data.description && (
            <div className="bio-section">
              <p>{data.description}</p>
            </div>
          )}

          {/* Primary Actions */}
          <div className="action-buttons">
            <button onClick={downloadVCard} className="btn-secondary" aria-label="Download contact card">
              Save Contact
            </button>
            {/* <button onClick={handleShare} className="btn-secondary" aria-label="Share profile">
              Share
            </button> */}
          </div>


          <ContactGrid />
          <SocialLinks />

      {/* QR Code for Sharing */}
      {qrCodeUrl && (
        <div className="qr-section">
          <img src={qrCodeUrl} alt="QR Code for sharing" className="qr-code" onClick={handleShare} aria-label="Share profile"/>
          <p>Scan or click to share</p>
        </div>
      )}
          <div className="login-footer">
            <button className="admin-btn" onClick={onBack} aria-label="Admin login">
              Admin? Edit your profile.
            </button>
          </div>

          <div className="footer-branding">
            <p>Powered by <strong>Quickly</strong></p>
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