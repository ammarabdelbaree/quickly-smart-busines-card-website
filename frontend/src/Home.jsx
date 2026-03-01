import React, { useState } from "react";

import "./Home.css"

function Home() {
  return (
    <div className="home-page">
      <nav>
        <ul>
          <li className="logo">
            <a href={process.env.REACT_APP_API_BASE_URL}><h1>Quickly</h1></a>
          </li>
          <li className="sub-page"><a href={process.env.REACT_APP_API_BASE_URL}>HOME</a></li>
          <li className="sub-page">
            <a href={process.env.REACT_APP_API_BASE_URL + "/create-profile"}>CREATE PROFILE</a>
          </li>
          <li className="sub-page"><a href={process.env.REACT_APP_API_BASE_URL + "/cards"}>CARDS</a></li>
          <li className="nav-btn">
            <a href={process.env.REACT_APP_API_BASE_URL + "/buy-now"}>Buy Now</a>
          </li>
        </ul>
      </nav>

      <div className="content">
        <div className="first">
          <div className="img-section">
            <img src="../imgs/.png" alt="sample" />
          </div>
          <div className="first-content">
            <h1>Quickly</h1>
            <p>
              Quickly lets you create and share your smart digital business card
              instantly via NFC.
            </p>
          </div>
        </div>

        <div className="second" id="second"></div>

        <div className="third">
          <h2>Create your own Quickly profile</h2>
          <p>description</p>
          <label>Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value="{email}"
            required
          />
          <button>Create Account</button>
        </div>
      </div>
      <div className="footer-divider"></div>
      <footer>
        <div className="copyrights">
          <p className="copyrights">© Quickly 2024</p>
        </div>
        <div className="right-footer">
          <div className="sm-accounts">
            <div>
              <a href="https://www.instagram.com/theammaarr/" target="_blank">
                <img
                  src="../icons/instagram.png"
                  alt="instagram account"
                />
              </a>
            </div>
            <div>
              <a href="https://www.facebook.com/theammaarr/" target="_blank">
                <img
                  src="../icons/facebook.png"
                  alt="facebook account"
                />
              </a>
            </div>
            <div>
              <a href="https://wa.me/201027540334" target="_blank">
                <img
                  src="../icons/whatsapp.png"
                  alt="whatsapp account"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home;