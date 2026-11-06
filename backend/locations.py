import os
import json
import re
from typing import Dict, List, Optional, Tuple, Any

LOCATIONS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "config",
    "locations.json"
)

_LOCATIONS_DATA: Dict[str, Any] = {}

def get_locations_data() -> Dict[str, Any]:
    global _LOCATIONS_DATA
    if not _LOCATIONS_DATA:
        try:
            with open(LOCATIONS_FILE, "r", encoding="utf-8") as f:
                _LOCATIONS_DATA = json.load(f)
        except Exception:
            _LOCATIONS_DATA = {"states": [], "cities": {}, "aliases": {}}
    return _LOCATIONS_DATA

def normalize_city(city_str: str) -> Optional[str]:
    """Returns canonical city name or None."""
    if not city_str:
        return None
    data = get_locations_data()
    clean = city_str.strip()
    low = clean.lower()

    # Check aliases
    if low in data.get("aliases", {}):
        return data["aliases"][low]

    # Check direct city keys (case-insensitive)
    for c in data.get("cities", {}):
        if c.lower() == low:
            return data.get("aliases", {}).get(low, c)
    return clean.title() if len(clean) > 2 else None

def normalize_state(state_str: str) -> Optional[str]:
    """Returns canonical Indian state name or None."""
    if not state_str:
        return None
    data = get_locations_data()
    low = state_str.strip().lower()
    for s in data.get("states", []):
        if s.lower() == low:
            return s
    return None

def get_cities_for_state(state_name: str) -> List[str]:
    """Returns all mapped city names for a state."""
    data = get_locations_data()
    target_state = normalize_state(state_name) or state_name
    matched = []
    for city, st in data.get("cities", {}).items():
        if st.lower() == target_state.lower():
            canonical = data.get("aliases", {}).get(city.lower(), city)
            if canonical not in matched:
                matched.append(canonical)
    return matched

def parse_location(location_str: str) -> Dict[str, Any]:
    """
    Parses arbitrary location text into structured components:
    city, state, country, is_remote, work_mode.
    Handles aliases (Bangalore->Bengaluru, Gurgaon->Gurugram)
    and remote flags.
    """
    if not location_str or not isinstance(location_str, str):
        return {
            "city": None,
            "state": None,
            "country": "India",
            "is_remote": False,
            "work_mode": "onsite"
        }

    raw = location_str.strip()
    low = raw.lower()

    # 1. Detect remote & work mode
    is_remote = False
    work_mode = "onsite"
    if "hybrid" in low:
        work_mode = "hybrid"
    elif any(r in low for r in ["remote", "wfh", "work from home", "anywhere"]):
        is_remote = True
        work_mode = "remote"

    data = get_locations_data()
    detected_city: Optional[str] = None
    detected_state: Optional[str] = None
    country = "India"

    # International checks
    if any(c in low for c in ["united states", "usa", "us", "uk", "london", "canada", "germany", "singapore"]):
        if not any(ic in low for ic in ["india", "bengaluru", "hyderabad", "delhi", "mumbai", "pune", "gurgaon"]):
            country = "International"

    # 2. Match city against aliases and cities
    # Sort cities by descending length to match multi-word first (e.g. "Navi Mumbai" before "Mumbai")
    sorted_cities = sorted(data.get("cities", {}).keys(), key=lambda x: len(x), reverse=True)
    for c in sorted_cities:
        pattern = r"\b" + re.escape(c.lower()) + r"\b"
        if re.search(pattern, low):
            canonical = data.get("aliases", {}).get(c.lower(), c)
            detected_city = canonical
            detected_state = data["cities"].get(c)
            break

    # 3. If city not found, try aliases directly
    if not detected_city:
        for alias, target in data.get("aliases", {}).items():
            pattern = r"\b" + re.escape(alias) + r"\b"
            if re.search(pattern, low):
                detected_city = target
                detected_state = data["cities"].get(target) or data["cities"].get(alias)
                break

    # 4. Detect state if still missing
    if not detected_state:
        for s in data.get("states", []):
            pattern = r"\b" + re.escape(s.lower()) + r"\b"
            if re.search(pattern, low):
                detected_state = s
                break

    # Fallback: if only city detected, resolve its state
    if detected_city and not detected_state:
        detected_state = data.get("cities", {}).get(detected_city)

    return {
        "city": detected_city,
        "state": detected_state,
        "country": country,
        "is_remote": is_remote,
        "work_mode": work_mode
    }

def search_locations(query: str = "", limit: int = 15) -> List[Dict[str, Any]]:
    """
    Returns autocompletion items for the location combobox:
    Cities, States, and Remote option.
    """
    data = get_locations_data()
    q = (query or "").strip().lower()
    results: List[Dict[str, Any]] = []

    # Remote option always present if matching or empty query
    if not q or "rem" in q or "any" in q or "world" in q:
        results.append({
            "type": "remote",
            "name": "Remote",
            "state": None,
            "label": "Remote (Worldwide / Work from Home)",
            "value": "Remote"
        })

    # Search Cities
    seen_cities = set()
    for city, st in data.get("cities", {}).items():
        canonical = data.get("aliases", {}).get(city.lower(), city)
        if canonical in seen_cities:
            continue
        if not q or q in canonical.lower() or q in city.lower() or q in st.lower():
            seen_cities.add(canonical)
            results.append({
                "type": "city",
                "name": canonical,
                "state": st,
                "label": f"{canonical}, {st}",
                "value": canonical
            })
            if len(results) >= limit:
                return results

    # Search States
    for st in data.get("states", []):
        if not q or q in st.lower():
            results.append({
                "type": "state",
                "name": st,
                "state": None,
                "label": f"{st} (State)",
                "value": st
            })
            if len(results) >= limit:
                return results

    return results[:limit]

