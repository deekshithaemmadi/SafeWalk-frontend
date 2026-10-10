import { Shield, ExternalLink, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div className="footer-top-grid">
          {/* Brand & Purpose */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="brand-badge small">
                <Shield size={18} />
              </div>
              <span className="footer-brand-title">SafeWalk</span>
            </div>
            <p className="footer-description">
              Women's travel safety and smart route comparison web application designed to support
              informed and confident journeys.
            </p>
            <div className="emergency-numbers-card">
              <span className="emergency-card-title">National Emergency Helplines (India):</span>
              <div className="helpline-tags">
                <span className="helpline-tag">Women Helpline: <strong>1091</strong></span>
                <span className="helpline-tag">Emergency: <strong>112</strong></span>
                <span className="helpline-tag">Police: <strong>100</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Navigation</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/plan">Plan Journey</Link>
              </li>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/emergency-contacts">Emergency Contacts</Link>
              </li>
              <li>
                <Link to="/nearby-help">Nearby Help</Link>
              </li>
              <li>
                <Link to="/sos">Emergency SOS</Link>
              </li>
              <li>
                <Link to="/community">Community Reports</Link>
              </li>
              <li>
                <Link to="/profile">User Profile</Link>
              </li>
            </ul>
          </div>

          {/* Attribution & Standards */}
          <div className="footer-col">
            <h4 className="footer-heading">Map & Data</h4>
            <ul className="footer-links">
              <li>
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  <span>OpenStreetMap Contributors</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://operations.osmfoundation.org/policies/nominatim/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  <span>Nominatim Geocoding Policy</span>
                  <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://project-osrm.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  <span>Open Source Routing Machine</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Safety Disclaimer Banner */}
        <div className="safety-disclaimer-box" role="note">
          <div className="disclaimer-header">
            <AlertTriangle className="disclaimer-icon" size={18} />
            <strong>Safety Disclaimer</strong>
          </div>
          <p className="disclaimer-text">
            SafeWalk is a journey planning and route exploration aid. SafeWalk <strong>does not guarantee personal safety</strong>,
            prevent incidents, or replace local law enforcement. Always prioritize your instincts, stay in well-lit public thoroughfares,
            and call verified emergency services (112 / 1091) immediately if you feel in danger.
          </p>
        </div>

        {/* Copyright & Meta */}
        <div className="footer-bottom">
          <p className="copyright-text">
            &copy; {currentYear} SafeWalk — Built for Women's Travel Safety & Smart Route Planning.
          </p>
          <p className="footer-privacy-text">
            Passionate about safe mobility. No user passwords or sensitive tracking tokens are exposed.
          </p>
        </div>
      </div>
    </footer>
  );
}
