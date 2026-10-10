/**
 * Geolocation & Distance Utilities
 * Pure helper functions shared by the Nearby Help Map and SOS features.
 * No network access — only local geometry math used when valid coordinates exist.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Validate that a value pair represents a usable geographic coordinate.
 * Guards against missing, non-numeric, or out-of-range dataset values so we
 * never plot a fabricated or invalid point on the map.
 */
export function isValidLatLon(lat, lon) {
  const latitude = typeof lat === "string" ? Number.parseFloat(lat) : lat;
  const longitude = typeof lon === "string" ? Number.parseFloat(lon) : lon;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return false;
  }

  // Hyderabad / India sanity bounds (rejects 0,0 placeholders and swapped axes)
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return false;
  }
  // Practical India bounding box filter to avoid obvious junk coordinates
  if (latitude < 5 || latitude > 38 || longitude < 68 || longitude > 98) {
    return false;
  }

  return true;
}

const toRadians = (deg) => (deg * Math.PI) / 180;

/**
 * Great-circle (haversine) distance between two coordinates in kilometres.
 * @param {number} lat1 @param {number} lon1 @param {number} lat2 @param {number} lon2
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Human-friendly distance label. Uses metres below 1 km for precision.
 */
export function formatDistance(km) {
  if (!Number.isFinite(km)) return "";
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

export default {
  isValidLatLon,
  haversineKm,
  formatDistance,
};
