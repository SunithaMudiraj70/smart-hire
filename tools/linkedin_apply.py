from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

from config import LINKEDIN_EMAIL, LINKEDIN_PASSWORD


def linkedin_auto_apply(job_link):

    driver = webdriver.Chrome()

    driver.get("https://www.linkedin.com/login")

    wait = WebDriverWait(driver, 20)

    # wait for username field
    email = wait.until(
        EC.presence_of_element_located((By.ID, "username"))
    )

    password = driver.find_element(By.ID, "password")

    email.send_keys(LINKEDIN_EMAIL)
    password.send_keys(LINKEDIN_PASSWORD)

    driver.find_element(By.XPATH, "//button[@type='submit']").click()

    time.sleep(5)

    driver.get(job_link)

    time.sleep(5)
try:

    apply_button = wait.until(
        EC.element_to_be_clickable(
            (By.XPATH, "//button[contains(@class,'jobs-apply-button')]")
        )
    )

    apply_button.click()

    time.sleep(3)

    submit_buttons = driver.find_elements(By.XPATH, "//button[@type='submit']")

    if submit_buttons:
        submit_buttons[-1].click()
        print("Applied successfully on LinkedIn!")

    else:
        print("Application form too complex")

except:

    print("Easy Apply not available")