import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseCsv } from "./csv";

const DATA_DIRS = {
  reports: "data/reports",
  mpa_reports: "data/reports/mpa",
  vessel_reports: "data/reports/vessels"
};

function normalizeDirKey(dirKey) {
  if (Object.prototype.hasOwnProperty.call(DATA_DIRS, dirKey)) {
    return dirKey;
  }
  throw new Error(`Unknown data directory key: ${dirKey}`);
}

export function getDirOptions() {
  return Object.keys(DATA_DIRS);
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function walkCsvFiles(folderPath, recursive, relativePrefix = "") {
  const entries = await readdir(folderPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    const relativePath = relativePrefix ? path.join(relativePrefix, entry.name) : entry.name;

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
      files.push(toPosixPath(relativePath));
      continue;
    }

    if (recursive && entry.isDirectory()) {
      const nested = await walkCsvFiles(fullPath, true, relativePath);
      files.push(...nested);
    }
  }

  return files;
}

export async function listCsvFiles(dirKey, options = {}) {
  const safeDirKey = normalizeDirKey(dirKey);
  const recursive = Boolean(options.recursive);
  const folderPath = path.join(process.cwd(), DATA_DIRS[safeDirKey]);
  const csvFiles = await walkCsvFiles(folderPath, recursive);

  return csvFiles.sort((a, b) => a.localeCompare(b));
}

function getSafeCsvPath(dirKey, fileName) {
  const safeDirKey = normalizeDirKey(dirKey);
  const basePath = path.join(process.cwd(), DATA_DIRS[safeDirKey]);
  const normalizedRelative = path.normalize(String(fileName || "")).replace(/^[/\\]+/, "");

  if (!normalizedRelative.toLowerCase().endsWith(".csv")) {
    return null;
  }

  const resolvedPath = path.resolve(basePath, normalizedRelative);
  const inBasePath = resolvedPath === basePath || resolvedPath.startsWith(`${basePath}${path.sep}`);
  if (!inBasePath) {
    return null;
  }

  return resolvedPath;
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
