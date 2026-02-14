import { getRiskRowClass } from "../../../lib/mpa-viewer";

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
        For this region, the following vessels were detected in the provided time range. Click on a vessel to see more details.
      </p>

      <ul className="column-guide">
        <li>
          <strong>vessel_name</strong>: Registered vessel name.
        </li>
        <li>
          <strong>flag</strong>: Country where the vessel is registered.
        </li>
        <li>
          <strong>gear_type</strong>: Main fishing method used.
        </li>
        <li>
          <strong>composite_risk_score</strong>: Overall concern score where higher means more
          suspicious behavior.
        </li>
        <li>
          <strong>total_violations</strong>: Number of detected violation events for the vessel.
        </li>
        <li>
          <strong>violation_types</strong>: Categories of behavior detected (for example dark
          periods or zone violations).
        </li>
      </ul>

      <section className="table-wrap">
        <table>
          <thead>
            <tr>
              {visibleHeaders.map((header) => {
                const arrow = sortBy === header ? (order === "asc" ? " ▲" : " ▼") : "";
                return (
                  <th key={header}>
                    <button type="button" className="table-sort-btn" onClick={() => onSort(header)}>
                      {header + arrow}
                    </button>
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
                  <td key={`${index}-${header}`}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
