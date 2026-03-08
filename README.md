# Anomalous Marine Activity Platform

Interactive dashboard for exploring anomalous vessel activity in and around MPAs, with:
- map-first MPA view
- MPA summary insights
- vessel-level details
- optional deep-dive enrichment from `dashboard/data/reports/vessels`

## Project Structure

- `dashboard/` - Next.js app
- `dashboard/data/reports/mpa_registry.csv` - canonical MPA ID/name to files mapping
- `dashboard/data/reports/mpa/` - MPA-level CSV reports
- `dashboard/data/reports/vessels/<vessel_slug>/` - vessel deep-dive CSVs (identity/visits/violations/dark events)
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
  - `dashboard/data/reports/mpa/charlie_gibbs_north_sea.csv`
- MPA dataset mapping is controlled by:
  - `dashboard/data/reports/mpa_registry.csv`
  - required columns: `mpa_id`, `display_name`, `report_file`, `geojson_file`, `is_default`
  - the first row with `is_default=1` is selected by the app (or first row if none are marked default)
- Deep-dive files are auto-discovered when organized like:
  - `dashboard/data/reports/vessels/<vessel_slug>/identity.csv`
  - `dashboard/data/reports/vessels/<vessel_slug>/visits.csv`
  - `dashboard/data/reports/vessels/<vessel_slug>/violations.csv`
  - `dashboard/data/reports/vessels/<vessel_slug>/dark_events.csv`

If deep-dive data exists for a vessel, the platform uses it to enrich vessel details.

## Troubleshooting

- If dependencies seem stale:

```bash
rm -rf node_modules .next
npm install
npm run dev
```

- If the app starts but looks empty, verify CSV files exist under:
  - `dashboard/data/reports/mpa/`
  - `dashboard/data/reports/vessels/`
