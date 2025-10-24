import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';

const CollegeFilter = ({ 
  colleges, 
  selectedCollege, 
  onCollegeChange, 
  disabled = false 
}) => {
  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl fullWidth disabled={disabled}>
        <InputLabel id="college-select-label">College</InputLabel>
        <Select
          labelId="college-select-label"
          id="college-select"
          value={selectedCollege}
          label="College"
          onChange={(e) => onCollegeChange(e.target.value)}
        >
          <MenuItem value="all">All Colleges</MenuItem>
          {colleges.map((college) => (
            <MenuItem key={college} value={college}>
              {college}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default CollegeFilter;
