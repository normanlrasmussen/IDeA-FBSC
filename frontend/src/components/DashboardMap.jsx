import React, { useMemo } from "react";
import Plot from "react-plotly.js";
import {
  aggregateCities,
  aggregateColleges,
  aggregatePaths
} from "../utils/recruiting";

const MAP_LAYOUT = {
  autosize: true,
  margin: { l: 6, r: 6, t: 6, b: 6 },
  paper_bgcolor: "#ffffff",
  plot_bgcolor: "#ffffff",
  showlegend: false,
  hovermode: "closest",
  geo: {
    scope: "usa",
    projection: { type: "albers usa" },
    showland: true,
    landcolor: "#e9eff0",
    showlakes: true,
    lakecolor: "#ffffff",
    showsubunits: true,
    subunitcolor: "#cbd8dc",
    subunitwidth: 0.6,
    showcoastlines: true,
    coastlinecolor: "#a6bdc4",
    bgcolor: "#ffffff"
  },
  font: { family: "Inter, system-ui, sans-serif", color: "#334155" },
  uirevision: "recruiting-map"
};

const MAP_CONFIG = {
  responsive: true,
  scrollZoom: false,
  displaylogo: false,
  modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"],
  toImageButtonOptions: { format: "png", filename: "recruiting-map", scale: 2 }
};

function connectionTraces(paths) {
  const tiers = [
    { match: count => count === 1, color: "rgba(31, 117, 131, 0.24)", width: 0.8 },
    { match: count => count >= 2 && count <= 3, color: "rgba(26, 116, 129, 0.44)", width: 1.3 },
    { match: count => count >= 4, color: "rgba(209, 131, 59, 0.65)", width: 2.1 }
  ];
  const traces = tiers.map(tier => {
    const lat = [];
    const lon = [];
    for (const path of paths) {
      if (!tier.match(path.count)) continue;
      lat.push(path.lat, path.collegeLat, null);
      lon.push(path.lon, path.collegeLon, null);
    }
    return {
      type: "scattergeo",
      mode: "lines",
      lat, lon,
      line: { width: tier.width, color: tier.color },
      hoverinfo: "skip",
      showlegend: false
    };
  });
  const origins = new Map();
  const colleges = new Map();
  for (const path of paths) {
    const key = [path.school, path.city, path.state, path.lat, path.lon].join("|");
    const existing = origins.get(key);
    if (existing) existing.count += path.count;
    else origins.set(key, {
      name: path.school,
      location: [path.city, path.state].filter(Boolean).join(", "),
      lat: path.lat, lon: path.lon, count: path.count
    });
    const destination = colleges.get(path.college);
    if (destination) destination.count += path.count;
    else colleges.set(path.college, {
      name: path.college, lat: path.collegeLat, lon: path.collegeLon,
      count: path.count
    });
  }
  const schools = [...origins.values()];
  const destinations = [...colleges.values()];
  traces.push({
    type: "scattergeo",
    mode: "markers",
    lat: schools.map(p => p.lat),
    lon: schools.map(p => p.lon),
    text: schools.map(p => p.name),
    customdata: schools.map(p => [p.location, p.count]),
    hovertemplate: "<b>%{text}</b><br>%{customdata[0]}<br>Recruits in displayed pathways: %{customdata[1]}<extra></extra>",
    marker: { color: "#168b92", size: 6, opacity: 0.78, line: { color: "#ffffff", width: 0.6 } },
    name: "High schools"
  });
  traces.push({
    type: "scattergeo",
    mode: "markers",
    lat: destinations.map(p => p.lat),
    lon: destinations.map(p => p.lon),
    text: destinations.map(p => p.name),
    customdata: destinations.map(p => p.count),
    hovertemplate: "<b>%{text}</b><br>Recruits in displayed pathways: %{customdata}<extra></extra>",
    marker: {
      color: "#e0a052", size: 11, symbol: "diamond",
      line: { color: "#ffffff", width: 1 }, opacity: 0.95
    },
    name: "Colleges"
  });
  return traces;
}

function densityTrace(places, isCollege) {
  const top = places.slice(0, 800);
  const max = top.length ? top[0].count : 1;
  return [{
    type: "scattergeo",
    mode: "markers",
    lat: top.map(p => p.lat),
    lon: top.map(p => p.lon),
    text: top.map(p => p.name),
    customdata: top.map(p => p.count),
    hovertemplate: "<b>%{text}</b><br>Recruits: %{customdata}<extra></extra>",
    marker: {
      size: top.map(p => 5 + 35 * Math.sqrt(p.count / max)),
      color: isCollege ? "#d99447" : "#168b92",
      opacity: 0.68,
      line: { color: "#ffffff", width: 0.65 }
    }
  }];
}

export default function DashboardMap({ view, rows, geocodes, selectedCollege, densityType }) {
  const result = useMemo(() => {
    if (view === "connections") {
      const pathways = aggregatePaths(rows, geocodes);
      const maxVisible = selectedCollege === "all" ? 180 : 360;
      const visible = pathways.slice(0, maxVisible);
      return {
        traces: connectionTraces(visible),
        shown: visible.length,
        total: pathways.length,
        label: "Recruiting pathways",
        note: pathways.length > maxVisible
          ? "Showing the " + maxVisible + " highest-volume pathways for map readability. All matching records count toward the statistics."
          : "Lines connect documented high-school locations to geocoded college locations."
      };
    }
    const places = densityType === "colleges"
      ? aggregateColleges(rows, geocodes)
      : aggregateCities(rows);
    return {
      traces: densityTrace(places, densityType === "colleges"),
      shown: Math.min(places.length, 800),
      total: places.length,
      label: densityType === "colleges" ? "College destinations" : "Recruit hometowns",
      note: places.length > 800
        ? "Showing the 800 highest-volume locations for performance. Counts include all matching records."
        : "Circle area scales with recruit volume. Hover over a marker for its count."
    };
  }, [view, rows, geocodes, selectedCollege, densityType]);

  return (
    <div className="map-shell">
      <div className="map-heading">
        <div>
          <span className="eyebrow">GEOGRAPHIC EXPLORER</span>
          <h2>{result.label}</h2>
        </div>
        <div className="map-count">{result.shown.toLocaleString()} / {result.total.toLocaleString()} {view === "connections" ? "pathways" : "locations"}</div>
      </div>
      <div className="map-plot" role="img" aria-label={result.label + " interactive geographic map"}>
        <Plot
          data={result.traces}
          layout={MAP_LAYOUT}
          config={MAP_CONFIG}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="map-footnote">
        <span className="map-legend"><i className="legend-dot teal" />Origins <i className="legend-dot amber" />Destinations</span>
        <span>{result.note}</span>
      </div>
    </div>
  );
}
