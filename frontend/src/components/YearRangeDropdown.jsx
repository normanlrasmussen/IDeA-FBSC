import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';

const YearRangeDropdown = ({ 
  yearRange, 
  selectedYears, 
  onYearChange, 
  disabled = false 
}) => {
  // Ensure we have valid year range
  const safeYearRange = yearRange && typeof yearRange.min === 'number' && typeof yearRange.max === 'number' 
    ? yearRange 
    : { min: 2023, max: 2025 };
  
  const safeSelectedYears = selectedYears && Array.isArray(selectedYears) && selectedYears.length === 2
    ? selectedYears
    : [2023, 2025];

  // Generate year options (last 10 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear; year >= Math.max(safeYearRange.min, currentYear - 10); year--) {
    yearOptions.push(year);
  }

  const handleStartYearChange = (event) => {
    const newStartYear = parseInt(event.target.value);
    onYearChange([newStartYear, safeSelectedYears[1]]);
  };

  const handleEndYearChange = (event) => {
    const newEndYear = parseInt(event.target.value);
    onYearChange([safeSelectedYears[0], newEndYear]);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <FormControl sx={{ minWidth: 120 }} disabled={disabled}>
        <InputLabel id="start-year-label">Start Year</InputLabel>
        <Select
          labelId="start-year-label"
          id="start-year-select"
          value={safeSelectedYears[0]}
          label="Start Year"
          onChange={handleStartYearChange}
        >
          {yearOptions.map(year => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl sx={{ minWidth: 120 }} disabled={disabled}>
        <InputLabel id="end-year-label">End Year</InputLabel>
        <Select
          labelId="end-year-label"
          id="end-year-select"
          value={safeSelectedYears[1]}
          label="End Year"
          onChange={handleEndYearChange}
        >
          {yearOptions.map(year => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default YearRangeDropdown;
