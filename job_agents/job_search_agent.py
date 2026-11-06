from tools.job_scraper import scrape_jobs
from backend.search_engine import fetch_live_rapidapi_jobs

def search_jobs(keyword, location="India"):
    print(f"🔎 Searching jobs for '{keyword}' via RapidAPI & multi-portal feeds...")
    
    # 1. Fetch live jobs via RapidAPI
    jobs = fetch_live_rapidapi_jobs(keyword, location)
    
    # 2. Fallback to web scraping if needed
    if not jobs:
        print("Falling back to direct scraper...")
        jobs = scrape_jobs(keyword)

    print("Jobs Found:", len(jobs))
    return jobs
