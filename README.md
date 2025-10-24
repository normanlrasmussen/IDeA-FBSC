# College Football Recruiting Visualization Dashboard

A comprehensive web application for analyzing and visualizing college football recruiting data through interactive maps and statistical visualizations. This project provides insights into recruiting patterns, geographic distributions, and connections between high schools and colleges.

## 🏈 Overview

This dashboard visualizes college football recruiting data spanning from 2000 to 2025, showing:
- **Recruiting Connections**: Interactive maps displaying pathways from high schools to colleges
- **Geographic Distribution**: Circle-based visualizations of recruiting hotspots
- **Statistical Analysis**: Top recruiting schools and patterns

## ✨ Features

### 📍 Connections Map
- Interactive geographic visualization of recruiting pathways
- Blue markers for high schools, green diamonds for colleges
- Red connecting lines with thickness representing recruit volume
- Real-time filtering by college and year range
- Top 10 recruiting schools analysis

### 🔵 Circles Map
- Size-based visualizations showing recruiting density
- Two view modes: Cities and Colleges
- Dynamic circle sizing based on recruit counts
- Comprehensive filtering options

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Plotly.js** - Interactive visualizations and maps
- **Material-UI (MUI)** - Component library and theming
- **PapaParse** - CSV data parsing

### Data Processing
- **Python** - Data collection and preprocessing
- **Pandas** - Data manipulation and analysis
- **Jupyter Notebooks** - Data exploration and visualization

## 📊 Data Source & Attribution

### Primary Data Source
**College Football Data API** - [collegefootballdata.com](https://collegefootballdata.com)

The recruiting data used in this project is sourced from the College Football Data API, which provides comprehensive college football statistics and recruiting information. This data includes:

- Player names and rankings
- High school and college affiliations  
- Geographic coordinates and locations
- Athletic statistics and ratings
- Historical recruiting data (2000-2025)

### Data Usage
- **Purpose**: Educational and research visualization
- **Scope**: Public college football recruiting information
- **Attribution**: Data sourced from College Football Data API
- **License**: Public sports statistics and recruiting information

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+ (for data processing)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd IDeA---FBSC
   ```

2. **Set up the frontend**:
   ```bash
   cd frontend
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** to [http://localhost:3000](http://localhost:3000)

### Data Processing (Optional)

If you need to regenerate the recruiting data:

1. **Set up Python environment**:
   ```bash
   conda env create -f environment.yml
   conda activate football
   ```

2. **Run data collection notebook**:
   ```bash
   jupyter notebook generate_csv.ipynb
   ```

## 📁 Project Structure

```
IDeA---FBSC/
├── frontend/                 # React web application
│   ├── src/
│   │   ├── components/       # React components
│   │   └── utils/           # Utility functions
│   ├── public/
│   │   └── data/            # Static data files
│   └── package.json
├── generate_csv.ipynb       # Data collection notebook
├── visualize_recruiting_map.ipynb  # Analysis notebook
└── environment.yml          # Python dependencies
```

## 🎯 Key Components

### Data Visualization
- **ConnectionsMap.jsx**: Interactive recruiting pathway visualizations
- **CirclesMap.jsx**: Size-based geographic distribution maps
- **Navigation.jsx**: Application navigation and routing

### Data Processing
- **generate_csv.ipynb**: Automated data collection from CFBD API
- **visualize_recruiting_map.ipynb**: Data analysis and exploration

## 📈 Performance Considerations

- **Client-side Processing**: All data processing happens in the browser
- **Data Size**: Optimized for datasets up to ~100k records
- **Caching**: Data is cached after initial load for better performance
- **Filtering**: Real-time filtering for responsive user experience

## 🌐 Deployment

This application is designed to be deployed as a static site and is compatible with:
- **GitHub Pages** (recommended for free hosting)
- **Netlify**
- **Vercel**
- Any static hosting service

### GitHub Pages Deployment
1. Build the application: `npm run build`
2. Push to GitHub repository
3. Enable GitHub Pages in repository settings
4. Deploy from the `gh-pages` branch or `main` branch

## 🤝 Contributing

This project is part of academic research and educational purposes. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📜 License & Credits

### Data Attribution
- **College Football Data API**: [collegefootballdata.com](https://collegefootballdata.com)
- **Data Type**: Public college football recruiting statistics
- **Usage**: Educational and research purposes
- **Attribution**: All recruiting data sourced from College Football Data API

### Technology Credits
- **React**: [reactjs.org](https://reactjs.org)
- **Plotly.js**: [plotly.com](https://plotly.com)
- **Material-UI**: [mui.com](https://mui.com)
- **College Football Data API**: [collegefootballdata.com](https://collegefootballdata.com)

### Academic Use
This project is created for educational and research purposes. The data used consists of publicly available college football recruiting information that is widely accessible and discussed in public forums.

## 📞 Contact

For questions about this project or data usage, please refer to the original data source terms of service at [collegefootballdata.com](https://collegefootballdata.com).

---

**Note**: This project uses publicly available college football recruiting data for educational and research purposes. All data attribution and credits are provided as required by the data source terms of service.
