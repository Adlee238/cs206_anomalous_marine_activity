import { useEffect, useMemo, useState } from "react";
import Tooltip from "../ui/tooltip";
import ViolationTypeTags from "./violation-type-tags";
import { VIOLATION_TYPE_DESCRIPTIONS } from "../../../lib/violation-types";
import { TOOLTIP_CONTENT } from "../../../lib/tooltip-content";

const DETAIL_ROWS_PER_PAGE = 10;

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

function normalizeMmsi(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const numeric = Number(raw);
  if (!Number.isNaN(numeric)) {
    return String(Math.trunc(numeric));
  }

  return raw.replace(/[^0-9]/g, "");
}

function toTimestamp(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

function sortByTimestamp(rows, field) {
  return [...rows].sort((a, b) => toTimestamp(a[field]) - toTimestamp(b[field]));
}

function PaginatedDetailTable({ rows, columns, rowKeyPrefix, scrollable = true }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / DETAIL_ROWS_PER_PAGE));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * DETAIL_ROWS_PER_PAGE;
    return rows.slice(start, start + DETAIL_ROWS_PER_PAGE);
  }, [page, rows]);

  useEffect(() => {
    setPage(1);
  }, [rows.length, rowKeyPrefix]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <>
      <section className={`violation-detail-table-wrap${scrollable ? "" : " no-scroll"}`}>
        <table className="violation-detail-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedRows.map((row, index) => (
              <tr key={`${rowKeyPrefix}-${(page - 1) * DETAIL_ROWS_PER_PAGE + index}`}>
                {columns.map((column) => (
                  <td key={`${rowKeyPrefix}-${column.key}-${(page - 1) * DETAIL_ROWS_PER_PAGE + index}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div className="table-pagination">
        <button
          type="button"
          className="table-page-btn"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <span className="table-page-status">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="table-page-btn"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </>
  );
}

export default function SpecificVesselView({ vessel, onBack, deepDiveData }) {
  const mmsiKey = normalizeMmsi(vessel?.mmsi);
  const matchedDive = (mmsiKey && deepDiveData?.byMmsi?.[mmsiKey]) || null;
  const identity = matchedDive?.identity || null;
  const hasDeepDive = Boolean(matchedDive);

  const deepDiveVisits = hasDeepDive ? matchedDive.visits || [] : [];
  const deepDiveSuspiciousActivities = hasDeepDive ? matchedDive.violations || [] : [];
  const deepDiveDarkEvents = hasDeepDive ? matchedDive.darkEvents || [] : [];
  const sortedDeepDiveVisits = sortByTimestamp(deepDiveVisits, "entry_time");
  const sortedDeepDiveSuspiciousActivities = sortByTimestamp(deepDiveSuspiciousActivities, "start_time");
  const sortedDeepDiveDarkEvents = sortByTimestamp(deepDiveDarkEvents, "gap_start_time");
  const deepDiveVisitHours = deepDiveVisits.reduce(
    (sum, row) => sum + parseNumber(row.duration_hours),
    0
  );
  const deepDiveDarkHours = deepDiveDarkEvents.reduce(
    (sum, row) => sum + parseNumber(row.gap_duration_hours),
    0
  );

  const deepDiveSuspiciousActivityTypes = Array.from(
    new Set(
      deepDiveSuspiciousActivities
        .map((row) => String(row.violation_type || "").trim())
        .filter((value) => value.length > 0)
    )
  ).join(", ");
  const resolvedFlag = preferDeep(identity?.flag, vessel.flag);
  const resolvedType = preferDeep(identity?.vessel_type, vessel.vessel_type);
  const resolvedGear = preferDeep(identity?.gear_type, vessel.gear_type);
  const resolvedLength = preferDeep(identity?.length_m, vessel.length_m);
  const resolvedAgeYears = preferDeep(identity?.vessel_age_years, vessel.vessel_age_years);

  const resolvedVisits = parseNumber(
    preferDeep(hasDeepDive ? deepDiveVisits.length : null, vessel.total_visits)
  );
  const resolvedHours = parseNumber(
    preferDeep(hasDeepDive ? deepDiveVisitHours : null, vessel.total_hours_in_mpa)
  );
  const deepDiveMeanVisitSpeedKnots =
    sortedDeepDiveVisits.length > 0
      ? sortedDeepDiveVisits.reduce((sum, row) => sum + parseNumber(row.avg_speed_knots), 0) /
        sortedDeepDiveVisits.length
      : null;
  const deepDiveMaxVisitSpeedKnots =
    sortedDeepDiveVisits.length > 0
      ? Math.max(...sortedDeepDiveVisits.map((row) => parseNumber(row.max_speed_knots)))
      : null;
  const fallbackMeanVisitSpeedKnots = isMissing(vessel.mean_speed_knots)
    ? null
    : Number(vessel.mean_speed_knots);
  const fallbackMaxVisitSpeedKnots = isMissing(vessel.max_speed_knots)
    ? null
    : Number(vessel.max_speed_knots);
  const resolvedMeanVisitSpeedKnots =
    hasDeepDive && deepDiveMeanVisitSpeedKnots !== null ? deepDiveMeanVisitSpeedKnots : fallbackMeanVisitSpeedKnots;
  const resolvedMaxVisitSpeedKnots =
    hasDeepDive && deepDiveMaxVisitSpeedKnots !== null ? deepDiveMaxVisitSpeedKnots : fallbackMaxVisitSpeedKnots;
  const meanVisitSpeedText =
    Number.isFinite(resolvedMeanVisitSpeedKnots)
      ? `${resolvedMeanVisitSpeedKnots.toFixed(1)} knots`
      : "Unavailable";
  const maxVisitSpeedText =
    Number.isFinite(resolvedMaxVisitSpeedKnots)
      ? `${resolvedMaxVisitSpeedKnots.toFixed(1)} knots`
      : "Unavailable";
  const resolvedSuspiciousActivityCount = parseNumber(
    preferDeep(hasDeepDive ? deepDiveSuspiciousActivities.length : null, vessel.total_violations)
  );
  const resolvedSuspiciousActivityTypes = preferDeep(
    hasDeepDive ? deepDiveSuspiciousActivityTypes : null,
    vessel.violation_types
  );

  const resolvedDarkEvents = parseNumber(
    preferDeep(hasDeepDive ? deepDiveDarkEvents.length : null, vessel.gap_events)
  );
  const resolvedDarkHours = parseNumber(
    preferDeep(hasDeepDive ? deepDiveDarkHours : null, vessel.total_gap_hours)
  );
  const deepDiveDarkDurations = deepDiveDarkEvents.map((row) => parseNumber(row.gap_duration_hours));
  const deepDiveAvgDarkGapHours =
    deepDiveDarkDurations.length > 0
      ? deepDiveDarkDurations.reduce((sum, value) => sum + value, 0) / deepDiveDarkDurations.length
      : null;
  const deepDiveMaxDarkGapHours =
    deepDiveDarkDurations.length > 0 ? Math.max(...deepDiveDarkDurations) : null;
  const hasDarkMetrics = hasDeepDive && deepDiveDarkDurations.length > 0;
  const darkTotalHoursText = hasDarkMetrics ? `${resolvedDarkHours.toFixed(1)} hours` : "Unavailable";
  const darkAvgGapText =
    hasDarkMetrics && deepDiveAvgDarkGapHours !== null
      ? `${deepDiveAvgDarkGapHours.toFixed(1)} hours`
      : "Unavailable";
  const darkMaxGapText =
    hasDarkMetrics && deepDiveMaxDarkGapHours !== null
      ? `${deepDiveMaxDarkGapHours.toFixed(1)} hours`
      : "Unavailable";

  const risk = String(vessel.risk_category || "").toUpperCase();

  const overallSentence =
    risk === "CRITICAL"
      ? `This vessel is in the critical-risk tier.`
      : risk === "HIGH"
        ? `This vessel is in the high-risk tier.`
        : risk === "MEDIUM"
          ? `This vessel is in the medium-risk tier.`
          : `This vessel is currently in the low-risk tier.`;

  const visitsSummaryNode = (
    <ul className="detail-bullets">
      <li className="detail-bullet-item">
        This vessel made {resolvedVisits} visit{resolvedVisits === 1 ? "" : "s"} to this region in the
        selected time period.
      </li>
      <li className="detail-bullet-item">
        In total, it spent {resolvedHours.toFixed(1)} hours
        <Tooltip
          ariaLabel="What tracked hours include"
          variant="superscript"
          content={TOOLTIP_CONTENT.specificVessel.visitDurationHours}
        />{" "}
        in this region.
      </li>
      <li className="detail-bullet-item">Overall, its average speed
        <Tooltip
          ariaLabel="What tracked hours include"
          variant="superscript"
          content={TOOLTIP_CONTENT.specificVessel.averageSpeedKnots}
        />{" "}
         was {meanVisitSpeedText}.</li>
      <li className="detail-bullet-item">Overall, its maximum detected speed was {maxVisitSpeedText}.</li>
    </ul>
  );
  const visitColumns = [
    {
      key: "entry_time",
      header: "Entry Time",
      render: (row) => toDisplayValue(row.entry_time)
    },
    {
      key: "exit_time",
      header: "Exit Time",
      render: (row) => toDisplayValue(row.exit_time)
    },
    {
      key: "duration_hours",
      header: (
        <span className="table-header-cell">
          Duration (Hours)
          <Tooltip
            ariaLabel="Why visit duration matters"
            variant="superscript"
            placement="bottom"
            content={TOOLTIP_CONTENT.specificVessel.visitDurationHours}
          />
        </span>
      ),
      render: (row) => toDisplayValue(row.duration_hours)
    },
    {
      key: "avg_speed_knots",
      header: (
        <span className="table-header-cell">
          Average Speed (knots)
          <Tooltip
            ariaLabel="Why average speed matters"
            variant="superscript"
            placement="bottom"
            content={TOOLTIP_CONTENT.specificVessel.averageSpeedKnots}
          />
        </span>
      ),
      render: (row) => toDisplayValue(row.avg_speed_knots)
    },
    {
      key: "fishing_detected",
      header: "Fishing Detected",
      render: (row) => toDisplayValue(row.fishing_detected)
    },
    {
      key: "dark_periods_detected",
      header: "Dark Activity Detected",
      render: (row) => toDisplayValue(row.dark_periods_detected)
    }
  ];
  const visitsTableNode =
    hasDeepDive && sortedDeepDiveVisits.length > 0 ? (
      <PaginatedDetailTable
        rows={sortedDeepDiveVisits}
        columns={visitColumns}
        rowKeyPrefix="visit"
        scrollable={false}
      />
    ) : (
      <p className="detail-section-note">
        Detailed per-visit records are not available for this vessel.
      </p>
    );
  const suspiciousActivitySentence = `There were ${resolvedSuspiciousActivityCount} detected instances where this vessel exhibited suspicious behavior.`;
  const suspiciousActivitySummaryNode = (
    <>
      {suspiciousActivitySentence}
      {resolvedSuspiciousActivityCount > 0 ? (
        <>
          {" "}
          These activities include:{" "}
          <ViolationTypeTags value={resolvedSuspiciousActivityTypes} emptyLabel="None" />.
        </>
      ) : null}
    </>
  );
  const suspiciousColumns = [
    {
      key: "detection_date",
      header: "Detection Date",
      render: (row) => getDetectionTimestamp(row.start_time, row.end_time)
    },
    {
      key: "violation_type",
      header: "Suspicious Activity",
      render: (row) => toDisplayValue(row.violation_type)
    }
  ];
  const suspiciousActivityTableNode =
    hasDeepDive && sortedDeepDiveSuspiciousActivities.length > 0 ? (
      <PaginatedDetailTable
        rows={sortedDeepDiveSuspiciousActivities}
        columns={suspiciousColumns}
        rowKeyPrefix="violation"
      />
    ) : (
      <p className="detail-section-note">
        Detailed per-suspicious-activity records are not available for this vessel.
      </p>
    );
  const darkActivityTermNode = (
    <>
      dark activity
      <Tooltip
        ariaLabel="What is dark activity?"
        variant="superscript"
        content={TOOLTIP_CONTENT.darkActivity}
      />
    </>
  );
  const darkSentence = (
    <>
      There {resolvedDarkEvents === 1 ? "was 1 gap" : `were ${resolvedDarkEvents} gaps`} in
      which the vessel exhibited {darkActivityTermNode}.
    </>
  );
  const darkSummaryNode = (
    <ul className="detail-bullets">
      <li className="detail-bullet-item">{darkSentence}</li>
      <li className="detail-bullet-item">
        The vessel was off-the-grid for a total of {darkTotalHoursText}.
      </li>
      <li className="detail-bullet-item">
        The average gap duration was {darkAvgGapText}.
      </li>
      <li className="detail-bullet-item">
        The longest gap duration was {darkMaxGapText}.
      </li>
    </ul>
  );
  const darkColumns = [
    {
      key: "gap_start_time",
      header: "Gap Start Time",
      render: (row) => toDisplayValue(row.gap_start_time)
    },
    {
      key: "gap_end_time",
      header: "Gap End Time",
      render: (row) => toDisplayValue(row.gap_end_time)
    },
    {
      key: "gap_duration_hours",
      header: "Gap Duration (Hours)",
      render: (row) => toDisplayValue(row.gap_duration_hours)
    }
  ];
  const darkTableNode =
    hasDeepDive && sortedDeepDiveDarkEvents.length > 0 ? (
      <PaginatedDetailTable
        rows={sortedDeepDiveDarkEvents}
        columns={darkColumns}
        rowKeyPrefix="dark-event"
      />
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
        field("Flag", resolvedFlag),
        field("Vessel Type", resolvedType),
        field("Gear Type", resolvedGear),
        field("Length (m)", resolvedLength),
        ...(hasDeepDive
          ? [
              field("Owner", identity?.owner),
              field("Operator", identity?.operator),
              field("Age (Years)", resolvedAgeYears)
            ]
          : [])
      ]
    },
    {
      title: "Visits in This Region",
      summaryNode: visitsSummaryNode,
      node: visitsTableNode,
      items: []
    },
    {
      title: "Suspicious Activities",
      summary: suspiciousActivitySummaryNode,
      node: suspiciousActivityTableNode,
      items: []
    },
    {
      title: "Dark Activity",
      summaryNode: darkSummaryNode,
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
            content={TOOLTIP_CONTENT.mmsi}
          />
          : <span className="mmsi-value">{vessel.mmsi || "Unknown"}</span>
        </span>
        )
      </h3>
      <p className="overall-summary">{overallSentence}</p>

      {detailSections.map((section) => (
        <section key={section.title} className="detail-section">
          <h4 className="detail-section-title">
            {section.title}
            {section.title === "Visits in This Region" ? (
              <Tooltip
                ariaLabel="Why repeated visits matter"
                variant="superscript"
                content={TOOLTIP_CONTENT.specificVessel.visitsInRegion}
              />
            ) : null}
            {section.title === "Suspicious Activities" ? (
              <Tooltip
                ariaLabel="About Suspicious Activities"
                variant="superscript"
                content={
                  <>
                    {TOOLTIP_CONTENT.vesselTableHeaders.violation_types}
                    <br />
                    {Object.entries(VIOLATION_TYPE_DESCRIPTIONS).map(([type, description], index) => (
                      <span key={type}>
                        {index > 0 ? <br /> : null}
                        <strong>{type}</strong>: {description}
                      </span>
                    ))}
                  </>
                }
              />
            ) : null}
          </h4>
          {section.summaryNode ? (
            section.summaryNode
          ) : (
            <p className="detail-section-note">{section.summary}</p>
          )}
          {section.node ? (
            section.node
          ) : (
            <ul className="detail-bullets">
              {section.items.map((item) => (
                <li key={`${section.title}-${item.label}`} className="detail-bullet-item">
	                  <strong>
	                    {item.label}
	                    {item.label === "Gear Type" ? (
	                      <Tooltip
	                        ariaLabel={`What is ${item.label}?`}
	                        variant="superscript"
	                        content={TOOLTIP_CONTENT.specificVessel.gearType}
	                      />
	                    ) : null}
	                    {item.label === "Vessel Type" ? (
	                      <Tooltip
	                        ariaLabel="What is Vessel Type?"
	                        variant="superscript"
	                        content={
	                          <>
	                            {TOOLTIP_CONTENT.specificVessel.vesselType}
	                            <br />
	                            {Object.entries(TOOLTIP_CONTENT.specificVessel.vesselTypeCategories).map(
	                              ([type, description], index) => (
	                                <span key={type}>
	                                  {index > 0 ? <br /> : null}
	                                  <strong>{type}</strong>: {description}
	                                </span>
	                              )
	                            )}
	                          </>
	                        }
	                      />
	                    ) : null}
	                    :
	                  </strong>{" "}
                  {item.node || item.value}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </section>
  );
}
