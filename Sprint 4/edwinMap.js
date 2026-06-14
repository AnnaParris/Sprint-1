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
// Station dropdown change: this connects the station dropdown from page.html to the JavaScript.
const station_select = document.getElementById('station_select');

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

// Station dropdown change: this puts the station dropdown back to its default empty option.
function resetStationDropdown() {
    station_select.innerHTML = '<option value="">Station</option>';
}

// Station dropdown change: this fills the station dropdown after the user chooses a city.
function fillStationDropdown(cityStations) {
    resetStationDropdown();

    [...cityStations]
        .sort((a, b) => a.callSign.localeCompare(b.callSign, undefined, { sensitivity: 'base' }))
        .forEach(station => {
            const option = document.createElement('option');
            option.value = station.callSign;
            option.textContent = `${station.callSign} - ${station.frequency}`;
            station_select.appendChild(option);
        });
}

// Create map markers and station checkbox list
const markers = {};

const networkColors = {
  kLove:        '#43d1bf',
  air1:         '#2e77f9',
  wayFm:        '#f64fd6',
  christianFm:  '#27a899',
  familyLife:   '#a259f7',
  joyFm:        '#ff6b9d',
  faithNetwork: '#1bbfe0',
  moody:        '#f9a825',
  metroMarket:  '#f94f6e',
  individualStations: '#65a30d',
  bottRadioNetwork: '#475569' 
};

function getStationColor(station) {
  if (kLoveStations.includes(station))            return networkColors.kLove;
  if (air1Stations.includes(station))             return networkColors.air1;
  if (wayFmStations.includes(station))            return networkColors.wayFm;
  if (christianFmAffiliates.includes(station))    return networkColors.christianFm;
  if (familyLifeStations.includes(station))       return networkColors.familyLife;
  if (joyFmStations.includes(station))            return networkColors.joyFm;
  if (faithNetworkStations.includes(station))     return networkColors.faithNetwork;
  if (moodyStations.includes(station))            return networkColors.moody;
  if (book6MetroMarketStations.includes(station)) return networkColors.metroMarket;
  if (individualStations.includes(station))       return networkColors.individualStations;
  if (bottRadioNetwork.includes(station))         return networkColors.bottRadioNetwork;
  return '#999999';
}
// This object groups stations by network for easy filtering when a user selects a network from the dropdown.
const networkGroups = {
    kLove: kLoveStations,
    air1: air1Stations,
    wayFm: wayFmStations,
    christianFm: christianFmAffiliates,
    familyLife: familyLifeStations,
    joyFm: joyFmStations,
    faithNetwork: faithNetworkStations,
    moody: moodyStations,
    metroMarket: book6MetroMarketStations,
    individualStations: individualStations,
    bottRadioNetwork: bottRadioNetwork
};

