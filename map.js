// 1. Initialize Map
const map = L.map('map').setView([20, 100], 3); 

// 2. Add ESRI Blue Ocean Basemap
const esriBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}').addTo(map);
const esriLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}').addTo(map);

// 3. Create a group to hold our weather layers
const weatherLayers = {};

// 4. Load Temperature Data
fetch('data/temp_24h.tif')
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => {
    parseGeoraster(arrayBuffer).then(georaster => {
      const tempLayer = new GeoRasterLayer({
          georaster: georaster,
          opacity: 0.65,
          resolution: 128,
          pixelValuesToColorFn: values => {
              const val = values[0];
              // Ignore empty data
              if (val === 9999 || isNaN(val) || val === 0) return null; 
              
              const temp = val - 273.15; // Kelvin to Celsius
              
              // Professional Weather Color Scale
              if (temp < -10) return '#313695'; // Dark Blue
              if (temp < 0) return '#4575b4';   // Blue
              if (temp < 10) return '#74add1';  // Light Blue
              if (temp < 20) return '#abd9e9';  // Cyan
              if (temp < 25) return '#fdae61';  // Yellow/Orange
              if (temp < 30) return '#f46d43';  // Orange/Red
              if (temp >= 30) return '#d73027'; // Dark Red
              return null;
          }
      });
      
      // Add the layer to the map and to the Control Box
      tempLayer.addTo(map);
      weatherLayers["2m Temperature (+24h)"] = tempLayer;
      
      // Create the Control Button on the top right
      L.control.layers(null, weatherLayers, {collapsed: false}).addTo(map);
    });
  });