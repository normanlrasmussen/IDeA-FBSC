import {
  aggregateCities, aggregateColleges, aggregatePaths,
  filterRecords, getCollegeLocation, normalizeDataset,
  summarize, topStates
} from "./recruiting";

const raw = [
  { class_year: "2024", committedTo: "Alabama", school: "Central", city: "Austin", stateProvince: "TX", country: "USA", latitude: "30.27", longitude: "-97.74", stars: "4" },
  { class_year: "2024", committedTo: "Alabama", school: "Central", city: "Austin", stateProvince: "TX", country: "USA", latitude: "30.27", longitude: "-97.74", stars: "5" },
  { class_year: "2025", committedTo: "Georgia", school: "East", city: "Atlanta", stateProvince: "GA", country: "USA", latitude: "33.75", longitude: "-84.39", stars: "3" },
  { class_year: "2025", committedTo: "Alabama", school: "Unknown", city: "", stateProvince: "TX", country: "USA", latitude: "", longitude: "", stars: "" }
];

const geocodes = {
  Alabama: { latitude: 33.21, longitude: -87.56 },
  Georgia: { latitude: 33.95, longitude: -83.37 }
};

test("normalizes recruiting records without inventing missing coordinates", () => {
  const data = normalizeDataset(raw);
  expect(data).toHaveLength(4);
  expect(data[3].hasOrigin).toBe(false);
  expect(data[3].latitude).toBeNull();
  expect(data[0].year).toBe(2024);
});

test("aggregates repeated school-to-college routes by count", () => {
  const paths = aggregatePaths(normalizeDataset(raw), geocodes);
  expect(paths).toHaveLength(2);
  expect(paths[0].count).toBe(2);
  expect(paths[0].school).toBe("Central");
});

test("omits unlocated colleges instead of using a fallback map marker", () => {
  const data = normalizeDataset(raw);
  expect(getCollegeLocation({}, "Alabama")).toBeNull();
  expect(aggregatePaths(data, {})).toEqual([]);
  expect(aggregateColleges(data, {})).toEqual([]);
});

test("maintains honest summary counts when some records cannot be mapped", () => {
  const data = normalizeDataset(raw);
  const summary = summarize(filterRecords(data, 2024, 2025, "Alabama"));
  expect(summary.recruits).toBe(3);
  expect(summary.mapped).toBe(2);
  expect(summary.colleges).toBe(1);
  expect(summary.averageStars).toBe(4.5);
});

test("sorts cities and states from the supplied recruiting data", () => {
  const data = normalizeDataset(raw);
  expect(aggregateCities(data)[0].count).toBe(2);
  expect(topStates(data)[0]).toEqual({ name: "TX", count: 3 });
});

test("rejects invalid or absent years", () => {
  expect(normalizeDataset([{ committedTo: "Alabama", class_year: "" }])).toEqual([]);
});
