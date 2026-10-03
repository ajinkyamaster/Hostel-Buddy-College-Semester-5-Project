import requests

API_URL = "http://localhost:4000/api"

def test_protected_api_unauthorized():
    """
    Test Case: API Authorization Enforcement
    Objective: Verify that accessing a protected endpoint without a valid JWT token results in a 401 Unauthorized error.
    """
    print("\n[Pytest 4] Testing /api/users/me endpoint without a token...")
    # Attempting to fetch user profile without providing an Authorization header
    response = requests.get(f"{API_URL}/users/me")
    
    assert response.status_code == 401
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "UNAUTHENTICATED"
    print("  -> SUCCESS: API correctly blocked unauthorized access with a 401 status code.")
