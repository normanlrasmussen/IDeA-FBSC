import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();

  return (
    <AppBar position="static" sx={{ backgroundColor: '#4caf50' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Football Recruiting Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            to="/"
            sx={{
              backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Connections Map
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/circles"
            sx={{
              backgroundColor: location.pathname === '/circles' ? 'rgba(255,255,255,0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Circles Map
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
