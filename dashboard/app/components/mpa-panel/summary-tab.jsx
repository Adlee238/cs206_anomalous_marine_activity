import Tooltip from "../ui/tooltip";

function getDarkActivityVessels(records) {
  const seen = new Set();
  const names = [];

  for (const row of records || []) {
    const types = String(row.violation_types || "").toLowerCase();
    const vesselName = String(row.vessel_name || "").trim();
    if (!types.includes("dark period") || !vesselName || seen.has(vesselName)) {
      continue;
    }
    seen.add(vesselName);
    names.push(vesselName);
  }

  return names.sort((a, b) => a.localeCompare(b));
}

function getFishingActivityVessels(records) {
  const seen = new Set();
  const names = [];

  for (const row of records || []) {
    const types = String(row.violation_types || "").toLowerCase();
    const vesselName = String(row.vessel_name || "").trim();
    if (!types.includes("fishing activity") || !vesselName || seen.has(vesselName)) {
      continue;
    }
    seen.add(vesselName);
    names.push(vesselName);
  }

  return names.sort((a, b) => a.localeCompare(b));
}

export default function SummaryTab({ riskSummary, records }) {
  const fishingActivityVessels = getFishingActivityVessels(records);
  const highlightedVessels = getDarkActivityVessels(records);

  return (
    <>
      <h3 className="viewer-title">For this region, during the provided time range...</h3>
      <p className="summary-note">
        {riskSummary.total} vessels were detected. {riskSummary.concerning} vessels (
        {riskSummary.concerningPct}%) showed medium, high, or critical concern signals.
      </p>

      <section className="summary-grid">
        <article className="summary-card risk-critical-card">
          <h3>Critical Concern</h3>
          <p>{riskSummary.critical}</p>
        </article>
        <article className="summary-card risk-high-card">
          <h3>High Concern</h3>
          <p>{riskSummary.high}</p>
        </article>
        <article className="summary-card risk-medium-card">
          <h3>Medium Concern</h3>
          <p>{riskSummary.medium}</p>
        </article>
        <article className="summary-card risk-low-card">
          <h3>Low Concern</h3>
          <p>{riskSummary.low}</p>
        </article>
      </section>

      <section className="highlighted-vessels">
        <h3>Vessels of Potential Interests</h3>
        <p className="summary-note">
          The following vessels showed signs of fishing activity in this region:
        </p>
        {fishingActivityVessels.length > 0 ? (
          <div className="highlighted-vessel-list">
            {fishingActivityVessels.map((name) => (
              <span key={`fishing-${name}`} className="highlighted-vessel-pill">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="summary-note">No vessels with fishing-activity signals were found.</p>
        )}
        <br />
        <p className="summary-note">
          The following vessels showed signs of dark activity
          <Tooltip
            ariaLabel="What is dark activity?"
            variant="superscript"
            content="Dark activity refers to periods in which a vessel turns off its Automatic Identification System (AIS) transponders. This allows it to hide its location and activities from public surveillance."
          />{" "}
          in this region:
        </p>
        {highlightedVessels.length > 0 ? (
          <div className="highlighted-vessel-list">
            {highlightedVessels.map((name) => (
              <span key={name} className="highlighted-vessel-pill">
                {name}
              </span>
            ))}
          </div>
        ) : (
          <p className="summary-note">No vessels with dark-period signals were found.</p>
        )}
      </section>
    </>
  );
}
