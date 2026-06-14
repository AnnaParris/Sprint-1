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
// State dropdown is populated by the cascading filter system (populateStateDropdown), defined below.

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

//Network Lables for the legend
const networkLabels = {
    kLove: 'K-LOVE',
    air1: 'Air1',
    wayFm: 'WAY-FM',
    christianFm: 'Christian FM',
    familyLife: 'Family Life',
    joyFm: 'Joy FM',
    faithNetwork: 'Faith Network',
    moody: 'Moody Radio',
    metroMarket: 'Metro Market',
    individualStations: 'Individual Stations',
    bottRadioNetwork: 'Bott Radio Network'

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

// ===== Unified cascading filters: network -> state -> city -> station =====
// All four dropdowns now work together. Network is the top of the hierarchy:
// choosing a network re-scopes the state/city/station options to that network.
// Choosing a state narrows city + station; choosing a city narrows station.
const filters = { network: '', state: '', city: '', station: '' };

// Accumulated search results: searches ADD to this set instead of replacing it, so you
// can stack several searches and see them all at once. Reset clears it. Dropdowns are
// unaffected — this only changes how the search box behaves.
let accumulatedCallSigns = new Set();

// Remember the state dropdown's original placeholder so we can rebuild it cleanly.
const statePlaceholderHTML = dropdown.innerHTML;

const networkSelect = document.getElementById('network_select');

// Stations available given the currently selected network (top of the hierarchy).
function stationsInNetwork() {
    if (!filters.network) return stations;
    const arr = networkGroups[filters.network] || [];
    const callSet = new Set(arr.map(s => s.callSign));
    return stations.filter(s => callSet.has(s.callSign));
}

function populateStateDropdown() {
    const statesAvail = [...new Set(stationsInNetwork().map(s => s.stateCode))].sort();
    dropdown.innerHTML = statePlaceholderHTML;
    statesAvail.forEach(st => {
        const o = document.createElement('option');
        o.value = st;
        o.textContent = st;
        dropdown.appendChild(o);
    });
    dropdown.value = filters.state || '';
}

function populateCityDropdown() {
    const pool = stationsInNetwork().filter(s => !filters.state || s.stateCode === filters.state);
    const citiesAvail = [...new Set(pool.map(s => s.city))].sort();
    city_select.innerHTML = '<option value="">Cities</option>';
    citiesAvail.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        city_select.appendChild(o);
    });
    city_select.value = filters.city || '';
}

function populateStationDropdownFromFilters() {
    const pool = stationsInNetwork()
        .filter(s => !filters.state || s.stateCode === filters.state)
        .filter(s => !filters.city || s.city === filters.city);
    fillStationDropdown(pool);
    station_select.value = filters.station || '';
}

// Compute the filtered set from all active filters and render it.
function renderFromFilters() {
    // Using the dropdowns is a separate action from searching, so clear any old
    // search text to keep the two from conflicting (and from clashing in the URL).
    if (searchInput) searchInput.value = '';

    let pool = stationsInNetwork();
    if (filters.state)   pool = pool.filter(s => s.stateCode === filters.state);
    if (filters.city)    pool = pool.filter(s => s.city === filters.city);
    if (filters.station) pool = pool.filter(s => s.callSign === filters.station);

    const hasFilter = filters.network || filters.state || filters.city || filters.station;
    // Show the accumulated pile plus a live preview of the current dropdown selection.
    renderView(hasFilter ? pool.map(s => s.callSign) : []);
}

// ---- Dropdown handlers ----
dropdown.addEventListener('change', e => {
    filters.state = e.target.value;
    filters.city = '';
    filters.station = '';
    populateCityDropdown();
    resetStationDropdown();
    renderFromFilters();
});

city_select.addEventListener('change', e => {
    filters.city = e.target.value;
    filters.station = '';
    populateStationDropdownFromFilters();
    renderFromFilters();
});

station_select.addEventListener('change', e => {
    filters.station = e.target.value;
    renderFromFilters();
});

networkSelect.addEventListener('change', e => {
    filters.network = e.target.value;
    filters.state = '';
    filters.city = '';
    filters.station = '';
    populateStateDropdown();
    populateCityDropdown();
    populateStationDropdownFromFilters();
    renderFromFilters();
});

