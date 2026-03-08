import { readFile } from "node:fs/promises";
import path from "node:path";
import MainMapExperience from "./components/mpa-panel/main-map-experience";
import { listCsvFiles, loadCsvData } from "../lib/data";

function normalizeMmsi(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  // Accept both plain MMSI strings and values serialized as numeric CSV fields (e.g. "273250200.0").
  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) {
    return String(Math.trunc(numeric));
  }

  return raw.replace(/[^0-9]/g, "");
}

async function loadDeepDiveIndex() {
  const files = await listCsvFiles("vessel_reports", { recursive: true });
  const grouped = new Map();

  for (const file of files) {
    const match = file.match(/^([^/]+)\/(identity|visits|violations|dark_events|deepdive)\.csv$/i);
    if (!match) {
      continue;
    }

    const vesselSlug = match[1];
    const part = match[2].toLowerCase();
    if (!grouped.has(vesselSlug)) {
      grouped.set(vesselSlug, {});
    }
    grouped.get(vesselSlug)[part] = file;
  }

  const byMmsi = {};

  for (const [vesselSlug, parts] of grouped.entries()) {
    const [identityData, visitsData, violationsData, darkEventsData, deepDiveData] = await Promise.all([
      parts.identity ? loadCsvData("vessel_reports", parts.identity, "", "asc") : Promise.resolve({ records: [] }),
      parts.visits ? loadCsvData("vessel_reports", parts.visits, "", "asc") : Promise.resolve({ records: [] }),
      parts.violations ? loadCsvData("vessel_reports", parts.violations, "", "asc") : Promise.resolve({ records: [] }),
      parts.dark_events ? loadCsvData("vessel_reports", parts.dark_events, "", "asc") : Promise.resolve({ records: [] }),
      parts.deepdive ? loadCsvData("vessel_reports", parts.deepdive, "", "asc") : Promise.resolve({ records: [] })
    ]);

    const deepDiveSummary = deepDiveData.records[0] || null;
    const identity =
      identityData.records[0] || (deepDiveSummary
        ? {
            mmsi: deepDiveSummary.mmsi || "",
            imo: "",
            vessel_name: deepDiveSummary.vessel_name || "",
            flag: deepDiveSummary.flag || "",
            vessel_type: deepDiveSummary.vessel_type || "",
            length_m: "",
            vessel_age_years: deepDiveSummary.vessel_age_years || "",
            gear_type: "",
            owner: "",
            operator: "",
            first_seen: deepDiveSummary.first_seen || "",
            last_seen: deepDiveSummary.last_seen || ""
          }
        : null);
    const record = {
      identity,
      visits: visitsData.records,
      violations: violationsData.records,
      darkEvents: darkEventsData.records
    };

    const mmsiKey = normalizeMmsi(identity?.mmsi);
    if (mmsiKey) {
      byMmsi[mmsiKey] = record;
    }
  }

  return { byMmsi };
}

async function loadMpaRegions() {
  const { records } = await loadCsvData("reports", "mpa_registry.csv", "", "asc");
  if (!records.length) {
    throw new Error("No MPA rows found in data/reports/mpa_registry.csv");
  }

  const regions = await Promise.all(
    records.map(async (row) => {
      const mpaId = String(row.mpa_id || "").trim();
      const displayName = String(row.display_name || mpaId).trim();
      const reportFile = String(row.report_file || "").trim();
      const geojsonFile = String(row.geojson_file || "").trim();
      const metadataFile = String(row.metadata_file || "").trim();

      if (!mpaId || !geojsonFile) {
        return null;
      }

      const geojsonRaw = await readFile(path.join(process.cwd(), "data/region_geojsons", geojsonFile), "utf8");
      let contextData = null;
      try {
        const contextRaw = await readFile(path.join(process.cwd(), "data/context", `${mpaId}.json`), "utf8");
        contextData = JSON.parse(contextRaw);
      } catch {
        contextData = null;
      }
      let regionMetadata = null;
      if (metadataFile) {
        try {
          const metadataRaw = await readFile(
            path.join(process.cwd(), "data/region_metadata", metadataFile),
            "utf8"
          );
          regionMetadata = JSON.parse(metadataRaw);
        } catch {
          regionMetadata = null;
        }
      }
      let reportData = { records: [] };
      if (reportFile) {
        try {
          reportData = await loadCsvData("mpa_reports", reportFile, "", "asc");
        } catch {
          reportData = { records: [] };
        }
      }
      const geojson = JSON.parse(geojsonRaw);

      return {
        mpaId,
        displayName,
        geojsonFile,
        geojson,
        hasValidData: Boolean(reportFile) && reportData.records.length > 0,
        context: contextData,
        regionMetadata,
        records: reportData.records
      };
    })
  );

  return regions.filter(Boolean);
}

export default async function MainPage() {
  const mpaRegions = await loadMpaRegions();
  const defaultMpa = mpaRegions.find((region) => region.hasValidData) || mpaRegions[0] || null;
  const deepDiveData = await loadDeepDiveIndex();

  return (
    <MainMapExperience
      mpaRegions={mpaRegions}
      defaultMpaId={defaultMpa?.mpaId || ""}
      deepDiveData={deepDiveData}
    />
  );
}
