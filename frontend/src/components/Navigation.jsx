import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box
} from '@mui/material';
import { SportsFootball } from '@mui/icons-material';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static">
      <Toolbar>
        <SportsFootball sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Football Recruiting Dashboard
        </Typography>
        <Box>
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ 
              backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent',
              mr: 1
            }}
          >
            Connections Map
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/size-graphs')}
            sx={{ 
              backgroundColor: isActive('/size-graphs') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Size Graphs
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
