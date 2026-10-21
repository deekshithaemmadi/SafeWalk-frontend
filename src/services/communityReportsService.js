/**
 * Community Safety Reports Service
 * Communicates with backend endpoints:
 * - GET /api/community-reports (returns Page<CommunityReportResponse>)
 * - POST /api/community-reports (saves permanently to MySQL community_reports table)
 */

import { apiRequest } from "./api";

const BACKUP_STORAGE_KEY = "safewalk_community_reports_backup";

function getLocalBackupReports() {
  try {
    const raw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalBackupReport(report) {
  try {
    const existing = getLocalBackupReports();
    const next = [report, ...existing];
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore local storage errors
  }
}

/**
 * Fetch permitted community reports from MySQL database via Spring Boot backend.
 * Authenticated users receive all VERIFIED reports plus their own reports.
 */
export async function fetchCommunityReports({ status, category, page = 0, size = 50 } = {}) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (category) params.append("category", category);
  params.append("page", String(page));
  params.append("size", String(size));

  try {
    const response = await apiRequest(`/api/community-reports?${params.toString()}`, {
      method: "GET",
    });

    const items = Array.isArray(response)
      ? response
      : response && Array.isArray(response.content)
      ? response.content
      : [];

    return items;
  } catch (err) {
    // If backend is unreachable or not authenticated, fall back to any local backups
    const local = getLocalBackupReports();
    if (local.length > 0) {
      return local;
    }
    throw err;
  }
}

/**
 * Submit a community safety report to be saved permanently in MySQL database.
 * @param {object} report
 * @param {string} report.category
 * @param {string} report.description
 * @param {string} [report.location]
 * @param {number} [report.latitude]
 * @param {number} [report.longitude]
 * @returns {Promise<{saved: boolean, report: object, message?: string}>}
 */
export async function submitReport({ category, description, location = "", latitude = null, longitude = null }) {
  const payload = {
    category: category.trim(),
    description: description.trim(),
    location: location?.trim() || null,
    latitude: typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null,
    longitude: typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null,
  };

  try {
    const saved = await apiRequest("/api/community-reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      saved: true,
      report: saved,
      message: "Report saved permanently in the SafeWalk database. It is currently PENDING moderation review.",
    };
  } catch (error) {
    // If user is unauthenticated or backend offline, save locally as fallback
    const offlineRecord = {
      id: `local-${Date.now()}`,
      category: payload.category,
      description: payload.description,
      location: payload.location,
      latitude: payload.latitude,
      longitude: payload.longitude,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      isLocalOnly: true,
    };
    saveLocalBackupReport(offlineRecord);

    return {
      saved: false,
      report: offlineRecord,
      message: error?.message || "Could not reach the server. Saved locally as fallback.",
    };
  }
}

export default {
  fetchCommunityReports,
  submitReport,
};
