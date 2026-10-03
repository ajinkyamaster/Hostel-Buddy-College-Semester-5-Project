import requests

API_URL = "http://localhost:4000/api"

def test_health_endpoint():
    """
    Test Case 1: Verify the health check API endpoint.
    Objective: Ensure the /api/health endpoint returns a 200 OK status and correct JSON shape.
    """
    print("\n[Pytest 1] Testing /api/health endpoint...")
    response = requests.get(f"{API_URL}/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["service"] == "hostel-buddy"
    assert "time" in data
    print("  -> SUCCESS: API is healthy and returns correct data format.")

def test_hostels_list_endpoint():
    """
    Test Case 2: Verify the public hostels list API endpoint.
    Objective: Ensure the /api/hostels endpoint returns a 200 OK status and a list of hostels.
    """
    print("\n[Pytest 2] Testing /api/hostels endpoint...")
    response = requests.get(f"{API_URL}/hostels")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0 # We assume database is seeded
    # Check shape of a hostel object
    first_hostel = data[0]
    assert "hostel_id" in first_hostel
    assert "hostel_name" in first_hostel
    print("  -> SUCCESS: Hostels endpoint successfully returns a list of hostels.")
