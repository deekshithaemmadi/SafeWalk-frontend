/**
 * Authentication Service
 * Communicates with backend endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/register
 */

import { apiRequest, setStoredToken, getStoredToken } from "./api";

export { getStoredToken, setStoredToken };

const USER_STORAGE_KEY = "safewalk_user";

export async function login({ email, password }) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Expected response: { token: string, user: { id, name, email, phone, emergencyContacts } }
  if (data?.token) {
    setStoredToken(data.token);
  }
  if (data?.user) {
    setStoredUser(data.user);
  }
  return data;
}

export async function register({ name, email, phone, password, emergencyContacts }) {
  const data = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      phone,
      password,
      emergencyContacts,
    }),
  });

  // Some backend designs return token + user immediately upon register
  if (data?.token) {
    setStoredToken(data.token);
  }
  if (data?.user) {
    setStoredUser(data.user);
  }
  return data;
}

export function logout() {
  setStoredToken(null);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    // Exclude any raw password or sensitive credentials before saving user profile snapshot
    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function isAuthenticated() {
  return Boolean(getStoredToken() || getStoredUser());
}

export default {
  login,
  register,
  logout,
  getStoredUser,
  setStoredUser,
  isAuthenticated,
};
