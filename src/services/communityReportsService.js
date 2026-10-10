/**
 * Community Safety Reports Service
 *
 * FRONTEND-ONLY STATUS:
 * There is NO existing backend API for community reports. Submitted reports are
 * stored ONLY in this browser (localStorage) so the list persists across reloads
 * on the same device. They are NOT uploaded, NOT shared with other users, and
 * NOT verified by any authority.
 *
 * The UI must always label these as "Unverified" and must never claim they are
 * permanently saved or broadcast.
 *
 * Integration point: to make reports real & shared, implement a backend endpoint
 * (e.g. POST /api/community-reports) and replace the localStorage calls below.
 */

const STORAGE_KEY = "safewalk_community_reports";

/** Read all locally stored reports (newest first). */
export function getLocalReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist a new report locally.
 * @returns {Promise<{saved:boolean, stored:boolean, report:object}>}
 * `stored` is true only when saved to this device; `saved` remains false to make
 * clear nothing was submitted to a server.
 */
export async function submitReport(report) {
  const record = {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: report.category,
    description: report.description.trim(),
    location: report.location?.trim() || "",
    createdAt: new Date().toISOString(),
    verified: false,
  };

  try {
    const existing = getLocalReports();
    const next = [record, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return { saved: false, stored: true, report: record };
  } catch {
    return { saved: false, stored: false, report: record };
  }
}

export default { getLocalReports, submitReport };
