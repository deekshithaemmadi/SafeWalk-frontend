import { ShieldCheck, Info, Phone, Compass, CheckCircle } from "lucide-react";

export default function SafetyInfoPanel({ route }) {
  if (!route) {
    return (
      <div className="safety-panel empty-state">
        <Compass size={32} className="empty-panel-icon" />
        <h4>Route Safety Insights</h4>
        <p>Select or search for a starting location and destination to view travel details and safety data.</p>
      </div>
    );
  }

  const { distanceKm, durationMin, verifiedSafetyInfo } = route;

  return (
    <div className="safety-panel-card">
      <div className="safety-panel-header">
        <div className="header-badge">
          <ShieldCheck size={20} className="shield-icon" />
          <h3>Route Safety & Travel Details</h3>
        </div>
        <span className="route-identifier">{route.name}</span>
      </div>

      {/* Travel Metrics Summary */}
      <div className="safety-metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Total Distance</span>
          <strong className="metric-num">{distanceKm} km</strong>
        </div>
        <div className="metric-box">
          <span className="metric-label">Est. Duration</span>
          <strong className="metric-num">{durationMin} min</strong>
        </div>
        <div className="metric-box">
          <span className="metric-label">Transit Mode</span>
          <strong className="metric-num">Road Travel</strong>
        </div>
      </div>

      {/* Safety Data Verification Block */}
      <div className="safety-verification-section">
        {verifiedSafetyInfo ? (
          <div className="verified-data-box">
            <div className="verified-header">
              <CheckCircle size={18} className="verified-icon" />
              <strong>Verified Safety Data:</strong>
            </div>
            <p className="verified-body">{verifiedSafetyInfo.description || JSON.stringify(verifiedSafetyInfo)}</p>
          </div>
        ) : (
          <div className="unverified-notice-box" role="note">
            <Info size={18} className="info-icon" />
            <div className="unverified-text">
              <strong>Data Status</strong>
              <p>Verified safety information is currently unavailable for this route.</p>
            </div>
          </div>
        )}
      </div>

      {/* Safe Travel Guidelines (Responsible & Non-misleading) */}
      <div className="safety-guidelines-box">
        <h4 className="guidelines-title">Essential Travel Recommendations</h4>
        <ul className="guidelines-list">
          <li>Share your estimated travel duration with a trusted emergency contact.</li>
          <li>Choose well-lit arterial roads and public transport corridors when traveling at night.</li>
          <li>Keep your phone charged and emergency helplines accessible.</li>
          <li>If you suspect you are being followed, head immediately into an open shop, hospital, or public establishment.</li>
        </ul>
      </div>

      {/* Immediate Helpline Reference */}
      <div className="panel-helpline-row">
        <span className="helpline-hint">In case of immediate threat or harassment:</span>
        <div className="helpline-badges">
          <span className="helpline-pill"><Phone size={12} /> Women Helpline: 1091</span>
          <span className="helpline-pill"><Phone size={12} /> Police / Emergency: 112</span>
        </div>
      </div>
    </div>
  );
}
