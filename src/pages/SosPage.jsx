import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  Siren,
  PhoneCall,
  Phone,
  MessageSquare,
  MapPin,
  ShieldCheck,
  Info,
  AlertTriangle,
  X,
  Check,
  LocateFixed,
  Copy,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { sendSosAlert } from "../services/sosService";

// India's national emergency number (all services) — real, documented.
const EMERGENCY_NUMBER = "112";
const WOMENS_HELPLINE = "1091";

export default function SosPage() {
  const { user, isAuthenticated } = useAuth();

  const [stage, setStage] = useState("idle"); // 'idle' | 'confirming' | 'active'
  const [consentLocation, setConsentLocation] = useState(true);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState("");
  const [sosResult, setSosResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contacts =
    user?.emergencyContacts && user.emergencyContacts.length > 0
      ? user.emergencyContacts
      : [];

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoNotice("Geolocation is not supported, so your location can't be captured.");
      return;
    }
    setLocating(true);
    setGeoNotice("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
      },
      (err) => {
        setGeoNotice(
          err.code === 1
            ? "Location permission was denied, so no location will be shared."
            : "Could not read your location. Please try again."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  const handleOpenConfirm = () => {
    setSosResult(null);
    setStage("confirming");
    if (!location) {
      requestLocation();
    }
  };

  const handleCancel = () => {
    setStage("idle");
    setSosResult(null);
  };

  const handleConfirmSos = async () => {
    setSubmitting(true);
    try {
      const result = await sendSosAlert({
        location,
        shareLocation: consentLocation,
        message: "SafeWalk Emergency SOS triggered by user",
      });
      setSosResult(result);
      setStage("active");
    } finally {
      setSubmitting(false);
    }
  };

  const getEmergencyMessageText = () => {
    let msg = "EMERGENCY: I am in distress and need assistance.";
    if (location) {
      msg += ` My current location: https://maps.google.com/?q=${location.lat.toFixed(6)},${location.lon.toFixed(6)}`;
    }
    return msg;
  };

  const handleCopyMessage = () => {
    const text = getEmergencyMessageText();
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="sos-page">
      <div className="container">
        <div className="page-intro-header">
          <div className="intro-badge sos-badge">
            <Siren size={16} />
            <span>EMERGENCY SOS</span>
          </div>
          <h1 className="page-intro-title">Emergency SOS</h1>
          <p className="page-intro-text">
            Immediate emergency response center. Activates verified incident logging to the SafeWalk
            database, one-tap dialing to India's National Helpline (112), and direct contact alerts.
          </p>
        </div>

        {/* Requirements & capabilities notice */}
        <div className="sos-capability-notice" role="note">
          <AlertTriangle size={18} className="notice-icon" />
          <div>
            <strong>Emergency Connectivity Notice:</strong> SafeWalk permanently logs your SOS alert
            and location in our secure MySQL database. Automated direct-to-carrier SMS broadcast
            requires a licensed external telephony gateway (e.g., Twilio or AWS SNS). Use the direct
            <strong> Call 112</strong> and <strong>Contact Alert</strong> buttons below for instant communication.
          </div>
        </div>

        <div className="sos-layout">
          {/* Primary SOS panel */}
          <div className="sos-primary-card">
            {stage === "idle" && (
              <div className="sos-idle-state">
                <button type="button" className="sos-big-button" onClick={handleOpenConfirm}>
                  <Siren size={44} />
                  <span>SOS</span>
                  <small>Tap to activate</small>
                </button>
                <p className="sos-idle-hint">
                  Activating SOS opens a confirmation dialog so it is never triggered accidentally.
                </p>
              </div>
            )}

            {stage === "confirming" && (
              <div className="sos-confirm-state">
                <h2 className="sos-confirm-title">Confirm SOS Activation?</h2>
                <p className="sos-confirm-text">
                  This will record an emergency alert in the SafeWalk database and open immediate
                  emergency call and contact actions.
                </p>

                {/* Consent-based location sharing */}
                <label className="sos-consent-row">
                  <input
                    type="checkbox"
                    checked={consentLocation}
                    onChange={(e) => {
                      setConsentLocation(e.target.checked);
                      if (e.target.checked && !location) requestLocation();
                    }}
                  />
                  <span className="sos-consent-text">
                    Include my current GPS location in this emergency record
                  </span>
                </label>

                {consentLocation && (
                  <div className="sos-location-status">
                    {locating && (
                      <span>
                        <span className="spinner-sm animate-spin" /> Acquiring accurate GPS coordinates...
                      </span>
                    )}
                    {location && !locating && (
                      <span className="sos-location-ok">
                        <MapPin size={13} /> {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                      </span>
                    )}
                    {geoNotice && <span className="sos-location-warn">{geoNotice}</span>}
                  </div>
                )}

                <div className="sos-confirm-actions">
                  <button
                    type="button"
                    className="sos-btn-cancel"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button
                    type="button"
                    className="sos-btn-confirm"
                    onClick={handleConfirmSos}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-sm animate-spin" /> Recording Alert...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Yes, Activate SOS
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {stage === "active" && (
              <div className="sos-active-state">
                {sosResult && (
                  <div
                    className={`sos-delivery-notice ${sosResult.recorded ? "recorded" : "error"}`}
                    role="note"
                    style={{
                      background: sosResult.recorded ? "#ecfdf5" : "#fef2f2",
                      borderColor: sosResult.recorded ? "#a7f3d0" : "#fecaca",
                      color: sosResult.recorded ? "#065f46" : "#991b1b",
                      padding: "1rem",
                      borderRadius: "8px",
                      marginBottom: "1.25rem",
                      border: "1px solid",
                    }}
                  >
                    <Info size={18} style={{ float: "left", marginRight: "8px", marginTop: "2px" }} />
                    <div>
                      <strong>
                        {sosResult.recorded
                          ? `SOS Event #${sosResult.id} Confirmed in SafeWalk Database`
                          : "Alert Recording Notice"}
                      </strong>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem" }}>
                        {sosResult.message}
                      </p>
                      {sosResult.createdAt && (
                        <span style={{ fontSize: "0.75rem", opacity: 0.85, display: "block", marginTop: "4px" }}>
                          Timestamp: {new Date(sosResult.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="sos-call-actions">
                  <a href={`tel:${EMERGENCY_NUMBER}`} className="sos-call-primary">
                    <PhoneCall size={22} /> Call {EMERGENCY_NUMBER} (National Emergency)
                  </a>
                  <a href={`tel:${WOMENS_HELPLINE}`} className="sos-call-secondary">
                    <Phone size={18} /> Call {WOMENS_HELPLINE} (Women's Helpline)
                  </a>
                </div>

                {location && (
                  <div className="sos-quick-share-box" style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", marginTop: "1rem", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                        <LocateFixed size={14} /> Location: {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyMessage}
                        style={{
                          background: "#0d9488",
                          color: "#fff",
                          border: "none",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                        }}
                      >
                        {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
                        <span>{copied ? "Copied!" : "Copy Alert Text"}</span>
                      </button>
                    </div>
                  </div>
                )}

                <button type="button" className="sos-btn-cancel" onClick={handleCancel} style={{ marginTop: "1.25rem" }}>
                  Close SOS Panel
                </button>
              </div>
            )}
          </div>

          {/* Emergency contacts panel */}
          <div className="sos-contacts-card">
            <div className="sos-contacts-header">
              <ShieldCheck size={18} />
              <h3>Your Emergency Contacts</h3>
            </div>
            {contacts.length === 0 ? (
              <div className="sos-no-contacts">
                <p>You have no saved emergency contacts yet.</p>
                {isAuthenticated ? (
                  <Link to="/emergency-contacts" className="btn-secondary-nav" style={{ display: "inline-block", marginTop: "0.5rem" }}>
                    Add Emergency Contacts
                  </Link>
                ) : (
                  <Link to="/login" className="btn-secondary-nav" style={{ display: "inline-block", marginTop: "0.5rem" }}>
                    Sign in to manage contacts
                  </Link>
                )}
              </div>
            ) : (
              <div className="sos-contacts-list">
                {contacts.map((c, idx) => {
                  const smsBody = encodeURIComponent(getEmergencyMessageText());
                  return (
                    <div key={c.id || idx} className="sos-contact-item">
                      <div className="sos-contact-info">
                        <strong>{c.name}</strong>
                        {c.relation && <span className="sos-contact-relation">{c.relation}</span>}
                        <span className="sos-contact-phone">{c.phone}</span>
                      </div>
                      <div className="sos-contact-action-group" style={{ display: "flex", gap: "8px" }}>
                        <a
                          href={`sms:${c.phone}?body=${smsBody}`}
                          className="sos-contact-call"
                          title={`Send emergency SMS to ${c.name}`}
                          style={{ background: "#0284c7", color: "#fff" }}
                        >
                          <MessageSquare size={16} />
                        </a>
                        <a
                          href={`tel:${c.phone}`}
                          className="sos-contact-call"
                          title={`Call ${c.name}`}
                        >
                          <Phone size={16} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="sos-contacts-note">
              Use the phone and message buttons to directly call or text contacts from your device dialer.
              Direct automated SMS dispatch requires an active telephony gateway provider (e.g. Twilio / Sinch).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
