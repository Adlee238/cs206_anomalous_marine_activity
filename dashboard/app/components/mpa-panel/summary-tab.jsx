export default function SummaryTab({ riskSummary }) {
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
    </>
  );
}