function getMarkerIcon(color) {
    return L.divIcon({
        className: '',
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="4" fill="#fff"/>
        </svg>`,
        iconSize: [24, 36],
        iconAnchor: [12, 36],
        popupAnchor: [0, -36]
    });
}

// FCC contour change: this variable remembers the contour currently drawn on the map.
let activeContourLayer = null;

// FCC contour change: this cache saves FCC results so clicking the same station again is faster.
const contourCache = new Map();

// FCC contour change: this number makes sure an older FCC request cannot redraw after a newer marker click.
let latestContourRequestId = 0;

// FCC contour change: this removes suffixes like "-FM" or "-HD2" because the FCC API usually wants the base call sign.
function getFccCallSign(station) {
    return station.callSign.replace(/-(FM|AM|HD\d+)$/i, '');
}

// FCC contour change: this builds the FCC Contours API URL for one station.
function getFccContourUrl(station) {
    const params = new URLSearchParams({
        serviceType: 'fm'
    });

    // FCC contour change: if we add facilityId to stations.js later, use it because it is the most accurate lookup.
    if (station.facilityId) {
        params.set('facilityId', station.facilityId);
    } else {
        params.set('callsign', getFccCallSign(station));
    }

    return `https://geo.fcc.gov/api/contours/entity.json?${params.toString()}`;
}

// FCC contour change: this clears the old FCC contour before drawing a new one.
function removeActiveContour() {
    if (activeContourLayer) {
        map.removeLayer(activeContourLayer);
        activeContourLayer = null;
    }
}

// FCC contour change: this converts the FCC contour radial distances into one approximate round radius.
function getApproxRadiusMeters(contourData) {
    const contourPoints = contourData.features?.[0]?.properties?.contourData || [];
    const distancesInKm = contourPoints
        .map(point => Number(point.distance))
        .filter(distance => Number.isFinite(distance) && distance > 0);

    if (distancesInKm.length === 0) {
        return null;
    }

    const averageDistanceKm = distancesInKm.reduce((sum, distance) => sum + distance, 0) / distancesInKm.length;
    return averageDistanceKm * 1000;
}

// FCC contour change: this gives a backup radius when the FCC API cannot find a station.
function getFallbackRadiusMeters(station) {
    const callSign = station.callSign.toUpperCase();

    // FCC contour change: translator call signs often look like K265DF or W212AP, and they usually cover a smaller area.
    if (/^[KW]\d{3}[A-Z]{2}$/.test(callSign)) {
        return 20 * 1609.34;
    }

    // FCC contour change: HD subchannels use the parent station signal, so this keeps them medium-sized if FCC lookup fails.
    if (/-HD\d+$/i.test(callSign)) {
        return 35 * 1609.34;
    }

    // FCC contour change: full-power FM stations usually cover more area, so this is the general backup estimate.
    return 45 * 1609.34;
}

// FCC contour change: this draws an estimated circle when an official FCC contour is not available.
function showFallbackRadius(station, color, marker) {
    const radiusMeters = getFallbackRadiusMeters(station);
    const radiusMiles = (radiusMeters / 1609.34).toFixed(1);

    activeContourLayer = L.circle([station.lat, station.lng], {
        radius: radiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.12,
        opacity: 0.7,
        weight: 2,
        dashArray: '6 6',
        interactive: false
    }).addTo(map);

    map.fitBounds(activeContourLayer.getBounds(), { padding: [40, 40] });
    if (map.getZoom() > 9) {
        map.setZoom(9);
    }
    marker.setPopupContent(`<b>${station.callSign}</b><br>${station.city}, ${station.stateCode}<br>${station.frequency}<br>FCC contour was not found.<br>Estimated radius: ${radiusMiles} miles`);
    marker.openPopup();
}

// FCC contour change: this asks the FCC API for a station contour and draws an approximate round radius on the Leaflet map.
async function showFccContour(station, color) {
    const requestId = latestContourRequestId + 1;
    latestContourRequestId = requestId;

    removeActiveContour();

    const marker = markers[station.callSign];
    marker.setPopupContent(`<b>${station.callSign}</b><br>${station.city}, ${station.stateCode}<br>${station.frequency}<br>Loading FCC contour...`);

    try {
        const cacheKey = station.facilityId || getFccCallSign(station);
        let contourData = contourCache.get(cacheKey);

        if (!contourData) {
            const response = await fetch(getFccContourUrl(station));

            if (!response.ok) {
                throw new Error('No FCC contour found');
            }

            contourData = await response.json();
            contourCache.set(cacheKey, contourData);
        }

        if (requestId !== latestContourRequestId) {
            return;
        }

        const radiusMeters = getApproxRadiusMeters(contourData);

        if (!radiusMeters) {
            throw new Error('FCC contour did not include distance values');
        }

        activeContourLayer = L.circle([station.lat, station.lng], {
            radius: radiusMeters,
            color: color,
            fillColor: color,
            fillOpacity: 0.18,
            opacity: 0.9,
            weight: 2,
            interactive: false
        }).addTo(map);

        map.fitBounds(activeContourLayer.getBounds(), { padding: [40, 40] });
        if (map.getZoom() > 9) {
            map.setZoom(9);
        }

        const properties = contourData.features?.[0]?.properties || {};
        const contourLabel = properties.field ? `${properties.field} dBu FCC contour` : 'FCC contour';
        const facilityLabel = properties.facility_id ? `<br>Facility ID: ${properties.facility_id}` : '';
        const radiusMiles = (radiusMeters / 1609.34).toFixed(1);

        marker.setPopupContent(`<b>${station.callSign}</b><br>${station.city}, ${station.stateCode}<br>${station.frequency}<br>${contourLabel}${facilityLabel}<br>Approx. radius: ${radiusMiles} miles`);
        marker.openPopup();
    } catch (error) {
        if (requestId !== latestContourRequestId) {
            return;
        }

        showFallbackRadius(station, color, marker);
    }
}

// loop to create markers and checkboxes
[...stations].sort((a, b) => a.callSign.localeCompare(b.callSign, undefined, { sensitivity: 'base' })).forEach(station => {
    const color = getStationColor(station);

    const marker = L.marker([station.lat, station.lng], {
        icon: getMarkerIcon(color)
    })
    .bindPopup(`<b>${station.callSign}</b><br>${station.city}, ${station.stateCode}<br>${station.frequency}`);

    marker.addTo(map);
    markers[station.callSign] = marker;

    // FCC contour change: when a user clicks a marker, draw that station's official FCC contour.
    marker.on('click', () => {
        showFccContour(station, color);
    });

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = station.callSign;

    const label = document.createElement('label');
    label.htmlFor = station.callSign;
    label.textContent = `${station.city} - ${station.callSign}`;

    const item = document.createElement('li');
    item.appendChild(checkbox);
    item.appendChild(label);
    stationList.appendChild(item);
});

// Station part
function showStations(matchingStations) {
    const matchingCallSigns = new Set(matchingStations.map(station => station.callSign));

    stations.forEach(station => {
        const checkbox = document.getElementById(station.callSign);
        const item = checkbox.closest('li');
        const visible = matchingCallSigns.has(station.callSign);

        item.style.display = visible ? '' : 'none';

        if (visible) {
            markers[station.callSign].addTo(map);
            checkbox.checked = true;
        } else {
            markers[station.callSign].remove();
            checkbox.checked = false;
        }
    });

    // Re-sort visible items
    const visibleItems = [...stationList.querySelectorAll('li')]
        .filter(li => li.style.display !== 'none');
    visibleItems.sort((a, b) => {
        const aText = a.querySelector('label').textContent;
        const bText = b.querySelector('label').textContent;
        return aText.localeCompare(bText, undefined, { sensitivity: 'base' });
    });
    visibleItems.forEach(li => stationList.appendChild(li));
}

document.getElementById('stationList').addEventListener('change', function(e) {
    if (e.target.type === 'checkbox') {
        const callSign = e.target.id;
        if (e.target.checked) {
            markers[callSign].addTo(map);
        } else {
            markers[callSign].remove();
        }
    }
});

function zoomToStations(matchingStations) {
    if (matchingStations.length === 0) return;

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
    // FCC contour change: cancel any FCC request that is still loading when reset is pressed.
    latestContourRequestId += 1;

    // FCC contour change: remove the contour when the user resets the whole map.
    removeActiveContour();
    map.setView([39.5, -98.35], 4);
    showStations(stations);
    dropdown.value = '';
    city_select.innerHTML = '<option value="">Cities</option>';
    // Station dropdown change: reset the station dropdown when the whole map resets.
    resetStationDropdown();
    if (searchInput) searchInput.value = '';
}

// State dropdown filter
dropdown.addEventListener('change', event => {
    const selectedState = event.target.value;
    city_select.innerHTML = '<option value="">Cities</option>';
    // Station dropdown change: clear old station options when the user changes states.
    resetStationDropdown();

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

    if (!selectedCity) return;

    const cityStations = stations.filter(station => {
        return station.city === selectedCity && station.stateCode === selectedState;
    });

    // Station dropdown change: after city is selected, show only stations from that city in the station dropdown.
    fillStationDropdown(cityStations);
    showStations(cityStations);
    zoomToStations(cityStations);
});

// Station dropdown change: selecting one station filters the map to that station and shows its FCC radius.
station_select.addEventListener('change', event => {
    const selectedCallSign = event.target.value;

    if (!selectedCallSign) {
        return;
    }

    const selectedStation = stations.find(station => {
        return station.callSign === selectedCallSign;
    });

    if (!selectedStation) {
        return;
    }

    const color = getStationColor(selectedStation);
    showStations([selectedStation]);
    // Station dropdown change: do not zoom to only the marker because the radius function will zoom to the full radius.
    showFccContour(selectedStation, color);
});

// Network dropdown filter: this filters the map to show only stations from the selected network, and zooms to them. 
const networkSelect = document.getElementById('network_select');

networkSelect.addEventListener('change', event => {
    const selectedNetwork = event.target.value;

    // Reset if nothing selected
    if (!selectedNetwork) {
        resetMap();
        return;
    }

    // Get all stations in that network
    const networkStations = networkGroups[selectedNetwork] || [];

    // Filter the map + list
    showStations(networkStations);

    // Zoom to all stations in the network
    zoomToStations(networkStations);
});

// Search suggestions and keyword search part
const searchSuggestions = document.createElement('datalist');
searchSuggestions.id = 'searchSuggestions';
document.body.appendChild(searchSuggestions);

if (searchInput) searchInput.setAttribute('list', 'searchSuggestions');

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
    if (!searchText.trim()) return;

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

    //Automatically show FCC contour + popup when exactly one station matches
    if (matchingStations.length === 1) {
        const station = matchingStations[0];
        const color = getStationColor(station);
        showFccContour(station, color);
    }
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
        button.innerHTML = '🔄';
        button.href = '#';
        button.title = 'Reset Map';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Reset map view and clear markers');

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            resetMap();
            map.closePopup();
        });

        return container;
    }
});

