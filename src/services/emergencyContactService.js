/**
 * Emergency Contacts Service
 * Communicates with backend endpoints:
 * - GET /api/emergency-contacts
 * - POST /api/emergency-contacts
 * - PUT /api/emergency-contacts/{id}
 * - DELETE /api/emergency-contacts/{id}
 */

import { apiRequest } from "./api";

export async function getEmergencyContacts() {
  return await apiRequest("/api/emergency-contacts", {
    method: "GET",
  });
}

export async function createEmergencyContact({ name, phone, relation }) {
  return await apiRequest("/api/emergency-contacts", {
    method: "POST",
    body: JSON.stringify({ name, phone, relation }),
  });
}

export async function updateEmergencyContact(id, { name, phone, relation }) {
  return await apiRequest(`/api/emergency-contacts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, phone, relation }),
  });
}

export async function deleteEmergencyContact(id) {
  return await apiRequest(`/api/emergency-contacts/${id}`, {
    method: "DELETE",
  });
}

export default {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
};
