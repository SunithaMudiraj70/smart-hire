import pytest
from fastapi.testclient import TestClient
from backend.server import app
from backend.locations import normalize_city, normalize_state, get_cities_for_state, parse_location, search_locations

@pytest.fixture
def client():
    return TestClient(app)

def test_location_normalization_and_mapping():
    """Verify city and state aliases and mappings."""
    assert normalize_city("Bangalore") == "Bengaluru"
    assert normalize_city("bengaluru") == "Bengaluru"
    assert normalize_city("Gurgaon") == "Gurugram"
    assert normalize_city("Mumbai") == "Mumbai"

    assert normalize_state("Karnataka") == "Karnataka"
    assert normalize_state("karnataka") == "Karnataka"
    assert normalize_state("Telangana") == "Telangana"

    # Cities for Karnataka must include Bengaluru
    karnataka_cities = get_cities_for_state("Karnataka")
    assert "Bengaluru" in karnataka_cities

def test_parse_location_structure():
    """Verify arbitrary location string parsing."""
    p1 = parse_location("Bangalore, Karnataka, India")
    assert p1["city"] == "Bengaluru"
    assert p1["state"] == "Karnataka"
    assert p1["country"] == "India"
    assert p1["is_remote"] is False

    p2 = parse_location("Remote Worldwide")
    assert p2["is_remote"] is True
    assert p2["work_mode"] == "remote"

    p3 = parse_location("Hyderabad (Hybrid)")
    assert p3["city"] == "Hyderabad"
    assert p3["state"] == "Telangana"
    assert p3["work_mode"] == "hybrid"

def test_api_locations_autocomplete(client):
    """GET /api/locations?q= returns matching cities, states, and remote."""
    resp = client.get("/api/locations?q=ben")
    assert resp.status_code == 200
    data = resp.json()
    assert any(item["name"] == "Bengaluru" for item in data)
    assert any(item["type"] == "city" for item in data)

    # Empty query should include Remote
    resp_empty = client.get("/api/locations?q=")
    assert resp_empty.status_code == 200
    data_empty = resp_empty.json()
    assert any(item["type"] == "remote" for item in data_empty)

def test_search_jobs_city_filter(client):
    """Filtering by city returns only that city."""
    resp = client.get("/api/jobs/search?city=Bengaluru&work_mode=all")
    assert resp.status_code == 200
    data = resp.json()
    assert "jobs" in data
    assert "total" in data
    # Verified: returned jobs must be in Bengaluru or have Bengaluru in location
    for j in data["jobs"]:
        loc = (j.get("location") or "").lower()
        city = (j.get("city") or "").lower()
        assert "bengaluru" in loc or "bangalore" in loc or city == "bengaluru"

def test_search_jobs_state_filter(client):
    """Selecting a state returns every job in that state's cities."""
    resp = client.get("/api/jobs/search?state=Karnataka")
    assert resp.status_code == 200
    data = resp.json()
    k_cities = [c.lower() for c in get_cities_for_state("Karnataka")]
    for j in data["jobs"]:
        loc = (j.get("location") or "").lower()
        state = (j.get("state") or "").lower()
        city = (j.get("city") or "").lower()
        assert state == "karnataka" or city in k_cities or "karnataka" in loc or any(c in loc for c in k_cities)

def test_search_jobs_remote_filter(client):
    """Work mode = remote returns only remote positions."""
    resp = client.get("/api/jobs/search?work_mode=remote")
    assert resp.status_code == 200
    data = resp.json()
    for j in data["jobs"]:
        assert j.get("is_remote") is True or "remote" in j.get("work_mode", "").lower() or "remote" in j.get("location", "").lower()

def test_search_jobs_experience_filter(client):
    """Experience filter returns matching seniority levels."""
    resp = client.get("/api/jobs/search?experience=fresher")
    assert resp.status_code == 200
    data = resp.json()
    for j in data["jobs"]:
        level = (j.get("experience_level") or "").lower()
        years = (j.get("years_experience") or "").lower()
        assert level in ("fresher", "internship", "junior") or "0" in years

def test_search_jobs_combined_filters(client):
    """Combined search filters (query + work mode + sort)."""
    resp = client.get("/api/jobs/search?q=Developer&work_mode=remote&sort=newest&page=1&page_size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert "page" in data
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["jobs"]) <= 10

def test_search_jobs_empty_result(client):
    """Query with impossible keywords returns 0 jobs without error."""
    resp = client.get("/api/jobs/search?q=nonexistentxyzimpossibleterm12345")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert len(data["jobs"]) == 0

