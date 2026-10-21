/**
 * SOS Emergency Service
 * Communicates with backend endpoint:
 * - POST /api/sos (Records emergency event and optional location in MySQL sos_events table)
 * - GET /api/sos (Fetches user's previous SOS events)
 */

import { apiRequest } from "./api";

/**
 * Submit an SOS alert to the Spring Boot backend to be recorded in MySQL.
 *
 * @param {object} params
 * @param {{lat:number, lon:number, accuracy?:number}|null} [params.location]
 * @param {boolean} [params.shareLocation] - whether the user consented to share location
 * @param {string} [params.message]
 * @returns {Promise<{recorded: boolean, id?: number, delivered: boolean, message: string, createdAt?: string}>}
 */
export async function sendSosAlert({ location = null, shareLocation = false, message = "" } = {}) {
  const payload = {
    message: message || "SOS activated from SafeWalk web application",
    shareLocation: Boolean(shareLocation),
    latitude: shareLocation && location ? location.lat : null,
    longitude: shareLocation && location ? location.lon : null,
    accuracy: shareLocation && location?.accuracy != null ? location.accuracy : null,
    requestedAt: new Date().toISOString(),
  };

  try {
    const data = await apiRequest("/api/sos", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      recorded: true,
      id: data.id,
      delivered: Boolean(data.delivered), // false per backend contract until SMS gateway is connected
      message: data.message || "SOS event recorded in SafeWalk database.",
      createdAt: data.createdAt,
    };
  } catch (error) {
    return {
      recorded: false,
      delivered: false,
      message: error?.message || "Failed to record SOS event in the backend database.",
    };
  }
}

/**
 * Retrieve past SOS event history for the authenticated user.
 */
export async function getSosHistory() {
  return await apiRequest("/api/sos", {
    method: "GET",
  });
}

export default {
  sendSosAlert,
  getSosHistory,
};
