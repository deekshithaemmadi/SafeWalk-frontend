import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Hospital,
  ShieldAlert,
  HeartHandshake,
  MapPin,
  Navigation,
  LocateFixed,
  Info,
  Phone,
  ListFilter,
} from "lucide-react";
import HelpMap from "../components/HelpMap";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import { loadHelpLocations } from "../services/helpLocationsService";
import { haversineKm, formatDistance, isValidLatLon } from "../utils/geoUtils";

const CATEGORIES = [
  { key: "hospital", label: "Hospitals", icon: Hospital, color: "#e11d48" },
  { key: "police", label: "Police Stations", icon: ShieldAlert, color: "#1d4ed8" },
  { key: "women_help", label: "Women's Help Centres", icon: HeartHandshake, color: "#7c3aed" },
];

function formatGeoError(geoError) {
  if (!geoError) return "Unable to read your location.";
  if (geoError.code === 1) {
    return "Location permission was denied. Enable location access to calculate distances.";
  }
  if (geoError.code === 2) return "GPS location is currently unavailable.";
  if (geoError.code === 3) return "Location request timed out. Please try again.";
  return geoError.message || "Unable to update your location.";
}

export default function NearbyHelpPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategories, setActiveCategories] = useState({
    hospital: true,
    police: true,
    women_help: true,
  });
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await loadHelpLocations();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load nearby help datasets.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUseLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoNotice("Geolocation is not supported by this browser, so distances can't be calculated.");
      return;
    }
    setLocating(true);
    setGeoNotice("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocating(false);
      },
      (geoError) => {
        setGeoNotice(formatGeoError(geoError));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Combine all records, attach distance (only when both coords are valid), then filter.
  const allRecords = useMemo(() => {
    if (!data) return [];
    return [...data.hospitals, ...data.policeStations, ...data.womenHelpCentres];
  }, [data]);

  const enriched = useMemo(() => {
    return allRecords.map((rec) => {
      let distanceKm = null;
      if (userLocation && isValidLatLon(rec.latitude, rec.longitude)) {
        distanceKm = haversineKm(userLocation.lat, userLocation.lon, rec.latitude, rec.longitude);
      }
      return {
        ...rec,
        distanceKm,
        distanceLabel: distanceKm != null ? formatDistance(distanceKm) : "",
      };
    });
  }, [allRecords, userLocation]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched
      .filter((rec) => activeCategories[rec.category])
      .filter((rec) => {
        if (!q) return true;
        return (
          rec.name.toLowerCase().includes(q) ||
          (rec.address || "").toLowerCase().includes(q) ||
          (rec.area || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Mappable + distance first (nearest), then alphabetical
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [enriched, activeCategories, search]);

  const mapMarkers = useMemo(
    () => filtered.filter((rec) => isValidLatLon(rec.latitude, rec.longitude)),
    [filtered]
  );

  const toggleCategory = (key) =>
    setActiveCategories((prev) => ({ ...prev, [key]: !prev[key] }));

  const counts = useMemo(() => {
    const c = { hospital: 0, police: 0, women_help: 0 };
    enriched.forEach((r) => {
      if (activeCategories[r.category]) c[r.category] += 1;
    });
    return c;
  }, [enriched, activeCategories]);

  return (
    <div className="nearby-help-page">
      <div className="container">
        <div className="page-intro-header">
          <div className="intro-badge">
            <MapPin size={16} />
            <span>NEARBY HELP DIRECTORY</span>
          </div>
          <h1 className="page-intro-title">Nearby Help Map</h1>
          <p className="page-intro-text">
            Find hospitals, police stations, and women's help centres from SafeWalk's verified
            Hyderabad datasets. Enable location access to sort by real distance from you.
          </p>
        </div>

        {loading && <LoadingSpinner message="Loading nearby help datasets..." />}
        {error && <ErrorMessage title="Dataset Notice" message={error} variant="warning" />}

        {!loading && data && (
          <>
            {/* Controls */}
            <div className="nearby-controls-card">
              <div className="nearby-filter-row">
                <span className="nearby-controls-label">
                  <ListFilter size={16} /> Categories
                </span>
                <div className="nearby-category-toggles">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = activeCategories[cat.key];
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        className={`nearby-category-chip ${active ? "active" : ""}`}
                        onClick={() => toggleCategory(cat.key)}
                        aria-pressed={active}
                        style={
                          active
                            ? { borderColor: cat.color, color: cat.color, background: "#ffffff" }
                            : undefined
                        }
                      >
                        <Icon size={15} style={active ? { color: cat.color } : undefined} />
                        <span>{cat.label}</span>
                        <span className="nearby-chip-count">{counts[cat.key]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="nearby-location-row">
                <input
                  type="text"
                  className="text-input nearby-search-input"
                  placeholder="Search by name, area, or address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search nearby help locations"
                />
                <button
                  type="button"
                  className="btn-nearby-locate"
                  onClick={handleUseLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <>
                      <span className="spinner-sm animate-spin" /> Locating...
                    </>
                  ) : (
                    <>
                      <LocateFixed size={16} /> Use My Location
                    </>
                  )}
                </button>
              </div>

              {userLocation && (
                <p className="nearby-geo-active">
                  <Navigation size={13} /> Showing distances from{" "}
                  {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                </p>
              )}
              {geoNotice && (
                <p className="nearby-geo-notice" role="note">
                  <Info size={13} /> {geoNotice}
                </p>
              )}
            </div>

            {/* Data-honesty notices */}
            {data.meta.notes.length > 0 && (
              <div className="nearby-data-notice" role="note">
                <Info size={16} className="info-icon" />
                <div>
                  <strong>About this data</strong>
                  <ul>
                    {data.meta.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}


            <div className="nearby-layout">
              {/* Map */}
              <div className="nearby-map-card">
                <div className="nearby-map-header">
                  <h3>Emergency & Safety Locations</h3>
                  <span className="nearby-map-badge">{mapMarkers.length} plotted</span>
                </div>
                <div className="nearby-map-canvas">
                  <HelpMap markers={mapMarkers} userLocation={userLocation} />
                </div>
                <p className="nearby-map-note">
                  Interactive map plotting verified hospitals, police stations, and women's help centres. Toggle categories above to filter.
                </p>
              </div>

              {/* Results list */}
              <div className="nearby-list-card">
                <div className="list-card-header">
                  <div>
                    <h2 className="list-card-title">Results ({filtered.length})</h2>
                    <p className="list-card-subtitle">
                      {userLocation
                        ? "Sorted by distance from your location"
                        : "Enable location to sort by distance"}
                    </p>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <p className="nearby-empty">No locations match your filters.</p>
                ) : (
                  <div className="nearby-results-scroll">
                    {filtered.slice(0, 120).map((rec) => {
                      const cat = CATEGORIES.find((c) => c.key === rec.category);
                      const Icon = cat?.icon || MapPin;
                      return (
                        <div key={rec.id} className="nearby-result-item">
                          <div
                            className="nearby-result-icon"
                            style={{ color: cat?.color, background: "#ffffff" }}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="nearby-result-body">
                            <div className="nearby-result-title-row">
                              <h4 className="nearby-result-name">{rec.name}</h4>
                              {rec.distanceLabel && (
                                <span className="nearby-distance-badge">
                                  <Navigation size={12} /> {rec.distanceLabel}
                                </span>
                              )}
                            </div>
                            <span className="nearby-result-type">{rec.type}</span>
                            {rec.address && (
                              <p className="nearby-result-address">{rec.address}</p>
                            )}
                            {rec.phone && (
                              <a href={`tel:${rec.phone}`} className="nearby-result-phone">
                                <Phone size={12} /> {rec.phone}
                              </a>
                            )}
                            {rec.source && (
                              <span className="nearby-result-source">
                                Source: {rec.source}
                                {rec.sourceYear ? ` (${rec.sourceYear})` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {filtered.length > 120 && (
                      <p className="nearby-more-note">
                        Showing first 120 of {filtered.length} results. Refine your search to see more.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


