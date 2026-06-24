// Initialize Map
const map = L.map('map').setView([20, 100], 3); 
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}').addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}').addTo(map);

let currentLayer = null;

// Function to load data based on dropdown selection
function updateMap() {
    const param = document.getElementById('paramSelect').value;
    const time = document.getElementById('timeSelect').value;
    const filePath = `data/${param}_${time}.tif`;

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
                
                // Ignore empty ocean data, missing data, and 0s
                if (val === 9999 || isNaN(val) || val === 0) return null; 

                // TEMPERATURE
                if (param === 'temp') {
                    const temp = val - 273.15;
                    if (temp < -10) return '#313695';
                    if (temp < 0) return '#4575b4';  
                    if (temp < 10) return '#74add1'; 
                    if (temp < 20) return '#abd9e9'; 
                    if (temp < 30) return '#fdae61'; 
                    if (temp >= 30) return '#d73027';
                }
                // RAINFALL
                else if (param === 'rain') {
                    const rain = val * 3600;
                    if (rain < 0.1) return null;      
                    if (rain < 1.0) return '#a1dab4'; 
                    if (rain < 5.0) return '#41b6c4'; 
                    if (rain < 10.0) return '#225ea8';
                    if (rain >= 10.0) return '#081d58';
                }
                // PRESSURE
                else if (param === 'pressure') {
                    const mspl = val / 100;
                    if (mspl < 990) return '#8c510a'; 
                    if (mspl < 1000) return '#d8b365';
                    if (mspl < 1010) return '#f6e8c3';
                    if (mspl < 1020) return '#c7eae5';
                    if (mspl >= 1020) return '#5ab4ac';
                }
                return null;
            }
        });
        currentLayer.addTo(map);
      })
      .catch(err => console.log("Waiting for file: " + filePath));
}

// Listen for dropdown changes
document.getElementById('paramSelect').addEventListener('change', updateMap);
document.getElementById('timeSelect').addEventListener('change', updateMap);

// Load initial map
updateMap();