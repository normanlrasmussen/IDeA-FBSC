import React from 'react';
import {
  Box,
  Typography,
  Slider,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';

const YearRangeSlider = ({ 
  yearRange, 
  selectedYears, 
  onYearChange, 
  disabled = false 
}) => {
  const handleChange = (event, newValue) => {
    onYearChange(newValue);
  };

  // Ensure we have valid year range and selected years
  const safeYearRange = yearRange && typeof yearRange.min === 'number' && typeof yearRange.max === 'number' 
    ? yearRange 
    : { min: 2023, max: 2025 };
  
  const safeSelectedYears = selectedYears && Array.isArray(selectedYears) && selectedYears.length === 2
    ? selectedYears
    : [2023, 2025];

  return (
    <Box sx={{ width: 300 }}>
      <Typography gutterBottom>
        Year Range: {safeSelectedYears[0]} - {safeSelectedYears[1]}
      </Typography>
      <Slider
        value={safeSelectedYears}
        onChange={handleChange}
        valueLabelDisplay="auto"
        min={safeYearRange.min}
        max={safeYearRange.max}
        step={1}
        disabled={disabled}
        marks={[
          { value: safeYearRange.min, label: safeYearRange.min.toString() },
          { value: safeYearRange.max, label: safeYearRange.max.toString() }
        ]}
      />
    </Box>
  );
};

export default YearRangeSlider;
