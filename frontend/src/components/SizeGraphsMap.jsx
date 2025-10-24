import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as d3 from 'd3';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { 
  loadRecruitingData, 
  filterData, 
  aggregateCities, 
  aggregateColleges, 
  getUniqueColleges, 
  getYearRange 
} from '../utils/dataLoader';
import { calculateCircleSize, getDataBounds } from '../utils/mapUtils';
import CollegeFilter from './CollegeFilter';
import YearRangeDropdown from './YearRangeDropdown';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const D3Overlay = ({ data, viewMode, mapRef }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data.length || !mapRef.current) return;

    const map = mapRef.current;
    const svg = d3.select(svgRef.current);
    
    // Clear previous content
    svg.selectAll("*").remove();

    // Create group for circles
    const circlesGroup = svg.append("g").attr("class", "circles");

    // Get max count for scaling
    const maxCount = Math.max(...data.map(d => d.count));

    // Draw circles based on view mode
    data.forEach(item => {
      const point = map.latLngToContainerPoint([item.lat, item.lon]);
      const circleSize = calculateCircleSize(item.count, maxCount);
      
      let color, label;
      if (viewMode === 'allColleges') {
        color = 'green';
        label = item.college;
      } else {
        color = 'blue';
        label = viewMode === 'allCities' ? `${item.city}, ${item.state}` : `${item.city}, ${item.state}`;
      }

      circlesGroup
        .append("circle")
        .attr("cx", point.x)
        .attr("cy", point.y)
        .attr("r", circleSize)
        .attr("fill", color)
        .attr("opacity", 0.6)
        .attr("stroke", color === 'green' ? 'darkgreen' : 'darkblue')
        .attr("stroke-width", 1)
        .attr("class", "data-circle")
        .append("title")
        .text(`${label}\nRecruits: ${item.count}`);
    });

  }, [data, viewMode, mapRef]);

  return <div ref={svgRef} className="d3-overlay" />;
};

const MapComponent = ({ data, viewMode }) => {
  const mapRef = useRef();
  const bounds = useMemo(() => {
    if (!data.length) return null;
    return getDataBounds(data);
  }, [data]);

  useEffect(() => {
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds]);

  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
      maxBounds={[[24, -125], [50, -66]]} // Limit to continental US
      maxBoundsViscosity={1.0} // Prevent scrolling outside bounds
      minZoom={3}
      maxZoom={10}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        maxZoom={10}
      />
      <D3Overlay data={data} viewMode={viewMode} mapRef={mapRef} />
    </MapContainer>
  );
};

const SizeGraphsMap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedYears, setSelectedYears] = useState([2023, 2025]);
  const [viewMode, setViewMode] = useState('allCities');
  const [colleges, setColleges] = useState([]);
  const [yearRange, setYearRange] = useState({ min: 2023, max: 2025 });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const recruitingData = await loadRecruitingData();
        setData(recruitingData);
        
        const uniqueColleges = getUniqueColleges(recruitingData);
        setColleges(uniqueColleges);
        
        const years = getYearRange(recruitingData);
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

  // Process and filter data based on view mode
  const processedData = useMemo(() => {
    if (!data) return [];

    const filtered = filterData(data, selectedYears[0], selectedYears[1], selectedCollege);
    
    switch (viewMode) {
      case 'allCities':
        return aggregateCities(filtered);
      case 'citiesToCollege':
        if (selectedCollege === 'all') return [];
        return aggregateCities(filtered);
      case 'allColleges':
        const collegeData = aggregateColleges(filtered);
        // Add placeholder coordinates for colleges (in real app, use actual college coordinates)
        return collegeData.map(college => ({
          ...college,
          lat: 39.8283 + (Math.random() - 0.5) * 10,
          lon: -98.5795 + (Math.random() - 0.5) * 20
        }));
      default:
        return [];
    }
  }, [data, selectedYears, selectedCollege, viewMode]);

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
      {/* Controls */}
      <Paper sx={{ p: 2, m: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          Size Graphs
        </Typography>
        
        {/* View Mode Selection */}
        <FormControl component="fieldset">
          <FormLabel component="legend">View Mode</FormLabel>
          <RadioGroup
            row
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <FormControlLabel value="allCities" control={<Radio />} label="All Cities" />
            <FormControlLabel value="citiesToCollege" control={<Radio />} label="Cities to College" />
            <FormControlLabel value="allColleges" control={<Radio />} label="All Colleges" />
          </RadioGroup>
        </FormControl>

        {/* College Filter - only show for citiesToCollege mode */}
        {viewMode === 'citiesToCollege' && (
          <CollegeFilter
            colleges={colleges}
            selectedCollege={selectedCollege}
            onCollegeChange={setSelectedCollege}
          />
        )}

        <YearRangeDropdown
          yearRange={yearRange}
          selectedYears={selectedYears}
          onYearChange={setSelectedYears}
          disabled={loading}
        />

        <Typography variant="body2" color="text.secondary">
          Showing {processedData.length} {viewMode === 'allColleges' ? 'colleges' : 'cities'}
        </Typography>
      </Paper>

      {/* Map */}
      <Box sx={{ flex: 1, m: 2, mb: 2 }}>
        <MapComponent data={processedData} viewMode={viewMode} />
      </Box>
    </Box>
  );
};

export default SizeGraphsMap;
