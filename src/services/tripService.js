/**
 * Trip Lifecycle & History Service
 * Communicates with backend endpoints:
 * - POST /api/trips (Creates a planned trip in MySQL trips table)
 * - GET  /api/trips (Returns paginated Page<TripResponse> for current user)
 * - GET  /api/trips/{id} (Returns single TripResponse)
 * - POST /api/trips/{id}/start (Starts trip: PLANNED -> ACTIVE)
 * - POST /api/trips/{id}/location (Updates latest coordinates while ACTIVE)
 * - POST /api/trips/{id}/end (Ends trip: ACTIVE -> COMPLETED)
 * - POST /api/trips/{id}/cancel (Cancels trip: -> CANCELLED)
 */

import { apiRequest } from "./api";

/**
 * Create a new planned trip in the database.
 * @param {object} params
 * @param {string} [params.originLabel]
 * @param {{latitude: number, longitude: number}} [params.origin]
 * @param {string} [params.destinationLabel]
 * @param {{latitude: number, longitude: number}} [params.destination]
 */
export async function createTrip({
  originLabel = "Starting Point",
  origin = null,
  destinationLabel = "Destination",
  destination = null,
} = {}) {
  const payload = {
    originLabel: originLabel || "Starting Point",
    origin: origin && Number.isFinite(origin.latitude) && Number.isFinite(origin.longitude)
      ? { latitude: origin.latitude, longitude: origin.longitude }
      : null,
    destinationLabel: destinationLabel || "Destination",
    destination: destination && Number.isFinite(destination.latitude) && Number.isFinite(destination.longitude)
      ? { latitude: destination.latitude, longitude: destination.longitude }
      : null,
  };

  return await apiRequest("/api/trips", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Start a planned trip (PLANNED -> ACTIVE).
 * @param {number|string} tripId
 */
export async function startTrip(tripId) {
  return await apiRequest(`/api/trips/${tripId}/start`, {
    method: "POST",
  });
}

/**
 * Update latest location of an active trip.
 * @param {number|string} tripId
 * @param {{latitude: number, longitude: number, accuracy?: number}} coords
 */
export async function updateTripLocation(tripId, { latitude, longitude }) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return await apiRequest(`/api/trips/${tripId}/location`, {
    method: "POST",
    body: JSON.stringify({ latitude, longitude }),
  });
}

/**
 * Complete an active trip (ACTIVE -> COMPLETED).
 * @param {number|string} tripId
 */
export async function endTrip(tripId) {
  return await apiRequest(`/api/trips/${tripId}/end`, {
    method: "POST",
  });
}

/**
 * Cancel a trip.
 * @param {number|string} tripId
 */
export async function cancelTrip(tripId) {
  return await apiRequest(`/api/trips/${tripId}/cancel`, {
    method: "POST",
  });
}

/**
 * Fetch trip history for the current authenticated user.
 * @param {object} params
 * @param {number} [params.page]
 * @param {number} [params.size]
 * @returns {Promise<Array<object>>}
 */
export async function getTrips({ page = 0, size = 30 } = {}) {
  const response = await apiRequest(`/api/trips?page=${page}&size=${size}`, {
    method: "GET",
  });

  if (Array.isArray(response)) {
    return response;
  }
  if (response && Array.isArray(response.content)) {
    return response.content;
  }
  return [];
}

/**
 * Get a specific trip by ID.
 * @param {number|string} tripId
 */
export async function getTripById(tripId) {
  return await apiRequest(`/api/trips/${tripId}`, {
    method: "GET",
  });
}

export default {
  createTrip,
  startTrip,
  updateTripLocation,
  endTrip,
  cancelTrip,
  getTrips,
  getTripById,
};
