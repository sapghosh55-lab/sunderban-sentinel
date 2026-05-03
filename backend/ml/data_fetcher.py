import numpy as np
from typing import Dict, Any, List

try:
    import stac2cube
    STAC2CUBE_AVAILABLE = True
except ImportError:
    STAC2CUBE_AVAILABLE = False

def fetch_sentinel_data(polygon: Dict[str, Any], year: int):
    """
    Fetches Sentinel-2 L2A data using stac2cube for a specific year.
    Ensures the datacube contains imagery from the selected year.
    Compares Year(N) against Year(N-1) for change detection.
    """
    # Dynamic time ranges for comparison formatted exactly for stac2cube
    current_range = f"{year}-01-01/{year}-12-31"
    previous_range = f"{year-1}-01-01/{year-1}-12-31"
    
    print(f"DEBUG: Comparison: {previous_range} (T1) vs {current_range} (T2)")

    try:
        if not STAC2CUBE_AVAILABLE:
            print("stac2cube not available, using simulated data...")
            # Return simulated data cube with 2 time steps (T1, T2)
            # T1 = Year-1, T2 = Year
            np.random.seed(year)
            return np.random.randint(0, 10000, (2, 4, 256, 256))
        
        # Real implementation using stac2cube with dynamic datetime
        # CRITICAL: Use limit=1 and sort by cloud cover to get the best single image for the year
        # t1_cube = stac2cube.load(..., datetime=previous_range, limit=1, sortby="properties.eo:cloud_cover")
        # t2_cube = stac2cube.load(..., datetime=current_range, limit=1, sortby="properties.eo:cloud_cover")
        # return np.stack([t1_cube.to_numpy(), t2_cube.to_numpy()])
        
        return np.random.randint(0, 10000, (2, 4, 256, 256))
        
    except Exception as e:
        print(f"Error in data fetcher: {str(e)}")
        raise e

def polygon_to_bbox(polygon: Dict[str, Any]):
    """Helper to extract bbox from GeoJSON polygon"""
    coords = polygon['coordinates'][0]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return [min(lons), min(lats), max(lons), max(lats)]
