      import React, { useEffect, useState } from "react";
      import axios from "axios";
      import { 
      FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaWhatsapp, 
      FaPhone, FaEnvelope, FaGlobe, FaShareAlt, FaUserDownload, FaLock 
      } from "react-icons/fa";
      import { FaXTwitter } from "react-icons/fa6"; // New X logo
      import "./PublicPage.css"; // We will create this below

      function PublicPage({ tagId, onAdminLogin }) {
      const [data, setData] = useState({});
      const [loading, setLoading] = useState(true);
      const [errorMsg, setErrorMsg] = useState("");

      useEffect(() => {
      const fetchData = async () => {
      try {
      setLoading(true);
      // Simulator for demo purposes - Remove setTimeout in production
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/card/${tagId}`);
      setData(res.data);

      // --- MOCK DATA FOR PREVIEW (Replace with your actual API call above) ---
      setTimeout(() => {
      setData({
      name: "Alex J. Quickly",
      title: "Senior Product Designer",
      description: "Building digital experiences that matter. Let's connect and build something great together.",
      phone: "+1234567890",
      email: "alex@quickly.com",
      coverPhoto: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
      profilePic: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      socialMedia: [
      { platform: "linkedin", url: "#" },
      { platform: "x", url: "#" },
      { platform: "instagram", url: "#" }
      ],
      links: [
      { text: "View Portfolio", url: "https://google.com" },
      { text: "Book a Meeting", url: "https://calendly.com" }
      ]
      });
      setLoading(false);
      }, 1000); 
      // -------------------------------------------------------------

      } catch (err) {
      setErrorMsg("This Quickly profile isn't active yet.");
      setLoading(false);
      }
      };
      fetchData();
      }, [tagId]);

      // --- Dynamic Icon Mapping ---
      const getSocialIcon = (platform) => {
      const p = platform?.toLowerCase().trim();
      switch (p) {
      case "facebook": return <FaFacebook />;
      case "instagram": return <FaInstagram />;
      case "linkedin": return <FaLinkedin />;
      case "twitter": return <FaTwitter />;
      case "x": return <FaXTwitter />;
      case "whatsapp": return <FaWhatsapp />;
      default: return <FaGlobe />;
      }
      };

      // --- vCard Generation ---
      const downloadVCard = () => {
      const vcard = `BEGIN:VCARD
      VERSION:3.0
      FN:${data.name || 'Quickly User'}
      TITLE:${data.title || ''}
      TEL;TYPE=CELL:${data.phone || ''}
      EMAIL:${data.email || ''}
      NOTE:${data.description || ''}
      URL:${window.location.href}
      END:VCARD`;

      const blob = new Blob([vcard], { type: "text/vcard" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${(data.name || 'contact').replace(/\s+/g, '_')}.vcf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      };

      // --- Native Share ---
      const handleShare = async () => {
      if (navigator.share) {
      try {
      await navigator.share({
      title: data.name,
      text: `Check out ${data.name}'s Quickly Card`,
      url: window.location.href,
      });
      } catch (error) {
      console.log('Error sharing', error);
      }
      } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
      }
      };

      // --- Skeleton Loader Component ---
      const Skeleton = () => (
      <div className="skeleton-wrapper animate-pulse">
      <div className="skeleton-cover"></div>
      <div className="skeleton-avatar"></div>
      <div className="skeleton-text h-title"></div>
      <div className="skeleton-text h-subtitle"></div>
      <div className="skeleton-text h-bio"></div>
      <div className="skeleton-actions"></div>
      </div>
      );

      if (loading) return <Skeleton />;
      if (errorMsg) return <div className="error-page"><div className="error-card">⚠️ {errorMsg}</div></div>;

      return (
      <div className="public-page-container fade-in">

      {/* Admin Login Floating Button */}
      {onAdminLogin && (
      <button className="admin-btn" onClick={onAdminLogin} aria-label="Edit Profile">
      <FaLock size={14} /> Edit
      </button>
      )}

      <div className="card-wrapper">
      {/* Cover Photo */}
      <div 
      className="cover-photo" 
      style={{ backgroundImage: `url(${data.coverPhoto || '/default-cover.jpg'})` }}
      ></div>

      <div className="card-content">
      {/* Profile Picture */}
      <div className="profile-container">
      <img 
      src={data.profilePic || "/default-avatar.png"} 
      alt={data.name} 
      className="profile-pic" 
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

      {/* Primary Actions (Sticky/Prominent) */}
      <div className="action-buttons">
      <button onClick={downloadVCard} className="btn-primary">
      <FaUserDownload /> Save Contact
      </button>
      <button onClick={handleShare} className="btn-secondary">
      <FaShareAlt /> Share
      </button>
      </div>

      {/* Direct Contact Grid */}
      <div className="contact-grid">
      {data.phone && (
      <a href={`tel:${data.phone}`} className="contact-item">
      <div className="icon-box phone"><FaPhone /></div>
      <span>Call</span>
      </a>
      )}
      {data.email && (
      <a href={`mailto:${data.email}`} className="contact-item">
      <div className="icon-box email"><FaEnvelope /></div>
      <span>Email</span>
      </a>
      )}
      {data.socialMedia?.some(sm => sm.platform === 'whatsapp') && (
      <a href={data.socialMedia.find(sm => sm.platform === 'whatsapp').url} className="contact-item">
      <div className="icon-box whatsapp"><FaWhatsapp /></div>
      <span>WhatsApp</span>
      </a>
      )}
      </div>

      {/* Social Media Row */}
      {data.socialMedia?.length > 0 && (
      <div className="social-row">
      {data.socialMedia.filter(sm => sm.platform !== 'whatsapp').map((sm, index) => (
      <a 
      key={index} 
      href={sm.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="social-pill"
      >
      {getSocialIcon(sm.platform)}
      </a>
      ))}
      </div>
      )}

      {/* Custom Links (Linktree Style) */}
      {data.links?.length > 0 && (
      <div className="links-list">
      {data.links.map((link, index) => (
      <a 
      key={index} 
      href={link.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="custom-link-card"
      >
      <div className="link-icon"><FaGlobe /></div>
      <span className="link-text">{link.text}</span>
      <span className="link-arrow">→</span>
      </a>
      ))}
      </div>
      )}

      <div className="footer-branding">
      <p>Powered by <strong>Quickly</strong></p>
      </div>
      </div>
      </div>
      </div>
      );
      }

      export default PublicPage;