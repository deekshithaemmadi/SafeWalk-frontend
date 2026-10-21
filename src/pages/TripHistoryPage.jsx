import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  History,
  Navigation,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Compass,
  RefreshCw,
  LocateFixed,
} from "lucide-react";
import { getTrips } from "../services/tripService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function calculateDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  try {
    const start = new Date(startIso).getTime();
    const end = new Date(endIso).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return "< 1 min";
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    if (hours > 0) {
      return `${hours} hr ${remainingMins} min`;
    }
    return `${minutes} min`;
  } catch {
    return null;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "COMPLETED":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            background: "#ecfdf5",
            color: "#059669",
            border: "1px solid #a7f3d0",
          }}
        >
          <CheckCircle2 size={13} /> Completed
        </span>
      );
    case "ACTIVE":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            background: "#f0fdf4",
            color: "#0d9488",
            border: "1px solid #99f6e4",
          }}
        >
          <Navigation size={13} className="animate-spin" /> In Progress
        </span>
      );
    case "CANCELLED":
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            background: "#f1f5f9",
            color: "#64748b",
            border: "1px solid #cbd5e1",
          }}
        >
          <XCircle size={13} /> Cancelled
        </span>
      );
    default:
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 10px",
            borderRadius: "12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            background: "#eff6ff",
            color: "#2563eb",
            border: "1px solid #bfdbfe",
          }}
        >
          <Clock size={13} /> Planned
        </span>
      );
  }
}

export default function TripHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | COMPLETED | ACTIVE | CANCELLED

  const fetchTripHistory = useCallback(() => {
    setLoading(true);
    setError("");
    getTrips({ page: 0, size: 50 })
      .then((data) => setTrips(data))
      .catch((err) => setError(err.message || "Unable to load trip records from database."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    getTrips({ page: 0, size: 50 })
      .then((data) => {
        if (active) setTrips(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load trip records from database.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredTrips = trips.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  const totalCount = trips.length;
  const completedCount = trips.filter((t) => t.status === "COMPLETED").length;
  const activeCount = trips.filter((t) => t.status === "ACTIVE").length;

  return (
    <div className="trip-history-page" style={{ padding: "2.5rem 0", minHeight: "80vh", background: "#f8fafc" }}>
      <div className="container">
        {/* Header */}
        <div className="page-intro-header" style={{ marginBottom: "2rem" }}>
          <div className="intro-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#e0f2fe", color: "#0369a1", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>
            <History size={15} />
            <span>TRIP LOGS & HISTORY</span>
          </div>
          <h1 className="page-intro-title" style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0.5rem 0" }}>
            Trip History
          </h1>
          <p className="page-intro-text" style={{ color: "#64748b", fontSize: "1rem", maxWidth: "600px" }}>
            View your completed journeys and tracking sessions saved permanently in the SafeWalk MySQL database.
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Total Journeys</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{totalCount}</div>
          </div>
          <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <span style={{ fontSize: "0.85rem", color: "#059669", fontWeight: 600 }}>Completed</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>{completedCount}</div>
          </div>
          <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <span style={{ fontSize: "0.85rem", color: "#0d9488", fontWeight: 600 }}>Active Now</span>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0d9488", marginTop: "4px" }}>{activeCount}</div>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["ALL", "COMPLETED", "ACTIVE", "CANCELLED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  border: filter === st ? "1px solid #0d9488" : "1px solid #e2e8f0",
                  background: filter === st ? "#0d9488" : "#ffffff",
                  color: filter === st ? "#ffffff" : "#475569",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {st === "ALL" ? "All Trips" : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={fetchTripHistory}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <Link
              to="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "#0d9488",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Compass size={16} />
              <span>Plan Journey</span>
            </Link>
          </div>
        </div>

        {/* Content Area */}
        {loading && <LoadingSpinner message="Loading trip history from database..." />}
        {error && !loading && (
          <ErrorMessage title="Trip Records Notice" message={error} variant="warning" />
        )}

        {!loading && filteredTrips.length === 0 && (
          <div style={{ background: "#ffffff", padding: "3rem 2rem", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <History size={40} style={{ color: "#94a3b8", margin: "0 auto 1rem auto" }} />
            <h3 style={{ fontSize: "1.25rem", color: "#1e293b", margin: "0 0 0.5rem 0" }}>No trips found</h3>
            <p style={{ color: "#64748b", maxWidth: "450px", margin: "0 auto 1.5rem auto", fontSize: "0.95rem" }}>
              {filter === "ALL"
                ? "You haven't recorded any trips yet. When you plan a route and start live tracking on the Dashboard, your journey will appear here."
                : `No trips with status "${filter}" found.`}
            </p>
            <Link
              to="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#0d9488",
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Navigation size={16} />
              <span>Start Tracking on Dashboard</span>
            </Link>
          </div>
        )}

        {!loading && filteredTrips.length > 0 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            {filteredTrips.map((trip) => {
              const duration = calculateDuration(trip.startedAt, trip.endedAt);
              return (
                <div
                  key={trip.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    padding: "1.25rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div>
                    {/* Top Row: ID, Status, and Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b" }}>
                        TRIP #{trip.id}
                      </span>
                      {getStatusBadge(trip.status)}
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={13} /> {formatDateTime(trip.createdAt)}
                      </span>
                    </div>

                    {/* Route Details: Origin -> Destination */}
                    <div style={{ display: "grid", gap: "6px", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", color: "#0f172a" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0d9488", flexShrink: 0 }} />
                        <strong style={{ color: "#334155" }}>From:</strong>
                        <span>{trip.originLabel || "Starting Location"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.95rem", color: "#0f172a" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e11d48", flexShrink: 0 }} />
                        <strong style={{ color: "#334155" }}>To:</strong>
                        <span>{trip.destinationLabel || "Destination"}</span>
                      </div>
                    </div>

                    {/* Metadata: Duration, Coordinates */}
                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.8rem", color: "#64748b" }}>
                      {duration && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={13} /> Duration: <strong style={{ color: "#334155" }}>{duration}</strong>
                        </span>
                      )}
                      {trip.lastLatitude != null && trip.lastLongitude != null && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <LocateFixed size={13} /> Last Recorded: {trip.lastLatitude.toFixed(4)}, {trip.lastLongitude.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ textAlign: "right" }}>
                    {trip.status === "ACTIVE" ? (
                      <Link
                        to="/dashboard"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          background: "#0d9488",
                          color: "#ffffff",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <span>View Live</span>
                        <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          color: "#475569",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <span>Retrace Route</span>
                        <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
