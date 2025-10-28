import Papa from 'papaparse';

// Cache for loaded data
let cachedData = null;
let dataPromise = null;
let collegeCoords = null;

/**
 * Load geocode cache for college coordinates
 * @returns {Promise<Object>} College coordinates
 */
export const loadCollegeCoords = async () => {
  if (collegeCoords) {
    return collegeCoords;
  }

  try {
    const response = await fetch(`${process.env.PUBLIC_URL || ''}/data/geocode_cache.json`);
    const geocodeCache = await response.json();
    
    // Convert cache format to coordinate format
    collegeCoords = {};
    for (const [college, data] of Object.entries(geocodeCache)) {
      if (data && data.latitude && data.longitude) {
        collegeCoords[college] = {
          lat: data.latitude,
          lon: data.longitude
        };
      }
    }
    
    return collegeCoords;
  } catch (error) {
    console.error('Error loading college coordinates:', error);
    return {};
  }
};

/**
 * Load and parse the recruiting data CSV
 * @returns {Promise<Array>} Parsed recruiting data
 */
export const loadRecruitingData = async () => {
  if (cachedData) {
    return cachedData;
  }

  if (dataPromise) {
    return dataPromise;
  }

  dataPromise = new Promise((resolve, reject) => {
    Papa.parse('./data/recruiting_data.csv', {
      header: true,
      download: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Handle specific column name mappings first
        if (header === 'class_year') {
          return 'classYear';
        }
        if (header === 'stateProvince') return 'stateProvince';
        if (header === 'committedTo') return 'committedTo';
        
        // Convert other headers to camelCase
        const transformed = header
          .toLowerCase()
          .replace(/([a-z])([A-Z])/g, '$1$2')
          .replace(/\s+/g, '');
        return transformed;
      },
      complete: (results) => {
        
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        // Convert numeric fields and handle missing values - match notebook exactly
        const processedData = results.data
          .filter(row => row.classYear && row.committedTo && row.school) // Filter out empty rows
          .map(row => ({
            ...row,
            year: parseInt(row.year) || 0,
            ranking: parseInt(row.ranking) || 0,
            height: parseFloat(row.height) || 0,
            weight: parseFloat(row.weight) || 0,
            stars: parseInt(row.stars) || 0,
            rating: parseFloat(row.rating) || 0,
            classYear: parseInt(row.classYear) || 0,
            latitude: parseFloat(row.latitude) || null,
            longitude: parseFloat(row.longitude) || null
          }))
          .filter(row => row.latitude && row.longitude && row.classYear > 0); // Filter out invalid coordinates

        
        cachedData = processedData;
        resolve(processedData);
      },
      error: (error) => {
        console.error('Error loading CSV:', error);
        reject(error);
      }
    });
  });

  return dataPromise;
};

/**
 * Get unique colleges from the dataset
 * @param {Array} data - Recruiting data
 * @returns {Array} Sorted list of unique colleges
 */
export const getUniqueColleges = (data) => {
  const colleges = [...new Set(data.map(row => row.committedTo))];
  return colleges.sort();
};

/**
 * Get year range from the dataset
 * @param {Array} data - Recruiting data
 * @returns {Object} Object with min and max years
 */
export const getYearRange = (data) => {
  if (!data || data.length === 0) {
    return { min: 2023, max: 2025 };
  }
  
  const years = data.map(row => row.classYear).filter(year => year > 0 && year < 2030);
  
  if (years.length === 0) {
    return { min: 2023, max: 2025 };
  }
  
  return {
    min: Math.min(...years),
    max: Math.max(...years)
  };
};

/**
 * Filter data by year range and college
 * @param {Array} data - Full dataset
 * @param {number} startYear - Start year (inclusive)
 * @param {number} endYear - End year (inclusive)
 * @param {string} college - College name or 'all'
 * @returns {Array} Filtered data
 */
export const filterData = (data, startYear, endYear, college = 'all') => {
  console.log('Filtering data:', {
    totalData: data.length,
    startYear,
    endYear,
    college
  });
  
  let filtered = data.filter(row => 
    row.classYear >= startYear && 
    row.classYear <= endYear &&
    row.latitude && 
    row.longitude &&
    row.country === 'USA'
  );

  console.log('After year and location filter:', filtered.length);

  if (college !== 'all') {
    filtered = filtered.filter(row => 
      row.committedTo.toLowerCase().includes(college.toLowerCase())
    );
    console.log('After college filter:', filtered.length);
  }

  return filtered;
};

/**
 * Aggregate pathways (high school -> college connections)
 * @param {Array} data - Filtered recruiting data
 * @returns {Array} Aggregated pathway data
 */
