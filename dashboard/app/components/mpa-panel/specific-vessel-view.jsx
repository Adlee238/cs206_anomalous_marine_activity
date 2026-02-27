import Tooltip from "../ui/tooltip";
import ViolationTypeTags from "./violation-type-tags";
import { getViolationTypeDescription } from "../../../lib/violation-types";

function formatTimestamp(value) {
  const text = String(value || "").trim();
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] || 0);
  const minute = Number(match[5] || 0);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  const paddedHour = String(hour).padStart(2, "0");
  const paddedMinute = String(minute).padStart(2, "0");
  return `${paddedMonth}/${paddedDay}/${year} ${paddedHour}:${paddedMinute}`;
}

function formatTimestampFromMs(ms) {
  if (!Number.isFinite(ms)) {
    return "Not available";
  }

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day}/${year} ${hour}:${minute}`;
}

function formatDateFromMs(ms) {
  if (!Number.isFinite(ms)) {
    return "Not available";
  }

  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${month}/${day}/${year}`;
}

function getDetectionTimestamp(startValue, endValue) {
  const start = Date.parse(String(startValue || ""));
  const end = Date.parse(String(endValue || ""));
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "Not available";
  }

  const midpoint = (start + end) / 2;
  return formatDateFromMs(midpoint);
}

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

  const formattedTimestamp = formatTimestamp(value);
  if (formattedTimestamp) {
    return formattedTimestamp;
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

function normalizeName(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toTimestamp(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

function sortByTimestamp(rows, field) {
  return [...rows].sort((a, b) => toTimestamp(a[field]) - toTimestamp(b[field]));
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
  const sortedDeepDiveVisits = sortByTimestamp(deepDiveVisits, "entry_time");
  const sortedDeepDiveViolations = sortByTimestamp(deepDiveViolations, "start_time");
  const sortedDeepDiveDarkEvents = sortByTimestamp(deepDiveDarkEvents, "gap_start_time");
  const deepDiveVisitHours = deepDiveVisits.reduce(
    (sum, row) => sum + parseNumber(row.duration_hours),
    0
  );

  const deepDiveViolationTypes = Array.from(
    new Set(
      deepDiveViolations
        .map((row) => String(row.violation_type || "").trim())
        .filter((value) => value.length > 0)
    )
  ).join(", ");
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
  const resolvedViolations = parseNumber(
    preferDeep(hasDeepDive ? deepDiveViolations.length : null, vessel.total_violations)
  );
  const resolvedViolationTypes = preferDeep(
    hasDeepDive ? deepDiveViolationTypes : null,
    vessel.violation_types
  );

  const resolvedDarkEvents = parseNumber(
    preferDeep(hasDeepDive ? deepDiveDarkEvents.length : null, vessel.dark_events)
  );

  const risk = String(vessel.risk_category || "").toUpperCase();

  const overallSentence =
    risk === "HIGH" || risk === "CRITICAL"
      ? `This vessel is in the high-concern tier.`
      : risk === "MEDIUM"
        ? `This vessel is in the medium-concern tier.`
        : `This vessel is currently in the low-concern tier.`;

  const visitsSentence = `This vessel made ${resolvedVisits} visit${resolvedVisits === 1 ? "" : "s"} to this region in the selected time period. In total, it spent ${resolvedHours.toFixed(1)} hours in this region.`;
  const visitsTableNode =
    hasDeepDive && sortedDeepDiveVisits.length > 0 ? (
      <section className="violation-detail-table-wrap">
        <table className="violation-detail-table">
          <thead>
            <tr>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Duration (Hours)</th>
              <th>Average Speed (knots)</th>
              <th>Fishing Detected</th>
            </tr>
          </thead>
          <tbody>
            {sortedDeepDiveVisits.map((row, index) => (
              <tr key={`visit-${index}`}>
                <td>{toDisplayValue(row.entry_time)}</td>
                <td>{toDisplayValue(row.exit_time)}</td>
                <td>{toDisplayValue(row.duration_hours)}</td>
                <td>{toDisplayValue(row.avg_speed_knots)}</td>
                <td>{toDisplayValue(row.fishing_detected)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    ) : (
      <p className="detail-section-note">
        Detailed per-visit records are not available for this vessel.
      </p>
    );
  const violationSentence = `This vessel was detected with ${resolvedViolations} violations.`;
  const violationSummaryNode = (
    <>
      {violationSentence}
      {resolvedViolations > 0 ? (
        <>
          {" "}
          The violations detected include:{" "}
          <ViolationTypeTags value={resolvedViolationTypes} emptyLabel="None" />.
        </>
      ) : null}
    </>
  );
  const violationTableNode =
    hasDeepDive && sortedDeepDiveViolations.length > 0 ? (
      <section className="violation-detail-table-wrap">
        <table className="violation-detail-table">
          <thead>
            <tr>
              <th>Detection Date</th>
              <th>Violation Type</th>
              <th>Verified</th>
            </tr>
          </thead>
          <tbody>
            {sortedDeepDiveViolations.map((row, index) => (
              <tr key={`violation-${index}`}>
                <td>{getDetectionTimestamp(row.start_time, row.end_time)}</td>
                <td>
                  <span className="violation-type-inline">
                    <span>{toDisplayValue(row.violation_type)}</span>
                    <Tooltip
                      ariaLabel={`What does ${row.violation_type} mean?`}
                      variant="superscript"
                      placement="top"
                      content={getViolationTypeDescription(String(row.violation_type || "").trim())}
                    />
                  </span>
                </td>
                <td>{toDisplayValue(row.verified)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    ) : (
      <p className="detail-section-note">
        Detailed per-violation records are not available for this vessel.
      </p>
    );
  const darkActivityTermNode = (
    <>
      dark activity
      <Tooltip
        ariaLabel="What is dark activity?"
        variant="superscript"
        content="Dark activity refers to periods in which a vessel turns off its Automatic Identification System (AIS) transponders. This allows it to hide its location and activities from public surveillance."
      />
    </>
  );
  const darkSentence = (
    <>
      There {resolvedDarkEvents === 1 ? "was 1 gap" : `were ${resolvedDarkEvents} gaps`}{" "}
      in which the vessel exhibited {darkActivityTermNode}.
    </>
  );
  const darkTableNode =
    hasDeepDive && sortedDeepDiveDarkEvents.length > 0 ? (
      <section className="violation-detail-table-wrap">
        <table className="violation-detail-table">
          <thead>
            <tr>
              <th>Gap Start Time</th>
              <th>Gap End Time</th>
              <th>Gap Duration (Hours)</th>
              <th>Gap Happened in Region</th>
            </tr>
          </thead>
          <tbody>
            {sortedDeepDiveDarkEvents.map((row, index) => (
              <tr key={`dark-event-${index}`}>
                <td>{toDisplayValue(row.gap_start_time)}</td>
                <td>{toDisplayValue(row.gap_end_time)}</td>
                <td>{toDisplayValue(row.gap_duration_hours)}</td>
                <td>{toDisplayValue(row.in_mpa)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    ) : (
      <p className="detail-section-note">
        Detailed per-event dark activity records are not available for this vessel.
      </p>
    );

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
              field("Engine Power (kW)", identity?.engine_power_kw)
            ]
          : [])
      ]
    },
    {
      title: "Visits in This Region",
      summary: visitsSentence,
      node: visitsTableNode,
      items: []
    },
    {
      title: "Violations",
      summary: violationSummaryNode,
      node: violationTableNode,
      items: []
    },
    {
      title: "Dark Activity Behavior",
      summary: darkSentence,
      node: darkTableNode,
      items: []
    }
  ];

  return (
    <section className="vessel-detail">
      <button type="button" className="back-button" onClick={onBack}>
        {"< Back"}
      </button>
      <h3 className="viewer-title">
        {vessel.vessel_name && vessel.vessel_name !== "Unknown" ? vessel.vessel_name : "Vessel Details"} (
        <span className="mmsi-inline">
          <span className="mmsi-label">MMSI</span>
          <Tooltip
            ariaLabel="What is MMSI?"
            variant="superscript"
            content="A Maritime Mobile Service Identity (MMSI) is a unique 9-digit number assigned to each vessel for identifying it in digital, radio, and AIS communications."
          />
          : <span className="mmsi-value">{vessel.mmsi || "Unknown"}</span>
        </span>
        )
      </h3>
      <p className="overall-summary">{overallSentence}</p>

      {detailSections.map((section) => (
        <section key={section.title} className="detail-section">
          <h4 className="detail-section-title">{section.title}</h4>
          <p className="detail-section-note">{section.summary}</p>
          {section.node ? (
            section.node
          ) : (
            <ul className="detail-bullets">
              {section.items.map((item) => (
                <li key={`${section.title}-${item.label}`} className="detail-bullet-item">
                  <strong>{item.label}:</strong> {item.node || item.value}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </section>
  );
}
