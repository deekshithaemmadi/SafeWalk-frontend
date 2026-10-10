import { useState } from "react";
import {
  MessageSquarePlus,
  Flag,
  MapPin,
  AlertTriangle,
  Info,
  LocateFixed,
  ShieldAlert,
} from "lucide-react";
import { getLocalReports, submitReport } from "../services/communityReportsService";

const CATEGORIES = [
  "Poor lighting / dark area",
  "Harassment or eve-teasing",
  "Suspicious activity",
  "Unsafe public transport",
  "Feel unsafe at night",
  "Other safety concern",
];

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 500;

function formatTimestamp(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export default function CommunityReportsPage() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState("");
  const [feedback, setFeedback] = useState("");
  // Initialize directly from local storage (runs once) — avoids a cascading
  // render that a useEffect + setState would cause.
  const [reports, setReports] = useState(() => getLocalReports());

  const handleUseLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoNotice("Geolocation is not supported, so you can type a location instead.");
      return;
    }
    setLocating(true);
    setGeoNotice("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocating(false);
      },
      (err) => {
        setGeoNotice(
          err.code === 1
            ? "Location permission was denied. You can type a location manually."
            : "Could not read your location. You can type a location manually."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const validate = () => {
    const next = {};
    if (!category) next.category = "Please choose a category.";
    const trimmed = description.trim();
    if (!trimmed) {
      next.description = "Please describe the safety concern.";
    } else if (trimmed.length < MIN_DESCRIPTION) {
      next.description = `Please add a little more detail (at least ${MIN_DESCRIPTION} characters).`;
    } else if (trimmed.length > MAX_DESCRIPTION) {
      next.description = `Please keep the description under ${MAX_DESCRIPTION} characters.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback("");
    if (!validate()) return;

    const result = submitReport({ category, description, location });
    if (result.stored) {
      setReports((prev) => [result.report, ...prev]);
      setFeedback(
        "Saved to this browser only. Your report is UNVERIFIED and is not shared with other users or any authority."
      );
    } else {
      setFeedback(
        "Your report could not be saved locally (browser storage unavailable). Nothing was shared."
      );
    }
    setCategory("");
    setDescription("");
    setLocation("");
    setErrors({});
  };

  return (
    <div className="community-reports-page">
      <div className="container">
        <div className="page-intro-header">
          <div className="intro-badge">
            <Flag size={16} />
            <span>COMMUNITY SAFETY</span>
          </div>
          <h1 className="page-intro-title">Community Safety Reports</h1>
          <p className="page-intro-text">
            Share a safety concern to help others stay aware. Reports are <strong>unverified</strong>{" "}
            and stored only in this browser — they are not shared with other users or any authority.
          </p>
        </div>

        {/* Honest status banner */}
        <div className="reports-status-notice" role="note">
          <Info size={18} className="notice-icon" />
          <div>
            <strong>How this works:</strong> This is a frontend-only feature. Submitted reports are
            saved locally in your browser and clearly marked as <strong>unverified</strong>. They are
            not permanently stored, not shared, and not confirmed by officials. For emergencies,
            always call <strong>112</strong>.
          </div>
        </div>

        <div className="reports-layout">
          {/* Form */}
          <div className="reports-form-card">
            <div className="reports-form-header">
              <MessageSquarePlus size={18} />
              <h3>Submit a Report</h3>
            </div>

            {feedback && (
              <div className="reports-feedback" role="status">
                <Info size={15} /> {feedback}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="report-category" className="input-label">
                  Category
                </label>
                <select
                  id="report-category"
                  className={`text-input ${errors.category ? "has-error" : ""}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="input-error-msg">{errors.category}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="report-description" className="input-label">
                  Description
                </label>
                <textarea
                  id="report-description"
                  className={`reports-textarea ${errors.description ? "has-error" : ""}`}
                  rows={5}
                  maxLength={MAX_DESCRIPTION}
                  placeholder="Describe what happened or what feels unsafe. Avoid sharing private personal details."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="reports-textarea-meta">
                  {errors.description ? (
                    <p className="input-error-msg">{errors.description}</p>
                  ) : (
                    <span />
                  )}
                  <span className="reports-char-count">
                    {description.length}/{MAX_DESCRIPTION}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="report-location" className="input-label">
                  Location <span className="reports-optional">(optional)</span>
                </label>
                <div className="reports-location-row">
                  <input
                    id="report-location"
                    type="text"
                    className="text-input"
                    placeholder="Area, landmark, or coordinates"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-reports-locate"
                    onClick={handleUseLocation}
                    disabled={locating}
                  >
                    {locating ? (
                      <span className="spinner-sm animate-spin" />
                    ) : (
                      <LocateFixed size={16} />
                    )}
                    <span>GPS</span>
                  </button>
                </div>
                {geoNotice && <p className="field-warning-text">{geoNotice}</p>}
              </div>

              <button type="submit" className="btn-submit-report">
                <MessageSquarePlus size={16} /> Submit Report
              </button>
            </form>
          </div>

          {/* List */}
          <div className="reports-list-card">
            <div className="reports-list-header">
              <div>
                <h3 className="list-card-title">Reports ({reports.length})</h3>
                <p className="list-card-subtitle">Stored on this device only</p>
              </div>
              <span className="reports-unverified-badge">
                <ShieldAlert size={13} /> All Unverified
              </span>
            </div>

            {reports.length === 0 ? (
              <p className="reports-empty">
                No reports yet. Anything you submit will appear here, clearly labelled as unverified.
              </p>
            ) : (
              <div className="reports-list-scroll">
                {reports.map((r) => (
                  <div key={r.id} className="report-item">
                    <div className="report-item-top">
                      <span className="report-category-tag">{r.category}</span>
                      <span className="report-unverified-tag">Unverified</span>
                    </div>
                    <p className="report-description">{r.description}</p>
                    <div className="report-meta">
                      {r.location && (
                        <span className="report-location">
                          <MapPin size={12} /> {r.location}
                        </span>
                      )}
                      <span className="report-time">{formatTimestamp(r.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="reports-disclaimer" role="note">
              <AlertTriangle size={15} />
              <p>
                Reports are unverified community notes. They are not shared, not permanent, and not
                confirmed by any authority. Do not rely on them as fact.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


