// Initialize Map
const map = L.map('map').setView([20, 100], 3); 
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}').addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}').addTo(map);

let currentLayer = null;

// Function to load the data based on dropdown selection
function updateMap() {
    const param = document.getElementById('paramSelect').value;
    const time = document.getElementById('timeSelect').value;
    const filePath = `data/${param}_${time}.tif`;

    // Remove the old weather layer when switching
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }

    fetch(filePath)
      .then(response => {
          if (!response.ok) throw new Error("Data not ready yet.");
          return response.arrayBuffer();
      })
      .then(arrayBuffer => parseGeoraster(arrayBuffer))
      .then(georaster => {
        currentLayer = new GeoRasterLayer({
            georaster: georaster,
            opacity: 0.7,
            resolution: 128,
            pixelValuesToColorFn: values => {
                const val = values[0];
                
                // CRITICAL FIX: Ignore empty ocean data, missing data (9999), and corrupt 0s
                if (val === 9999 || isNaN(val) || val === 0) return null; 

                // 1. TEMPERATURE (Convert Kelvin to Celsius)
                if (param === 'temp') {
                    const temp = val - 273.15;
                    if (temp < -10) return '#313695'; // Dark Blue
                    if (temp < 0) return '#4575b4';   // Blue
                    if (temp < 10) return '#74add1';  // Light Blue
                    if (temp < 20) return '#abd9e9';  // Cyan
                    if (temp < 30) return '#fdae61';  // Yellow/Orange
                    if (temp >= 30) return '#d73027'; // Dark Red
                }
                
                // 2. RAINFALL (Convert to mm/hr)
                else if (param === 'rain') {
                    const rain = val * 3600;
                    if (rain < 0.1) return null;       // Don't color dry areas
                    if (rain < 1.0) return '#a1dab4';  // Light Green
                    if (rain < 5.0) return '#41b6c4';  // Light Blue
                    if (rain < 10.0) return '#225ea8'; // Med Blue
                    if (rain >= 10.0) return '#081d58';// Dark Blue
                }

                // 3. PRESSURE (Convert Pascals to hPa)
                else if (param === 'pressure') {
                    const mspl = val / 100;
                    if (mspl < 990) return '#8c510a';  // Brown
                    if (mspl < 1000) return '#d8b365';
                    if (mspl < 1010) return '#f6e8c3';
                    if (mspl < 1020) return '#c7eae5';
                    if (mspl >= 1020) return '#5ab4ac'; // Teal
                }
                return null;
            }
        });
        currentLayer.addTo(map);
      })
      .catch(err => console.log("Waiting for file: " + filePath));
}

// Listen for dropdown changes to update the map automatically
document.getElementById('paramSelect').addEventListener('change', updateMap);
document.getElementById('timeSelect').addEventListener('change', updateMap);

// Load the initial map layer immediately on startup
updateMap();