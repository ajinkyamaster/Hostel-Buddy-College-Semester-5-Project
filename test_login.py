import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

TARGET_URL = "http://localhost:4000/login.html"

def test_successful_login():
    print("\n[TEST 1] Testing Successful Login Flow...")
    
    # Use headless mode for environments without a display (like CI/CD or background agents)
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.maximize_window()

    try:
        # 1. Open the login page
        driver.get(TARGET_URL)

        # 2. Locate form input elements by their unique IDs
        email_input = driver.find_element(By.ID, "email")
        password_input = driver.find_element(By.ID, "password")
        login_button = driver.find_element(By.ID, "submitBtn")

        # 3. Enter valid demo student credentials
        email_input.clear()
        email_input.send_keys("rahul@hostel.test")

        password_input.clear()
        password_input.send_keys("student123")

        # 4. Click the login button
        login_button.click()

        # 5. Wait for redirection to dashboard.html
        WebDriverWait(driver, 8).until(
            EC.url_contains("dashboard.html")
        )
        
        assert "dashboard.html" in driver.current_url
        print("  -> SUCCESS: Login successful and redirected to dashboard!")

    finally:
        driver.quit()


def test_invalid_login():
    print("\n[TEST 2] Testing Invalid Credentials Flow...")
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=chrome_options)

    try:
        driver.get(TARGET_URL)

        # Enter wrong credentials
        driver.find_element(By.ID, "email").send_keys("rahul@hostel.test")
        driver.find_element(By.ID, "password").send_keys("WrongPassword")
        driver.find_element(By.ID, "submitBtn").click()

        # Wait for error message to appear
        error_element = WebDriverWait(driver, 8).until(
            EC.visibility_of_element_located((By.ID, "formError"))
        )
        
        assert len(error_element.text) > 0
        print(f"  -> SUCCESS: Invalid login error detected properly! ('{error_element.text}')")

    finally:
        driver.quit()


if __name__ == "__main__":
    test_successful_login()
    test_invalid_login()
    print("\nAll Selenium tests passed successfully! ✨")
