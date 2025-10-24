import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import Papa from 'papaparse';

const CirclesMap = () => {
  const [allData, setAllData] = useState(null);
  const [geocodeData, setGeocodeData] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('Alabama');
  const [yearRange, setYearRange] = useState([2020, 2025]);
  const [showAllColleges, setShowAllColleges] = useState(false);
  const [mapType, setMapType] = useState('cities'); // 'cities' or 'colleges'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load CSV data
        const csvResponse = await fetch('/data/recruiting_data.csv');
        const csvText = await csvResponse.text();
        
        // Load geocode data
        const geocodeResponse = await fetch('/data/geocode_cache.json');
        const geocodeData = await geocodeResponse.json();
        
        // Parse CSV
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            // Store all data and geocode data
            setAllData(results.data);
            setGeocodeData(geocodeData);
            setLoading(false);
          },
          error: (error) => {
            console.error('CSV parse error:', error);
            setError('Failed to parse CSV data');
            setLoading(false);
          }
        });
        
      } catch (err) {
        setError('Failed to load recruiting data');
        console.error('Error loading data:', err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Process data based on selected college
  const processedData = useMemo(() => {
    if (!allData || !geocodeData) return { cities: [], colleges: [] };
    
    // Filter for selected college data with year range
    const collegeData = allData.filter(row => 
      row.committedTo && 
      (showAllColleges || row.committedTo.toLowerCase().includes(selectedCollege.toLowerCase())) &&
      parseInt(row.class_year) >= yearRange[0] &&
      parseInt(row.class_year) <= yearRange[1] &&
      row.latitude && 
      row.longitude &&
      row.country === 'USA'
    );
    
    // Process cities data
    const cityCounts = new Map();
    collegeData.forEach(row => {
      const cityKey = `${row.city}|${row.stateProvince}`;
      if (cityCounts.has(cityKey)) {
        cityCounts.get(cityKey).count += 1;
      } else {
        cityCounts.set(cityKey, {
          city: row.city,
          state: row.stateProvince,
          lat: parseFloat(row.latitude),
          lon: parseFloat(row.longitude),
          count: 1
        });
      }
    });
    
    // Process colleges data
    const collegeCounts = new Map();
    collegeData.forEach(row => {
      if (collegeCounts.has(row.committedTo)) {
        collegeCounts.get(row.committedTo).count += 1;
      } else {
        const collegeCoord = geocodeData[row.committedTo];
        if (collegeCoord) {
          collegeCounts.set(row.committedTo, {
            college: row.committedTo,
            lat: collegeCoord.latitude,
            lon: collegeCoord.longitude,
            count: 1
          });
        }
      }
    });
    
    return {
      cities: Array.from(cityCounts.values()),
      colleges: Array.from(collegeCounts.values())
    };
  }, [allData, geocodeData, selectedCollege, yearRange, showAllColleges]);

  // Get available colleges for dropdown
  const availableColleges = useMemo(() => {
    if (!allData || !geocodeData) return [];
    
    const collegeSet = new Set();
    allData.forEach(row => {
      if (row.committedTo && geocodeData[row.committedTo] && parseInt(row.class_year) >= 2020) {
        collegeSet.add(row.committedTo);
      }
    });
    
    return Array.from(collegeSet).sort();
  }, [allData, geocodeData]);

  // Get year range from data
  const dataYearRange = useMemo(() => {
    if (!allData) return { min: 2020, max: 2025 };
    
    const years = allData
      .map(row => parseInt(row.class_year))
      .filter(year => year > 0 && year < 2030);
    
    if (years.length === 0) return { min: 2020, max: 2025 };
    
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  }, [allData]);

  const plotData = useMemo(() => {
    const traces = [];
    
    if (mapType === 'cities') {
      const cities = processedData.cities;
      if (cities.length > 0) {
        const maxCount = Math.max(...cities.map(c => c.count));
        
        traces.push({
          type: 'scattergeo',
          mode: 'markers',
          lat: cities.map(c => c.lat),
          lon: cities.map(c => c.lon),
          marker: {
            size: cities.map(c => Math.max(5, Math.min(50, 5 + (c.count / maxCount) * 45))),
            color: 'blue',
            opacity: 0.6,
            symbol: 'circle',
            line: {
              width: 1,
              color: 'darkblue'
            }
          },
          name: 'Cities by Recruit Count',
          hovertemplate: '<b>%{text}</b><br>Total Recruits: %{customdata}<br>%{lat:.3f}, %{lon:.3f}<extra></extra>',
          text: cities.map(c => `${c.city}, ${c.state}`),
          customdata: cities.map(c => c.count)
        });
      }
    } else {
      const colleges = processedData.colleges;
      if (colleges.length > 0) {
        const maxCount = Math.max(...colleges.map(c => c.count));
        
        traces.push({
          type: 'scattergeo',
          mode: 'markers',
          lat: colleges.map(c => c.lat),
          lon: colleges.map(c => c.lon),
          marker: {
            size: colleges.map(c => Math.max(8, Math.min(60, 8 + (c.count / maxCount) * 52))),
            color: 'green',
            opacity: 0.7,
            symbol: 'diamond',
            line: {
              width: 1,
              color: 'darkgreen'
            }
          },
          name: 'Colleges by Recruit Count',
          hovertemplate: '<b>%{text}</b><br>Total Recruits: %{customdata}<br>%{lat:.3f}, %{lon:.3f}<extra></extra>',
          text: colleges.map(c => c.college),
          customdata: colleges.map(c => c.count)
        });
      }
    }
    
    return traces;
  }, [processedData, mapType]);

  const layout = {
    geo: {
      projection_type: 'albers usa',
      showland: true,
      landcolor: 'lightgray',
      showocean: true,
      oceancolor: 'lightblue',
      showlakes: true,
      lakecolor: 'lightblue',
      showrivers: true,
      rivercolor: 'lightblue',
      scope: 'usa',
      center: { lat: 39.8283, lon: -98.5795 },
      lonaxis_range: [-125, -66],
      lataxis_range: [24, 50]
    },
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(255,255,255,0.8)'
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading recruiting data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Green Header */}
      <Paper sx={{ 
        p: 2, 
        m: 2, 
        backgroundColor: '#4caf50',
        color: 'white'
      }}>
        <Typography variant="h6" sx={{ mr: 2, color: 'white' }}>
          {showAllColleges ? 'All Colleges' : selectedCollege} Recruiting Circles
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Showing {mapType === 'cities' ? processedData.cities.length : processedData.colleges.length} locations
        </Typography>
      </Paper>

      {/* Controls */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        p: 2,
        gap: 4
      }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="college-select-label">Select College</InputLabel>
          <Select
            labelId="college-select-label"
            value={selectedCollege}
            label="Select College"
            onChange={(e) => setSelectedCollege(e.target.value)}
            disabled={showAllColleges}
          >
            {availableColleges.map((college) => (
              <MenuItem key={college} value={college}>
                {college}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ minWidth: 300 }}>
          <Typography variant="body2" sx={{ mb: 1, textAlign: 'center' }}>
            {showAllColleges ? `Year: ${yearRange[0]}` : `Year Range: ${yearRange[0]} - ${yearRange[1]}`}
          </Typography>
          <Slider
            value={showAllColleges ? yearRange[0] : yearRange}
            onChange={(e, newValue) => {
              if (showAllColleges) {
                setYearRange([newValue, newValue]);
              } else {
                setYearRange(newValue);
              }
            }}
            valueLabelDisplay="auto"
            min={dataYearRange.min}
            max={dataYearRange.max}
            step={1}
            marks={[
              { value: dataYearRange.min, label: dataYearRange.min.toString() },
              { value: dataYearRange.max, label: dataYearRange.max.toString() }
            ]}
          />
        </Box>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="map-type-label">Map Type</InputLabel>
          <Select
            labelId="map-type-label"
            value={mapType}
            label="Map Type"
            onChange={(e) => setMapType(e.target.value)}
          >
            <MenuItem value="cities">Cities</MenuItem>
            <MenuItem value="colleges">Colleges</MenuItem>
          </Select>
        </FormControl>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={showAllColleges}
              onChange={(e) => setShowAllColleges(e.target.checked)}
              color="primary"
            />
          }
          label="Show All Colleges"
        />
      </Box>

      {/* Centered Map */}
      <Box sx={{ 
        height: '60vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        m: 2,
        p: 2
      }}>
        <Box sx={{ 
          maxWidth: '1200px',
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <Plot
            data={plotData}
            layout={layout}
            style={{ width: '100%', height: '100%', margin: 0, padding: 0 }}
            config={{ responsive: true }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CirclesMap;
