import json
import numpy as np

# Helper function to calculate the centroid of a GeoJSON object
def get_geojson_center(geojson):
    coords = []
    
    # Helper function to recursively find all coordinates in a GeoJSON
    def extract(obj):
        if isinstance(obj, dict):
            # Handle Features, Geometries, and Collections
            if 'coordinates' in obj:
                extract(obj['coordinates'])
            elif 'features' in obj: # FeatureCollection
                for f in obj['features']:
                    extract(f)
            elif 'geometry' in obj: # Feature
                extract(obj['geometry'])
        elif isinstance(obj, list):
            # Check if this list is a [lon, lat] coordinate pair
            if len(obj) == 2 and isinstance(obj[0], (int, float)) and isinstance(obj[1], (int, float)):
                coords.append(obj)
            else:
                for item in obj:
                    extract(item)

    extract(geojson)
    
    if not coords:
        return 0, 0

    # Calculate the mean (centroid)
    # GeoJSON is [Lon, Lat], so index 0 is Lon, index 1 is Lat
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    
    return np.mean(lats), np.mean(lons)
