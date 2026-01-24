from keplergl import KeplerGl
import pandas as pd
import numpy as np
import time
import json
from utils import get_geojson_center

###### 1. AIS DATA PROCESSING ######

# Load CSV
CSV_PATH = "SAMPLE_AIS_DATA.csv"
df = pd.read_csv(
    CSV_PATH, 
    usecols=["MMSI", "LAT", "LON", "SOG", "BaseDateTime", "VesselName"]
)

# Optional: Sample down for faster processing
#df = df.sample(frac=0.2, random_state=42)

# Clean / cast
df["latitude"] = pd.to_numeric(df["LAT"], errors="coerce")
df["longitude"] = pd.to_numeric(df["LON"], errors="coerce")
df["VesselName"] = df["VesselName"].fillna("Unknown").astype(str)
df["BaseDateTime"] = pd.to_datetime(df["BaseDateTime"], errors="coerce")
df = df.dropna(subset=["latitude", "longitude", "VesselName", "BaseDateTime"])

# Time window deduplication
window_minutes = 10
df["window_start"] = df["BaseDateTime"].dt.floor(f"{window_minutes}min")
df = df.sort_values("BaseDateTime")  # ensures earliest first
df = df.drop_duplicates(subset=["MMSI", "window_start"], keep="first")

# Drop unused columns
df = df.drop(columns=["LAT", "LON", "window_start"])

# Optional: Debugging info
print(df.dtypes)
print(df.head())


###### 2. MPA BOUNDARY GEOJSON ######
# Load MPA bounding box GeoJSON
GEOJSON_PATH = "SAMPLE_MPA.json"
with open(GEOJSON_PATH, "r") as f:
    geojson_data = json.load(f)

region_df = pd.DataFrame({
    "name": ["Sargasso Sea"],
    "geometry": [json.dumps(geojson_data)]
})


###### 3. KEPLER GL VISUALIZATION ######
# Calculate bounding box center for map centering
BBOX_CENTER_LAT, BBOX_CENTER_LON = get_geojson_center(geojson_data)

# Kepler time filter initialization
start_time = df["BaseDateTime"].min()  # initial start time
end_time = start_time + pd.Timedelta(minutes=window_minutes*2)
start_ms = int(start_time.timestamp() * 1000)
end_ms = int(end_time.timestamp() * 1000)

# Visualizer Config
config = {
    "version": "v1",
    "config": {
        "mapState": {
            "latitude": BBOX_CENTER_LAT,
            "longitude": BBOX_CENTER_LON,
            "zoom": 4
        },
        "visState": {
            "filters": [
                {
                    "dataId": "AIS",
                    "id": "time-filter",
                    "name": "BaseDateTime",
                    "type": "timeRange",
                    "value": [start_ms, end_ms],
                    "isAnimating": True,  
                    "enlarged": True,     
                    "speed": 1            
                }
            ],
            "layers": [
                # Layer 1: The AIS Points
                {
                    "id": "ais-points",
                    "type": "point",
                    "config": {
                        "dataId": "AIS",
                        "label": "Vessel Positions",
                        "columns": {
                            "lat": "latitude",
                            "lng": "longitude"
                        },
                        "isVisible": True,
                        "visConfig": {
                            "radius": 8,
                            "opacity": 0.9,
                            "colorRange": {
                                "name": "ColorBrewer Set1",
                                "type": "qualitative",
                                "category": "ColorBrewer",
                                "colors": [
                                    "#e41a1c", "#377eb8", "#4daf4a", "#984ea3",
                                    "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999"
                                ]
                            }
                        },
                        "colorField": {
                            "name": "VesselName",
                            "type": "string"
                        }
                    }
                },
                # Layer 2: The Bounding Box Outline
                {
                    "id": "sargasso-region",
                    "type": "geojson",
                    "config": {
                        "dataId": "SargassoRegion",
                        "label": "Sargasso Boundary",
                        "columns": {"geojson": "geometry"},
                        "isVisible": True,
                        "visConfig": {
                            "opacity": 0.8,
                            "strokeOpacity": 0.8,
                            "thickness": 3,
                            "strokeColor": [0, 0, 255],
                            "filled": False,
                            "stroked": True
                        }
                    }
                }
            ],
            # ---- Tooltip config ----
            "interactionConfig": {
                "tooltip": {
                    "fieldsToShow": {
                        "AIS": [
                            {"name": "VesselName", "format": None},
                            {"name": "BaseDateTime", "format": None},
                            {"name": "longitude", "format": None},
                            {"name": "latitude", "format": None}
                        ]
                    },
                    "enabled": True
                }
            }
        }
    }
}

# Create and save KeplerGl map
HTML_PATH = "ais_visualizer.html"

map_ = KeplerGl(height=1600, config=config)

map_.save_to_html(
    file_name=HTML_PATH,
    data={
        "AIS": df, 
        "SargassoRegion": region_df
    }
)
