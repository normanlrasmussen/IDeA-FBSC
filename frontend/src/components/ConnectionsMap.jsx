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
        const csvResponse = await fetch(`/IDeA-FBSC/data/recruiting_data.csv`);
        const csvText = await csvResponse.text();
        
        // Load geocode data
        const geocodeResponse = await fetch(`/IDeA-FBSC/data/geocode_cache.json`);
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

  // Helper function to categorize connections by region
  const categorizeConnection = (row) => {
    // Handle Alaska and Hawaii even if country is missing
    if (row.stateProvince === 'AK') return 'alaska';
    if (row.stateProvince === 'HI') return 'hawaii';
    
    if (row.country === 'USA') {
      return 'continental';
    }
    if (row.country === 'CAN') return 'canada';
    return 'international';
  };

  // Process data based on selected college
  const processedData = useMemo(() => {
    if (!allData || !geocodeData) return { pathways: [], edgePoints: [] };
    
    // Filter for selected college data with year range (remove country filter)
    const collegeData = allData.filter(row => 
      row.committedTo && 
      (showAllColleges || row.committedTo === selectedCollege) &&
      parseInt(row.class_year) >= yearRange[0] &&
      parseInt(row.class_year) <= yearRange[1] &&
      (row.latitude && row.longitude) || // Continental US needs coordinates
      (row.stateProvince === 'AK' || row.stateProvince === 'HI') || // Alaska/Hawaii don't need coordinates
      (row.country && row.country !== 'USA') // International don't need coordinates
    );
    
    // Process pathways - separate continental and non-continental
    const pathwayCounts = new Map();
    const edgePointData = new Map(); // For aggregating non-continental connections
    
    collegeData.forEach(row => {
      const region = categorizeConnection(row);
      const key = `${row.school}|${row.committedTo}`;
      
      if (region === 'continental') {
        // Handle continental US connections normally
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
            longitude: parseFloat(row.longitude),
            region: region
          });
        }
      } else {
        // Handle non-continental connections for edge points
        // Only include if it matches the selected college filter
        if (showAllColleges || row.committedTo === selectedCollege) {
          const edgeKey = `${region}|${row.committedTo}`;
          if (!edgePointData.has(edgeKey)) {
            edgePointData.set(edgeKey, {
              region: region,
              committedTo: row.committedTo,
              recruits: [],
              totalCount: 0
            });
          }
          edgePointData.get(edgeKey).recruits.push({
            school: row.school,
            city: row.city,
            stateProvince: row.stateProvince,
            country: row.country
          });
          edgePointData.get(edgeKey).totalCount += 1;
        }
      }
    });
    
    // Transform continental pathways to visualization format
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
        college_total_recruits: pathway.count,
        region: pathway.region
      };
    });
    
    // Define edge point coordinates
    const edgePointCoords = {
      alaska: { lat: 48.0, lon: -124.0 },
      hawaii: { lat: 25.0, lon: -124.0 },
      canada: { lat: 49.0, lon: -98.0 },
      international: { lat: 30.0, lon: -66.0 }
    };
    
    // Create edge points
    const edgePoints = Array.from(edgePointData.values()).map(edgeData => {
      const collegeCoord = geocodeData[edgeData.committedTo];
      const coords = edgePointCoords[edgeData.region] || edgePointCoords.international;
      
      return {
        region: edgeData.region,
        college_name: edgeData.committedTo,
        college_lat: collegeCoord ? collegeCoord.latitude : 39.8283,
        college_lon: collegeCoord ? collegeCoord.longitude : -98.5795,
        edge_lat: coords.lat,
        edge_lon: coords.lon,
        total_count: edgeData.totalCount,
        recruits: edgeData.recruits
      };
    });
    
    return { pathways, edgePoints };
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
    if (!processedData.pathways.length && !processedData.edgePoints.length) {
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

    // Add edge points for non-continental connections
    if (processedData.edgePoints.length > 0) {
      const edgePointTrace = {
        type: 'scattergeo',
        mode: 'markers',
        lat: processedData.edgePoints.map(ep => ep.edge_lat),
        lon: processedData.edgePoints.map(ep => ep.edge_lon),
        marker: {
          size: 15,
          color: 'orange',
          opacity: 0.8,
          symbol: 'triangle-up'
        },
        name: 'International/Non-Continental',
        hovertemplate: '<b>%{text}</b><br>%{customdata[0]}<br>Total Recruits: %{customdata[1]}<extra></extra>',
        text: processedData.edgePoints.map(ep => {
          const regionNames = {
            alaska: 'Alaska',
            hawaii: 'Hawaii', 
            canada: 'Canada',
            international: 'International'
          };
          return regionNames[ep.region] || 'Other';
        }),
        customdata: processedData.edgePoints.map(ep => {
          // Count recruits per school
          const schoolCounts = new Map();
          ep.recruits.forEach(recruit => {
            const schoolKey = `${recruit.school}, ${recruit.city}${recruit.stateProvince ? ', ' + recruit.stateProvince : ''}${recruit.country ? ', ' + recruit.country : ''}`;
            schoolCounts.set(schoolKey, (schoolCounts.get(schoolKey) || 0) + 1);
          });
          
          // Format school list with counts
          const schoolList = Array.from(schoolCounts.entries())
            .map(([school, count]) => `${school} (${count} recruit${count !== 1 ? 's' : ''})`)
            .join('<br>');
          
          return [schoolList, ep.total_count];
        })
      };
      traces.push(edgePointTrace);

      // Add lines from edge points to colleges
      processedData.edgePoints.forEach(edgePoint => {
        const line_width = Math.max(2, Math.min(10, edgePoint.total_count));
        const line_opacity = Math.max(0.4, Math.min(0.9, 0.4 + (edgePoint.total_count / Math.max(...processedData.edgePoints.map(ep => ep.total_count))) * 0.5));
        
        traces.push({
          type: 'scattergeo',
          mode: 'lines',
          lat: [edgePoint.edge_lat, edgePoint.college_lat],
          lon: [edgePoint.edge_lon, edgePoint.college_lon],
          line: {
            color: `rgba(255, 165, 0, ${line_opacity})`, // Orange for international connections
            width: line_width,
            dash: 'dash' // Dashed lines for international connections
          },
          showlegend: false,
          hoverinfo: 'skip'
        });
      });
    }

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
          Showing {processedData.pathways.length} pathways{processedData.edgePoints.length > 0 ? ` + ${processedData.edgePoints.length} international/regional groups` : ''}
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