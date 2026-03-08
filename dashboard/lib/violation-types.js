import { TOOLTIP_CONTENT } from "./tooltip-content";

export const VIOLATION_TYPE_DESCRIPTIONS = TOOLTIP_CONTENT.violationTypeDescriptions;

export function parseViolationTypes(value) {
  if (!value) {
    return [];
  }

  const seen = new Set();
  const types = [];

  for (const raw of String(value).split(",")) {
    const type = raw.trim();
    if (!type || seen.has(type)) {
      continue;
    }
    seen.add(type);
    types.push(type);
  }

  return types;
}

export function getViolationTypeDescription(type) {
  return (
    VIOLATION_TYPE_DESCRIPTIONS[type] ||
    "This violation type is flagged in the dataset, but a detailed description is not available yet."
  );
}
