import Papa from 'papaparse';

// Cache for loaded data
let cachedData = null;
let dataPromise = null;

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
    Papa.parse('/data/recruiting_data.csv', {
      header: true,
      download: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Convert headers to camelCase and handle specific cases
        const cleanHeader = header
          .toLowerCase()
          .replace(/([a-z])([A-Z])/g, '$1$2')
          .replace(/\s+/g, '');
        
        // Handle specific column name mappings
        if (cleanHeader === 'class_year') return 'classYear';
        if (cleanHeader === 'stateprovince') return 'stateProvince';
        if (cleanHeader === 'committedto') return 'committedTo';
        
        return cleanHeader;
      },
      complete: (results) => {
        console.log('CSV parsing complete:', results.data.length, 'rows');
        console.log('Sample row:', results.data[0]);
        console.log('Column headers:', Object.keys(results.data[0] || {}));
        
        // Check what's in the first few rows
        console.log('First 3 rows:', results.data.slice(0, 3));
        
        // Check specific columns we need
        if (results.data[0]) {
          console.log('committedTo value:', results.data[0].committedTo);
          console.log('classYear value:', results.data[0].classYear);
          console.log('school value:', results.data[0].school);
        }
        
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

        console.log('Processed data:', processedData.length, 'valid rows');
        console.log('Sample processed row:', processedData[0]);
        
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
  const colleges = [...new Set(data.map(row => row.committedto))];
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
    const key = `${row.city}|${row.stateprovince}`;
    if (cityMap.has(key)) {
      cityMap.get(key).count += 1;
    } else {
      cityMap.set(key, {
        city: row.city,
        state: row.stateprovince,
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
    if (collegeMap.has(row.committedto)) {
      collegeMap.get(row.committedto).count += 1;
    } else {
      collegeMap.set(row.committedto, {
        college: row.committedto,
        count: 1
      });
    }
  });

  return Array.from(collegeMap.values());
};
