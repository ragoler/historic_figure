import requests

def get_coordinates(location: str, api_key: str) -> dict | None:
    """
    Uses the Google Geocoding API to find the latitude and longitude for a location string.
    """
    if not location or location.lower() == 'n/a':
        return None

    base_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": location,
        "key": api_key
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()

        if data["status"] == "OK":
            location_data = data["results"][0]["geometry"]["location"]
            return {"lat": location_data["lat"], "lng": location_data["lng"]}
        else:
            print(f"Geocoding failed for '{location}': {data['status']}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error calling Geocoding API: {e}")
        return None
