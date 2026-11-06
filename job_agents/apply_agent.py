from tools.rag_memory import already_applied,save_job
from job_agents.cover_agent import generate_cover_letter
import webbrowser
import time
from config import APPLICATION_DELAY


def apply_to_jobs(jobs,resume):

    for job in jobs:

        link=job["link"]

        if already_applied(link):

            print("Skipping already applied job")

            continue

        print("Applying to:",job["title"])

        cover=generate_cover_letter(resume,job)

        print("\nGenerated Cover Letter\n")
        print(cover[:300])

        print("\nOpening job page for Easy Apply...\n")

        webbrowser.open(link)

        save_job(link)

        time.sleep(APPLICATION_DELAY)