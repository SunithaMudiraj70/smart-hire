import time
import config
from job_agents.job_search_agent import search_jobs
from job_agents.matcher_agent import match_jobs
from job_agents.apply_agent import apply_to_jobs


def monitor_jobs(skill, resume):

    while True:

        print("Checking new jobs...")

        jobs = search_jobs(skill)

        matched = match_jobs(jobs, resume)

        apply_to_jobs(matched, resume)

        time.sleep(config.CHECK_INTERVAL)