import { useEffect, useMemo, useState } from "react";
import { getRiskRowClass } from "../../../lib/mpa-viewer";
import { VIOLATION_TYPE_DESCRIPTIONS, parseViolationTypes } from "../../../lib/violation-types";
import { TOOLTIP_CONTENT } from "../../../lib/tooltip-content";
import Tooltip from "../ui/tooltip";

const ROWS_PER_PAGE = 15;

const HEADER_LABELS = {
  vessel_name: "Vessel Name",
  flag: "Flag",
  total_violations: "Activity Count",
  violation_types: "Suspicious Activities"
};

function getHeaderLabel(header) {
  return HEADER_LABELS[header] || header;
}

function getHeaderTooltip(header) {
  if (header === "vessel_name") {
    return TOOLTIP_CONTENT.vesselTableHeaders.vessel_name;
  }
  if (header === "flag") {
    return TOOLTIP_CONTENT.vesselTableHeaders.flag;
  }
  if (header === "total_violations") {
    return TOOLTIP_CONTENT.vesselTableHeaders.total_violations;
  }
  if (header === "violation_types") {
    return (
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
  onSelectVessel
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rowsToShow.length / ROWS_PER_PAGE));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return rowsToShow.slice(start, start + ROWS_PER_PAGE);
  }, [page, rowsToShow]);

  useEffect(() => {
    setPage(1);
  }, [rowsToShow.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <>
      <p className="activity-intro">
        For this region, the following vessels were detected in the specified time range. Each entry is colored based on its risk score. Click on a vessel to see more details.
      </p>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              {visibleHeaders.map((header) => {
                const headerLabel = getHeaderLabel(header);
                const headerTooltip = getHeaderTooltip(header);
                return (
                  <th key={header}>
                    <span className="table-header-cell">
                      <span className="table-header-label">{headerLabel}</span>
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
            {pagedRows.map((row, index) => (
              <tr
                key={`row-${(page - 1) * ROWS_PER_PAGE + index}`}
                className={`${getRiskRowClass(row.risk_category)} vessel-row`}
                onClick={() => onSelectVessel(row)}
              >
                {visibleHeaders.map((header) => (
                  <td key={`${(page - 1) * ROWS_PER_PAGE + index}-${header}`}>
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
