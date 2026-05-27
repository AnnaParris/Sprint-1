const fs = require('fs');

const fixes = {
  'WKVV':   { lat: 33.5186, lng: -86.8104 },   // Birmingham, AL
  'KYLK':   { lat: 32.6927, lng: -114.6277 },  // Yuma, AZ
  'WKVZ':   { lat: 27.9506, lng: -82.4572 },   // Tampa, FL
  'WQLR':   { lat: 32.0724, lng: -84.2327 },   // Americus, GA
  'WLFN':   { lat: 43.0125, lng: -83.6875 },   // Flint, MI
  'WKLV-FM':{ lat: 41.4993, lng: -81.6944 },   // Cleveland, OH
  'WKVR':   { lat: 39.9612, lng: -82.9988 },   // Columbus, OH
  'WLVX':   { lat: 41.0998, lng: -80.6495 },   // Youngstown, OH
  'WYLR':   { lat: 41.0998, lng: -80.6495 },   // Youngstown, OH
  'KDKL':   { lat: 36.154,  lng: -95.9928 },   // Tulsa, OK
  'WFSH-FM':{ lat: 41.8434, lng: -79.1453 },   // Warren, PA
  'WKVC':   { lat: 33.689,  lng: -78.8867 },   // Myrtle Beach, SC
  'KLUV':   { lat: 44.3633, lng: -98.2145 },   // Huron, SD
  'KLRK':   { lat: 42.8711, lng: -97.3973 },   // Yankton, SD
  'KLVH':   { lat: 29.7604, lng: -95.3698 },   // Houston, TX
  'WNKV':   { lat: 40.064,  lng: -80.7209 },   // Wheeling, WV
  'K205EX': { lat: 60.5544, lng: -151.2583 },  // Kenai, AK
  'K291BR': { lat: 57.79,   lng: -152.4072 },  // Kodiak, AK
  'KNLP':   { lat: 34.54,   lng: -112.4685 },  // Prescott, AZ
  'KNLT':   { lat: 32.2226, lng: -110.9747 },  // Tucson, AZ
  'K265DV': { lat: 37.7749, lng: -122.4194 },  // San Francisco, CA
  'KSRI':   { lat: 38.4404, lng: -122.7141 },  // Santa Rosa, CA
  'KPUB':   { lat: 38.2544, lng: -104.6091 },  // Pueblo, CO
  'KICR':   { lat: 41.9779, lng: -91.6656 },   // Cedar Rapids, IA
  'KUPH':   { lat: 43.4666, lng: -112.0341 },  // Idaho Falls, ID
  'KLJC':   { lat: 39.0997, lng: -94.5786 },   // Kansas City, KS
  'KOHM':   { lat: 33.5779, lng: -101.8552 },  // Lubbock, TX
  'W220EE': { lat: 38.2527, lng: -85.7585 },   // Louisville, KY
};

let stationsFile = fs.readFileSync('stations.js', 'utf8');
let updated = 0;

for (const [callSign, coords] of Object.entries(fixes)) {
  const regex = new RegExp(
    `(callSign:\\s*["']${callSign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^}]*?lat:\\s*)[^,}]+(,\\s*lng:\\s*)[^,}]+`,
    'g'
  );
  const newFile = stationsFile.replace(regex, `$1${coords.lat}$2${coords.lng}`);
  if (newFile !== stationsFile) {
    stationsFile = newFile;
    updated++;
  }
}

fs.writeFileSync('stations.js', stationsFile);
console.log(`Done! Fixed ${updated} stations.`);