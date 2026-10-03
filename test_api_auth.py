import requests

API_URL = "http://localhost:4000/api"

def test_login_api_success():
    """
    Test Case: Authentication JWT API
    Objective: Verify the /api/auth/login endpoint authenticates a user and returns a valid JWT token.
    """
    print("\n[Pytest 3] Testing /api/auth/login endpoint for JWT generation...")
    payload = {
        "email": "rahul@hostel.test",
        "password": "student123"
    }
    response = requests.post(f"{API_URL}/auth/login", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "user" in data
    assert data["user"]["email"] == "rahul@hostel.test"
    print("  -> SUCCESS: Login API correctly authenticated user and returned a JWT token.")