export const aggregatePathways = (data) => {
  const pathwayMap = new Map();

  data.forEach(row => {
    const key = `${row.school}|${row.committedTo}`;
    if (pathwayMap.has(key)) {
      pathwayMap.get(key).count += 1;
    } else {
      pathwayMap.set(key, {
        school: row.school,
        college: row.committedTo,
        city: row.city,
        state: row.stateProvince,
        lat: row.latitude,
        lon: row.longitude,
        count: 1
      });
    }
  });

  console.log('Aggregated pathways:', pathwayMap.size);
  return Array.from(pathwayMap.values());
};

/**
 * Aggregate city recruit counts
 * @param {Array} data - Filtered recruiting data
 * @returns {Array} City data with recruit counts
 */
export const aggregateCities = (data) => {
  const cityMap = new Map();

  data.forEach(row => {
    const key = `${row.city}|${row.stateProvince}`;
    if (cityMap.has(key)) {
      cityMap.get(key).count += 1;
    } else {
      cityMap.set(key, {
        city: row.city,
        state: row.stateProvince,
        lat: row.latitude,
        lon: row.longitude,
        count: 1
      });
    }
  });

  return Array.from(cityMap.values());
};

/**
 * Aggregate college recruit counts
 * @param {Array} data - Filtered recruiting data
 * @returns {Array} College data with recruit counts
 */
export const aggregateColleges = (data) => {
  const collegeMap = new Map();

  data.forEach(row => {
    if (collegeMap.has(row.committedTo)) {
      collegeMap.get(row.committedTo).count += 1;
    } else {
      collegeMap.set(row.committedTo, {
        college: row.committedTo,
        count: 1
      });
    }
  });

  return Array.from(collegeMap.values());
};

/**
 * Load Alabama recruiting data using the notebook approach
 * @returns {Promise<Array>} Alabama pathway data
 */
export const loadAlabamaData = async () => {
  try {
    // Load both data and college coordinates
    const [recruitingData, collegeCoords] = await Promise.all([
      loadRecruitingData(),
      loadCollegeCoords()
    ]);


    // Filter to recent years (2020+) like the notebook
    const recentData = recruitingData.filter(row => 
      row.classYear >= 2020 && 
      row.latitude && 
      row.longitude && 
      row.country === 'USA' &&
      collegeCoords[row.committedTo] // Only include colleges we have coordinates for
    );


    // Filter specifically for Alabama
    const alabamaData = recentData.filter(row => 
      row.committedTo && row.committedTo.toLowerCase().includes('alabama')
    );


    // Aggregate pathways exactly like the notebook
    const pathwayCounts = new Map();
    
    alabamaData.forEach(row => {
      const key = `${row.school}|${row.committedTo}`;
      if (pathwayCounts.has(key)) {
        pathwayCounts.get(key).count += 1;
      } else {
        pathwayCounts.set(key, {
          school: row.school,
          committedTo: row.committedTo,
          city: row.city,
          stateProvince: row.stateProvince,
          count: 1,
          latitude: row.latitude,
          longitude: row.longitude
        });
      }
    });

    // Calculate city and college totals for hover info
    const cityCounts = new Map();
    const collegeCounts = new Map();

    alabamaData.forEach(row => {
      // City counts
      const cityKey = `${row.city}|${row.stateProvince}`;
      cityCounts.set(cityKey, (cityCounts.get(cityKey) || 0) + 1);
      
      // College counts
      collegeCounts.set(row.committedTo, (collegeCounts.get(row.committedTo) || 0) + 1);
    });

    // Transform to the exact format expected by the visualization
    const pathways = Array.from(pathwayCounts.values()).map(pathway => {
      const collegeCoord = collegeCoords[pathway.committedTo];
      const cityKey = `${pathway.city}|${pathway.stateProvince}`;
      
      return {
        hs_name: pathway.school,
        hs_lat: pathway.latitude,
        hs_lon: pathway.longitude,
        hs_city: pathway.city,
        hs_state: pathway.stateProvince,
        college_name: pathway.committedTo,
        college_lat: collegeCoord ? collegeCoord.lat : 33.2098, // Default to Alabama coordinates
        college_lon: collegeCoord ? collegeCoord.lon : -87.5692,
        recruit_count: pathway.count,
        city_total_recruits: cityCounts.get(cityKey) || 0,
        college_total_recruits: collegeCounts.get(pathway.committedTo) || 0
      };
    });


    return pathways;
  } catch (error) {
    console.error('Error loading Alabama data:', error);
    return [];
  }
};
