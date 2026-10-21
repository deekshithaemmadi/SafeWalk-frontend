import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquarePlus,
  Flag,
  MapPin,
  AlertTriangle,
  Info,
  LocateFixed,
  ShieldCheck,
  Clock,
  LogIn,
  RefreshCw,
} from "lucide-react";
import { fetchCommunityReports, submitReport } from "../services/communityReportsService";
import { useAuth } from "../context/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const CATEGORIES = [
  "Poor lighting / dark area",
  "Harassment or eve-teasing",
  "Suspicious activity",
  "Unsafe public transport",
  "Feel unsafe at night",
  "Other safety concern",
];

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 1000; // matches backend CreateReportRequest @Size(max = 1000)

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
  const { isAuthenticated } = useAuth();

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null);
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("info"); // 'success' | 'error' | 'info'
  const [submitting, setSubmitting] = useState(false);

  const [reports, setReports] = useState([]);
  // Only show loading spinner while authenticated and fetching from backend.
  const [loading, setLoading] = useState(isAuthenticated);
  const [fetchError, setFetchError] = useState("");

  const loadReports = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    setFetchError("");
    fetchCommunityReports()
      .then((data) => setReports(data))
      .catch((err) => setFetchError(err.message || "Unable to load community reports from server."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let active = true;
    fetchCommunityReports()
      .then((data) => {
        if (active) setReports(data);
      })
      .catch((err) => {
        if (active) setFetchError(err.message || "Unable to load community reports from server.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleUseLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoNotice("Geolocation is not supported, so you can type a location instead.");
      return;
    }
    setLocating(true);
    setGeoNotice("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");
    if (!validate()) return;

    if (!isAuthenticated) {
      setFeedback("Please sign in to submit a safety report to the database.");
      setFeedbackType("error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport({
        category,
        description,
        location,
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
      });

      if (result.saved) {
        setReports((prev) => [result.report, ...prev]);
        setFeedback(result.message || "Report saved permanently in the SafeWalk database.");
        setFeedbackType("success");
        setCategory("");
        setDescription("");
        setLocation("");
        setCoords(null);
        setErrors({});
      } else {
        setFeedback(result.message || "Failed to save report to backend.");
        setFeedbackType("error");
      }
    } catch (err) {
      setFeedback(err.message || "An error occurred while submitting.");
      setFeedbackType("error");
    } finally {
      setSubmitting(false);
    }
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
            Share local safety concerns to help women travelers stay informed. Reports are saved
            permanently in the database and reviewed for community awareness.
          </p>
        </div>

        {/* Database & Moderation banner */}
        <div className="reports-status-notice" role="note">
          <Info size={18} className="notice-icon" />
          <div>
            <strong>Verified Database Storage:</strong> Reports submitted here are saved permanently
            in the SafeWalk MySQL database. All submissions enter <strong>Pending Moderation</strong> status
            before being verified. In an immediate emergency, always call <strong>112</strong> directly.
          </div>
        </div>

        <div className="reports-layout">
          {/* Form */}
          <div className="reports-form-card">
            <div className="reports-form-header">
              <MessageSquarePlus size={18} />
              <h3>Submit a Report</h3>
            </div>

            {!isAuthenticated && (
              <div className="reports-auth-prompt" style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#475569" }}>
                  <LogIn size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                  You are viewing community reports. <Link to="/login" style={{ color: "#0d9488", fontWeight: 600 }}>Sign in</Link> to save new reports directly to the database.
                </p>
              </div>
            )}

            {feedback && (
              <div
                className={`reports-feedback ${feedbackType}`}
                style={{
                  padding: "0.75rem",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  fontSize: "0.875rem",
                  backgroundColor: feedbackType === "success" ? "#f0fdf4" : feedbackType === "error" ? "#fef2f2" : "#f0f9ff",
                  color: feedbackType === "success" ? "#166534" : feedbackType === "error" ? "#991b1b" : "#0369a1",
                  border: `1px solid ${feedbackType === "success" ? "#bbf7d0" : feedbackType === "error" ? "#fecaca" : "#bae6fd"}`,
                }}
                role="status"
              >
                <Info size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                {feedback}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="btn-reports-locate"
                    onClick={handleUseLocation}
                    disabled={locating || submitting}
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

              <button
                type="submit"
                className="btn-submit-report"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-sm animate-spin" /> Saving to Database...
                  </>
                ) : (
                  <>
                    <MessageSquarePlus size={16} /> Submit to Database
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="reports-list-card">
            <div className="reports-list-header">
              <div>
                <h3 className="list-card-title">Reports ({reports.length})</h3>
                <p className="list-card-subtitle">Saved in SafeWalk database</p>
              </div>
              <button
                type="button"
                className="btn-secondary-nav"
                style={{ padding: "4px 8px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                onClick={loadReports}
                disabled={loading}
                title="Refresh reports"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {loading && <LoadingSpinner message="Loading community reports..." />}
            {fetchError && !loading && (
              <ErrorMessage title="Reports Notice" message={fetchError} variant="warning" />
            )}

            {!isAuthenticated ? (
              <p className="reports-empty">
                <LogIn size={15} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                <Link to="/login" style={{ color: "#0d9488", fontWeight: 600 }}>Sign in</Link>{" "}
                to view community reports saved in the database.
              </p>
            ) : !loading && reports.length === 0 ? (
              <p className="reports-empty">
                No reports found in the database. Be the first to submit a safety concern for this area.
              </p>
            ) : (
              <div className="reports-list-scroll">
                {reports.map((r) => {
                  const isVerified = r.status === "VERIFIED";
                  const isPending = !r.status || r.status === "PENDING";
                  return (
                    <div key={r.id} className="report-item">
                      <div className="report-item-top">
                        <span className="report-category-tag">{r.category}</span>
                        {isVerified ? (
                          <span
                            className="report-verified-tag"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "#ecfdf5",
                              color: "#059669",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            <ShieldCheck size={12} /> Verified
                          </span>
                        ) : isPending ? (
                          <span
                            className="report-pending-tag"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: "#fef3c7",
                              color: "#d97706",
                              border: "1px solid #fde68a",
                            }}
                          >
                            <Clock size={12} /> Pending Review
                          </span>
                        ) : (
                          <span className="report-unverified-tag">{r.status}</span>
                        )}
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
                  );
                })}
              </div>
            )}

            <div className="reports-disclaimer" role="note">
              <AlertTriangle size={15} />
              <p>
                Community reports provide local situational context submitted by users and are
                subject to moderation. In an emergency, immediately contact local authorities at 112.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
