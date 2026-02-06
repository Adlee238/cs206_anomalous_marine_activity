import AlertCard from "../components/AlertCard";
import VesselTable from "../components/VesselTable";

const alerts = [
  {
    title: "5 vessels traversed in MPA in the past 6 months",
    description:
      "Five distinct vessels were detected traversing the marine protected area between March and August 2024.",
    vessels: [
      { name: "Silver Current", country: "Chile" },
      { name: "Northwind", country: "Japan" },
      { name: "Mariner Dawn", country: "Chile" },
      { name: "Blue Meridian", country: "Philippines" },
      { name: "Triton Reef", country: "Japan" },
      { name: "Maryland", country: "Japan" },
    ],
    topCountries: [
      { name: "Chile", count: 2 },
      { name: "Japan", count: 2 },
      { name: "Philippines", count: 1 },
    ],
  },
  {
    title: "Dark vessels detected with AIS off",
    description:
      "Sensors flagged vessels operating without AIS signals within the monitored zone during the last 30 days.",
    vessels: [
      { name: "Silent Wake", country: "Unknown" },
      { name: "Shadow Tide", country: "Unknown" },
      { name: "Night Current", country: "Unknown" },
    ],
    topCountries: [{ name: "Unknown", count: 3 }],
  },
];

export default function AlertsPage() {
  return (
    <div className="alerts-page">
      <header className="page-header">
        <div>
          <p className="page-kicker">Active incident queue</p>
          <h1 className="page-title">Alerts</h1>
        </div>
      </header>

      <section className="alert-list">
        {alerts.map((alert) => (
          <AlertCard key={alert.title} title={alert.title}>
            <div className="alert-details-grid">
              <p className="alert-meta">{alert.description}</p>

              <div className="alert-section">
                <p className="alert-section-title">Vessels</p>
                <VesselTable vessels={alert.vessels} />
              </div>

              <div className="alert-section">
                <p className="alert-section-title">Top countries</p>
                <div className="alert-counts">
                  {alert.topCountries.map((country) => (
                    <div key={country.name} className="alert-count-row">
                      <span className="alert-count-label">{country.name}</span>
                      <span className="alert-count-value">{country.count} vessels</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AlertCard>
        ))}
      </section>
    </div>
  );
}
