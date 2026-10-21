import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation } from "lucide-react";

// Hyderabad default view (matches the rest of SafeWalk)
const DEFAULT_CENTER = [17.385044, 78.486671];
const DEFAULT_ZOOM = 11;

// Distinct marker colors per help category
const CATEGORY_STYLE = {
  hospital: { color: "#e11d48", label: "H" },
  police: { color: "#1d4ed8", label: "P" },
  women_help: { color: "#7c3aed", label: "W" },
};

function createHelpIcon(color, label) {
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:30px;height:30px;border-radius:50%;
        background-color:${color};color:#fff;font-weight:700;font-size:13px;
        font-family:system-ui,-apple-system,sans-serif;
        box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid #ffffff;
      ">${label}</div>
      <div style="
        width:0;height:0;border-left:6px solid transparent;
        border-right:6px solid transparent;border-top:8px solid ${color};
        margin:-2px auto 0;
      "></div>
    `,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
  });
}

const userLocationIcon = L.divIcon({
  className: "custom-leaflet-marker current-location-marker",
  html: `<div class="live-location-pulse-ring"></div><div class="live-location-dot"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

/** Fits the map to all visible markers (and user location when present). */
function HelpMapController({ markers, userLocation }) {
  const map = useMap();
  const fittedKeyRef = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const points = markers.map((m) => [m.latitude, m.longitude]);
    if (userLocation) points.push([userLocation.lat, userLocation.lon]);

    if (points.length === 0) return;

    // Only auto-fit once per distinct marker set to avoid fighting user pan/zoom
    const key = `${points.length}:${userLocation ? `${userLocation.lat},${userLocation.lon}` : ""}`;
    if (fittedKeyRef.current === key) return;
    fittedKeyRef.current = key;

    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, userLocation, map]);

  return null;
}

export default function HelpMap({ markers = [], userLocation = null }) {
  // Calculate tiny spiral offsets for markers that share the same or very close coordinates
  // so no markers overlap or hide each other.
  const processedMarkers = useMemo(() => {
    const mappable = markers.filter(
      (m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude)
    );

    const clusters = new Map();
    mappable.forEach((m) => {
      const key = `${m.latitude.toFixed(4)},${m.longitude.toFixed(4)}`;
      if (!clusters.has(key)) clusters.set(key, []);
      clusters.get(key).push(m);
    });

    return mappable.map((m) => {
      const key = `${m.latitude.toFixed(4)},${m.longitude.toFixed(4)}`;
      const group = clusters.get(key);
      if (!group || group.length <= 1) {
        return { ...m, displayLat: m.latitude, displayLon: m.longitude };
      }
      const index = group.indexOf(m);
      const angle = (2 * Math.PI * index) / group.length;
      const radius = 0.00025;
      const displayLat = m.latitude + radius * Math.cos(angle);
      const displayLon =
        m.longitude + (radius * Math.sin(angle)) / Math.cos((m.latitude * Math.PI) / 180);
      return { ...m, displayLat, displayLon };
    });
  }, [markers]);

  return (
    <MapContainer
      center={userLocation ? [userLocation.lat, userLocation.lon] : DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="safewalk-leaflet-container"
      style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <HelpMapController markers={processedMarkers} userLocation={userLocation} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lon]} icon={userLocationIcon}>
          <Popup className="safewalk-popup">
            <strong>Your location</strong>
            <p>
              {userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}
            </p>
          </Popup>
        </Marker>
      )}

      {processedMarkers.map((m) => {
        const style = CATEGORY_STYLE[m.category] || CATEGORY_STYLE.hospital;
        return (
          <Marker
            key={m.id}
            position={[m.displayLat, m.displayLon]}
            icon={createHelpIcon(style.color, style.label)}
          >
            <Popup className="safewalk-popup">
              <strong>{m.name}</strong>
              <p>{m.type}</p>
              {m.address && <p>{m.address}</p>}
              {m.phone && (
                <p>
                  <a href={`tel:${m.phone}`} style={{ color: "#0d9488", textDecoration: "none" }}>
                    📞 {m.phone}
                  </a>
                </p>
              )}
              {m.distanceLabel && (
                <p>
                  <Navigation size={11} style={{ verticalAlign: "middle" }} /> {m.distanceLabel} away
                </p>
              )}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
