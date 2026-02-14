import { readFile } from "node:fs/promises";
import path from "node:path";
import MainMapExperience from "./components/mpa-panel/main-map-experience";
import { listCsvFiles, loadCsvData } from "../lib/data";
import { buildProjectedPaths, extractRings } from "../lib/geojson-map";

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function loadDeepDiveIndex() {
  const files = await listCsvFiles("vessel_details");
  const grouped = new Map();

  for (const file of files) {
    const match = file.match(/^(.+)_deep_dive_(identity|visits|violations|dark_events)\.csv$/i);
    if (!match) {
      continue;
    }

    const base = match[1];
    const part = match[2].toLowerCase();
    if (!grouped.has(base)) {
      grouped.set(base, {});
    }
    grouped.get(base)[part] = file;
  }

  const byName = {};
  const byMmsi = {};

  for (const [base, parts] of grouped.entries()) {
    const [identityData, visitsData, violationsData, darkEventsData] = await Promise.all([
      parts.identity ? loadCsvData("vessel_details", parts.identity, "", "asc") : Promise.resolve({ records: [] }),
      parts.visits ? loadCsvData("vessel_details", parts.visits, "", "asc") : Promise.resolve({ records: [] }),
      parts.violations ? loadCsvData("vessel_details", parts.violations, "", "asc") : Promise.resolve({ records: [] }),
      parts.dark_events ? loadCsvData("vessel_details", parts.dark_events, "", "asc") : Promise.resolve({ records: [] })
    ]);

    const identity = identityData.records[0] || null;
    const record = {
      identity,
      visits: visitsData.records,
      violations: violationsData.records,
      darkEvents: darkEventsData.records
    };

    const nameKey = normalizeName(identity?.vessel_name || base);
    if (nameKey) {
      byName[nameKey] = record;
    }

    const mmsiKey = identity?.mmsi ? String(identity.mmsi) : "";
    if (mmsiKey) {
      byMmsi[mmsiKey] = record;
    }
  }

  return { byName, byMmsi };
}

export default async function MainPage() {
  const northPath = path.join(
    process.cwd(),
    "data/region_geojsons/Charlie-Gibbs_North_High_Seas_Marine_Protected_Area.geojson"
  );
  const northRaw = await readFile(northPath, "utf8");
  const northJson = JSON.parse(northRaw);
  const northRings = extractRings(northJson);
  const northPaths = buildProjectedPaths(northRings);

  const { records } = await loadCsvData("mpa_report", "charlie_gibbs_report.csv", "", "asc");
  const deepDiveData = await loadDeepDiveIndex();

  return (
    <MainMapExperience
      northPaths={northPaths}
      records={records}
      deepDiveData={deepDiveData}
    />
  );
}
