import { useState } from "react";
import Tooltip from "../ui/tooltip";
import { TOOLTIP_CONTENT } from "../../../lib/tooltip-content";
import { getRiskRowClass } from "../../../lib/mpa-viewer";

const DEFAULT_LIST_LIMIT = 10;

function getDarkActivityVessels(records) {
  const vesselsByName = new Map();

  for (const row of records || []) {
    const darkVisits = Number(row.visits_with_dark_periods || 0);
    const vesselName = String(row.vessel_name || "").trim();
    if (darkVisits <= 0 || !vesselName) {
      continue;
    }

    const riskScoreRaw = Number(
      row.composite_risk_score ?? row.anomaly_score ?? row.risk_score ?? Number.NEGATIVE_INFINITY
    );
    const riskScore = Number.isFinite(riskScoreRaw) ? riskScoreRaw : Number.NEGATIVE_INFINITY;
    const riskCategory = String(row.risk_category || "").trim().toUpperCase();
    const current = vesselsByName.get(vesselName);
    if (!current || riskScore > current.riskScore) {
      vesselsByName.set(vesselName, { name: vesselName, riskScore, riskCategory });
    }
  }

  return Array.from(vesselsByName.values())
    .sort((a, b) => b.riskScore - a.riskScore || a.name.localeCompare(b.name))
    .map((entry) => ({ name: entry.name, riskCategory: entry.riskCategory }));
}

function getFishingActivityVessels(records) {
  const vesselsByName = new Map();

  for (const row of records || []) {
    const fishingVisits = Number(row.visits_with_fishing || 0);
    const vesselName = String(row.vessel_name || "").trim();
    if (fishingVisits <= 0 || !vesselName) {
      continue;
    }

    const riskScoreRaw = Number(
      row.composite_risk_score ?? row.anomaly_score ?? row.risk_score ?? Number.NEGATIVE_INFINITY
    );
    const riskScore = Number.isFinite(riskScoreRaw) ? riskScoreRaw : Number.NEGATIVE_INFINITY;
    const riskCategory = String(row.risk_category || "").trim().toUpperCase();
    const current = vesselsByName.get(vesselName);
    if (!current || riskScore > current.riskScore) {
      vesselsByName.set(vesselName, { name: vesselName, riskScore, riskCategory });
    }
  }

  return Array.from(vesselsByName.values())
    .sort((a, b) => b.riskScore - a.riskScore || a.name.localeCompare(b.name))
    .map((entry) => ({ name: entry.name, riskCategory: entry.riskCategory }));
}

function withVesselNoun(count) {
  return `${count} ${count === 1 ? "vessel" : "vessels"}`;
}

function getPct(count, total) {
  if (!total) {
    return 0;
  }
  return Math.round((Number(count || 0) / Number(total)) * 100);
}

function getSummaryNote(riskSummary) {
  const criticalRiskCount = Number(riskSummary.critical || 0);
  const highRiskCount = Number(riskSummary.high || 0);
  const mediumRiskCount = Number(riskSummary.medium || 0);
  const lowRiskCount = Number(riskSummary.low || 0);
  const total = Number(riskSummary.total || 0);
  const parts = [`${withVesselNoun(total)} detected in this region during the specified time range.`];

  if (criticalRiskCount > 0) {
    parts.push(
      `${criticalRiskCount} ${
        criticalRiskCount === 1 ? "vessel" : "vessels"
      } showed critical risk scores; we recommend immediate investigation.`
    );
  }

  if (highRiskCount > 0) {
    parts.push(
      `${highRiskCount} ${highRiskCount === 1 ? "vessel" : "vessels"} showed high risk scores; we recommend beginning investigation.`
    );
  }

  if (mediumRiskCount > 0) {
    parts.push(
      `${mediumRiskCount} ${
        mediumRiskCount === 1 ? "vessel" : "vessels"
      } showed medium risk signals; we recommend continuing to monitor these vessels.`
    );
  }

  if (lowRiskCount > 0) {
    parts.push(
      `${lowRiskCount} ${lowRiskCount === 1 ? "vessel" : "vessels"} showed low risk scores; we recommend routine observation.`
    );
  }

  return parts;
}