map.addControl(new ResetControl());

// Pin toggle button addition: add a P control below Reset to remove or restore the pins shown by the current filter.
function togglePins() {
    const removePins = stations.some(station => map.hasLayer(markers[station.callSign]));

    if (removePins) {
        // Pin toggle button addition: remove the open contour with the pins and cancel a contour request still loading.
        latestContourRequestId += 1;
        removeActiveContour();
    }

    stations.forEach(station => {
        const checkbox = document.getElementById(station.callSign);
        const item = checkbox.closest('li');

        if (!removePins && item.style.display !== 'none') {
            markers[station.callSign].addTo(map);
            checkbox.checked = true;
        } else {
            markers[station.callSign].remove();
            checkbox.checked = false;
        }
    });
}

// Pin toggle button addition: use the same Leaflet control style as R and place this control after it.
const PinToggleControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'pin-toggle-button', container);
        button.innerHTML = '📍';
        button.href = '#';
        button.title = 'Remove Pins';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Show or remove all station pins');

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            togglePins();
        });

        return container;
    }
});

map.addControl(new PinToggleControl());

// Sidebar toggle code: this allows the user to collapse the sidebar to see more of the map, and fixes the Leaflet map size after collapsing.
const sidebar = document.querySelector('.sidebar');
const container = document.querySelector('.container');
const collapseBtn = document.getElementById('collapseBtn');

collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    container.classList.toggle('sidebar-collapsed');

    // Fix Leaflet map resizing
    setTimeout(() => {
        map.invalidateSize();
    }, 350);
});