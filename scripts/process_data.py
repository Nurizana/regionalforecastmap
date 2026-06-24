import requests
import os
from datetime import datetime

# NOAA's New GRIB Filter System
date_str = datetime.utcnow().strftime('%Y%m%d')
run = "00"
f_hour = "024"

# Request 2m Temperature for 15S to 55N, 60E to 110W (250E)
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

print("Downloading from NOAA GRIB Filter...")
response = requests.get(url)

if response.status_code == 200:
    with open(grib_file, 'wb') as f:
        f.write(response.content)
        
    print("Download complete. Converting to GeoTIFF...")
    # Convert raw NOAA data to web map format
    os.system(f"gdal_translate -of GTiff -a_srs EPSG:4326 {grib_file} {tif_file}")
    
    # Remove raw file to save space
    if os.path.exists(grib_file):
        os.remove(grib_file)
        
    print("Successfully created Temperature GeoTIFF!")
else:
    print(f"Failed! NOAA returned HTTP {response.status_code}")