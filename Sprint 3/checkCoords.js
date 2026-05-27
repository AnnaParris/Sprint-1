const fs = require('fs');

// Rough bounding boxes for each US state
const stateBounds = {
  'AL': { minLat: 30.1, maxLat: 35.0, minLng: -88.5, maxLng: -84.9 },
  'AK': { minLat: 54.0, maxLat: 71.5, minLng: -180.0, maxLng: -129.0 },
  'AZ': { minLat: 31.3, maxLat: 37.0, minLng: -114.8, maxLng: -109.0 },
  'AR': { minLat: 33.0, maxLat: 36.5, minLng: -94.6, maxLng: -89.6 },
  'CA': { minLat: 32.5, maxLat: 42.0, minLng: -124.5, maxLng: -114.1 },
  'CO': { minLat: 36.9, maxLat: 41.0, minLng: -109.1, maxLng: -102.0 },
  'CT': { minLat: 40.9, maxLat: 42.1, minLng: -73.7, maxLng: -71.8 },
  'DE': { minLat: 38.4, maxLat: 39.8, minLng: -75.8, maxLng: -75.0 },
  'FL': { minLat: 24.5, maxLat: 31.0, minLng: -87.6, maxLng: -80.0 },
  'GA': { minLat: 30.3, maxLat: 35.0, minLng: -85.6, maxLng: -80.8 },
  'HI': { minLat: 18.9, maxLat: 22.2, minLng: -160.3, maxLng: -154.8 },
  'ID': { minLat: 41.9, maxLat: 49.0, minLng: -117.2, maxLng: -111.0 },
  'IL': { minLat: 36.9, maxLat: 42.5, minLng: -91.5, maxLng: -87.0 },
  'IN': { minLat: 37.7, maxLat: 41.8, minLng: -88.1, maxLng: -84.7 },
  'IA': { minLat: 40.3, maxLat: 43.5, minLng: -96.6, maxLng: -90.1 },
  'KS': { minLat: 36.9, maxLat: 40.0, minLng: -102.1, maxLng: -94.6 },
  'KY': { minLat: 36.5, maxLat: 39.1, minLng: -89.6, maxLng: -81.9 },
  'LA': { minLat: 28.9, maxLat: 33.0, minLng: -94.0, maxLng: -88.8 },
  'ME': { minLat: 43.0, maxLat: 47.5, minLng: -71.1, maxLng: -66.9 },
  'MD': { minLat: 37.9, maxLat: 39.7, minLng: -79.5, maxLng: -75.0 },
  'MA': { minLat: 41.2, maxLat: 42.9, minLng: -73.5, maxLng: -69.9 },
  'MI': { minLat: 41.6, maxLat: 48.3, minLng: -90.4, maxLng: -82.4 },
  'MN': { minLat: 43.5, maxLat: 49.4, minLng: -97.2, maxLng: -89.5 },
  'MS': { minLat: 30.1, maxLat: 35.0, minLng: -91.7, maxLng: -88.1 },
  'MO': { minLat: 35.9, maxLat: 40.6, minLng: -95.8, maxLng: -89.1 },
  'MT': { minLat: 44.3, maxLat: 49.0, minLng: -116.1, maxLng: -104.0 },
  'NE': { minLat: 39.9, maxLat: 43.0, minLng: -104.1, maxLng: -95.3 },
  'NV': { minLat: 35.0, maxLat: 42.0, minLng: -120.0, maxLng: -114.0 },
  'NH': { minLat: 42.7, maxLat: 45.3, minLng: -72.6, maxLng: -70.6 },
  'NJ': { minLat: 38.9, maxLat: 41.4, minLng: -75.6, maxLng: -73.9 },
  'NM': { minLat: 31.3, maxLat: 37.0, minLng: -109.1, maxLng: -103.0 },
  'NY': { minLat: 40.5, maxLat: 45.0, minLng: -79.8, maxLng: -71.9 },
  'NC': { minLat: 33.8, maxLat: 36.6, minLng: -84.3, maxLng: -75.5 },
  'ND': { minLat: 45.9, maxLat: 49.0, minLng: -104.1, maxLng: -96.6 },
  'OH': { minLat: 38.4, maxLat: 42.0, minLng: -84.8, maxLng: -80.5 },
  'OK': { minLat: 33.6, maxLat: 37.0, minLng: -103.0, maxLng: -94.4 },
  'OR': { minLat: 41.9, maxLat: 46.3, minLng: -124.6, maxLng: -116.5 },
  'PA': { minLat: 39.7, maxLat: 42.3, minLng: -80.5, maxLng: -74.7 },
  'RI': { minLat: 41.1, maxLat: 42.0, minLng: -71.9, maxLng: -71.1 },
  'SC': { minLat: 32.0, maxLat: 35.2, minLng: -83.4, maxLng: -78.5 },
  'SD': { minLat: 42.5, maxLat: 45.9, minLng: -104.1, maxLng: -96.4 },
  'TN': { minLat: 34.9, maxLat: 36.7, minLng: -90.3, maxLng: -81.6 },
  'TX': { minLat: 25.8, maxLat: 36.5, minLng: -106.6, maxLng: -93.5 },
  'UT': { minLat: 36.9, maxLat: 42.0, minLng: -114.1, maxLng: -109.0 },
  'VT': { minLat: 42.7, maxLat: 45.0, minLng: -73.4, maxLng: -71.5 },
  'VA': { minLat: 36.5, maxLat: 39.5, minLng: -83.7, maxLng: -75.2 },
  'WA': { minLat: 45.5, maxLat: 49.0, minLng: -124.8, maxLng: -116.9 },
  'WV': { minLat: 37.2, maxLat: 40.6, minLng: -82.6, maxLng: -77.7 },
  'WI': { minLat: 42.5, maxLat: 47.1, minLng: -92.9, maxLng: -86.8 },
  'WY': { minLat: 40.9, maxLat: 45.0, minLng: -111.1, maxLng: -104.0 },
  'DC': { minLat: 38.8, maxLat: 39.0, minLng: -77.1, maxLng: -76.9 },
};

const stationsFile = fs.readFileSync('stations.js', 'utf8');
const stationsMatch = stationsFile.match(/const stations\s*=\s*(\[[\s\S]*?\]);/);

// Extract all station objects using a simpler approach
const stationRegex = /\{[^}]+stateCode:\s*["'](\w+)["'][^}]+callSign:\s*["']([^"']+)["'][^}]+lat:\s*([-\d.]+)[^}]+lng:\s*([-\d.]+)[^}]*\}/g;

let match;
const problems = [];

while ((match = stationRegex.exec(stationsFile)) !== null) {
    const [, stateCode, callSign, lat, lng] = match;
    const bounds = stateBounds[stateCode];
    if (!bounds) continue;
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (latNum < bounds.minLat || latNum > bounds.maxLat || 
        lngNum < bounds.minLng || lngNum > bounds.maxLng) {
        problems.push({ callSign, stateCode, lat: latNum, lng: lngNum });
    }
}

if (problems.length === 0) {
    console.log('All stations look correct!');
} else {
    console.log(`Found ${problems.length} stations with possibly wrong coordinates:\n`);
    problems.forEach(p => {
        console.log(`${p.callSign} (${p.stateCode}): lat=${p.lat}, lng=${p.lng}`);
    });
}