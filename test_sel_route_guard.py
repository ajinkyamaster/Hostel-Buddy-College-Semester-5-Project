import time
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

TARGET_URL = "http://localhost:4000/hostels.html"

def test_protected_route_redirect():
    """
    Test Case: UI Route Guard
    Objective: Verify that an unauthenticated user attempting to visit a protected admin page is redirected to login.
    """
    print("\n[SELENIUM 4] Testing Protected Route Guard...")
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Try to access a protected admin page without logging in
        driver.get(TARGET_URL)
        
        # The guard.js script should immediately redirect to login.html
        WebDriverWait(driver, 8).until(
            EC.url_contains("login.html")
        )
        assert "login.html" in driver.current_url
        print("  -> SUCCESS: Route guard successfully intercepted unauthorized access and redirected to login!")
    finally:
        driver.quit()

if __name__ == "__main__":
    test_protected_route_redirect()
