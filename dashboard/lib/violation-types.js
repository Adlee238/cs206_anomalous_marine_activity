export const VIOLATION_TYPE_DESCRIPTIONS = {
  "Dark Period":
    "The vessel turned off its AIS transponder, indicating potential concealment of activity.",
  "Zone Violation": "The vessel entered or operated in a restricted area.",
  "Speed Violation":
    "The vessel showed speed patterns that deviated from expected behaviors for normal transit.",
  "Unauthorized Entry": "The vessel was detected in the region without the authority to do so.",
  "Fishing Activity": "The vessel showed signs of conducting fishing."
};

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
