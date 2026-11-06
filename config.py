OLLAMA_MODEL = "llama3"

RESUME_PATH = "resume.pdf"

JOB_KEYWORDS = [
    "machine learning",
    "data scientist",
    "ai engineer"
]

JOB_SEARCH_KEYWORD = "machine learning"

LOCATION = "India"

APPLICATION_DELAY = 30

APPLIED_JOBS_FILE = "applied_jobs.txt"

# Supabase Database Configuration
# Set these in your environment or below to connect your remote Supabase PostgreSQL database
import os
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# RapidAPI Configuration for Live Job Searches (JSearch / Multi-board)
RAPID_API_KEY = os.environ.get("RAPID_API_KEY", "765c41d967msh7e25ccc8dea6ab1p19daf1jsn32c47dc2018c")
RAPIDAPI_KEY = RAPID_API_KEY
RAPIDAPI_HOST = os.environ.get("RAPIDAPI_HOST", "jsearch.p.rapidapi.com")
