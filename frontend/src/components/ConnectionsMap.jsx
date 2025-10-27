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

const ConnectionsMap = () => {
  const [allData, setAllData] = useState(null);
  const [geocodeData, setGeocodeData] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('Alabama');
  const [yearRange, setYearRange] = useState([2020, 2025]);
  const [showAllColleges, setShowAllColleges] = useState(false);
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
    if (!allData || !geocodeData) return { pathways: [] };
    
    // Filter for selected college data with year range
    const collegeData = allData.filter(row => 
      row.committedTo && 
      (showAllColleges || row.committedTo === selectedCollege) &&
      parseInt(row.class_year) >= yearRange[0] &&
      parseInt(row.class_year) <= yearRange[1] &&
      row.latitude && 
      row.longitude &&
      row.country === 'USA'
    );
    
    // Process pathways
    const pathwayCounts = new Map();
    
    collegeData.forEach(row => {
      const key = `${row.school}|${row.committedTo}`;
      if (pathwayCounts.has(key)) {
        pathwayCounts.get(key).count += 1;
      } else {
        pathwayCounts.set(key, {
          school: row.school,
          committedTo: row.committedTo,
          city: row.city,
          stateProvince: row.stateProvince,
          count: 1,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        });
      }
    });
    
    // Transform to visualization format
    const pathways = Array.from(pathwayCounts.values()).map(pathway => {
      const collegeCoord = geocodeData[pathway.committedTo];
      
      return {
        hs_name: pathway.school,
        hs_lat: pathway.latitude,
        hs_lon: pathway.longitude,
        hs_city: pathway.city,
        hs_state: pathway.stateProvince,
        college_name: pathway.committedTo,
        college_lat: collegeCoord ? collegeCoord.latitude : 39.8283,
        college_lon: collegeCoord ? collegeCoord.longitude : -98.5795,
        recruit_count: pathway.count,
        city_total_recruits: pathway.count,
        college_total_recruits: pathway.count
      };
    });
    
    return { pathways };
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

  // Calculate top 10 schools analysis
  const topSchools = useMemo(() => {
    if (!processedData.pathways.length) return [];
    
    const schoolCounts = new Map();
    processedData.pathways.forEach(pathway => {
      const key = `${pathway.hs_name}, ${pathway.hs_state}`;
      schoolCounts.set(key, (schoolCounts.get(key) || 0) + pathway.recruit_count);
    });
    
    return Array.from(schoolCounts.entries())
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [processedData.pathways]);

  const plotData = useMemo(() => {
    const traces = [];
    
    // Always add a dummy trace to ensure the map shows up
    if (!processedData.pathways.length) {
      traces.push({
        type: 'scattergeo',
        mode: 'markers',
        lat: [39.8283], // Center of US
        lon: [-98.5795],
        marker: {
          size: 1,
          color: 'transparent',
          opacity: 0
        },
        showlegend: false,
        hoverinfo: 'skip'
      });
      return traces;
    }


    // Add high school markers (blue) - match notebook exactly
    const hs_trace = {
      type: 'scattergeo',
      mode: 'markers',
      lat: processedData.pathways.map(p => p.hs_lat),
      lon: processedData.pathways.map(p => p.hs_lon),
      marker: {
        size: 8,
        color: 'blue',
        opacity: 0.7,
        symbol: 'circle'
      },
      name: 'High Schools',
      hovertemplate: '<b>%{text}</b><br>High School<br>City Total Recruits: %{customdata}<extra></extra>',
      text: processedData.pathways.map(p => `${p.hs_name}<br>${p.hs_city}, ${p.hs_state}`),
      customdata: processedData.pathways.map(p => p.city_total_recruits)
    };
    traces.push(hs_trace);

    // Add college markers (green) - match notebook exactly
    const college_trace = {
      type: 'scattergeo',
      mode: 'markers',
      lat: processedData.pathways.map(p => p.college_lat),
      lon: processedData.pathways.map(p => p.college_lon),
      marker: {
        size: 10,
        color: 'green',
        opacity: 0.8,
        symbol: 'diamond'
      },
      name: 'Colleges',
      hovertemplate: '<b>%{text}</b><br>College<br>Total Recruits Received: %{customdata}<extra></extra>',
      text: processedData.pathways.map(p => p.college_name),
      customdata: processedData.pathways.map(p => p.college_total_recruits)
    };
    traces.push(college_trace);

    // Add connecting lines (red, thickness based on recruit count) - match notebook exactly
    processedData.pathways.forEach(pathway => {
      const line_width = Math.max(1, Math.min(8, pathway.recruit_count));
      const line_opacity = Math.max(0.3, Math.min(0.9, 0.3 + (pathway.recruit_count / Math.max(...processedData.pathways.map(p => p.recruit_count))) * 0.6));
      
      traces.push({
        type: 'scattergeo',
        mode: 'lines',
        lat: [pathway.hs_lat, pathway.college_lat],
        lon: [pathway.hs_lon, pathway.college_lon],
        line: {
          color: `rgba(255, 0, 0, ${line_opacity})`,
          width: line_width
        },
        showlegend: false,
        hoverinfo: 'skip'
      });
    });

    return traces;
  }, [processedData]);

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
    width: 1200,
    height: 800,
    showlegend: true,
    legend: {
      x: 0.02,
      y: 0.98,
      bgcolor: 'rgba(255,255,255,0.8)'
    },
    margin: { l: 50, r: 50, t: 50, b: 50 }
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
          {showAllColleges ? 'All Colleges' : selectedCollege} Football Recruiting Connections
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Showing {processedData.pathways.length} pathways
        </Typography>
        {processedData.pathways.length === 0 && !loading && (
          <Typography variant="body2" sx={{ color: '#ffcdd2' }}>
            No pathways found. Check console for debugging info.
          </Typography>
        )}
      </Paper>

      {/* College Selection and Year Range */}
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

      {/* Top Schools Panel - Underneath */}
      <Box sx={{ 
        backgroundColor: '#f5f5f5',
        borderRadius: 2,
        p: 2,
        m: 2,
        mt: 0
      }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32', textAlign: 'center' }}>
          Top 10 Schools by Recruits {showAllColleges ? 'Overall' : `to ${selectedCollege}`}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: '600px', mx: 'auto' }}>
          {topSchools.length > 0 ? (
            topSchools.map((school, index) => (
              <Box 
                key={school.school}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 1.5,
                  px: 2,
                  backgroundColor: index < 3 ? '#e8f5e8' : 'white',
                  borderRadius: 1,
                  border: index < 3 ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  width: '100%'
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                    {index + 1}. {school.school}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: index < 3 ? '#2e7d32' : '#666'
                  }}
                >
                  {school.count} recruit{school.count !== 1 ? 's' : ''}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No data available
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ConnectionsMap;