import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, useLocation } from "react-router-dom";
import DashboardMap from "./components/DashboardMap";
import { useRecruitingData } from "./hooks/useRecruitingData";
import {
  aggregateCities,
  aggregateColleges,
  filterRecords,
  summarize,
  topSchools,
  topStates
} from "./utils/recruiting";

const fmt = value => Number(value).toLocaleString("en-US");

const TABS = [
  { path: "/", label: "Connections", description: "Origin to destination" },
  { path: "/circles", label: "Recruiting density", description: "Hotspots on the map" },
  { path: "/compare", label: "College comparison", description: "Side-by-side analysis" }
];

function RankingPanel({ items, title, subtitle }) {
  const max = items.length ? items[0].count : 1;
  return (
    <section className="panel ranking-panel">
      <div className="panel-head">
        <div><span className="eyebrow">LEADERBOARD</span><h2>{title}</h2></div>
        <p>{subtitle}</p>
      </div>
      {items.length ? (
        <ol className="ranking-list">
          {items.map((item, index) => (
            <li key={item.name} className="ranking-item">
              <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="rank-details">
                <div className="rank-label-row"><span title={item.name}>{item.name}</span><strong>{fmt(item.count)}</strong></div>
                <div className="rank-track"><div style={{ width: (item.count / max * 100) + "%" }} /></div>
              </div>
            </li>
          ))}
        </ol>
      ) : <div className="empty-panel">No matching records for this selection.</div>}
    </section>
  );
}

function Metric({ value, title, note }) {
  return (
    <div className="metric">
      <span className="metric-label">{title}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </div>
  );
}

function ComparisonColumn({ name, records }) {
  const stats = useMemo(() => summarize(records), [records]);
  const states = useMemo(() => topStates(records, 8), [records]);
  const maximum = states.length ? states[0].count : 1;
  return (
    <section className="panel comparison-column">
      <div className="compare-col-head">
        <span className="eyebrow">PROGRAM PROFILE</span>
        <h2>{name}</h2>
        <p>{fmt(stats.recruits)} recruits · {fmt(stats.schools)} source schools</p>
      </div>
      <div className="compare-mini-metrics">
        <div><strong>{stats.averageStars === null ? "—" : stats.averageStars.toFixed(2)}</strong><span>Avg. star rating</span></div>
        <div><strong>{fmt(stats.mapped)}</strong><span>US-mapped origins</span></div>
      </div>
      <h3>Top recruiting states</h3>
      {states.length ? (
        <ol className="state-list">
          {states.map((state, index) => (
            <li key={state.name}>
              <span>{index + 1}. {state.name}</span>
              <div className="state-track"><i style={{ width: (100 * state.count / maximum) + "%" }} /></div>
              <strong>{fmt(state.count)}</strong>
            </li>
          ))}
        </ol>
      ) : <p className="muted">No state information in the selected years.</p>}
    </section>
  );
}

function CollegeComparison({ data, colleges, years, compareA, setCompareA, compareB, setCompareB }) {
  const a = useMemo(() => filterRecords(data, years[0], years[1], compareA), [data, years, compareA]);
  const b = useMemo(() => filterRecords(data, years[0], years[1], compareB), [data, years, compareB]);
  return (
    <>
      <section className="panel compare-selector">
        <div>
          <span className="eyebrow">HEAD-TO-HEAD</span>
          <h2>Compare recruiting footprints</h2>
          <p>Analyze recruiting volume, source schools, ratings, and home states for two programs over the same years.</p>
        </div>
        <div className="compare-selects">
          <label>Program A
            <select value={compareA} onChange={event => setCompareA(event.target.value)}>
              {colleges.map(college => <option key={college} value={college}>{college}</option>)}
            </select>
          </label>
          <span className="versus">VS</span>
          <label>Program B
            <select value={compareB} onChange={event => setCompareB(event.target.value)}>
              {colleges.map(college => <option key={college} value={college}>{college}</option>)}
            </select>
          </label>
        </div>
      </section>
      <div className="comparison-grid">
        <ComparisonColumn name={compareA} records={a} />
        <ComparisonColumn name={compareB} records={b} />
      </div>
      <p className="method-note">Comparison counts include records without usable geographic coordinates. State rankings use the recorded home-state abbreviation and exclude records without a recognized US state.</p>
    </>
  );
}

