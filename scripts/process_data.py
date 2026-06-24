import requests
import os
from datetime import datetime, timedelta

# Smart Time Calculator
safe_time = datetime.utcnow() - timedelta(hours=6)
date_str = safe_time.strftime('%Y%m%d')

hour = safe_time.hour
if hour < 6: run = "00"
elif hour < 12: run = "06"
elif hour < 18: run = "12"
else: run = "18"

# 12 Forecast time steps (006 to 072)
f_hours = [f"{i:03d}" for i in range(6, 78, 6)]

# The 3 parameters requested
params = {
    "temp": "var_TMP=on&lev_2_m_above_ground=on",
    "rain": "var_PRATE=on&lev_surface=on",
    "pressure": "var_PRMSL=on&lev_mean_sea_level=on"
}

os.makedirs("data", exist_ok=True)
print(f"Fetching data for: {date_str} {run}z")

for f_hour in f_hours:
    for p_name, p_query in params.items():
        url = (
            f"https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"
            f"?file=gfs.t{run}z.pgrb2.0p25.f{f_hour}"
            f"&{p_query}"
            f"&subregion=&leftlon=60&rightlon=250&toplat=55&bottomlat=-15"
            f"&dir=%2Fgfs.{date_str}%2F{run}%2Fatmos"
        )
        
        grib_file = f"data/{p_name}_{f_hour}.grib2"
        tif_file = f"data/{p_name}_{f_hour}.tif"
        
        print(f"Downloading {p_name} for +{f_hour}h...")
        response = requests.get(url)
        
        if response.status_code == 200:
            with open(grib_file, 'wb') as f:
                f.write(response.content)
                
            # Convert using GDAL. -unscale is REQUIRED to fix the solid blue box!
            os.system(f"gdal_translate -unscale -of GTiff -ot Float32 -a_nodata 9999 -a_srs EPSG:4326 {grib_file} {tif_file}")
            
            # Clean up raw file
            if os.path.exists(grib_file):
                os.remove(grib_file)
        else:
            print(f"Failed to fetch {p_name} +{f_hour}h (HTTP {response.status_code})")

print("All layers processed successfully!")