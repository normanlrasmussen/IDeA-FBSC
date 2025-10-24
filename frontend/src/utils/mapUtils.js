/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Calculate circle size based on recruit count
 * @param {number} count - Number of recruits
 * @param {number} maxCount - Maximum count in dataset
 * @param {number} minSize - Minimum circle size
 * @param {number} maxSize - Maximum circle size
 * @returns {number} Circle size
 */
export const calculateCircleSize = (count, maxCount, minSize = 5, maxSize = 50) => {
  if (maxCount === 0) return minSize;
  const ratio = count / maxCount;
  return minSize + (ratio * (maxSize - minSize));
};

/**
 * Calculate line width based on recruit count
 * @param {number} count - Number of recruits
 * @param {number} maxCount - Maximum count in dataset
 * @param {number} minWidth - Minimum line width
 * @param {number} maxWidth - Maximum line width
 * @returns {number} Line width
 */
export const calculateLineWidth = (count, maxCount, minWidth = 1, maxWidth = 8) => {
  if (maxCount === 0) return minWidth;
  const ratio = count / maxCount;
  return minWidth + (ratio * (maxWidth - minWidth));
};

/**
 * Calculate line opacity based on recruit count
 * @param {number} count - Number of recruits
 * @param {number} maxCount - Maximum count in dataset
 * @param {number} minOpacity - Minimum opacity
 * @param {number} maxOpacity - Maximum opacity
 * @returns {number} Line opacity
 */
export const calculateLineOpacity = (count, maxCount, minOpacity = 0.3, maxOpacity = 0.9) => {
  if (maxCount === 0) return minOpacity;
  const ratio = count / maxCount;
  return minOpacity + (ratio * (maxOpacity - minOpacity));
};

/**
 * Get bounds for all data points
 * @param {Array} data - Array of data points with lat/lon
 * @returns {Array} Bounds array [south, west, north, east]
 */
export const getDataBounds = (data) => {
  if (data.length === 0) return null;
  
  const lats = data.map(d => d.lat).filter(lat => lat != null);
  const lons = data.map(d => d.lon).filter(lon => lon != null);
  
  if (lats.length === 0 || lons.length === 0) return null;
  
  return [
    Math.min(...lats), // south
    Math.min(...lons), // west
    Math.max(...lats), // north
    Math.max(...lons)  // east
  ];
};

/**
 * Convert lat/lon to pixel coordinates for D3
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Object} map - Leaflet map instance
 * @returns {Array} [x, y] pixel coordinates
 */
export const latLonToPixel = (lat, lon, map) => {
  const point = map.latLngToContainerPoint([lat, lon]);
  return [point.x, point.y];
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
