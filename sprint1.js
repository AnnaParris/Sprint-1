// Code for the map. Used Leaflet for the map.
const map = L.map('map').setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// dropdown of states
const dropdown = document.getElementById('dropdown');
const states = ['AK', 'AL', 'AR', 'AZ', 'WA'];

//loop to update each state in the dropdown
states.forEach(state => {
   //creating the element to update each state
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    //appending the dropdown
    dropdown.appendChild(option);
});

// markers object and stations array
const markers = {};
//an array of hardcoded stations
const stations = [
    { callSign: 'KWAO', city: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { callSign: 'KTSL', city: 'Spokane', lat: 47.6588, lng: -117.4260 },
    { callSign: 'KAKP', city: 'Tri-Cities', lat: 46.2396, lng: -119.1006 },
    { callSign: 'K210CX', city: 'Yakima', lat: 46.6021, lng: -120.5059 },
    { callSign: 'KYKV-HD2', city: 'Yakima', lat: 46.6021, lng: -120.5059 },
];

// loop to create markers and checkboxes
stations.forEach(station => {
    // create marker
    //L. is Leaflet's main object, marker is one of the bulit-in tools. 
    // lat and lng are for the coodinates 
    const marker = L.marker([station.lat, station.lng]).addTo(map);
    markers[station.callSign] = marker;

    // create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.id = station.callSign;

    // create label
    const label = document.createElement('label');
    label.htmlFor = station.callSign;
    label.textContent = `${station.callSign} - ${station.city}`;

    // add to the list one checkbox and one label 
    document.getElementById('stationList').appendChild(checkbox);
    document.getElementById('stationList').appendChild(label);

    // add an event listener to toggle marker
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            markers[station.callSign].addTo(map);
        } else {
            markers[station.callSign].remove();
        }
    });
});
