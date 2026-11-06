# Recruiting data dictionary

The dashboard uses historical recruiting data attributed to [CollegeFootballData](https://collegefootballdata.com). It reads a **static snapshot** in `frontend/public/data/recruiting_data.csv`, not a live API. Dates and rankings should not be interpreted as current.

## Fields consumed by the dashboard

| CSV field | Meaning and use |
| --- | --- |
| `class_year` | Recruiting class year. Used for inclusive year filters. |
| `committedTo` | Destination college/program label. Used for program filters and aggregation. |
| `school` | High-school name. Missing names are retained in overall totals but excluded from high-school rankings and path visualizations. |
| `city` | Recruit home city. Used for city-level aggregation and labels. |
| `stateProvince` | Home state/province abbreviation. Only recognized US state codes contribute to the comparison state rankings. |
| `country` | Origin country code; `USA` and `US` are treated as US origins for plotting. |
| `latitude`, `longitude` | High-school/home-location coordinates. A valid pair must be finite, within latitude/longitude ranges, and not `(0,0)`. Invalid coordinates are **not replaced** with a US center point. |
| `stars` | Available star rating (1–5). Only positive values through 5 are averaged; missing or zero values are excluded from the average. |
| `rating` | Numeric recruiting rating, retained in normalized records but not yet displayed. |

Other source fields may be present but are not consumed in the dashboard.

## College geocodes

`frontend/public/data/geocode_cache.json` maps program names to an object containing `latitude` and `longitude`. A connection or college destination is mapped **only** when the cache has valid coordinates. A cache point may be imprecise or wrong for a particular campus; it is a visual lookup, not a verified institutional address directory. Where correctness matters, review the named university's actual campus location.

## Counting conventions and limitations

- The **Total recruits** card counts normalized CSV rows with a destination college and a plausible class year. It counts dataset records, not verified unique people.
- **Source schools** counts distinct combinations of school, city, and state.
- **US-mapped origins** counts selected records with a valid US-origin coordinate.
- Map views use US geographic scope, so international and unlocated records can appear in overall statistics without being plotted.
- To keep maps usable, the connections view shows only the top 180 pathways when all colleges are selected (up to 360 for one college); density plots show at most 800 locations. These limits **do not** affect the summary cards.
- The comparison view ignores the global recruiting-program filter and uses its two separate selectors, but respects the shared class-year range.
- A path aggregates source school, home city/state, destination program, and origin coordinate. It is not an individual player's trajectory.
- Location and recruiting coverage are constrained by the quality and completeness of the source snapshot. This is an exploratory visualization, not a predictive recruiting model.

## Validation

Run `python3 scripts/validate_data.py` from the repository root to check required fields, parseability, dataset coverage, and geocode-cache structure. The GitHub Pages workflow runs this validation and the JavaScript unit tests before building on pushes to `main`.
