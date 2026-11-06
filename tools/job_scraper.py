from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time


def scrape_jobs(keyword):

    jobs=[]

    options = Options()
    options.add_argument("--headless")

    driver = webdriver.Chrome(ChromeDriverManager().install(),options=options)

    url=f"https://www.linkedin.com/jobs/search/?keywords={keyword}&location=India&f_TPR=r86400"

    driver.get(url)

    time.sleep(5)

    listings = driver.find_elements(By.CLASS_NAME,"base-card")

    for job in listings:

        try:

            title = job.find_element(By.CLASS_NAME,"base-search-card__title").text

            link = job.find_element(By.TAG_NAME,"a").get_attribute("href")

            company = job.find_element(By.CLASS_NAME,"base-search-card__subtitle").text

            jobs.append({
                "title":title,
                "company":company,
                "link":link,
                "description":""
            })

        except:
            pass

    driver.quit()

    return jobs