import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Trash2 } from "lucide-react";

// Default center: Hyderabad, Telangana
const DEFAULT_CENTER = [17.385044, 78.486671];
const DEFAULT_ZOOM = 12;

// Custom crisp SVG marker icons using L.divIcon
const createCustomMarkerIcon = (color, label) => {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${color};
        color: #ffffff;
        font-weight: 700;
        font-size: 13px;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid #ffffff;
      ">
        ${label}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid ${color};
        margin: -2px auto 0;
      "></div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
};

const startIcon = createCustomMarkerIcon("#0d9488", "A"); // Teal
const destinationIcon = createCustomMarkerIcon("#0f172a", "B"); // Deep Navy

const currentLocationIcon = L.divIcon({
  className: "custom-leaflet-marker current-location-marker",
  html: `
    <div class="live-location-pulse-ring"></div>
    <div class="live-location-dot"></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// Map Controller for auto-centering and fitting bounds
function MapController({ route, startCoords, destinationCoords, currentLocation, followCurrentLocation }) {
  const map = useMap();
  const lastPannedRef = useRef(null);

  useEffect(() => {
    // Invalidate size in case container size changed
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (followCurrentLocation && currentLocation) {
      const next = L.latLng(currentLocation[0], currentLocation[1]);
      const last = lastPannedRef.current;
      if (!last) {
        map.setView(next, Math.max(map.getZoom(), 15));
        lastPannedRef.current = next;
      } else if (last.distanceTo(next) > 12) {
        map.panTo(next);
        lastPannedRef.current = next;
      }
      return;
    }

    lastPannedRef.current = null;

    if (route && route.length > 1) {
      map.fitBounds(route, {
        padding: [50, 50],
        maxZoom: 15,
      });
    } else if (startCoords && destinationCoords) {
      map.fitBounds([startCoords, destinationCoords], {
        padding: [60, 60],
        maxZoom: 15,
      });
    } else if (startCoords) {
      map.setView(startCoords, 14);
    } else if (destinationCoords) {
      map.setView(destinationCoords, 14);
    }
  }, [route, startCoords, destinationCoords, currentLocation, followCurrentLocation, map]);

  return null;
}

export default function RouteMap({
  startCoords,
  destinationCoords,
  startLabel,
  destinationLabel,
  routes = [],
  selectedRouteIndex = 0,
  onSelectRoute,
  onClearRoute,
  isLoading = false,
  error = "",
  height = "520px",
  currentLocation = null,
  isTripActive = false,
}) {
  const activeRoute = routes[selectedRouteIndex] || routes[0];
  const activeRouteCoordinates = activeRoute?.coordinates || [];
  const liveCoords = currentLocation
    ? [currentLocation.lat, currentLocation.lon]
    : null;
  const followCurrentLocation = Boolean(isTripActive && liveCoords);

  return (
    <div className="map-wrapper-card" style={{ height }}>
      <MapContainer
        center={startCoords || destinationCoords || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="safewalk-leaflet-container"
        style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          route={activeRouteCoordinates}
          startCoords={startCoords}
          destinationCoords={destinationCoords}
          currentLocation={liveCoords}
          followCurrentLocation={followCurrentLocation}
        />

        {/* Start Point Marker */}
        {startCoords && (
          <Marker position={startCoords} icon={startIcon}>
            <Popup className="safewalk-popup">
              <strong>Starting Point (A)</strong>
              <p>{startLabel || `${startCoords[0].toFixed(4)}, ${startCoords[1].toFixed(4)}`}</p>
            </Popup>
          </Marker>
        )}

        {/* Destination Point Marker */}
        {destinationCoords && (
          <Marker position={destinationCoords} icon={destinationIcon}>
            <Popup className="safewalk-popup">
              <strong>Destination (B)</strong>
              <p>{destinationLabel || `${destinationCoords[0].toFixed(4)}, ${destinationCoords[1].toFixed(4)}`}</p>
            </Popup>
          </Marker>
        )}

        {liveCoords && (
          <Marker position={liveCoords} icon={currentLocationIcon} zIndexOffset={1000}>
            <Popup className="safewalk-popup">
              <strong>Your current location</strong>
              <p>
                {liveCoords[0].toFixed(6)}, {liveCoords[1].toFixed(6)}
              </p>
            </Popup>
          </Marker>
        )}

        {/* Render Alternative Routes (underneath primary) */}
        {routes.map((rt, idx) => {
          if (idx === selectedRouteIndex) return null;
          return (
            <Polyline
              key={rt.id || `alt-route-${idx}`}
              positions={rt.coordinates}
              pathOptions={{
                color: "#64748b",
                weight: 4,
                opacity: 0.6,
                dashArray: "6, 8",
              }}
              eventHandlers={{
                click: () => onSelectRoute && onSelectRoute(idx),
              }}
            />
          );
        })}

        {/* Render Active Selected Route */}
        {activeRouteCoordinates.length > 1 && (
          <Polyline
            positions={activeRouteCoordinates}
            pathOptions={{
              color: "#0d9488", // Teal theme accent
              weight: 6,
              opacity: 0.9,
            }}
          />
        )}
      </MapContainer>

      {/* Floating Map Controls & Badges */}
      <div className="map-floating-overlay-top">
        {activeRoute && !isLoading && (
          <div className="route-stats-pill">
            <span className="route-pill-dot"></span>
            <strong>{activeRoute.name || "Selected Route"}</strong>
            <span className="route-stat-divider">|</span>
            <span>{activeRoute.distanceKm} km</span>
            <span className="route-stat-divider">|</span>
            <span>~{activeRoute.durationMin} mins</span>
          </div>
        )}

        {onClearRoute && (activeRouteCoordinates.length > 0 || startCoords || destinationCoords) && (
          <button
            type="button"
            className="btn-map-floating btn-clear-route"
            onClick={onClearRoute}
            title="Clear route and markers"
          >
            <Trash2 size={14} />
            <span>Clear Map</span>
          </button>
        )}
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="map-overlay-center">
          <div className="map-loader-badge">
            <div className="spinner-sm animate-spin"></div>
            <span>Calculating road route...</span>
          </div>
        </div>
      )}

      {/* Error notification banner on map */}
      {error && !isLoading && (
        <div className="map-overlay-bottom">
          <div className="map-error-banner" role="alert">
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
