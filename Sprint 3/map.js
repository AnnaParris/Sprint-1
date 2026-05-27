// Code for the map. Used Leaflet for the map.
const map = L.map('map').setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// HTML references
const dropdown = document.getElementById('dropdown');
const city_select = document.getElementById('city_select');
const searchInput = document.querySelector('.search');
const stationList = document.getElementById('stationList');

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

// Fill the state dropdown
const states = Object.keys(cityData).sort();
states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    dropdown.appendChild(option);
});

// Create map markers and station checkbox list
const markers = {};


// loop to create markers and checkboxes
stations.forEach(station => {
    const marker = L.marker([station.lat, station.lng])
        .bindPopup(`<b>${station.callSign}</b><br>${station.city}, ${station.stateCode}<br>${station.frequency}`);

    marker.addTo(map);
    markers[station.callSign] = marker;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = station.callSign;

    const label = document.createElement('label');
    label.htmlFor = station.callSign;
    label.textContent = `${station.callSign} - ${station.city}`;

    const item = document.createElement('li');
    item.appendChild(checkbox);
    item.appendChild(label);
    stationList.appendChild(item);

    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            markers[station.callSign].addTo(map);
        } else {
            markers[station.callSign].remove();
        }
    });
});

// Station part
function showStations(matchingStations) {
    const matchingCallSigns = new Set(matchingStations.map(station => station.callSign));

    stations.forEach(station => {
        const checkbox = document.getElementById(station.callSign);

        if (matchingCallSigns.has(station.callSign)) {
            markers[station.callSign].addTo(map);
            checkbox.checked = true;
        } else {
            markers[station.callSign].remove();
            checkbox.checked = false;
        }
    });
}

function zoomToStations(matchingStations) {
    if (matchingStations.length === 0) {
        return;
    }

    if (matchingStations.length === 1) {
        const station = matchingStations[0];
        map.setView([station.lat, station.lng], 10);
        markers[station.callSign].openPopup();
        return;
    }

    const bounds = L.latLngBounds(matchingStations.map(station => [station.lat, station.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
}

// Map Reset

function resetMap() {
    map.setView([39.5, -98.35], 4);
    showStations(stations);
    dropdown.value = '';
    city_select.innerHTML = '<option value="">-- Select City --</option>';

    if (searchInput) {
        searchInput.value = '';
    }
}

// State dropdown filter
dropdown.addEventListener('change', event => {
    const selectedState = event.target.value;

    city_select.innerHTML = '<option value="">-- Select City --</option>';

    if (!selectedState) {
        resetMap();
        return;
    }

    cityData[selectedState].forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        city_select.appendChild(option);
    });

    const stateStations = stations.filter(station => station.stateCode === selectedState);
    showStations(stateStations);
    zoomToStations(stateStations);
});

// City dropdown filter
city_select.addEventListener('change', event => {
    const selectedCity = event.target.value;
    const selectedState = dropdown.value;

    if (!selectedCity) {
        return;
    }

    const cityStations = stations.filter(station => {
        return station.city === selectedCity && station.stateCode === selectedState;
    });

    showStations(cityStations);
    zoomToStations(cityStations);
});

// Search suggestions and keyword search part

const searchSuggestions = document.createElement('datalist');
searchSuggestions.id = 'searchSuggestions';
document.body.appendChild(searchSuggestions);

if (searchInput) {
    searchInput.setAttribute('list', 'searchSuggestions');
}

function matchesKeywords(text, searchText) {
    const keywords = searchText.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searchableText = text.toLowerCase();
    return keywords.every(keyword => searchableText.includes(keyword));
}

const citySearchOptions = [];
states.forEach(stateCode => {
    cityData[stateCode].forEach(city => {
        const cityStations = stations.filter(station => {
            return station.city === city && station.stateCode === stateCode;
        });

        citySearchOptions.push({
            type: 'City',
            value: `${city}, ${stateCode}`,
            searchText: `${city} ${stateCode} ${cityStations[0].stateName}`,
            stations: cityStations
        });
    });
});

const stationSearchOptions = stations.map(station => ({
    type: 'Station',
    value: `${station.callSign} - ${station.city}, ${station.stateCode}`,
    searchText: `${station.callSign} ${station.frequency} ${station.city} ${station.stateCode} ${station.stateName}`,
    stations: [station]
}));

const stateSearchOptions = states.map(stateCode => {
    const stateStations = stations.filter(station => station.stateCode === stateCode);

    return {
        type: 'State',
        value: `${stateStations[0].stateName} (${stateCode})`,
        searchText: `${stateStations[0].stateName} ${stateCode}`,
        stations: stateStations
    };
});

const searchOptions = [
    ...citySearchOptions.sort((a, b) => a.value.localeCompare(b.value)),
    ...stationSearchOptions.sort((a, b) => a.value.localeCompare(b.value)),
    ...stateSearchOptions.sort((a, b) => a.value.localeCompare(b.value))
];
const searchOptionsByValue = new Map(searchOptions.map(option => [option.value, option]));

function updateSearchSuggestions(searchText) {
    searchSuggestions.innerHTML = '';

    if (!searchText.trim()) {
        return;
    }

    searchOptions
        .filter(option => matchesKeywords(option.searchText, searchText))
        .slice(0, 20)
        .forEach(option => {
            const suggestion = document.createElement('option');
            suggestion.value = option.value;
            suggestion.label = option.type;
            searchSuggestions.appendChild(suggestion);
        });
}

function searchStations(searchText) {
    const searchValue = searchText.trim();

    if (!searchValue) {
        resetMap();
        return;
    }

    const selectedOption = searchOptionsByValue.get(searchValue);
    const matchingStations = selectedOption
        ? selectedOption.stations
        : stations.filter(station => {
            return matchesKeywords(
                `${station.callSign} ${station.frequency} ${station.city} ${station.stateCode} ${station.stateName}`,
                searchValue
            );
        });

    showStations(matchingStations);
    zoomToStations(matchingStations);
}

if (searchInput) {
    searchInput.addEventListener('input', event => {
        updateSearchSuggestions(event.target.value);
        searchStations(event.target.value);
    });
}

// Reset button control
const ResetControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'reset-button', container);
        button.innerHTML = 'R';
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

map.addControl(new ResetControl());
