/**
 * Route & Geocoding Service
 * Integrates with:
 * - GET /api/geocode?q={query}
 * - GET /api/route?startLat={lat}&startLon={lon}&endLat={lat}&endLon={lon}
 * 
 * Also supports direct OSM Nominatim autocomplete with proper debouncing and attribution,
 * and standard OSRM geometry parsing.
 */

import { apiRequest, ApiError } from "./api";

/**
 * Geocode query via backend /api/geocode
 * Falls back to OpenStreetMap Nominatim if explicitly enabled or backend fails
 */
export async function geocodeLocation(query, { useDirectOsmFallback = false } = {}) {
  const trimmed = query?.trim();
  if (!trimmed) {
    throw new Error("Please enter a location name or coordinates.");
  }

  // 1. Try Backend API first
  try {
    const encoded = encodeURIComponent(trimmed);
    const data = await apiRequest(`/api/geocode?q=${encoded}`, {
      method: "GET",
    });

    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    if (!useDirectOsmFallback) {
      return [];
    }
  } catch (err) {
    // If backend is offline and fallback is not allowed, bubble up the backend error
    if (!useDirectOsmFallback) {
      throw err;
    }
  }

  // 2. Client-side Nominatim fallback (for place suggestion preview and offline frontend test)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("Geocoding service unavailable.");
    }
    return await res.json();
  } catch {
    throw new ApiError(
      `Unable to geocode location "${trimmed}". Geocoding services could not be reached.`,
      0,
      null,
      true
    );
  }
}

/**
 * Fetch route between start and destination coordinates
 * @param {Array<number>} startCoords - [latitude, longitude]
 * @param {Array<number>} endCoords - [latitude, longitude]
 * @param {object} options - { useDirectOsrmFallback: boolean }
 */
export async function fetchRoute(startCoords, endCoords, { useDirectOsrmFallback = false } = {}) {
  if (!startCoords || !endCoords) {
    throw new Error("Both start and destination coordinates are required.");
  }

  const [startLat, startLon] = startCoords;
  const [endLat, endLon] = endCoords;

  const endpoint = `/api/route?startLat=${startLat}&startLon=${startLon}&endLat=${endLat}&endLon=${endLon}`;

  try {
    const data = await apiRequest(endpoint, { method: "GET" });
    return parseRouteResponse(data);
  } catch (backendError) {
    if (!useDirectOsrmFallback) {
      throw backendError;
    }

    // Direct public OSRM client-side demo fallback if enabled
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&alternatives=true`;
      const res = await fetch(osrmUrl);
      if (!res.ok) {
        throw new Error("Public routing service returned an error.");
      }
      const osrmData = await res.json();
      return parseRouteResponse(osrmData, "OSRM Public Routing (Client Fallback)");
    } catch {
      throw backendError;
    }
  }
}

/**
 * Normalize and parse route responses from backend or OSRM
 */
function parseRouteResponse(data, source = "Backend Route Service") {
  if (!data || data.code !== "Ok" || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error("Locations were found, but a drivable/walkable route could not be calculated.");
  }

  const parsedRoutes = data.routes.map((route, index) => {
    if (!route.geometry || !route.geometry.coordinates) {
      throw new Error(`Route #${index + 1} does not include geometry coordinates.`);
    }

    // Leaflet coordinates format: [latitude, longitude]
    // GeoJSON coordinates format: [longitude, latitude]
    const leafletCoordinates = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

    const distanceKm = Number((route.distance / 1000).toFixed(2));
    const durationMin = Math.max(1, Math.round(route.duration / 60));

    // Optional verified safety info field from backend
    const verifiedSafetyInfo = route.verifiedSafetyInfo || null;

    return {
      id: `route-${index + 1}`,
      name: route.name || (index === 0 ? "Primary Route" : `Alternative Route ${index}`),
      label: String.fromCharCode(65 + index), // 'A', 'B', 'C'
      distanceKm,
      durationMin,
      coordinates: leafletCoordinates,
      summary: route.legs?.[0]?.summary || "",
      verifiedSafetyInfo,
      source,
    };
  });

  return {
    routes: parsedRoutes,
    primaryRoute: parsedRoutes[0],
  };
}

/**
 * Pick best geocoding result matching user input
 */
export function chooseBestLocation(results, userInput = "") {
  if (!results || results.length === 0) return null;
  const input = userInput.trim().toLowerCase();

  const exactDisplayMatch = results.find(
    (item) => item.display_name && item.display_name.toLowerCase().startsWith(input)
  );
  if (exactDisplayMatch) return exactDisplayMatch;

  const exactNameMatch = results.find(
    (item) => item.name && item.name.toLowerCase() === input
  );
  if (exactNameMatch) return exactNameMatch;

  const addressMatch = results.find((item) => {
    if (!item.address) return false;
    const values = Object.values(item.address)
      .filter(Boolean)
      .map((v) => String(v).toLowerCase());
    return values.some((val) => val === input || val.includes(input));
  });
  if (addressMatch) return addressMatch;

  return results[0];
}

export default {
  geocodeLocation,
  fetchRoute,
  chooseBestLocation,
};
