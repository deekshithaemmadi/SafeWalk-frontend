/**
 * SOS Emergency Service
 *
 * FRONTEND-ONLY STATUS:
 * There is currently NO backend endpoint that delivers SOS alerts. The functions
 * below define a clear integration point (POST /api/sos) so that alert delivery,
 * SMS broadcasting, and location sharing can be wired to a real backend later.
 *
 * Until a backend exists, SafeWalk does NOT claim to send, deliver, or dispatch
 * any alert. The SOS UI only:
 *   - initiates a direct phone call to India's national emergency number (112),
 *   - lets the user manually share their consent-based location, and
 *   - lists the user's saved emergency contacts for manual calling.
 */

/**
 * Attempt to submit an SOS alert to the backend.
 *
 * @param {object} payload
 * @param {{lat:number, lon:number, accuracy?:number}|null} payload.location
 * @param {boolean} payload.shareLocation - whether the user consented to share location
 * @param {string} [payload.message]
 * @returns {Promise<{delivered:boolean, reason?:string, preparedPayload?:object}>}
 *
 * Integration point: replace the simulated branch with a real `apiRequest`
 * call to `POST /api/sos` (imported from "./api") once the backend implements
 * alert delivery. The `preparedPayload` shows exactly what would be sent.
 */
export async function sendSosAlert({ location = null, shareLocation = false, message = "" } = {}) {
  const preparedPayload = {
    message: message || "SOS activated from SafeWalk",
    shareLocation,
    location:
      shareLocation && location
        ? { lat: location.lat, lon: location.lon, accuracy: location.accuracy ?? null }
        : null,
    requestedAt: new Date().toISOString(),
  };

  try {
    // =====================================================================
    // REAL INTEGRATION POINT — enable once the backend implements delivery:
    //
    //   import { apiRequest } from "./api";
    //   const data = await apiRequest("/api/sos", {
    //     method: "POST",
    //     body: JSON.stringify(preparedPayload),
    //   });
    //   return { delivered: true, data };
    // =====================================================================

    // No backend endpoint is implemented yet — do not pretend an alert was sent.
    await Promise.resolve(); // keep async signature stable for future wiring
    return {
      delivered: false,
      preparedPayload,
      reason:
        "No backend alert service is connected. This action does NOT send an automated alert. Please call 112 directly.",
    };
  } catch (error) {
    return {
      delivered: false,
      reason:
        error?.message ||
        "Alert could not be delivered because no backend service is connected.",
    };
  }
}

export default { sendSosAlert };
