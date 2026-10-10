import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  PhoneCall,
  User,
  ArrowRight,
  Sun,
  Moon,
  RefreshCw,
  Search,
  Navigation,
  Square,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import LocationSearch from "../components/LocationSearch";
import RouteMap from "../components/RouteMap";
import RouteCard from "../components/RouteCard";
import SafetyInfoPanel from "../components/SafetyInfoPanel";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { geocodeLocation, fetchRoute, chooseBestLocation } from "../services/routeService";
import { ApiError } from "../services/api";
import useLiveTrip from "../hooks/useLiveTrip";

function formatElapsedDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatStartTime(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function tripStatusLabel(status) {
  if (status === "requesting") return "Waiting for GPS";
  if (status === "active") return "Trip in progress";
  if (status === "error") return "Location error";
  return "Not tracking";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    isActive: isTripActive,
    status: tripStatus,
    startTime: tripStartTime,
    elapsedMs,
    currentLocation,
    error: tripError,
    startTrip,
    stopTrip,
  } = useLiveTrip();

  // Search input states
  const [startQuery, setStartQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [travelTime, setTravelTime] = useState("Night"); // 'Day' | 'Night'

  // Coordinates & Resolved Results
  const [startCoords, setStartCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [startLabel, setStartLabel] = useState("");
  const [destLabel, setDestLabel] = useState("");

  // Route calculation states
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  // Contacts count
  const contactsCount = user?.emergencyContacts?.length || 2;

  // Handle route search
  const handleSearchRoutes = async (e) => {
    if (e) e.preventDefault();

    if (!startQuery.trim()) {
      setError("Please provide a starting location.");
      return;
    }
    if (!destQuery.trim()) {
      setError("Please provide a destination.");
      return;
    }

    setLoading(true);
    setError("");
    setIsBackendOffline(false);
    setRoutes([]);

    try {
      // 1. Geocode Start location if coordinates not already selected
      let sCoords = startCoords;
      let sLabel = startLabel || startQuery;

      if (!sCoords) {
        const startResults = await geocodeLocation(startQuery, { useDirectOsmFallback: true });
        const bestStart = chooseBestLocation(startResults, startQuery);
        if (!bestStart || !bestStart.lat || !bestStart.lon) {
          throw new Error(`Unable to pinpoint starting location: "${startQuery}". Please select a suggestion.`);
        }
        sCoords = [Number(bestStart.lat), Number(bestStart.lon)];
        sLabel = bestStart.display_name || startQuery;
        setStartCoords(sCoords);
        setStartLabel(sLabel);
      }

      // 2. Geocode Destination if coordinates not already selected
      let dCoords = destCoords;
      let dLabel = destLabel || destQuery;

      if (!dCoords) {
        const destResults = await geocodeLocation(destQuery, { useDirectOsmFallback: true });
        const bestDest = chooseBestLocation(destResults, destQuery);
        if (!bestDest || !bestDest.lat || !bestDest.lon) {
          throw new Error(`Unable to pinpoint destination: "${destQuery}". Please select a suggestion.`);
        }
        dCoords = [Number(bestDest.lat), Number(bestDest.lon)];
        dLabel = bestDest.display_name || destQuery;
        setDestCoords(dCoords);
        setDestLabel(dLabel);
      }

      // 3. Fetch real road route geometry from backend /api/route (or fallback if offline)
      try {
        const result = await fetchRoute(sCoords, dCoords, { useDirectOsrmFallback: false });
        setRoutes(result.routes);
        setSelectedRouteIndex(0);
      } catch (backendErr) {
        if (backendErr instanceof ApiError && backendErr.isNetworkError) {
          setIsBackendOffline(true);
          setError(
            "Backend route service at http://localhost:8080 is unreachable. You can verify that the Spring Boot server is running."
          );
        } else {
          setError(backendErr.message || "Failed to calculate road route between selected points.");
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred while finding locations.");
    } finally {
      setLoading(false);
    }
  };

  // Optional button for user to test real client OSRM routing while backend server is offline
  const handleTestClientFallback = async () => {
    if (!startCoords || !destCoords) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchRoute(startCoords, destCoords, { useDirectOsrmFallback: true });
      setRoutes(result.routes);
      setSelectedRouteIndex(0);
      setIsBackendOffline(false);
    } catch {
      setError("Unable to retrieve route geometry via fallback.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearRoute = () => {
    setRoutes([]);
    setSelectedRouteIndex(0);
    setStartCoords(null);
    setDestCoords(null);
    setStartLabel("");
    setDestLabel("");
    setStartQuery("");
    setDestQuery("");
    setError("");
    setIsBackendOffline(false);
  };

  const activeRoute = routes[selectedRouteIndex] || null;

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Welcome Banner */}
        <section className="dashboard-welcome-banner">
          <div className="welcome-text-content">
            <span className="welcome-tag">DASHBOARD & ROUTE CENTER</span>
            <h1 className="welcome-title">
              Welcome back, <span className="user-highlight">{user?.name || "Traveler"}</span>
            </h1>
            <p className="welcome-subtitle">
              Plan and compare verified routes, manage your trusted emergency contacts, and access safety resources.
            </p>
          </div>

          <div className="quick-stats-row">
            <Link to="/emergency-contacts" className="stat-card">
              <div className="stat-icon-wrapper teal">
                <PhoneCall size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Emergency Contacts</span>
                <strong className="stat-value">{contactsCount} Saved</strong>
              </div>
              <ArrowRight size={16} className="stat-arrow" />
            </Link>

            <Link to="/profile" className="stat-card">
              <div className="stat-icon-wrapper navy">
                <User size={20} />
              </div>
              <div className="stat-info">
                <span className="stat-label">User Profile</span>
                <strong className="stat-value">{user?.email || "Account Active"}</strong>
              </div>
              <ArrowRight size={16} className="stat-arrow" />
            </Link>
          </div>
        </section>

        {/* Route Planning Workspace */}
        <div className="dashboard-main-grid">
          {/* Left Column: Search & Controls */}
          <div className="dashboard-control-panel">
            <div className="panel-card live-trip-card">
              <div className="panel-header">
                <div className="header-icon-box">
                  <Navigation size={20} className="panel-header-icon" />
                </div>
                <div>
                  <h2 className="panel-title">Live Trip Tracking</h2>
                  <p className="panel-subtitle">
                    Location is requested only when you start a trip, and watching stops when you end it.
                  </p>
                </div>
              </div>

              <div className="live-trip-status-row">
                <span className={`trip-status-pill ${tripStatus}`}>
                  <span className="trip-status-dot"></span>
                  {tripStatusLabel(tripStatus)}
                </span>
              </div>

              <dl className="live-trip-metrics">
                <div className="live-trip-metric">
                  <dt>Start time</dt>
                  <dd>{formatStartTime(tripStartTime)}</dd>
                </div>
                <div className="live-trip-metric">
                  <dt>Elapsed</dt>
                  <dd>{isTripActive ? formatElapsedDuration(elapsedMs) : "00:00:00"}</dd>
                </div>
                <div className="live-trip-metric live-trip-metric-wide">
                  <dt>Latest coordinates</dt>
                  <dd>
                    {currentLocation
                      ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lon.toFixed(6)}`
                      : "—"}
                  </dd>
                </div>
              </dl>

              {tripError && (
                <ErrorMessage title="Location notice" message={tripError} variant="error" />
              )}

              <div className="live-trip-actions">
                {!isTripActive ? (
                  <button type="button" className="btn-start-trip" onClick={startTrip}>
                    <Navigation size={16} />
                    <span>Start Trip</span>
                  </button>
                ) : (
                  <button type="button" className="btn-stop-trip" onClick={stopTrip}>
                    <Square size={14} />
                    <span>Stop Trip</span>
                  </button>
                )}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <div className="header-icon-box">
                  <Compass size={20} className="panel-header-icon" />
                </div>
                <div>
                  <h2 className="panel-title">Plan Your Route</h2>
                  <p className="panel-subtitle">Enter origin and destination to calculate real road paths.</p>
                </div>
              </div>

              <form onSubmit={handleSearchRoutes} className="route-form">
                <LocationSearch
                  id="dashboard-start"
                  label="Starting Location (Point A)"
                  placeholder="e.g. Hyderabad Deccan Station, Begumpet..."
                  value={startQuery}
                  onChange={(val) => {
                    setStartQuery(val);
                    setStartCoords(null);
                  }}
                  onSelectSuggestion={(item) => {
                    setStartCoords([Number(item.lat), Number(item.lon)]);
                    setStartLabel(item.display_name || item.name);
                  }}
                  showCurrentLocationButton={true}
                  onCurrentLocationSuccess={(loc) => {
                    setStartCoords([loc.lat, loc.lon]);
                    setStartLabel(loc.display_name);
                  }}
                  disabled={loading}
                />

                <LocationSearch
                  id="dashboard-dest"
                  label="Destination (Point B)"
                  placeholder="e.g. Charminar, Hitec City, Jubilee Hills..."
                  value={destQuery}
                  onChange={(val) => {
                    setDestQuery(val);
                    setDestCoords(null);
                  }}
                  onSelectSuggestion={(item) => {
                    setDestCoords([Number(item.lat), Number(item.lon)]);
                    setDestLabel(item.display_name || item.name);
                  }}
                  disabled={loading}
                />

                {/* Day / Night Travel Preference */}
                <div className="travel-time-toggle-group">
                  <label className="toggle-label">Travel Period</label>
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={`toggle-btn ${travelTime === "Day" ? "active" : ""}`}
                      onClick={() => setTravelTime("Day")}
                    >
                      <Sun size={15} />
                      <span>Daytime</span>
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${travelTime === "Night" ? "active" : ""}`}
                      onClick={() => setTravelTime("Night")}
                    >
                      <Moon size={15} />
                      <span>Night Travel</span>
                    </button>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="btn-search-routes"
                  disabled={loading || !startQuery.trim() || !destQuery.trim()}
                >
                  {loading ? (
                    <LoadingSpinner message="Calculating real route..." size="sm" inline />
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Search Road Routes</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error & Offline Diagnostics */}
              {error && (
                <div className="search-error-block">
                  <ErrorMessage
                    title="Route Search Notice"
                    message={error}
                    variant={isBackendOffline ? "warning" : "error"}
                  />
                  {isBackendOffline && startCoords && destCoords && (
                    <div className="offline-fallback-prompt">
                      <p className="fallback-note">
                        Want to test interactive map rendering with real OSRM road geometry while your backend is being configured?
                      </p>
                      <button
                        type="button"
                        className="btn-fallback-action"
                        onClick={handleTestClientFallback}
                      >
                        <RefreshCw size={14} />
                        <span>Test Preview Route Geometry</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Route Options List */}
              {routes.length > 0 && (
                <div className="route-options-container">
                  <div className="options-header">
                    <h3>Available Road Routes ({routes.length})</h3>
                    <small>Select a card to highlight geometry on the map</small>
                  </div>
                  <div className="route-cards-list">
                    {routes.map((rt, idx) => (
                      <RouteCard
                        key={rt.id || idx}
                        route={rt}
                        isSelected={idx === selectedRouteIndex}
                        onSelect={() => setSelectedRouteIndex(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Safety Information Panel */}
            <div className="dashboard-safety-panel-wrapper">
              <SafetyInfoPanel route={activeRoute} />
            </div>
          </div>

          {/* Right Column: Interactive Map */}
          <div className="dashboard-map-panel">
            <div className="map-container-card">
              <div className="map-card-header">
                <div className="map-title-group">
                  <span className="live-indicator"></span>
                  <h3 className="map-card-title">Interactive Road Map</h3>
                </div>
                <div className="map-header-badges">
                  <span className="map-tag">OpenStreetMap</span>
                  {isTripActive && <span className="map-tag live-trip-tag">Live location</span>}
                  {activeRoute && <span className="map-tag active-route-tag">{activeRoute.name}</span>}
                </div>
              </div>

              <RouteMap
                startCoords={startCoords}
                destinationCoords={destCoords}
                startLabel={startLabel}
                destinationLabel={destLabel}
                routes={routes}
                selectedRouteIndex={selectedRouteIndex}
                onSelectRoute={(idx) => setSelectedRouteIndex(idx)}
                onClearRoute={handleClearRoute}
                isLoading={loading}
                error={error && !isBackendOffline ? error : ""}
                height="620px"
                currentLocation={currentLocation}
                isTripActive={isTripActive}
              />

              <div className="map-footer-notice">
                <small>
                  Tiles &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors.
                  Route geometries represent real road networks.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
