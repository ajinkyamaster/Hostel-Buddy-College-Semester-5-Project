import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

TARGET_URL = "http://localhost:4000/register.html"

def test_register_page_loads():
    """
    Test Case: Registration UI Page Load
    Objective: Verify that the student registration form renders correctly with all fields.
    """
    print("\n[SELENIUM 3] Testing Registration Page Load...")
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        driver.get(TARGET_URL)
        
        # Verify title and main elements
        assert "Register" in driver.title
        name_input = driver.find_element(By.ID, "name")
        email_input = driver.find_element(By.ID, "email")
        hostel_select = driver.find_element(By.ID, "hostel")
        
        assert name_input is not None
        assert email_input is not None
        assert hostel_select is not None
        
        print("  -> SUCCESS: Registration page loaded successfully with all required form fields!")
    finally:
        driver.quit()

if __name__ == "__main__":
    test_register_page_loads()
