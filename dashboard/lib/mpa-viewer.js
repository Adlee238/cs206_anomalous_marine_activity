export const MAX_ROWS = 200;
export const DISPLAY_COLUMNS = [
  "vessel_name",
  "flag",
  "gear_type",
  "composite_risk_score",
  "total_violations",
  "violation_types"
];

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

export function getRiskRowClass(riskCategory) {
  const risk = String(riskCategory || "").trim().toUpperCase();
  if (risk === "CRITICAL") {
    return "risk-critical";
  }
  if (risk === "HIGH") {
    return "risk-high";
  }
  if (risk === "MEDIUM") {
    return "risk-medium";
  }
  if (risk === "LOW") {
    return "risk-low";
  }
  return "";
}

export function getVisibleHeaders(records, columns = DISPLAY_COLUMNS) {
  return columns.filter((column) =>
    records.some((row) => Object.prototype.hasOwnProperty.call(row, column))
  );
}

export function getRiskSummary(records) {
  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const row of records) {
    const risk = String(row.risk_category || "").trim().toUpperCase();
    if (risk === "CRITICAL") {
      critical += 1;
    } else if (risk === "HIGH") {
      high += 1;
    } else if (risk === "MEDIUM") {
      medium += 1;
    } else if (risk === "LOW") {
      low += 1;
    }
  }

  const total = records.length;
  const concerning = critical + high + medium;
  const concerningPct = total ? Math.round((concerning / total) * 100) : 0;

  return { total, critical, high, medium, low, concerning, concerningPct };
}

export function getSortedRows(records, sortBy, order, limit = MAX_ROWS) {
  if (!sortBy) {
    return records.slice(0, limit);
  }

  const factor = order === "desc" ? -1 : 1;
  return [...records]
    .sort((rowA, rowB) => compareValues(rowA[sortBy], rowB[sortBy]) * factor)
    .slice(0, limit);
}

export function getNorthCenter(paths) {
  const points = paths.flatMap((path) =>
    path
      .trim()
      .split(/\s+/)
      .map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        return { x, y };
      })
  );

  if (!points.length) {
    return { x: 380, y: 210 };
  }

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2
  };
}
