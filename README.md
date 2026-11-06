# Recruit Atlas — College Football Recruiting Dashboard

[**Open the live dashboard**](https://normanlrasmussen.github.io/IDeA-FBSC/) · [Data dictionary](docs/DATA_DICTIONARY.md)

A responsive, browser-based explorer for historical college football recruiting patterns. It helps answer where recruits come from, which high schools contribute to college programs, and how two colleges' recruiting footprints compare.

## Explore the data

- **Connections:** See geocoded paths between high-school origins and college destinations. Pathway lines are grouped by volume; the map limits visible pathways for clarity while the statistics use the full filtered dataset.
- **Recruiting density:** Switch between city-level recruiting hotspots and college destination concentrations. Bubble size represents recruit volume.
- **College comparison:** Compare two programs' recruit totals, source-school counts, available star ratings, and top recruiting states over a shared period.
- **Shared controls:** Filter by college and class years. Comparison selectors are independent of the global college filter.
- **Data transparency:** Summary cards count all filtered records, including those that cannot be reliably mapped. No imaginary fallback coordinates are used.

## Technology

React 18, React Router, Plotly.js, PapaParse, static CSV and JSON source data, GitHub Actions, and GitHub Pages. Everything runs in the browser; no sign-in or API key is required to view the dashboard.

## Run locally

Requires Node.js 18+ and npm.

```bash
git clone https://github.com/normanlrasmussen/IDeA-FBSC.git
cd IDeA-FBSC/frontend
npm ci
npm start
```

Open http://localhost:3000/IDeA-FBSC/ when the development server starts.

## Tests and validation

From the repository root:

```bash
python3 scripts/validate_data.py
cd frontend
CI=true npm test -- --watch=false --runInBand
npm run build
```

The workflow in `.github/workflows/deploy.yml` runs validation, tests, and the production build on **every push to `main`**, and deploys the resulting artifact to GitHub Pages when those checks succeed. Configure repository **Settings → Pages → Build and deployment → GitHub Actions**.

## Project structure

```text
frontend/
  public/data/                 # Recruiting snapshot and college geocode cache
  src/
    App.jsx                    # Dashboard shell, filters, metrics, comparisons
    App.css                    # Responsive visual system
    components/DashboardMap.jsx
    hooks/useRecruitingData.js # Single cached CSV and geocode fetch
    utils/recruiting.js        # Normalization and aggregation
    utils/recruiting.test.js
docs/DATA_DICTIONARY.md
scripts/validate_data.py
.github/workflows/deploy.yml
```

## Data source and caveats

The recruiting snapshot is attributed to [CollegeFootballData](https://collegefootballdata.com). It is historical, not live. The dashboard does not establish completeness of a class, verify individual player identities, or validate every geocoded campus address. Its rankings count source records, not verified unique athletes. See [the data dictionary](docs/DATA_DICTIONARY.md) for field definitions and coverage limits.

This project is intended for educational, exploratory analytics and portfolio demonstration.
