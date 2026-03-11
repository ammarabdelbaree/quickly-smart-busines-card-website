// Home.jsx
import React from "react";
import { useTranslation } from "../LanguageContext";
import "../style/Home.css";
import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { MdQrCode2 } from "react-icons/md";

function Home() {
  const { t } = useTranslation();
  const s = t.home;
  const base = process.env.REACT_APP_API_BASE_URL;

  const handleCreateAccount = (e) => {
    const input = e.target.closest(".third").querySelector("input[type='email']");
    const email = input?.value?.trim();
    if (!email || !email.includes("@")) {
      input?.focus();
      return;
    }
    window.location.href = `${base}/create-profile?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="home-page">
      <nav>
        <ul>
          <li className="logo">
            <a href={base}><h1>{t.common.brand}</h1></a>
          </li>
          <li className="sub-page"><a href={base}>{s.nav.home}</a></li>
          <li className="sub-page"><a href={`${base}/create-profile`}>{s.nav.createProfile}</a></li>
          <li className="sub-page"><a href={`${base}/cards`}>{s.nav.cards}</a></li>
          <li className="nav-btn"><a href={`${base}/buy-now`}>{s.nav.buyNow}</a></li>
        </ul>
      </nav>

      <div className="content">
        <div className="first">
          <div className="img-section" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MdQrCode2 size={180} style={{ color: "var(--primary)", opacity: 0.85 }} />
          </div>
          <div className="first-content">
            <h1>{t.common.brand}</h1>
            <p>{s.hero.tagline}</p>
          </div>
        </div>

        <div className="second" id="second"></div>

        <div className="third">
          <h2>{s.cta.title}</h2>
          <label>{s.cta.emailLabel}</label>
          <input type="email" placeholder={s.cta.emailPlaceholder} required />
          <button onClick={handleCreateAccount}>{s.cta.createAccount}</button>
        </div>
      </div>

      <div className="footer-divider"></div>
      <footer>
        <div className="copyrights">
          <p>{s.footer.copyright}</p>
        </div>
        <div className="right-footer">
          <div className="sm-accounts">
            <div><a href="https://www.instagram.com/theammaarr/" target="_blank" rel="noreferrer"><FaInstagram size={22} /></a></div>
            <div><a href="https://www.facebook.com/theammaarr/" target="_blank" rel="noreferrer"><FaFacebook size={22} /></a></div>
            <div><a href="https://wa.me/201027540334" target="_blank" rel="noreferrer"><FaWhatsapp size={22} /></a></div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
