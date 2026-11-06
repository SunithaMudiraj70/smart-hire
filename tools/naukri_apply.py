from selenium import webdriver
from selenium.webdriver.common.by import By
import time

from config import NAUKRI_EMAIL, NAUKRI_PASSWORD


def naukri_apply(job_link):

    driver = webdriver.Chrome()

    driver.get("https://www.naukri.com/nlogin/login")

    time.sleep(3)

    driver.find_element(By.ID,"usernameField").send_keys(NAUKRI_EMAIL)
    driver.find_element(By.ID,"passwordField").send_keys(NAUKRI_PASSWORD)

    driver.find_element(By.XPATH,"//button[@type='submit']").click()

    time.sleep(5)

    driver.get(job_link)

    time.sleep(5)

    try:
        apply = driver.find_element(By.XPATH,"//button[contains(text(),'Apply')]")

        apply.click()

        print("Applied on Naukri")

    except:
        print("Apply button not found")

    driver.quit()