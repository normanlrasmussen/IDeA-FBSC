#!/usr/bin/env python3
"""Validate the committed recruiting snapshot without third-party dependencies."""

import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "frontend/public/data/recruiting_data.csv"
GEOCODE_PATH = ROOT / "frontend/public/data/geocode_cache.json"
REQUIRED = {"class_year", "committedTo", "school", "city", "stateProvince", "country", "latitude", "longitude"}


def valid_coordinate(lat_text, lon_text):
    try:
        lat, lon = float(lat_text), float(lon_text)
    except (ValueError, TypeError):
        return False
    return (
        math.isfinite(lat)
        and math.isfinite(lon)
        and -90 <= lat <= 90
        and -180 <= lon <= 180
        and (lat, lon) != (0, 0)
    )


def main():
    with CSV_PATH.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        missing = REQUIRED.difference(reader.fieldnames or [])
        if missing:
            raise SystemExit("Missing required CSV columns: " + ", ".join(sorted(missing)))
        total = 0
        valid_years = 0
        valid_origins = 0
        colleges = set()
        for row in reader:
            total += 1
            try:
                year = int(row["class_year"])
            except (ValueError, TypeError):
                year = 0
            if 1990 <= year <= 2040 and row["committedTo"].strip():
                valid_years += 1
                colleges.add(row["committedTo"].strip())
            if valid_coordinate(row["latitude"], row["longitude"]):
                valid_origins += 1

    with GEOCODE_PATH.open(encoding="utf-8") as handle:
        geocodes = json.load(handle)
    if not isinstance(geocodes, dict) or not geocodes:
        raise SystemExit("Expected a nonempty program coordinate dictionary.")
    valid_programs = sum(
        valid_coordinate(item.get("latitude"), item.get("longitude"))
        for item in geocodes.values()
        if isinstance(item, dict)
    )
    if not total or not valid_years or not valid_origins or not valid_programs:
        raise SystemExit("Dataset or geocode cache has no usable entries.")
    print(f"Rows: {total:,}; rows with valid class/destination: {valid_years:,}")
    print(f"Rows with usable coordinates: {valid_origins:,}; programs: {len(colleges):,}")
    print(f"Geocoded programs: {valid_programs:,}/{len(geocodes):,}")


if __name__ == "__main__":
    main()