function Dashboard() {
  const location = useLocation();
  const view = location.pathname === "/compare"
    ? "compare"
    : location.pathname === "/circles"
      ? "density"
      : "connections";
  const { loading, error, dataset } = useRecruitingData();
  const [college, setCollege] = useState("all");
  const [years, setYears] = useState([2020, 2025]);
  const [densityType, setDensityType] = useState("cities");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  useEffect(() => {
    if (!dataset) return;
    const { bounds, colleges } = dataset;
    setYears([Math.max(bounds.min, bounds.max - 5), bounds.max]);
    setCollege(colleges.includes("Alabama") ? "Alabama" : "all");
    setCompareA(colleges.includes("Alabama") ? "Alabama" : colleges[0]);
    setCompareB(colleges.includes("Georgia") ? "Georgia" : colleges.find(c => c !== (colleges.includes("Alabama") ? "Alabama" : colleges[0])) || colleges[0]);
  }, [dataset]);

  const records = useMemo(() => dataset ? dataset.records : [], [dataset]);
  const geocodes = useMemo(() => dataset ? dataset.geocodes : {}, [dataset]);
  const colleges = dataset ? dataset.colleges : [];
  const bounds = dataset ? dataset.bounds : { min: 2020, max: 2025 };
  const yearOptions = useMemo(
    () => Array.from({ length: bounds.max - bounds.min + 1 }, (_, i) => bounds.min + i),
    [bounds.min, bounds.max]
  );
  const scoped = useMemo(() => filterRecords(records, years[0], years[1], college), [records, years, college]);
  const statisticsRows = useMemo(() => {
    if (view !== "compare") return scoped;
    const chosen = new Set([compareA, compareB]);
    return records.filter(row => row.year >= years[0] && row.year <= years[1] && chosen.has(row.college));
  }, [view, scoped, compareA, compareB, records, years]);
  const stats = useMemo(() => summarize(statisticsRows), [statisticsRows]);
  const ranking = useMemo(() => {
    if (view === "connections") return topSchools(scoped);
    if (densityType === "colleges") return aggregateColleges(scoped, geocodes).slice(0, 10);
    return aggregateCities(scoped).slice(0, 10);
  }, [scoped, view, densityType, geocodes]);

  const resetFilters = () => {
    setCollege("all");
    setYears([Math.max(bounds.min, bounds.max - 5), bounds.max]);
  };

  return (
    <div className="dashboard">
      <header className="site-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">R<span>↗</span></span>
          <div><strong>RECRUIT ATLAS</strong><span>College football intelligence</span></div>
        </div>
        <div className="header-right">
          <span className="data-pill"><span className="status-dot" />Historical recruiting data</span>
          <a className="source-link" href="https://github.com/normanlrasmussen/IDeA-FBSC" target="_blank" rel="noreferrer">View source <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <div className="hero">
        <div className="hero-copy">
          <span className="hero-kicker">AN INTERACTIVE RECRUITING EXPLORER <span className="hero-rule" /></span>
          <h1>Where talent <em>meets opportunity.</em></h1>
          <p>Explore the geographic story of college football recruiting—from hometown pipelines to programs across the country.</p>
        </div>
        <div className="hero-badge">
          <span>DATA COVERAGE</span>
          <strong>{loading ? "—" : bounds.min + "—" + bounds.max}</strong>
          <small>Recruiting class years</small>
        </div>
      </div>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-label">EXPLORE</div>
          <nav className="section-nav" aria-label="Dashboard views">
            {TABS.map((tab, index) => (
              <Link key={tab.path} className={"section-link" + ((index === 0 && view === "connections") || (index === 1 && view === "density") || (index === 2 && view === "compare") ? " active" : "")} to={tab.path}>
                <span className="nav-glyph">{index === 0 ? "⌁" : index === 1 ? "◉" : "▥"}</span>
                <span><strong>{tab.label}</strong><small>{tab.description}</small></span>
                <span className="nav-chevron">›</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-divider" />
          <div className="filter-heading">
            <span className="side-label">FILTERS</span>
            <button type="button" className="text-button" onClick={() => setFiltersOpen(open => !open)} aria-expanded={filtersOpen}>{filtersOpen ? "Hide" : "Show"}</button>
          </div>
          {filtersOpen && (
            <div className="filters">
              <label className="field-label" htmlFor="college-filter">Recruiting program</label>
              <select id="college-filter" value={college} onChange={event => setCollege(event.target.value)} disabled={loading || view === "compare"}>
                <option value="all">All colleges</option>
                {colleges.map(item => <option value={item} key={item}>{item}</option>)}
              </select>
              {view === "compare" && <p className="filter-hint">Use the two program selectors in the comparison panel instead.</p>}

              <div className="range-head"><span className="field-label">Recruiting class years</span><strong>{years[0]} – {years[1]}</strong></div>
              <div className="year-selects">
                <label htmlFor="year-start">From
                  <select id="year-start" value={years[0]} onChange={event => setYears([Math.min(Number(event.target.value), years[1]), years[1]])} disabled={loading}>
                    {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
                <label htmlFor="year-end">To
                  <select id="year-end" value={years[1]} onChange={event => setYears([years[0], Math.max(Number(event.target.value), years[0])])} disabled={loading}>
                    {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
              </div>
              <button type="button" className="reset-button" onClick={resetFilters} disabled={loading}>Reset filters <span aria-hidden="true">↺</span></button>
            </div>
          )}
          <div className="sidebar-notes">
            <strong>About the data</strong>
            <p>Recruiting records are sourced from <a href="https://collegefootballdata.com" target="_blank" rel="noreferrer">CollegeFootballData</a>. Map markers require usable coordinates; summary counts can include unmapped records.</p>
            <span>Interactive analysis · Browser-based</span>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-intro">
            <div>
              <span className="eyebrow">DASHBOARD / {view === "connections" ? "CONNECTIONS" : view === "density" ? "DENSITY" : "COMPARISON"}</span>
              <h2>{view === "connections" ? "Recruiting connections" : view === "density" ? "Geographic recruiting density" : "College comparison"}</h2>
              <p>{view === "connections" ? "Trace recruiting pathways from high schools to college programs." : view === "density" ? "Identify the cities and campuses shaping the national recruiting landscape." : "Understand how programs differ in where and how widely they recruit."}</p>
            </div>
            <span className="selection-chip">{view === "compare" ? "Two-program view" : college === "all" ? "All colleges" : college}</span>
          </div>

          {loading ? (
            <div className="loading-panel" role="status"><span className="loading-spinner" />Loading the recruiting dataset…</div>
          ) : error ? (
            <div className="error-panel" role="alert"><strong>Unable to load recruiting data</strong><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>
          ) : (
            <>
              <div className="metrics-grid">
                <Metric title="Total recruits" value={fmt(stats.recruits)} note={view === "compare" ? "Across the compared programs" : "Matching class-year selection"} />
                <Metric title="Source schools" value={fmt(stats.schools)} note="Distinct listed high schools" />
                <Metric title="Colleges" value={fmt(stats.colleges)} note="Programs in selection" />
                <Metric title="US-mapped origins" value={fmt(stats.mapped)} note={stats.recruits ? Math.round(stats.mapped / stats.recruits * 100) + "% of selected records" : "No records"} />
              </div>
              {view === "compare" ? (
                <CollegeComparison data={records} colleges={colleges} years={years} compareA={compareA} setCompareA={setCompareA} compareB={compareB} setCompareB={setCompareB} />
              ) : (
                <>
                  {view === "density" && (
                    <div className="mode-switch" role="group" aria-label="Density map type">
                      <button type="button" className={densityType === "cities" ? "selected" : ""} onClick={() => setDensityType("cities")}>Recruit hometowns</button>
                      <button type="button" className={densityType === "colleges" ? "selected" : ""} onClick={() => setDensityType("colleges")}>College destinations</button>
                    </div>
                  )}
                  <div className="visual-grid">
                    <DashboardMap view={view} rows={scoped} geocodes={geocodes} selectedCollege={college} densityType={densityType} />
                    <RankingPanel
                      items={ranking}
                      title={view === "connections" ? "Top source schools" : densityType === "colleges" ? "Top destinations" : "Top hometowns"}
                      subtitle={"Top 10 by number of matching recruits"}
                    />
                  </div>
                  <p className="method-note">Map points are limited to US locations and usable geographic coordinates. Records from other countries or with missing locations remain in summary statistics and school rankings. College markers use a separate geocoding cache.</p>
                </>
              )}
            </>
          )}
        </main>
      </div>
      <footer className="site-footer"><span>RECRUIT ATLAS</span><span>Data: CollegeFootballData · Built with React and Plotly</span><a href="https://github.com/normanlrasmussen/IDeA-FBSC" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
    </div>
  );
}

export default function App() {
  return <BrowserRouter basename="/IDeA-FBSC"><Dashboard /></BrowserRouter>;
}
