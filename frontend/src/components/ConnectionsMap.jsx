import React, { useState, useEffect, useMemo } from 'react';
import Plot from 'react-plotly.js';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { loadRecruitingData, filterData, aggregatePathways, getUniqueColleges, getYearRange } from '../utils/dataLoader';
import CollegeFilter from './CollegeFilter';
import YearRangeDropdown from './YearRangeDropdown';

const ConnectionsMap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedYears, setSelectedYears] = useState([2023, 2025]);
  const [colleges, setColleges] = useState([]);
  const [yearRange, setYearRange] = useState({ min: 2023, max: 2025 });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Loading recruiting data...');
        const recruitingData = await loadRecruitingData();
        console.log('Data loaded:', recruitingData.length, 'records');
        setData(recruitingData);
        
        const uniqueColleges = getUniqueColleges(recruitingData);
        console.log('Unique colleges:', uniqueColleges.length);
        setColleges(uniqueColleges);
        
        const years = getYearRange(recruitingData);
        console.log('Year range:', years);
        setYearRange(years);
        // Set to most recent 2 years
        const currentYear = new Date().getFullYear();
        const startYear = Math.max(years.min, currentYear - 1);
        const endYear = Math.min(years.max, currentYear);
        setSelectedYears([startYear, endYear]);
      } catch (err) {
        setError('Failed to load recruiting data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const processedData = useMemo(() => {
    if (!data) return { pathways: [] };

    console.log('Processing data:', {
      totalData: data.length,
      selectedYears,
      selectedCollege
    });

    const filtered = filterData(data, selectedYears[0], selectedYears[1], selectedCollege);
    console.log('Filtered data:', filtered.length);
    
    const pathways = aggregatePathways(filtered);
    console.log('Pathways:', pathways.length);
    
    // Create college coordinates (simplified grid-based approach)
    const collegeCoords = {};
    const uniqueColleges = [...new Set(pathways.map(p => p.college))];
    
    uniqueColleges.forEach((college, index) => {
      const lat = 25 + (index % 10) * 2.5; // 25 to 47.5 latitude
      const lon = -125 + (Math.floor(index / 10) % 20) * 3; // -125 to -66 longitude
      collegeCoords[college] = { lat, lon };
    });

    // Transform pathways to match notebook structure exactly
    const transformedPathways = pathways.map(pathway => ({
      hs_name: pathway.school,
      hs_lat: pathway.lat,
      hs_lon: pathway.lon,
      hs_city: pathway.city,
      hs_state: pathway.state,
      college_name: pathway.college,
      college_lat: collegeCoords[pathway.college]?.lat || 39.8283,
      college_lon: collegeCoords[pathway.college]?.lon || -98.5795,
      recruit_count: pathway.count,
      city_total_recruits: pathway.count, // Simplified
      college_total_recruits: pathway.count // Simplified
    }));

    return {
      pathways: transformedPathways.slice(0, 3000) // Limit for performance
    };
  }, [data, selectedYears, selectedCollege]);

  const plotData = useMemo(() => {
    if (!processedData.pathways.length) return [];

    const traces = [];

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
    title: {
      text: 'Football Recruiting Connections',
      font: { size: 20 }
    },
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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, m: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          Connections Map
        </Typography>
        <CollegeFilter
          colleges={colleges}
          selectedCollege={selectedCollege}
          onCollegeChange={setSelectedCollege}
          disabled={loading}
        />
        <YearRangeDropdown
          yearRange={yearRange}
          selectedYears={selectedYears}
          onYearChange={setSelectedYears}
          disabled={loading}
        />
        <Typography variant="body2" color="text.secondary">
          Showing {processedData.pathways.length} pathways
        </Typography>
      </Paper>

      <Box sx={{ flex: 1, m: 2, mb: 2 }}>
        <Plot
          data={plotData}
          layout={layout}
          style={{ width: '100%', height: '100%' }}
          config={{ responsive: true }}
        />
      </Box>
    </Box>
  );
};

export default ConnectionsMap;