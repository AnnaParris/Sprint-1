const fs = require('fs');

const coords = JSON.parse(fs.readFileSync('coords.json', 'utf8'));

let stationsFile = fs.readFileSync('stations.js', 'utf8');

let updated = 0;
let skipped = 0;

for (const [callSign, data] of Object.entries(coords)) {
    if (data.lat === null || data.lng === null) {
        skipped++;
        continue;
    }
    
    const regex = new RegExp(
        `(callSign:\\s*["']${callSign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^}]*?lat:\\s*)[^,}]+(,\\s*lng:\\s*)[^,}]+`,
        'g'
    );
    
    const newFile = stationsFile.replace(regex, `$1${data.lat}$2${data.lng}`);
    
    if (newFile !== stationsFile) {
        stationsFile = newFile;
        updated++;
    }
}

fs.writeFileSync('stations.js', stationsFile);
console.log(`Done! Updated: ${updated}, Skipped (null): ${skipped}`);