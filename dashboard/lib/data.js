import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./csv";

const DATA_DIRS = {
  mpa_report: "data/mpa_report",
  vessel_details: "data/vessel_details"
};

function normalizeDirKey(dirKey) {
  if (Object.prototype.hasOwnProperty.call(DATA_DIRS, dirKey)) {
    return dirKey;
  }
  return "mpa_report";
}

export function getDirOptions() {
  return Object.keys(DATA_DIRS);
}

export async function listCsvFiles(dirKey) {
  const safeDirKey = normalizeDirKey(dirKey);
  const folderPath = path.join(process.cwd(), DATA_DIRS[safeDirKey]);
  const entries = await readdir(folderPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function getSafeCsvPath(dirKey, fileName) {
  const safeDirKey = normalizeDirKey(dirKey);
  const safeName = path.basename(fileName || "");
  if (!safeName.toLowerCase().endsWith(".csv")) {
    return null;
  }
  return path.join(process.cwd(), DATA_DIRS[safeDirKey], safeName);
}

function compareValues(a, b) {
  const aNum = Number(a);
  const bNum = Number(b);
  const aIsNum = !Number.isNaN(aNum) && String(a).trim() !== "";
  const bIsNum = !Number.isNaN(bNum) && String(b).trim() !== "";

  if (aIsNum && bIsNum) {
    return aNum - bNum;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

function sortRecords(records, sortBy, order) {
  if (!sortBy) {
    return records;
  }

  const safeOrder = order === "desc" ? "desc" : "asc";
  const factor = safeOrder === "desc" ? -1 : 1;

  return [...records].sort((rowA, rowB) => {
    return compareValues(rowA[sortBy], rowB[sortBy]) * factor;
  });
}

export function summarizeNumericColumns(records, headers, maxColumns = 4) {
  const numericHeaders = headers.filter((header) => {
    return records.some((row) => {
      const value = row[header];
      return String(value).trim() !== "" && !Number.isNaN(Number(value));
    });
  });

  return numericHeaders.slice(0, maxColumns).map((header) => {
    const numbers = records
      .map((row) => Number(row[header]))
      .filter((value) => !Number.isNaN(value));

    const total = numbers.reduce((sum, value) => sum + value, 0);
    const avg = numbers.length ? total / numbers.length : 0;

    return {
      column: header,
      min: numbers.length ? Math.min(...numbers) : null,
      max: numbers.length ? Math.max(...numbers) : null,
      avg
    };
  });
}

export async function loadCsvData(dirKey, fileName, sortBy, order) {
  const filePath = getSafeCsvPath(dirKey, fileName);
  if (!filePath) {
    return { headers: [], records: [] };
  }

  const csvText = await readFile(filePath, "utf8");
  const parsed = parseCsv(csvText);
  const sorted = sortRecords(parsed.records, sortBy, order);

  return { headers: parsed.headers, records: sorted };
}
