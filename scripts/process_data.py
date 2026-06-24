import requests
import os
from datetime import datetime, timedelta

# 1. Smart Time Calculator: Subtract 6 hours from current UTC time 
# to guarantee we only ask for a forecast that NOAA has completely finished uploading.
safe_time = datetime.utcnow() - timedelta(hours=6)
date_str = safe_time.strftime('%Y%m%d')

hour = safe_time.hour
if hour < 6:
    run = "00"
elif hour < 12:
    run = "06"
elif hour < 18:
    run = "12"
else:
    run = "18"

f_hour = "024" # 24-hour forecast

print(f"Fetching guaranteed data: Date={date_str}, Run={run}z")

url = (
    f"https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"
    f"?file=gfs.t{run}z.pgrb2.0p25.f{f_hour}"
    f"&lev_2_m_above_ground=on&var_TMP=on"
    f"&subregion=&leftlon=60&rightlon=250&toplat=55&bottomlat=-15"
    f"&dir=%2Fgfs.{date_str}%2F{run}%2Fatmos"
)

os.makedirs("data", exist_ok=True)
grib_file = "data/temp_24h.grib2"
tif_file = "data/temp_24h.tif"

response = requests.get(url)

# 2. Strict Error Checking: If NOAA rejects us, CRASH the script!
if response.status_code != 200:
    raise Exception(f"NOAA Server blocked the download! HTTP Status: {response.status_code}")

with open(grib_file, 'wb') as f:
    f.write(response.content)
    
print("Download complete. Converting to GeoTIFF format...")

# 3. Convert format using GDAL
exit_code = os.system(f"gdal_translate -of GTiff -a_srs EPSG:4326 {grib_file} {tif_file}")

if exit_code != 0:
    raise Exception("GDAL failed to convert the image!")

print("Successfully created the Temperature map!")