import { getRiskRowClass } from "../../../lib/mpa-viewer";
import { VIOLATION_TYPE_DESCRIPTIONS, parseViolationTypes } from "../../../lib/violation-types";
import Tooltip from "../ui/tooltip";

const HEADER_LABELS = {
  vessel_name: "Vessel Name",
  flag: "Flag",
  total_violations: "Number of Violations",
  violation_types: "Violation Types"
};

function getHeaderLabel(header) {
  return HEADER_LABELS[header] || header;
}

function getHeaderTooltip(header) {
  if (header === "vessel_name") {
    return "Registered vessel name.";
  }
  if (header === "flag") {
    return "Country where the vessel is registered.";
  }
  if (header === "total_violations") {
    return "Number of detected violation events for the vessel.";
  }
  if (header === "violation_types") {
    return (
      <>
        Types of violations the vessel was detected with. Possible categories include:
        <br />
        {Object.entries(VIOLATION_TYPE_DESCRIPTIONS).map(([type, description], index) => (
          <span key={type}>
            {index > 0 ? <br /> : null}
            <strong>{type}</strong>: {description}
          </span>
        ))}
      </>
    );
  }
  return null;
}

function formatViolationTypes(value) {
  const types = parseViolationTypes(value);
  return types.length ? types.join(", ") : "None";
}

export default function VesselTableView({
  visibleHeaders,
  rowsToShow,
  sortBy,
  order,
  onSort,
  onSelectVessel
}) {
  return (
    <>
      <p className="activity-intro">
        For this region, the following vessels were detected in the provided time range. Each entry is colored based on its risk level. Click on a vessel to see more details.
      </p>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              {visibleHeaders.map((header) => {
                const arrow = sortBy === header ? (order === "asc" ? " ▲" : " ▼") : "";
                const headerLabel = getHeaderLabel(header);
                const headerTooltip = getHeaderTooltip(header);
                return (
                  <th key={header}>
                    <span className="table-header-cell">
                      <button type="button" className="table-sort-btn" onClick={() => onSort(header)}>
                        {headerLabel + arrow}
                      </button>
                      {headerTooltip ? (
                        <Tooltip
                          ariaLabel={`About ${headerLabel}`}
                          variant="superscript"
                          placement="bottom"
                          content={headerTooltip}
                        />
                      ) : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map((row, index) => (
              <tr
                key={`row-${index}`}
                className={`${getRiskRowClass(row.risk_category)} vessel-row`}
                onClick={() => onSelectVessel(row)}
              >
                {visibleHeaders.map((header) => (
                  <td key={`${index}-${header}`}>
                    {header === "violation_types" ? (
                      formatViolationTypes(row[header])
                    ) : (
                      row[header]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
