
  const map = L.map('map').setView([39.5, -98.35], 4); // centered on US
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);