import { headers } from "next/headers";
import AlertCard from "../components/AlertCard";
import VesselTable from "../components/VesselTable";


/* ---------------- Constants ---------------- */

const TIME_RANGE_MONTHS = 1;
const CHART_COLORS = ["#1f5c6e", "#d45b3f", "#e2a860", "#7aa47b", "#3f6f5a"];

const DARK_VESSEL_VESSELS = [
  { name: "Silent Wake", country: "Unknown", hours: 3, vesselType: "Unknown" },
  { name: "Shadow Tide", country: "Unknown", hours: 2, vesselType: "Unknown" },
  { name: "Night Current", country: "Unknown", hours: 1, vesselType: "Unknown" },
];  // TODO: Replace with real dark vessel data from GFW 4Wings API when available


/* ---------------- Time + Time Formatting ---------------- */

function getTimeRange() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - TIME_RANGE_MONTHS);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function formatRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diffMs = end - start;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (Number.isNaN(diffMs)) {
    return `${startIso} to ${endIso}`;
  }

  if (diffHours <= 48) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${formatter.format(start)} to ${formatter.format(end)}`;
  }

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${dateFormatter.format(start)} to ${dateFormatter.format(end)}`;
}


/* ---------------- Breakdown Visualization Helpers ---------------- */

function buildBreakdown(vessels, getKey) {
  const counts = vessels.reduce((acc, vessel) => {
    const key = getKey(vessel);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }));
}

function buildCountryBreakdown(vessels) {
  return buildBreakdown(vessels, (vessel) => vessel.country);
}

function buildVesselTypeBreakdown(vessels) {
  return buildBreakdown(vessels, (vessel) => vessel.vesselType || "Unknown");
}

function buildPieChart(breakdown = []) {
  const total = breakdown.reduce((sum, entry) => sum + entry.count, 0);
  if (!total) {
    return {
      gradient: "conic-gradient(#e6e0d6 0 100%)",
      legend: [],
    };
  }

  let acc = 0;
  const segments = breakdown.map((entry, index) => {
    const value = (entry.count / total) * 100;
    const start = acc;
    acc += value;
    const color = CHART_COLORS[index % CHART_COLORS.length];
    return {
      ...entry,
      color,
      start,
      end: acc,
      percent: Math.round(value),
    };
  });

  const gradient = `conic-gradient(${segments
    .map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`)
    .join(", ")})`;

  return { gradient, legend: segments };
}

function buildCountryChart(breakdown = []) {
  const total = breakdown.reduce((sum, entry) => sum + entry.count, 0);
  const max = breakdown.reduce(
    (currentMax, entry) => Math.max(currentMax, entry.count),
    0
  );

  return {
    total,
    max,
    rows: breakdown.map((entry, index) => ({
      ...entry,
      color: CHART_COLORS[index % CHART_COLORS.length],
      percent: total ? Math.round((entry.count / total) * 100) : 0,
    })),
  };
}

/* ---------------- API Integration ---------------- */

async function fetchVesselAlert() {
  const { startIso, endIso } = getTimeRange();
  const host = headers().get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  try {
    const response = await fetch(
      `${protocol}://${host}/api/vessels?startTime=${startIso}&endTime=${endIso}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const records = Object.values(data || {}).flat();
    const vessels = records.map((record) => ({
      name: record?.shipName || "Unknown vessel",
      country: record?.flag || "Unknown",
      hours: typeof record?.hours === "number" ? record.hours : null,
      vesselType: record?.vesselType || null,
    }));
   
    const rangeLabel = formatRange(startIso, endIso);
    const title = `${vessels.length} vessels traversed in MPA from ${rangeLabel}`;
    const description = `${vessels.length} distinct vessels were detected traversing the marine protected area from ${rangeLabel}.`;

    return {
      title,
      description,
      vessels: vessels,
      vesselTypeBreakdown: buildVesselTypeBreakdown(vessels),
      countryBreakdown: buildCountryBreakdown(vessels),
    };
  } catch {
    return null;
  }
}

const DARK_VESSEL_ALERT = {
  title: "Dark vessels detected with AIS off",
  description:
    "Sensors flagged vessels operating without AIS signals within the monitored zone during the last 30 days.",
  vessels: DARK_VESSEL_VESSELS,
  vesselTypeBreakdown: buildVesselTypeBreakdown(DARK_VESSEL_VESSELS),
  countryBreakdown: buildCountryBreakdown(DARK_VESSEL_VESSELS),
};  // TODO: Replace with real dark vessel alert data from GFW 4Wings API when available


/* ---------------- Main Alert Page ---------------- */

export default async function AlertsPage() {
  const vesselAlert = await fetchVesselAlert();
  const alerts = vesselAlert ? [vesselAlert, DARK_VESSEL_ALERT] : [];

  return (
    <div className="alerts-page">
      <header className="page-header">
        <div>
          <p className="page-kicker">Active incident queue</p>
          <h1 className="page-title">Alerts</h1>
        </div>
      </header>

      <section className="alert-list">
        {alerts.map((alert) => {
          const countryChart = buildCountryChart(alert.countryBreakdown);
          const vesselTypeChart = buildPieChart(alert.vesselTypeBreakdown);
          return (
            <AlertCard key={alert.title} title={alert.title}>
              <div className="alert-details-grid">
                <p className="alert-meta">{alert.description}</p>

                <div className="alert-section">
                  <p className="alert-section-title">Vessels</p>
                  <VesselTable vessels={alert.vessels} />
                </div>

                <div className="alert-section">
                  <p className="alert-section-title">Vessel types</p>
                  <p className="alert-meta">
                    Distribution of vessels by their type classification.
                  </p>
                  <div className="type-chart">
                    <div
                      className="type-chart-pie"
                      style={{ backgroundImage: vesselTypeChart.gradient }}
                    />
                    <div className="type-chart-legend">
                      {vesselTypeChart.legend.map((type) => (
                        <div key={type.name} className="type-chart-item">
                          <span
                            className="type-chart-swatch"
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="type-chart-label">{type.name}</span>
                          <span className="type-chart-value">
                            {type.count} · {type.percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="alert-section">
                  <p className="alert-section-title">Country breakdown</p>
                  <p className="alert-meta">
                    Distribution of vessels by their associated countries.
                  </p>
                  <div className="country-details-panel">
                    <div className="country-bars">
                      {countryChart.rows.map((country) => (
                        <div key={country.name} className="country-bar-row">
                          <div className="country-bar-labels">
                            <span className="country-bar-name">{country.name}</span>
                            <span className="country-bar-value">
                              {country.count} · {country.percent}%
                            </span>
                          </div>
                          <div className="country-bar-track">
                            <span
                              className="country-bar-fill"
                              style={{
                                backgroundColor: country.color,
                                width: countryChart.max
                                  ? `${(country.count / countryChart.max) * 100}%`
                                  : "0%",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AlertCard>
          );
        })}
      </section>
    </div>
  );
}
