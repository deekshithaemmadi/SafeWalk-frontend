/**
 * SafeWalk Centralized API Service
 * Handles base URL configuration, headers, token injection, and unified error handling.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Custom API Error class with status code and details
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Retrieve auth token from storage
 */
export const getStoredToken = () => {
  return localStorage.getItem("safewalk_token");
};

/**
 * Set auth token in storage
 */
export const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem("safewalk_token", token);
  } else {
    localStorage.removeItem("safewalk_token");
  }
};

/**
 * Core HTTP request handler
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = getStoredToken();
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);

    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Request failed with status ${response.status} (${response.statusText})`;
      throw new ApiError(errorMessage, response.status, data, false);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network / connection failure (e.g. backend offline)
    const isNetwork =
      error.name === "TypeError" ||
      error.message?.includes("fetch") ||
      error.message?.includes("NetworkError") ||
      error.message?.includes("Failed to fetch");

    const message = isNetwork
      ? `Backend service at ${API_BASE_URL} is unreachable. Please verify the server is running.`
      : error.message || "An unexpected network error occurred.";

    throw new ApiError(message, 0, null, isNetwork);
  }
}

export default {
  apiRequest,
  getApiBaseUrl,
  getStoredToken,
  setStoredToken,
};
