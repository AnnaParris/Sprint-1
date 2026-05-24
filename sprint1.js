// Code for the map. Used Leaflet for the map.
const map = L.map('map').setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Build cityData from stations.js
const cityData = {};
stations.forEach(station => {
    if (!cityData[station.stateCode]) {
        cityData[station.stateCode] = [];
    }
    if (!cityData[station.stateCode].includes(station.city)) {
        cityData[station.stateCode].push(station.city);
    }
});

// dropdown references
const dropdown = document.getElementById('dropdown');
const city_select = document.getElementById('city_select');
const states = Object.keys(cityData).sort();

// loop to update each state in the dropdown
states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    dropdown.appendChild(option);
});

// markers object
const markers = {};

// loop to create markers and checkboxes
stations.forEach(station => {
    const marker = L.marker([station.lat, station.lng])
        .bindPopup(`<b>${station.callSign}</b><br>${station.city}<br>${station.frequency}`);
    marker.addTo(map);
    markers[station.callSign] = marker;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = station.callSign;

    const label = document.createElement('label');
    label.htmlFor = station.callSign;
    label.textContent = `${station.callSign} - ${station.city}`;

    document.getElementById('stationList').appendChild(checkbox);
    document.getElementById('stationList').appendChild(label);

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            markers[station.callSign].addTo(map);
        } else {
            markers[station.callSign].remove();
        }
    });
});

// state dropdown event listener
const state_select = document.getElementById('dropdown');
state_select.addEventListener('change', (event) => {
    const selectedState = event.target.value;

    // Update city dropdown
    city_select.innerHTML = '<option value="">-- Select City --</option>';
    city_select.value = "";
    if (cityData[selectedState]) {
        cityData[selectedState].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            city_select.appendChild(option);
        });
    }

    // Zoom to state or reset
    if (selectedState === '' || selectedState === '-- State --') {
        map.setView([39.8283, -98.5795], 4);
        stations.forEach(station => markers[station.callSign].addTo(map));
    } else if (cityData[selectedState]) {
        const stateStations = stations.filter(s => s.stateCode === selectedState);
        const avgLat = stateStations.reduce((sum, s) => sum + s.lat, 0) / stateStations.length;
        const avgLng = stateStations.reduce((sum, s) => sum + s.lng, 0) / stateStations.length;
        map.setView([avgLat, avgLng], 7);
    }

    // Show/hide markers based on state
    stations.forEach(station => {
        const currentMarker = markers[station.callSign];
        if (cityData[selectedState] && cityData[selectedState].includes(station.city)) {
            currentMarker.addTo(map);
            document.getElementById(station.callSign).checked = true;
        } else if (selectedState !== '' && selectedState !== '-- State --') {
            currentMarker.remove();
        }
    });
});

// city dropdown event listener
city_select.addEventListener('change', (event) => {
    const selectedCity = event.target.value;
    if (!selectedCity) return;

    const cityStation = stations.find(s => s.city === selectedCity);
    if (cityStation) {
        map.setView([cityStation.lat, cityStation.lng], 10);
    }
});


// Reset functions
function resetMap() {
    // Reset view to default
    map.setView([39.5, -98.35], 4);
    
    // Show all markers and check all checkboxes
    stations.forEach(station => {
        markers[station.callSign].addTo(map);
        document.getElementById(station.callSign).checked = true;
    });
    
    // Reset dropdowns
    document.getElementById('dropdown').value = '';
    document.getElementById('city_select').innerHTML = '<option value="">-- Select City --</option>';
}
// Reset button control
const ResetControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'reset-button', container);
        button.innerHTML = '🔄';
        button.href = '#';
        button.title = 'Reset Map';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Reset map view and clear markers');
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            resetMap();
        });
        return container;
    }
});
// Add control to map
map.addControl(new ResetControl());