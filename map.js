// Initialize Map
const map = L.map('map').setView([20, -25], 3); 

// Add ESRI Blue Ocean Basemap & Labels
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}').addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}').addTo(map);

// Add 5-Degree Grid
//L.simpleGraticule({ interval: 5, color: '#333', weight: 0.5, opacity: 0.5 }).addTo(map);

// Load the processed GeoTIFF from GitHub Data folder
fetch('data/temp_24h.tif')
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => {
    parseGeoraster(arrayBuffer).then(georaster => {
      const layer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 0.7,
          resolution: 128,
          pixelValuesToColorFn: values => {
              const kelvin = values[0];
              const temp = kelvin - 273.15; // Convert Kelvin to Celsius
              if (temp < 0) return '#0000ff'; 
              if (temp > 0 && temp < 20) return '#00ff00'; 
              if (temp >= 20) return '#ff0000'; 
              return null;
          }
      });
      layer.addTo(map);
    });
  });