// Populate the state dropdown once at startup (all networks).
populateStateDropdown();
// ===== end cascading filters =====

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

// ===== Auto-show coverage for the current filtered view =====
// When the filtered set is small enough, draw every station's FCC contour at once
// (no clicking needed). Stays off for large/unfiltered views to avoid flooding the
// FCC API and cluttering the map. Single-station and marker-click behavior is
// unchanged and still handled by showFccContour().
const VIEW_CONTOUR_LIMIT = 30;                 // only auto-draw when this many or fewer are shown
const viewContourGroup = L.layerGroup().addTo(map);
let viewContourRequestId = 0;

// Clear any auto-drawn coverage shapes.
function clearViewContours() {
    viewContourRequestId++;                     // cancels any in-flight batch
    viewContourGroup.clearLayers();
}

// Draw coverage shapes for a list of stations, all at once. Lighter styling than the
// click view so overlapping areas stay readable; skips stations with no FCC contour.
async function showContoursForView(list) {
    const reqId = ++viewContourRequestId;
    viewContourGroup.clearLayers();

    await Promise.all(list.map(async station => {
        try {
            const cacheKey = station.facilityId || getFccCallSign(station);
            let data = contourCache.get(cacheKey);
            if (!data) {
                const resp = await fetch(getFccContourUrl(station));
                if (!resp.ok) return;           // e.g. translators with no contour -> skip
                data = await resp.json();
                contourCache.set(cacheKey, data);
            }
            if (reqId !== viewContourRequestId) return;   // a newer filter superseded this batch
            const feature = data.features?.[0];
            if (feature?.geometry?.coordinates?.length) {
                const color = getStationColor(station);
                L.geoJSON(feature, {
                    style: { color, fillColor: color, fillOpacity: 0.12, opacity: 0.7, weight: 1.5 },
                    interactive: false
                }).addTo(viewContourGroup);
            }
        } catch (_) { /* skip this one, keep the rest */ }
    }));
}
// ===== end auto-show coverage =====

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

// FCC contour change: this asks the FCC API for a station contour and draws the real coverage shape on the Leaflet map.
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

        // Draw the REAL FCC contour shape (the 360-point polygon) from the response
        // geometry. Fall back to the averaged circle only if no geometry is present.
        const feature = contourData.features?.[0];
        const hasGeometry = feature?.geometry?.coordinates?.length;
        const radiusMeters = getApproxRadiusMeters(contourData);

        if (hasGeometry) {
            activeContourLayer = L.geoJSON(feature, {
                style: {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.18,
                    opacity: 0.9,
                    weight: 2
                },
                interactive: false
            }).addTo(map);
        } else if (radiusMeters) {
            activeContourLayer = L.circle([station.lat, station.lng], {
                radius: radiusMeters,
                color: color,
                fillColor: color,
                fillOpacity: 0.18,
                opacity: 0.9,
                weight: 2,
                interactive: false
            }).addTo(map);
        } else {
            throw new Error('FCC contour had no geometry or distance values');
        }

        // If the drawn layer has no usable bounds, treat it as a miss and fall back.
        if (!activeContourLayer.getBounds().isValid()) {
            map.removeLayer(activeContourLayer);
            activeContourLayer = null;
            throw new Error('FCC contour produced no usable shape');
        }

        map.fitBounds(activeContourLayer.getBounds(), { padding: [40, 40] });
        if (map.getZoom() > 9) {
            map.setZoom(9);
        }

        const properties = feature?.properties || {};
        const contourLabel = properties.field ? `${properties.field} dBu FCC contour` : 'FCC contour';
        const facilityLabel = properties.facility_id ? `<br>Facility ID: ${properties.facility_id}` : '';
        const radiusLine = radiusMeters ? `<br>Approx. radius: ${(radiusMeters / 1609.34).toFixed(1)} miles` : '';

        marker.setPopupContent(`<b>${station.callSign}</b><br>${station.city}, ${station.stateCode}<br>${station.frequency}<br>${contourLabel}${facilityLabel}${radiusLine}`);
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
    .bindPopup(`<b>${station.callSign}</b><br>${station.city}, ${station.stateCode}<br>${station.frequency}${station.approx ? '<br><em>Approximate location (city center)</em>' : ''}`);

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
    latestContourRequestId += 1;
    removeActiveContour();
    clearViewContours();
    accumulatedCallSigns.clear();
    map.setView([39.5, -98.35], 4);

    filters.network = '';
    filters.state = '';
    filters.city = '';
    filters.station = '';
    if (networkSelect) networkSelect.value = '';
    populateStateDropdown();
    city_select.innerHTML = '<option value="">Cities</option>';
    resetStationDropdown();

    showStations(stations);
    if (searchInput) searchInput.value = '';

    syncUrl();
}

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

