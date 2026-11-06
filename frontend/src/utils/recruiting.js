const STATE_CODES = new Set(
  "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ")
);

export function validCoordinates(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
    !(lat === 0 && lon === 0);
}

function numeric(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeRecord(row) {
  const year = numeric(row.class_year ?? row.classYear ?? row.classyear);
  const latitude = numeric(row.latitude);
  const longitude = numeric(row.longitude);
  const college = String(row.committedTo ?? row.committedto ?? "").trim();
  const school = String(row.school ?? "").trim();
  if (!college || !year || year < 1990 || year > 2040) return null;
  return {
    year,
    college,
    school,
    city: String(row.city ?? "").trim(),
    state: String(row.stateProvince ?? row.stateprovince ?? "").trim().toUpperCase(),
    country: String(row.country ?? "").trim().toUpperCase(),
    latitude,
    longitude,
    stars: numeric(row.stars),
    rating: numeric(row.rating),
    hasOrigin: validCoordinates(latitude, longitude)
  };
}

export function normalizeDataset(rows) {
  return rows.map(normalizeRecord).filter(Boolean);
}

export function getYearBounds(rows) {
  const years = rows.map(row => row.year).filter(Number.isFinite);
  return years.length
    ? { min: Math.min(...years), max: Math.max(...years) }
    : { min: 2020, max: 2025 };
}

export function filterRecords(rows, start, end, college = "all") {
  return rows.filter(row => row.year >= start && row.year <= end &&
    (college === "all" || row.college === college));
}

export function isUSOrigin(row) {
  return row.hasOrigin &&
    (row.country === "USA" || row.country === "US" ||
      (!row.country && STATE_CODES.has(row.state)));
}

export function getCollegeLocation(geocodes, college) {
  const point = geocodes[college];
  if (!point) return null;
  const lat = numeric(point.latitude);
  const lon = numeric(point.longitude);
  return validCoordinates(lat, lon) ? { lat, lon } : null;
}

export function aggregatePaths(rows, geocodes) {
  const paths = new Map();
  for (const row of rows) {
    if (!isUSOrigin(row) || !row.school) continue;
    const destination = getCollegeLocation(geocodes, row.college);
    if (!destination) continue;
    const key = [row.school, row.city, row.state, row.college, row.latitude, row.longitude].join("|");
    const current = paths.get(key);
    if (current) {
      current.count++;
    } else {
      paths.set(key, {
        school: row.school,
        city: row.city,
        state: row.state,
        college: row.college,
        lat: row.latitude,
        lon: row.longitude,
        collegeLat: destination.lat,
        collegeLon: destination.lon,
        count: 1
      });
    }
  }
  return [...paths.values()].sort((a, b) => b.count - a.count);
}

export function aggregateCities(rows) {
  const cities = new Map();
  for (const row of rows) {
    if (!isUSOrigin(row) || !row.city) continue;
    const key = [row.city, row.state].join("|");
    const existing = cities.get(key);
    if (existing) existing.count++;
    else cities.set(key, {
      name: row.city + (row.state ? ", " + row.state : ""),
      city: row.city,
      state: row.state,
      lat: row.latitude,
      lon: row.longitude,
      count: 1
    });
  }
  return [...cities.values()].sort((a, b) => b.count - a.count);
}

export function aggregateColleges(rows, geocodes) {
  const colleges = new Map();
  for (const row of rows) {
    const location = getCollegeLocation(geocodes, row.college);
    if (!location) continue;
    const existing = colleges.get(row.college);
    if (existing) existing.count++;
    else colleges.set(row.college, {
      name: row.college, lat: location.lat, lon: location.lon, count: 1
    });
  }
  return [...colleges.values()].sort((a, b) => b.count - a.count);
}

export function topSchools(rows, limit = 10) {
  const schools = new Map();
  for (const row of rows) {
    if (!row.school) continue;
    const key = [row.school, row.city, row.state].join("|");
    const existing = schools.get(key);
    if (existing) existing.count++;
    else schools.set(key, {
      name: row.school + (row.state ? " · " + row.state : ""),
      count: 1
    });
  }
  return [...schools.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function topStates(rows, limit = 8) {
  const totals = new Map();
  for (const row of rows) {
    if (!STATE_CODES.has(row.state)) continue;
    totals.set(row.state, (totals.get(row.state) || 0) + 1);
  }
  return [...totals].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, limit);
}

export function summarize(rows) {
  const schools = new Set();
  const colleges = new Set();
  let geocoded = 0;
  let totalStars = 0;
  let starCount = 0;
  for (const row of rows) {
    colleges.add(row.college);
    if (row.school) schools.add([row.school, row.city, row.state].join("|"));
    if (isUSOrigin(row)) geocoded++;
    if (row.stars !== null && row.stars > 0 && row.stars <= 5) {
      totalStars += row.stars;
      starCount++;
    }
  }
  return {
    recruits: rows.length,
    schools: schools.size,
    colleges: colleges.size,
    mapped: geocoded,
    averageStars: starCount ? totalStars / starCount : null
  };
}
