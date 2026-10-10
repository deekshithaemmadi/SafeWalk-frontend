import { useCallback, useState } from "react";
import {
  Siren,
  PhoneCall,
  Phone,
  MapPin,
  ShieldCheck,
  Info,
  AlertTriangle,
  X,
  Check,
  LocateFixed,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { sendSosAlert } from "../services/sosService";

// India's national emergency number (all services) — real, documented.
const EMERGENCY_NUMBER = "112";
const WOMENS_HELPLINE = "1091";

export default function SosPage() {
  const { user } = useAuth();

  const [stage, setStage] = useState("idle"); // 'idle' | 'confirming' | 'active'
  const [consentLocation, setConsentLocation] = useState(false);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState("");
  const [deliveryNotice, setDeliveryNotice] = useState("");

  const contacts =
    user?.emergencyContacts && user.emergencyContacts.length > 0
      ? user.emergencyContacts
      : [];

  const handleOpenConfirm = () => {
    setDeliveryNotice("");
    setStage("confirming");
  };

  const handleCancel = () => {
    setStage("idle");
    setDeliveryNotice("");
  };

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

  const handleConfirmSos = async () => {
    // Attempt backend delivery. No backend exists yet, so this returns
    // delivered:false with a clear reason — we never fake a success message.
    const result = await sendSosAlert({ location, shareLocation: consentLocation });
    setDeliveryNotice(
      result.delivered
        ? "Your alert was submitted to the SafeWalk alert service."
        : result.reason ||
            "No backend alert service is connected. This does NOT send an automated alert. Please call 112 directly."
    );
    setStage("active");
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
            One-tap access to India's national emergency number, your saved contacts, and
            consent-based location sharing. SafeWalk cannot dispatch help for you automatically.
          </p>
        </div>

        {/* Honest capability banner */}
        <div className="sos-capability-notice" role="note">
          <AlertTriangle size={18} className="notice-icon" />
          <div>
            <strong>This does not auto-dispatch help.</strong> Automated alert delivery requires a
            backend service that is not connected. The fastest way to get help is to call{" "}
            <strong>112</strong> directly using the button below.
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
                  Activating SOS opens a confirmation so it is never triggered by accident.
                </p>
              </div>
            )}

            {stage === "confirming" && (
              <div className="sos-confirm-state">
                <h2 className="sos-confirm-title">Confirm SOS activation?</h2>
                <p className="sos-confirm-text">
                  This will open emergency options. SafeWalk will <strong>not</strong> send an
                  automated alert because no backend alert service is connected.
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
                    Share my current location with this action (optional, requires your permission)
                  </span>
                </label>

                {consentLocation && (
                  <div className="sos-location-status">
                    {locating && (
                      <span><span className="spinner-sm animate-spin" /> Reading location...</span>
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
                  <button type="button" className="sos-btn-cancel" onClick={handleCancel}>
                    <X size={16} /> Cancel
                  </button>
                  <button type="button" className="sos-btn-confirm" onClick={handleConfirmSos}>
                    <Check size={16} /> Yes, activate SOS
                  </button>
                </div>
              </div>
            )}

            {stage === "active" && (
              <div className="sos-active-state">
                {deliveryNotice && (
                  <div className="sos-delivery-notice" role="note">
                    <Info size={16} /> {deliveryNotice}
                  </div>
                )}
                <div className="sos-call-actions">
                  <a href={`tel:${EMERGENCY_NUMBER}`} className="sos-call-primary">
                    <PhoneCall size={22} /> Call {EMERGENCY_NUMBER} (All Emergencies)
                  </a>
                  <a href={`tel:${WOMENS_HELPLINE}`} className="sos-call-secondary">
                    <Phone size={18} /> Call {WOMENS_HELPLINE} (Women's Helpline)
                  </a>
                </div>
                {consentLocation && location && (
                  <p className="sos-shared-location">
                    <LocateFixed size={13} /> Location ready to share manually:{" "}
                    {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                  </p>
                )}
                <button type="button" className="sos-btn-cancel" onClick={handleCancel}>
                  Close SOS panel
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
              <p className="sos-no-contacts">
                You have no saved emergency contacts yet. Add them from the Emergency Contacts page.
              </p>
            ) : (
              <div className="sos-contacts-list">
                {contacts.map((c, idx) => (
                  <div key={c.id || idx} className="sos-contact-item">
                    <div className="sos-contact-info">
                      <strong>{c.name}</strong>
                      {c.relation && <span className="sos-contact-relation">{c.relation}</span>}
                      <span className="sos-contact-phone">{c.phone}</span>
                    </div>
                    <a href={`tel:${c.phone}`} className="sos-contact-call" title={`Call ${c.name}`}>
                      <Phone size={16} />
                    </a>
                  </div>
                ))}
              </div>
            )}
            <p className="sos-contacts-note">
              Calling a contact uses your phone's dialer. SafeWalk does not send them automated
              messages or your location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