// Find the stations matching one search query (exact suggestion or keyword match).
function getSearchMatches(searchValue) {
    const selectedOption = searchOptionsByValue.get(searchValue);
    if (selectedOption) return selectedOption.stations;
    return stations.filter(station =>
        matchesKeywords(
            `${station.callSign} ${station.frequency} ${station.city} ${station.stateCode} ${station.stateName}`,
            searchValue
        )
    );
}

// Render a set of stations: show them, zoom to fit, and auto-draw coverage if small.
function renderStationSet(pool) {
    showStations(pool);
    zoomToStations(pool);

    if (pool.length === 1) {
        clearViewContours();
        showFccContour(pool[0], getStationColor(pool[0]));
    } else if (pool.length > 1 && pool.length <= VIEW_CONTOUR_LIMIT) {
        showContoursForView(pool);
    } else {
        clearViewContours();
    }

    syncUrl();
}

// The stations currently being "previewed" — i.e. what the user is looking at right now
// from EITHER the search box or the dropdowns (whichever is active), not yet committed.
function activeSelectionCallSigns() {
    const q = searchInput ? searchInput.value.trim() : '';
    if (q) {
        return getSearchMatches(q).map(s => s.callSign);
    }
    let pool = stationsInNetwork();
    if (filters.state)   pool = pool.filter(s => s.stateCode === filters.state);
    if (filters.city)    pool = pool.filter(s => s.city === filters.city);
    if (filters.station) pool = pool.filter(s => s.callSign === filters.station);
    if (filters.network || filters.state || filters.city || filters.station) {
        return pool.map(s => s.callSign);
    }
    return [];
}

// The one place the map gets drawn: the accumulated pile PLUS an optional live preview.
function renderView(previewCallSigns) {
    const set = new Set(accumulatedCallSigns);
    (previewCallSigns || []).forEach(cs => set.add(cs));

    if (set.size === 0) {
        // Nothing pinned and nothing selected -> default full-country view.
        showStations(stations);
        clearViewContours();
        removeActiveContour();
        map.setView([39.5, -98.35], 4);
        syncUrl();
        return;
    }

    renderStationSet(stations.filter(s => set.has(s.callSign)));
}

// Clear the active selectors (search box + dropdowns) WITHOUT touching the pinned pile.
function resetSelectors() {
    filters.network = '';
    filters.state = '';
    filters.city = '';
    filters.station = '';
    if (networkSelect) networkSelect.value = '';
    populateStateDropdown();
    city_select.innerHTML = '<option value="">Cities</option>';
    resetStationDropdown();
    if (searchInput) searchInput.value = '';
}

// Live preview as the user types: pile + a preview of what this search would add.
function searchStations(searchText) {
    const q = searchText.trim();
    renderView(q ? getSearchMatches(q).map(s => s.callSign) : []);
}

// "Add to results": pin whatever is currently showing (search OR dropdown selection)
// into the accumulated pile, then clear the selectors so the next pick starts fresh.
function commitCurrentView() {
    activeSelectionCallSigns().forEach(cs => accumulatedCallSigns.add(cs));
    resetSelectors();
    renderView([]);
}

if (searchInput) {
    searchInput.addEventListener('input', event => {
        updateSearchSuggestions(event.target.value);
        searchStations(event.target.value);
    });
    // Enter pins the current search to the running set (stacking results).
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commitCurrentView();
        }
    });
}

