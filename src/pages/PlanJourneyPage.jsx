import { useState } from "react";
import {
  Compass,
  ArrowUpDown,
  Search,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import LocationSearch from "../components/LocationSearch";
import RouteMap from "../components/RouteMap";
import RouteCard from "../components/RouteCard";
import SafetyInfoPanel from "../components/SafetyInfoPanel";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { geocodeLocation, fetchRoute, chooseBestLocation } from "../services/routeService";
import { ApiError } from "../services/api";

export default function PlanJourneyPage() {
  const [startQuery, setStartQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [travelTime, setTravelTime] = useState("Night");

  const [startCoords, setStartCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [startLabel, setStartLabel] = useState("");
  const [destLabel, setDestLabel] = useState("");

  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isBackendOffline, setIsBackendOffline] = useState(false);

  // Swap starting location and destination
  const handleSwapLocations = () => {
    const tempQuery = startQuery;
    const tempCoords = startCoords;
    const tempLabel = startLabel;

    setStartQuery(destQuery);
    setStartCoords(destCoords);
    setStartLabel(destLabel);

    setDestQuery(tempQuery);
    setDestCoords(tempCoords);
    setDestLabel(tempLabel);

    if (routes.length > 0) {
      setRoutes([]);
      setSelectedRouteIndex(0);
    }
  };

  const handleSearchRoutes = async (e) => {
    if (e) e.preventDefault();

    if (!startQuery.trim()) {
      setError("Please specify a starting location.");
      return;
    }
    if (!destQuery.trim()) {
      setError("Please specify a destination.");
      return;
    }

    setLoading(true);
    setError("");
    setIsBackendOffline(false);
    setRoutes([]);

    try {
      let sCoords = startCoords;
      let sLabel = startLabel || startQuery;

      if (!sCoords) {
        const startResults = await geocodeLocation(startQuery, { useDirectOsmFallback: true });
        const bestStart = chooseBestLocation(startResults, startQuery);
        if (!bestStart || !bestStart.lat || !bestStart.lon) {
          throw new Error(`Could not resolve location: "${startQuery}". Please select a suggestion.`);
        }
        sCoords = [Number(bestStart.lat), Number(bestStart.lon)];
        sLabel = bestStart.display_name || startQuery;
        setStartCoords(sCoords);
        setStartLabel(sLabel);
      }

      let dCoords = destCoords;
      let dLabel = destLabel || destQuery;

      if (!dCoords) {
        const destResults = await geocodeLocation(destQuery, { useDirectOsmFallback: true });
        const bestDest = chooseBestLocation(destResults, destQuery);
        if (!bestDest || !bestDest.lat || !bestDest.lon) {
          throw new Error(`Could not resolve location: "${destQuery}". Please select a suggestion.`);
        }
        dCoords = [Number(bestDest.lat), Number(bestDest.lon)];
        dLabel = bestDest.display_name || destQuery;
        setDestCoords(dCoords);
        setDestLabel(dLabel);
      }

      try {
        const result = await fetchRoute(sCoords, dCoords, { useDirectOsrmFallback: false });
        setRoutes(result.routes);
        setSelectedRouteIndex(0);
      } catch (backendErr) {
        if (backendErr instanceof ApiError && backendErr.isNetworkError) {
          setIsBackendOffline(true);
          setError(
            "Backend route service at http://localhost:8080 is unreachable. Please verify that your Spring Boot backend server is active."
          );
        } else {
          setError(backendErr.message || "Failed to calculate road route between locations.");
        }
      }
    } catch (err) {
      setError(err.message || "An error occurred during location resolution.");
    } finally {
      setLoading(false);
    }
  };

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
      setError("Unable to retrieve fallback route geometry.");
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
    <div className="plan-journey-page">
      <div className="container">
        {/* Page Header */}
        <div className="page-intro-header">
          <div className="intro-badge">
            <Compass size={16} />
            <span>JOURNEY PLANNING ENGINE</span>
          </div>
          <h1 className="page-intro-title">Plan & Compare Travel Routes</h1>
          <p className="page-intro-text">
            Search any starting point and destination to view real road network paths, actual distance,
            estimated travel times, and safety information.
          </p>
        </div>

        {/* Main Grid */}
        <div className="plan-grid-layout">
          {/* Controls Column */}
          <div className="plan-controls-column">
            <div className="plan-search-card">
              <form onSubmit={handleSearchRoutes} className="plan-form">
                <LocationSearch
                  id="plan-start"
                  label="Starting Location"
                  placeholder="Enter starting address or landmark..."
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

                {/* Swap button */}
                <div className="swap-button-row">
                  <button
                    type="button"
                    className="btn-swap-locations"
                    onClick={handleSwapLocations}
                    title="Swap starting point and destination"
                    aria-label="Swap starting point and destination"
                  >
                    <ArrowUpDown size={15} />
                    <span>Swap Points</span>
                  </button>
                </div>

                <LocationSearch
                  id="plan-destination"
                  label="Destination"
                  placeholder="Where are you heading?"
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

                {/* Travel time toggle */}
                <div className="travel-time-toggle-group">
                  <label className="toggle-label">Travel Period</label>
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={`toggle-btn ${travelTime === "Day" ? "active" : ""}`}
                      onClick={() => setTravelTime("Day")}
                    >
                      <Sun size={15} />
                      <span>Day</span>
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${travelTime === "Night" ? "active" : ""}`}
                      onClick={() => setTravelTime("Night")}
                    >
                      <Moon size={15} />
                      <span>Night</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary-plan"
                  disabled={loading || !startQuery.trim() || !destQuery.trim()}
                >
                  {loading ? (
                    <LoadingSpinner message="Calculating road route..." size="sm" inline />
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Calculate Route</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error & Offline Diagnostics */}
              {error && (
                <div className="search-error-block">
                  <ErrorMessage
                    title="Routing Notice"
                    message={error}
                    variant={isBackendOffline ? "warning" : "error"}
                  />
                  {isBackendOffline && startCoords && destCoords && (
                    <div className="offline-fallback-prompt">
                      <p className="fallback-note">
                        Backend routing service is offline. You can preview actual road geometry using public OSRM while testing:
                      </p>
                      <button
                        type="button"
                        className="btn-fallback-action"
                        onClick={handleTestClientFallback}
                      >
                        <RefreshCw size={14} />
                        <span>Preview Real Road Geometry</span>
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
                    <small>Click to highlight geometry on the map</small>
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
            <SafetyInfoPanel route={activeRoute} />
          </div>

          {/* Map Column */}
          <div className="plan-map-column">
            <div className="map-container-card">
              <div className="map-card-header">
                <div className="map-title-group">
                  <span className="live-indicator"></span>
                  <h3 className="map-card-title">Route Visualization</h3>
                </div>
                {activeRoute && (
                  <div className="map-route-summary-pill">
                    <span>{activeRoute.distanceKm} km</span>
                    <span>&bull;</span>
                    <span>{activeRoute.durationMin} mins</span>
                  </div>
                )}
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
                height="640px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
