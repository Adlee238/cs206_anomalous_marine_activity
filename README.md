# Anomalous Marine Activity Platform

Interactive dashboard for exploring anomalous vessel activity in and around MPAs, with:
- map-first MPA view
- MPA summary insights
- vessel-level details
- optional deep-dive enrichment from `dashboard/data/vessel_details`

## Project Structure

- `dashboard/` - Next.js app
- `dashboard/data/mpa_report/` - MPA-level CSV reports
- `dashboard/data/vessel_details/` - vessel deep-dive CSVs (identity/visits/violations/dark events)
- `dashboard/data/region_geojsons/` - MPA geometry files

## Prerequisites

- Node.js 18+
- npm 9+

## Run Locally

1. Open a terminal in the repo root:

```bash
cd dashboard
```

2. Install dependencies (if needed):

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

- `http://localhost:3000`

If port 3000 is in use:

```bash
npm run dev -- -p 3001
```

Then open `http://localhost:3001`.

## Data Notes

- Main MPA report currently used by the UI:
  - `dashboard/data/mpa_report/charlie_gibbs_report.csv`
- Deep-dive files are auto-discovered when named like:
  - `*_deep_dive_identity.csv`
  - `*_deep_dive_visits.csv`
  - `*_deep_dive_violations.csv`
  - `*_deep_dive_dark_events.csv`

If deep-dive data exists for a vessel, the platform uses it to enrich vessel details.

## Troubleshooting

- If dependencies seem stale:

```bash
rm -rf node_modules .next
npm install
npm run dev
```

- If the app starts but looks empty, verify CSV files exist under:
  - `dashboard/data/mpa_report/`
  - `dashboard/data/vessel_details/`
