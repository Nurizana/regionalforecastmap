import xarray as xr
import rioxarray
import os
from datetime import datetime

# Define bounds: 15S to 55N, 60E to 110W (110W is 250E in NOAA systems)
lat_min, lat_max = -15.0, 55.0
lon_min, lon_max = 60.0, 250.0

os.makedirs("data", exist_ok=True)

# Access NOAA OpenDAP Server (GFS 0.25 Degree)
date_str = datetime.utcnow().strftime('%Y%m%d')
url = f"https://nomads.ncep.noaa.gov/dods/gfs_0p25/gfs{date_str}/gfs_0p25_00z"

try:
    print("Connecting to NOAA...")
    ds = xr.open_dataset(url)
    
    # Clip data and select the 24hr forecast (index 8, since it's 3-hourly)
    subset = ds.sel(lon=slice(lon_min, lon_max), lat=slice(lat_min, lat_max)).isel(time=8)
    
    # Extract 2m Temperature and convert from Kelvin to Celsius
    temp_c = subset.tmp2m - 273.15
    temp_c = temp_c.rio.write_crs("epsg:4326")
    
    # Save as Web-Friendly GeoTIFF
    temp_c.rio.to_raster("data/temp_24h.tif")
    print("Successfully created Temperature GeoTIFF!")
    
except Exception as e:
    print(f"Error fetching data: {e}")