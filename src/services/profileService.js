/**
 * User Profile Service
 * Communicates with backend endpoints:
 * - GET /api/users/me
 * - PUT /api/users/me
 */

import { apiRequest } from "./api";
import { setStoredUser, getStoredUser } from "./authService";

export async function getProfile() {
  const data = await apiRequest("/api/users/me", {
    method: "GET",
  });
  if (data) {
    setStoredUser(data);
  }
  return data;
}

export async function updateProfile({ name, email, phone }) {
  const data = await apiRequest("/api/users/me", {
    method: "PUT",
    body: JSON.stringify({ name, email, phone }),
  });
  
  // Update local session state on confirmed backend update
  const currentUser = getStoredUser() || {};
  const updated = {
    ...currentUser,
    ...(data || { name, email, phone }),
  };
  setStoredUser(updated);

  return data || updated;
}

export default {
  getProfile,
  updateProfile,
};