export default function SummaryTab({ riskSummary, records, regionMetadata }) {
  const [showAllFishing, setShowAllFishing] = useState(false);
  const [showAllDark, setShowAllDark] = useState(false);
  const fishingActivityVessels = getFishingActivityVessels(records);
  const highlightedVessels = getDarkActivityVessels(records);
  const visibleFishingVessels = showAllFishing
    ? fishingActivityVessels
    : fishingActivityVessels.slice(0, DEFAULT_LIST_LIMIT);
  const visibleDarkVessels = showAllDark
    ? highlightedVessels
    : highlightedVessels.slice(0, DEFAULT_LIST_LIMIT);
  const total = Number(riskSummary.total || 0);
  const summaryNoteParts = getSummaryNote(riskSummary);
  const detectedPrefix = `${withVesselNoun(total)} detected`;
  const detectedSuffix = " in this region during the specified time range.";
  const followupSummary = summaryNoteParts.slice(1).join(" ");
  const fishingPolicy = String(regionMetadata?.restrictions?.fishingPolicy || "").trim();

  return (
    <>
      <h3 className="viewer-title summary-overview-title">
        Risk Detection Overview
        <Tooltip
          ariaLabel="How risk is determined after detection"
          variant="superscript"
          content={TOOLTIP_CONTENT.detectionRisk}
        />
      </h3>
      <p className="summary-note">
        {detectedPrefix}
        {detectedSuffix}
        {followupSummary ? ` ${followupSummary}` : ""}
      </p>

      <section className="summary-grid">
        <article className="summary-card risk-critical-card">
          <h3 className="summary-card-title">
            Critical Risk
            <Tooltip
              ariaLabel="What is a critical risk signal?"
              variant="superscript"
              content={TOOLTIP_CONTENT.riskSignals.critical}
            />
          </h3>
          <p>
            {riskSummary.critical} vessels ({getPct(riskSummary.critical, total)}%)
          </p>
        </article>
        <article className="summary-card risk-high-card">
          <h3 className="summary-card-title">
            High Risk
            <Tooltip
              ariaLabel="What is a high risk signal?"
              variant="superscript"
              content={TOOLTIP_CONTENT.riskSignals.high}
            />
          </h3>
          <p>
            {riskSummary.high} vessels ({getPct(riskSummary.high, total)}%)
          </p>
        </article>
        <article className="summary-card risk-medium-card">
          <h3 className="summary-card-title">
            Medium Risk
            <Tooltip
              ariaLabel="What is a medium risk signal?"
              variant="superscript"
              content={TOOLTIP_CONTENT.riskSignals.medium}
            />
          </h3>
          <p>
            {riskSummary.medium} vessels ({getPct(riskSummary.medium, total)}%)
          </p>
        </article>
        <article className="summary-card risk-low-card">
          <h3 className="summary-card-title">
            Low Risk
            <Tooltip
              ariaLabel="What is a low risk signal?"
              variant="superscript"
              content={TOOLTIP_CONTENT.riskSignals.low}
            />
          </h3>
          <p>
            {riskSummary.low} vessels ({getPct(riskSummary.low, total)}%)
          </p>
        </article>
      </section>

      <section className="highlighted-vessels">
        <h3>Vessels of Potential Interests</h3>
        <p className="summary-note">
          The following vessels showed signs of fishing activity
          {fishingPolicy ? (
            <Tooltip
              ariaLabel="How to interpret fishing activity in this region"
              variant="superscript"
              content={fishingPolicy}
            />
          ) : null}{" "}
          in this region:
        </p>
        {fishingActivityVessels.length > 0 ? (
          <>
            <div className="highlighted-vessel-list">
              {visibleFishingVessels.map((entry) => (
                <span
                  key={`fishing-${entry.name}`}
                  className={`highlighted-vessel-pill ${getRiskRowClass(entry.riskCategory)}`.trim()}
                >
                  {entry.name}
                </span>
              ))}
            </div>
            {fishingActivityVessels.length > DEFAULT_LIST_LIMIT ? (
              <button
                type="button"
                className="summary-list-toggle"
                onClick={() => setShowAllFishing((current) => !current)}
              >
                {showAllFishing
                  ? `Show Top ${DEFAULT_LIST_LIMIT}`
                  : `Show All (${fishingActivityVessels.length})`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="summary-note">No vessels with fishing-activity signals were found.</p>
        )}
        <div className="highlighted-vessel-section-separator" />
        <p className="summary-note">
          The following vessels showed signs of dark activity 
          <Tooltip
            ariaLabel="What is dark activity?"
            variant="superscript"
            content={TOOLTIP_CONTENT.darkActivity}
          />{" "}
          in this region:
        </p>
        {highlightedVessels.length > 0 ? (
          <>
            <div className="highlighted-vessel-list">
              {visibleDarkVessels.map((entry) => (
                <span
                  key={entry.name}
                  className={`highlighted-vessel-pill ${getRiskRowClass(entry.riskCategory)}`.trim()}
                >
                  {entry.name}
                </span>
              ))}
            </div>
            {highlightedVessels.length > DEFAULT_LIST_LIMIT ? (
              <button
                type="button"
                className="summary-list-toggle"
                onClick={() => setShowAllDark((current) => !current)}
              >
                {showAllDark
                  ? `Show Top ${DEFAULT_LIST_LIMIT}`
                  : `Show All (${highlightedVessels.length})`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="summary-note">No vessels with dark-period signals were found.</p>
        )}
      </section>
    </>
  );
}
