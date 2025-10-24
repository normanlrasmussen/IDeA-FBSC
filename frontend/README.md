# Football Recruiting Dashboard

A React-based web application for visualizing college football recruiting data with interactive maps showing connections between high schools and colleges, and size-based visualizations of recruiting patterns.

## Features

### Page 1: Connections Map
- Interactive map showing connections between high schools and colleges
- Blue circles for high schools (hometowns)
- Green diamonds for colleges  
- Red lines connecting them (thickness = recruit count)
- College dropdown filter (All Colleges or specific college)
- Year range slider (2000-2025)
- Real-time filtering and visualization

### Page 2: Size Graphs
- Circle-based visualizations showing recruit counts
- Three view modes:
  - **All Cities**: Shows all cities with circle sizes based on total recruits
  - **Cities to College**: Shows cities that sent recruits to a specific college
  - **All Colleges**: Shows all colleges with circle sizes based on total recruits
- Year range filtering
- College selection for "Cities to College" mode

## Technology Stack

- **React 18** with hooks
- **React Router** for navigation
- **React Leaflet** for map base layer
- **D3.js** for custom SVG overlays
- **Material-UI (MUI)** for UI components
- **PapaParse** for CSV parsing

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy the recruiting data CSV to the public directory:
```bash
cp ../data/recruiting_data.csv public/data/
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) to view the application

### Building for Production

```bash
npm run build
```

This creates a `build` folder with the production-ready application.

## Data Requirements

The application expects a CSV file at `/data/recruiting_data.csv` with the following columns:
- `year`: Recruiting year
- `name`: Player name
- `school`: High school name
- `committedTo`: College name
- `city`: City name
- `stateProvince`: State/province
- `country`: Country (should be 'USA')
- `class_year`: Class year
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate

## Performance Notes

- The application loads and processes data client-side
- Large datasets (>10k records) may impact performance
- Data is cached after initial load
- Visualizations are limited to top pathways for performance
- Consider using a backend API for very large datasets

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Troubleshooting

### Common Issues

1. **Map not loading**: Ensure the CSV file is in the correct location (`public/data/recruiting_data.csv`)
2. **Performance issues**: Try reducing the year range or selecting a specific college
3. **Styling issues**: Clear browser cache and restart the development server

### Development Tips

- Use browser developer tools to monitor performance
- Check the console for any error messages
- The application includes loading states and error handling
