import { useEffect, useState } from "react";
import Papa from "papaparse";
import { getYearBounds, normalizeDataset } from "../utils/recruiting";

let cachedPromise = null;

function fetchDataset() {
  if (!cachedPromise) {
    cachedPromise = Promise.all([
      fetch(process.env.PUBLIC_URL + "/data/recruiting_data.csv"),
      fetch(process.env.PUBLIC_URL + "/data/geocode_cache.json")
    ]).then(async ([csvResponse, geocodeResponse]) => {
      if (!csvResponse.ok || !geocodeResponse.ok) {
        throw new Error("Unable to retrieve the recruiting dataset. Please reload the page.");
      }
      const [csv, geocodes] = await Promise.all([
        csvResponse.text(),
        geocodeResponse.json()
      ]);
      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: "greedy"
      });
      const records = normalizeDataset(parsed.data);
      if (!records.length) throw new Error("The recruiting dataset contains no usable records.");
      return {
        records,
        geocodes,
        bounds: getYearBounds(records),
        colleges: [...new Set(records.map(record => record.college))].sort()
      };
    }).catch(error => {
      cachedPromise = null;
      throw error;
    });
  }
  return cachedPromise;
}

export function useRecruitingData() {
  const [state, setState] = useState({ loading: true, error: null, dataset: null });
  useEffect(() => {
    let mounted = true;
    fetchDataset()
      .then(dataset => {
        if (mounted) setState({ loading: false, error: null, dataset });
      })
      .catch(error => {
        if (mounted) setState({ loading: false, error: error.message, dataset: null });
      });
    return () => { mounted = false; };
  }, []);
  return state;
}
