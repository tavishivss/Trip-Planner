"""
Route service using OSRM (Open Source Routing Machine) - free, no API key needed.
Falls back to straight-line distance estimation if OSRM is unavailable.
"""

import requests
import math
from typing import Optional


OSRM_BASE = "https://router.project-osrm.org"
NOMINATIM_BASE = "https://nominatim.openstreetmap.org"


def geocode(address: str) -> Optional[dict]:
    """Convert address string to lat/lng using Nominatim (OpenStreetMap)."""
    try:
        resp = requests.get(
            f"{NOMINATIM_BASE}/search",
            params={
                "q": address,
                "format": "json",
                "limit": 1,
            },
            headers={"User-Agent": "ELD-TripPlanner/1.0"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        if data:
            return {
                "name": data[0].get("display_name", address),
                "lat": float(data[0]["lat"]),
                "lng": float(data[0]["lon"]),
            }
    except Exception as e:
        print(f"Geocoding error for '{address}': {e}")
    return None


def geocode_suggestions(query: str, limit: int = 5) -> list:
    """Get address suggestions for autocomplete."""
    try:
        resp = requests.get(
            f"{NOMINATIM_BASE}/search",
            params={
                "q": query,
                "format": "json",
                "limit": limit,
            },
            headers={"User-Agent": "ELD-TripPlanner/1.0"},
            timeout=10,
        )
        resp.raise_for_status()
        return [
            {
                "name": item.get("display_name", ""),
                "lat": float(item["lat"]),
                "lng": float(item["lon"]),
            }
            for item in resp.json()
        ]
    except Exception:
        return []


def get_route(origin: dict, destination: dict) -> dict:
    """
    Get driving route between two points using OSRM.
    origin/destination: {lat, lng, name}
    Returns: {distance_miles, duration_hours, waypoints: [[lng, lat], ...], steps: [...]}
    """
    try:
        coords = f"{origin['lng']},{origin['lat']};{destination['lng']},{destination['lat']}"
        resp = requests.get(
            f"{OSRM_BASE}/route/v1/driving/{coords}",
            params={
                "overview": "full",
                "geometries": "geojson",
                "steps": "true",
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("code") == "Ok" and data.get("routes"):
            route = data["routes"][0]
            distance_meters = route["distance"]
            duration_seconds = route["duration"]
            geometry = route["geometry"]["coordinates"]

            steps = []
            for leg in route.get("legs", []):
                for step in leg.get("steps", []):
                    steps.append({
                        "instruction": step.get("maneuver", {}).get("type", ""),
                        "name": step.get("name", ""),
                        "distance_miles": step["distance"] * 0.000621371,
                        "duration_minutes": step["duration"] / 60,
                    })

            return {
                "distance_miles": distance_meters * 0.000621371,
                "duration_hours": duration_seconds / 3600,
                "waypoints": geometry,
                "steps": steps,
                "start_name": origin["name"],
                "end_name": destination["name"],
                "start_lat": origin["lat"],
                "start_lng": origin["lng"],
                "end_lat": destination["lat"],
                "end_lng": destination["lng"],
            }
    except Exception as e:
        print(f"OSRM routing error: {e}")

    return _fallback_route(origin, destination)


def _haversine(lat1, lon1, lat2, lon2):
    R = 3958.8  # Earth radius in miles
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def _fallback_route(origin: dict, destination: dict) -> dict:
    distance = _haversine(origin['lat'], origin['lng'], destination['lat'], destination['lng'])
    distance *= 1.3  # road distance factor
    duration = distance / 55  # assume 55 mph average

    num_points = max(int(distance / 10), 2)
    waypoints = []
    for i in range(num_points + 1):
        t = i / num_points
        lat = origin['lat'] + t * (destination['lat'] - origin['lat'])
        lng = origin['lng'] + t * (destination['lng'] - origin['lng'])
        waypoints.append([lng, lat])

    return {
        "distance_miles": distance,
        "duration_hours": duration,
        "waypoints": waypoints,
        "steps": [],
        "start_name": origin["name"],
        "end_name": destination["name"],
        "start_lat": origin["lat"],
        "start_lng": origin["lng"],
        "end_lat": destination["lat"],
        "end_lng": destination["lng"],
    }
