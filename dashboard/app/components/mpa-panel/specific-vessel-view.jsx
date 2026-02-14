function toDisplayValue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Not available";
  }
  if (value === "True") {
    return "Yes";
  }
  if (value === "False") {
    return "No";
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(value).trim() !== "") {
    return numeric.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }

  return String(value);
}

function field(label, value) {
  return { label, value: toDisplayValue(value) };
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function isMissing(value) {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function preferDeep(deepValue, fallbackValue) {
  return isMissing(deepValue) ? fallbackValue : deepValue;
}

function parseBoolean(value) {
  return String(value).trim().toLowerCase() === "true";
}

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export default function SpecificVesselView({ vessel, onBack, deepDiveData }) {
  const mmsiKey = vessel?.mmsi ? String(vessel.mmsi) : "";
  const nameKey = normalizeName(vessel?.vessel_name);
  const matchedDive =
    (mmsiKey && deepDiveData?.byMmsi?.[mmsiKey]) || deepDiveData?.byName?.[nameKey] || null;
  const identity = matchedDive?.identity || null;
  const hasDeepDive = Boolean(matchedDive);

  const deepDiveVisits = hasDeepDive ? matchedDive.visits || [] : [];
  const deepDiveViolations = hasDeepDive ? matchedDive.violations || [] : [];
  const deepDiveDarkEvents = hasDeepDive ? matchedDive.darkEvents || [] : [];

  const deepDiveVisitHours = deepDiveVisits.reduce(
    (sum, row) => sum + parseNumber(row.duration_hours),
    0
  );
  const deepDiveMeanSpeed =
    deepDiveVisits.length > 0
      ? deepDiveVisits.reduce((sum, row) => sum + parseNumber(row.avg_speed_knots), 0) /
        deepDiveVisits.length
      : null;
  const deepDiveMaxSpeed =
    deepDiveVisits.length > 0
      ? Math.max(...deepDiveVisits.map((row) => parseNumber(row.max_speed_knots)))
      : null;
  const deepDiveFishingVisits = deepDiveVisits.filter((row) => parseBoolean(row.fishing_detected)).length;
  const deepDiveVisitsWithDark = deepDiveVisits.filter((row) => parseBoolean(row.dark_periods_detected)).length;

  const deepDiveDarkHours = deepDiveDarkEvents.reduce(
    (sum, row) => sum + parseNumber(row.gap_duration_hours),
    0
  );
  const deepDiveAvgDarkHours =
    deepDiveDarkEvents.length > 0 ? deepDiveDarkHours / deepDiveDarkEvents.length : null;

  const deepDiveViolationTypes = Array.from(
    new Set(
      deepDiveViolations
        .map((row) => String(row.violation_type || "").trim())
        .filter((value) => value.length > 0)
    )
  ).join(", ");
  const deepDiveCritical = deepDiveViolations.filter(
    (row) => String(row.severity || "").toUpperCase() === "CRITICAL"
  ).length;
  const deepDiveHigh = deepDiveViolations.filter(
    (row) => String(row.severity || "").toUpperCase() === "HIGH"
  ).length;
  const deepDiveMedium = deepDiveViolations.filter(
    (row) => String(row.severity || "").toUpperCase() === "MEDIUM"
  ).length;
  const deepDiveLow = deepDiveViolations.filter(
    (row) => String(row.severity || "").toUpperCase() === "LOW"
  ).length;
  const deepDiveVerifiedViolations = deepDiveViolations.filter((row) => parseBoolean(row.verified)).length;

  const resolvedFlag = preferDeep(identity?.flag, vessel.flag);
  const resolvedType = preferDeep(identity?.vessel_type, vessel.vessel_type);
  const resolvedGear = preferDeep(identity?.gear_type, vessel.gear_type);
  const resolvedLength = preferDeep(identity?.length_m, vessel.length_m);

  const resolvedVisits = parseNumber(
    preferDeep(hasDeepDive ? deepDiveVisits.length : null, vessel.total_visits)
  );
  const resolvedHours = parseNumber(
    preferDeep(hasDeepDive ? deepDiveVisitHours : null, vessel.total_hours_in_mpa)
  );
  const resolvedMeanSpeed = preferDeep(
    hasDeepDive ? deepDiveMeanSpeed : null,
    vessel.mean_speed_knots
  );
  const resolvedMaxSpeed = preferDeep(
    hasDeepDive ? deepDiveMaxSpeed : null,
    vessel.max_speed_knots
  );
  const resolvedFishingVisits = preferDeep(
    hasDeepDive ? deepDiveFishingVisits : null,
    vessel.visits_with_fishing
  );
  const resolvedVisitsWithDark = preferDeep(
    hasDeepDive ? deepDiveVisitsWithDark : null,
    vessel.visits_with_dark_periods
  );

  const resolvedViolations = parseNumber(
    preferDeep(hasDeepDive ? deepDiveViolations.length : null, vessel.total_violations)
  );
  const resolvedViolationTypes = preferDeep(
    hasDeepDive ? deepDiveViolationTypes : null,
    vessel.violation_types
  );
  const resolvedCritical = preferDeep(hasDeepDive ? deepDiveCritical : null, vessel.critical_count);
  const resolvedHigh = preferDeep(hasDeepDive ? deepDiveHigh : null, vessel.high_count);
  const resolvedMedium = preferDeep(hasDeepDive ? deepDiveMedium : null, vessel.medium_count);
  const resolvedLow = preferDeep(hasDeepDive ? deepDiveLow : null, vessel.low_count);

  const resolvedDarkEvents = parseNumber(
    preferDeep(hasDeepDive ? deepDiveDarkEvents.length : null, vessel.dark_events)
  );
  const resolvedDarkHours = parseNumber(
    preferDeep(hasDeepDive ? deepDiveDarkHours : null, vessel.total_dark_hours)
  );
  const resolvedAvgDarkHours = preferDeep(
    hasDeepDive ? deepDiveAvgDarkHours : null,
    vessel.avg_dark_hours
  );

  const risk = String(vessel.risk_category || "").toUpperCase();

  const overallSentence =
    risk === "HIGH" || risk === "CRITICAL"
      ? `This vessel is in the high-concern tier (risk score of ${vessel.composite_risk_score}) and should be prioritized for review.`
      : risk === "MEDIUM"
        ? `This vessel is in the medium-concern tier (risk score of ${vessel.composite_risk_score}) and should remain on the watchlist.`
        : `This vessel is currently in the low-concern tier (risk score of ${vessel.composite_risk_score}) compared with others in this region.`;

  const visitsSentence =
    resolvedVisits >= 4
      ? `The vessel made repeated visits (${resolvedVisits}), which can increase monitoring priority.`
      : `The vessel made ${resolvedVisits} visit${resolvedVisits === 1 ? "" : "s"} during this period.`;
  const visitDurationSentence = `In total, it spent ${resolvedHours.toFixed(1)} hours in this region.`;
  const violationSentence =
    resolvedViolations >= 5
      ? `A relatively high number of violations (${resolvedViolations}) were recorded for this vessel, specifically in the categories of ${toDisplayValue(resolvedViolationTypes)}, which may warrant closer inspection.`
      : resolvedViolations >= 1
        ? `${resolvedViolations} violation events were recorded, indicating some compliance issues.`
        : "No violations were recorded for this vessel in the selected period.";
  const darkSentence =
    resolvedDarkEvents >= 1 || resolvedDarkHours > 0
      ? `Dark activity (periods when AIS tracking appears turned off) was observed (${resolvedDarkEvents} events, ${resolvedDarkHours.toFixed(
          1
        )} total hours), which may warrant closer inspection.`
      : "No dark-activity signal (AIS turned off) was detected for this vessel in the selected period.";

  const detailSections = [
    {
      title: "Vessel Profile",
      summary: "Core vessel identity and equipment details.",
      items: [
        field("Flag State", resolvedFlag),
        field("Vessel Type", resolvedType),
        field("Gear Type", resolvedGear),
        field("Length (m)", resolvedLength),
        ...(hasDeepDive
          ? [
              field("Owner", identity?.owner),
              field("Operator", identity?.operator),
              field("Tonnage", identity?.tonnage),
              field("Engine Power (kW)", identity?.engine_power_kw),
              field("First Seen", identity?.first_seen),
              field("Last Seen", identity?.last_seen)
            ]
          : [])
      ]
    },
    {
      title: "Visits in This Region",
      summary: `${visitsSentence} ${visitDurationSentence}`,
      items: [
        field("Total Visits", resolvedVisits),
        field("Total Hours in Region", resolvedHours),
        field("Average Speed (knots)", resolvedMeanSpeed),
        field("Max Speed (knots)", resolvedMaxSpeed),
        field("Visits With Fishing", resolvedFishingVisits),
        field("Visits With Dark Periods", resolvedVisitsWithDark),
        field("Repeat Visit Score", vessel.repeat_visit_score)
      ]
    },
    {
      title: "Violations",
      summary: violationSentence,
      items: [
        field("Total Violations", resolvedViolations),
        field("Violation Categories", resolvedViolationTypes),
        field("Critical Alerts", resolvedCritical),
        field("High Alerts", resolvedHigh),
        field("Medium Alerts", resolvedMedium),
        field("Low Alerts", resolvedLow),
        field("Violation Score", vessel.violation_score),
        ...(hasDeepDive ? [field("Verified Violations", deepDiveVerifiedViolations)] : [])
      ]
    },
    {
      title: "Dark Vessel Behavior",
      summary: darkSentence,
      items: [
        field("AIS-Off Events Detected", resolvedDarkEvents),
        field("Visits With AIS-Off Periods", resolvedVisitsWithDark),
        field("Total AIS-Off Hours", resolvedDarkHours),
        field("Average AIS-Off Hours", resolvedAvgDarkHours),
        field("Dark Vessel Score", vessel.dark_vessel_score_norm)
      ]
    }
  ];

  return (
    <section className="vessel-detail">
      <button type="button" className="back-button" onClick={onBack}>
        {"< Back"}
      </button>
      <h3 className="viewer-title">
        {vessel.vessel_name && vessel.vessel_name !== "Unknown" ? vessel.vessel_name : "Vessel Details"} (MMSI: {vessel.mmsi || "Unknown"})
      </h3>
      <p className="overall-summary">{overallSentence}</p>

      {detailSections.map((section) => (
        <section key={section.title} className="detail-section">
          <h4 className="detail-section-title">{section.title}</h4>
          <p className="detail-section-note">{section.summary}</p>
          <ul className="detail-bullets">
            {section.items.map((item) => (
              <li key={`${section.title}-${item.label}`} className="detail-bullet-item">
                <strong>{item.label}:</strong> {item.value}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
