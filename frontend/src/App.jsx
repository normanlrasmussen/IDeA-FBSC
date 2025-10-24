import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ConnectionsMap from './components/ConnectionsMap';
import CirclesMap from './components/CirclesMap';
import Navigation from './components/Navigation';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<ConnectionsMap />} />
            <Route path="/circles" element={<CirclesMap />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
