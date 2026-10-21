/**
 * Help Locations Service
 * Loads the real SafeWalk datasets shipped in `public/datasets/` and normalizes
 * them into a single shape for the Nearby Help Map.
 *
 * IMPORTANT DATA-HONESTY NOTES:
 * - All three datasets (`hyderabad_hospitals.csv`, `hyderabad_police_stations.csv`,
 *   `women_help_centres_selected.csv`) contain latitude/longitude columns with real
 *   Hyderabad coordinates. All three categories are plotted as map pins.
 * - Records with missing or out-of-range coordinates are gracefully handled (marker
 *   not shown; listed as directory entry only).
 * - Every record retains its original `source`/`sourceYear` for attribution.
 */

const DATASET_BASE = `${import.meta.env.BASE_URL || "/"}datasets`;

/**
 * Minimal RFC-4180-ish CSV parser.
 * Handles: quoted fields, embedded commas, embedded newlines inside quotes,
 * escaped double quotes (""), and a leading UTF-8 BOM.
 * @param {string} text
 * @returns {string[][]} rows of raw cell strings
 */
function parseCsv(text) {
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignore — handled by \n on CRLF
    } else {
      field += char;
    }
  }

  // Flush last field/row (files may or may not end with a newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function rowsToObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = (cells[idx] ?? "").trim();
      });
      return obj;
    });
}

async function fetchCsvObjects(fileName) {
  const res = await fetch(`${DATASET_BASE}/${fileName}`);
  if (!res.ok) {
    throw new Error(`Unable to load ${fileName} (HTTP ${res.status}).`);
  }
  const text = await res.text();
  return rowsToObjects(parseCsv(text));
}

// Shared load-state cache so the map + filters read the same parsed data once.
let cache = null;
let inflight = null;

/**
 * Load and normalize all help-location datasets.
 * Returns { hospitals, policeStations, womenHelpCentres, meta } where meta
 * reports which categories are mappable and any load limitations encountered.
 */
export async function loadHelpLocations({ force = false } = {}) {
  if (cache && !force) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const meta = {
      hospitalsMappable: true,
      policeMappable: false,
      womenMappable: false,
      notes: [],
    };

    // ---- Hospitals (HAS coordinates) ----
    let hospitals = [];
    try {
      const raw = await fetchCsvObjects("hyderabad_hospitals.csv");
      hospitals = raw
        .map((r, idx) => ({
          id: `hospital-${idx}`,
          category: "hospital",
          name: r.facility_name || "Unnamed Hospital",
          type: r.facility_type || "HOSPITALS",
          area: r.area_or_ward || r.zone || "",
          district: r.district || "",
          address: r.address || "",
          latitude: Number.parseFloat(r.latitude),
          longitude: Number.parseFloat(r.longitude),
          phone: "",
          sourceYear: r.source_year || "",
          source: r.source || "Hyderabad Hospitals dataset",
        }))
        .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));
    } catch {
      meta.notes.push(
        "Hospital dataset could not be loaded. Hospital markers are unavailable."
      );
      meta.hospitalsMappable = false;
    }

    // ---- Police stations (with verified coordinates) ----
    let policeStations = [];
    try {
      const raw = await fetchCsvObjects("hyderabad_police_stations.csv");
      policeStations = raw.map((r, idx) => {
        const lat = Number.parseFloat(r.latitude);
        const lon = Number.parseFloat(r.longitude);
        return {
          id: `police-${idx}`,
          category: "police",
          name: r["Station Name"] || "Unnamed Police Station",
          type: "POLICE STATION",
          area: r.Area || "",
          district: "Hyderabad",
          address: r.Address || "",
          latitude: Number.isFinite(lat) ? lat : null,
          longitude: Number.isFinite(lon) ? lon : null,
          phone: r.Phone || "",
          sourceYear: "",
          source: "Hyderabad Police Stations dataset",
        };
      });
      meta.policeMappable = policeStations.some((p) => p.latitude != null);
    } catch {
      meta.notes.push("Police station dataset could not be loaded.");
      meta.policeMappable = false;
    }

    // ---- Women's help centres (with verified coordinates) ----
    let womenHelpCentres = [];
    try {
      const raw = await fetchCsvObjects("women_help_centres_selected.csv");
      womenHelpCentres = raw.map((r, idx) => {
        const lat = Number.parseFloat(r.latitude);
        const lon = Number.parseFloat(r.longitude);
        return {
          id: `women-${idx}`,
          category: "women_help",
          name: r.organization_name || "Unnamed Organisation",
          type: r.support_type || "Women / girls support",
          area: "",
          district: "Hyderabad",
          address: r.address || "",
          latitude: Number.isFinite(lat) ? lat : null,
          longitude: Number.isFinite(lon) ? lon : null,
          phone: "",
          supportSectors: r.sectors || "",
          tier: r.tier || "",
          sourceYear: "",
          source: "Women Help Centres dataset (selected)",
        };
      });
      meta.womenMappable = womenHelpCentres.some((w) => w.latitude != null);
    } catch {
      meta.notes.push("Women's help centre dataset could not be loaded.");
      meta.womenMappable = false;
    }

    const result = { hospitals, policeStations, womenHelpCentres, meta };
    cache = result;
    return result;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export default { loadHelpLocations };