// "Add to results" button next to the search box: pins the current view — whether it
// came from the search box or the dropdowns — into the accumulated pile. (Button lives
// in page.html.)
const addSearchBtn = document.getElementById('addSearchBtn');
if (addSearchBtn) {
    addSearchBtn.addEventListener('click', () => commitCurrentView());
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
        clearViewContours();
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

//Legend control to show which color maps to which network
// Reads from networkColors so it can never drift out of sync with the pins.
const LegendControl = L.Control.extend({
    options: { position: 'bottomright' },
    onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-control legend');

        Object.keys(networkColors).forEach(key => {
            const row = L.DomUtil.create('div', 'legend-row', container);
            row.innerHTML = `<i style="background:${networkColors[key]}"></i>${networkLabels[key] || key}`;
        });

        // keep clicks/scrolls on the legend from panning or zooming the map
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
    }
});

map.addControl(new LegendControl());

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
const containerEl = document.querySelector('.container');
const collapseBtn = document.getElementById('collapseBtn');

if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        containerEl.classList.toggle('sidebar-collapsed');

        // Fix Leaflet map resizing after the sidebar finishes its CSS transition.
        setTimeout(() => {
            map.invalidateSize();
        }, 350);
    });
}

// Share button: copies the current view's link to the clipboard so it can be sent to someone.
const ShareControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'share-button', container);
        button.innerHTML = '🔗';
        button.href = '#';
        button.title = 'Copy a link to this view';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Copy a shareable link to the current map view');

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(button, 'click', function(e) {
            L.DomEvent.preventDefault(e);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(location.href).then(() => {
                    button.title = 'Link copied!';
                    setTimeout(() => { button.title = 'Copy a link to this view'; }, 1500);
                }).catch(() => {
                    button.title = 'Press Ctrl+C to copy the link';
                });
            } else {
                // Fallback when the clipboard API isn't available (e.g. non-https).
                button.title = 'Copy the link from the address bar';
            }
        });

        return container;
    }
});

map.addControl(new ShareControl());

// ===== Shareable link: save the current view in the URL so it can be sent to others =====
// Writes whatever the user is currently doing into the address bar. If they searched,
// the search term is saved; otherwise the dropdown filters are saved. Opening that URL
// reproduces the same view. Uses replaceState so it doesn't clutter the back button.
function syncUrl() {
    const params = new URLSearchParams();

    if (accumulatedCallSigns.size > 0) {
        // Save the actual pinned set, so the exact on-screen results reshare faithfully
        // no matter how they were built (searches, dropdowns, or a mix).
        params.set('pins', [...accumulatedCallSigns].join(','));
    } else {
        // No pile yet: save the current single search or dropdown selection instead.
        const q = searchInput ? searchInput.value.trim() : '';
        if (q) {
            params.set('q', q);
        } else {
            if (filters.network) params.set('net', filters.network);
            if (filters.state)   params.set('state', filters.state);
            if (filters.city)    params.set('city', filters.city);
            if (filters.station) params.set('station', filters.station);
        }
    }

    const qs = params.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

// On page load, read the URL and reproduce that view.
function applyUrlState() {
    const params = new URLSearchParams(location.search);

    // A saved pile of pinned stations wins — reproduce the exact on-screen set.
    const pins = params.get('pins');
    if (pins) {
        const wanted = new Set(pins.split(',').map(s => s.trim()).filter(Boolean));
        const valid = stations.filter(s => wanted.has(s.callSign)).map(s => s.callSign);
        accumulatedCallSigns = new Set(valid);
        renderView([]);
        return;
    }

    // A saved search is next, matching "last action wins".
    const q = params.get('q');
    if (q) {
        if (searchInput) searchInput.value = q;
        searchStations(q);
        return;
    }

    const net     = params.get('net') || '';
    const state   = params.get('state') || '';
    const city    = params.get('city') || '';
    const station = params.get('station') || '';
    if (!net && !state && !city && !station) return; // nothing saved -> default view

    filters.network = net;
    filters.state = state;
    filters.city = city;
    filters.station = station;

    // Rebuild the dropdowns in cascade so their options and selections match the saved view.
    populateStateDropdown();
    populateCityDropdown();
    populateStationDropdownFromFilters();
    if (networkSelect) networkSelect.value = net;
    dropdown.value = state;
    city_select.value = city;
    station_select.value = station;

    renderFromFilters();
}

// Run once at startup, after the stations, markers, and dropdowns are all built.
applyUrlState();
// ===== end shareable link =====