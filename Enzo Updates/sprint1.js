// Code for the map. Used Leaflet for the map.
const map = L.map('map').setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// dropdown of states
const dropdown = document.getElementById('dropdown');
const states = ['AK', 'AL', 'AR', 'AZ', 'WA', 'OH'];


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
    // Ohio cities
    { callSign: 'WBNS', city: 'Columbus', lat: 39.9612, lng: -82.9988 },
    { callSign: 'WCLV', city: 'Cleveland', lat: 41.4993, lng: -81.6944 },
    { callSign: 'WEBN', city: 'Cincinnati', lat: 39.1031, lng: -84.5120 },
];

// loop to create markers and checkboxes
stations.forEach(station => {
    // create marker
    //L. is Leaflet's main object, marker is one of the bulit-in tools. 
    // lat and lng are for the coodinates 
    const marker = L.marker([station.lat, station.lng]);
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

// Reference the state dropdown
const state_select = document.getElementById('dropdown');


// Event listener for the state selection
state_select.addEventListener('change', (event) => {
    const selectedState = event.target.value;

    city_select.innerHTML = '<option value="">-- Select City --</option>';
    city_select.value = ""; 

    // 2. Build the new city list for the selected state
    if (cityData[selectedState]) {
        cityData[selectedState].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            city_select.appendChild(option);
        });
    }

    if (selectedState === 'WA') {
        // Center of Washington
        map.setView([47.4749, -120.6805], 7);
    } 
    else if (selectedState === 'AR') {
        // Center of Arkansas (near Little Rock)
        map.setView([34.7465, -92.2896], 7);
    }
        // Center Ohio
    else if (selectedState === 'OH') {
        map.setView([40.4173, -82.9071], 7); // Center of Ohio
    }
    // Zoom out slightly more if they go back to the default
    else if (selectedState === '-- State --') {
        map.setView([39.8283, -98.5795], 4); // Center of USA
    }

    // NEW: Logic to show/hide markers based on the state
    stations.forEach(station => {
        const currentMarker = markers[station.callSign];
        
        // If the station belongs to the selected city/state, show it
        // This example shows markers if their city is in the cityData for that state
        if (cityData[selectedState] && cityData[selectedState].includes(station.city)) {
            currentMarker.addTo(map);
            document.getElementById(station.callSign).checked = true; // Keep checkbox synced
        } else {
            currentMarker.remove(); // Hide if it doesn't belong
        }
    });

    // Zoom out and hide all markers if they go back to default
    if (selectedState === '-- State --' || selectedState === '') {
        map.setView([39.8283, -98.5795], 4);
        stations.forEach(station => markers[station.callSign].remove());
    }

    // 1. Clear the current cities in the dropdown
    city_select.innerHTML = '<option value="">-- Select City --</option>';


    if (cityData[selectedState]) {
        cityData[selectedState].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            city_select.appendChild(option);
        });
    }


});


// --------------------city-----------------------------

// 1. Reference the select element and the data array
const city_select = document.getElementById('city_select');

// Cities objects
const cityData = {
    'WA': ['Seattle', 'Spokane', 'Yakima'],
    'OH': ['Columbus', 'Cleveland', 'Cincinnati'],
    'AR': ['Little Rock']
};

// // 2. Loop to update each city in the dropdown
// cities.forEach(city => {
//     // Create the <option> element
//     const option = document.createElement('option');
    
//     // Set the value and the text visible to the user
//     option.value = city;
//     option.textContent = city;
    
//     // Append the option to the city_select dropdown
//     city_select.appendChild(option);
// });

// 3. Optional: Add an event listener to handle when a user selects a city
city_select.addEventListener('change', (event) => {
    const selectedCity = event.target.value;
    console.log("User selected:", selectedCity);
    
    // Logic to filter markers or zoom the map could go here
if (selectedCity === 'Seattle') {
        map.setView([47.6062, -122.3321], 10);
    } 
    else if (selectedCity === 'Spokane') {
        map.setView([47.6588, -117.4260], 10);
    } 
    else if (selectedCity === 'Yakima') {
        map.setView([46.6021, -120.5059], 10);
    }
    // New Ohio Cities
    else if (selectedCity === 'Columbus') {
        map.setView([39.9612, -82.9988], 10);
    }
    else if (selectedCity === 'Cleveland') {
        map.setView([41.4993, -81.6944], 10);
    }
    else if (selectedCity === 'Cincinnati') {
        map.setView([39.1031, -84.5120], 10);
    }
});
